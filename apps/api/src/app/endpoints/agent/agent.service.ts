import { WatchlistService } from '@ghostfolio/api/app/endpoints/watchlist/watchlist.service';
import { PortfolioService } from '@ghostfolio/api/app/portfolio/portfolio.service';
import { RedisCacheService } from '@ghostfolio/api/app/redis-cache/redis-cache.service';
import { BenchmarkService } from '@ghostfolio/api/services/benchmark/benchmark.service';
import { DataProviderService } from '@ghostfolio/api/services/data-provider/data-provider.service';
import { PrismaService } from '@ghostfolio/api/services/prisma/prisma.service';
import type { UserWithSettings } from '@ghostfolio/common/types';

import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  StoredMessage,
  SystemMessage,
  ToolMessage,
  mapChatMessagesToStoredMessages,
  mapStoredMessagesToChatMessages
} from '@langchain/core/messages';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { ChatOpenAI } from '@langchain/openai';
import { Injectable, Logger } from '@nestjs/common';
import { traceable } from 'langsmith/traceable';
import { v4 as uuidv4 } from 'uuid';

import {
  AgentResponse,
  ToolCallRecord,
  ToolContext
} from './interfaces/agent.interfaces';
import { categorizeError } from './observability/error-categorizer';
import {
  TokenUsage,
  accumulateTokenUsage,
  extractTokenUsage
} from './observability/token-tracker';
import { sanitizeToolCallsForTrace } from './observability/trace-sanitizer';
import { getSystemPrompt } from './prompts/system-prompt';
import { createBenchmarkCompareTool } from './tools/benchmark-compare.tool';
import { createMarketDataTool } from './tools/market-data.tool';
import { createPortfolioAnalysisTool } from './tools/portfolio-analysis.tool';
import { createSymbolSearchTool } from './tools/symbol-search.tool';
import { createWatchlistManageTool } from './tools/watchlist-manage.tool';
import { calculateConfidenceScore } from './verification/confidence-scoring';
import { validateDataFreshness } from './verification/data-freshness';
import { validateNumericalCrosscheck } from './verification/numerical-crosscheck';
import { validateTickerSymbols } from './verification/ticker-validation';
import { VerificationResult } from './verification/verification.interfaces';

const MAX_ITERATIONS = 5;

@Injectable()
export class AgentService {
  private static readonly CONVERSATION_TTL_MS = 86_400_000; // 24 hours

  private readonly logger = new Logger(AgentService.name);

  public constructor(
    private readonly benchmarkService: BenchmarkService,
    private readonly dataProviderService: DataProviderService,
    private readonly portfolioService: PortfolioService,
    private readonly prismaService: PrismaService,
    private readonly redisCacheService: RedisCacheService,
    private readonly watchlistService: WatchlistService
  ) {}

  public async chat(
    message: string,
    conversationId: string | undefined,
    user: UserWithSettings
  ): Promise<AgentResponse> {
    const traceableChat = traceable(
      async (msg: string, convId: string | undefined) => {
        return this.executeChatPipeline(msg, convId, user);
      },
      {
        name: 'agent_chat',
        run_type: 'chain',
        tags: ['ghostfolio-agent'],
        metadata: {
          userId: user.id,
          baseCurrency: user.settings?.settings?.baseCurrency ?? 'USD'
        },
        processInputs: (inputs) => {
          return { message: inputs.args?.[0] ?? '' };
        },
        processOutputs: (outputs) => {
          const result = outputs.outputs ?? outputs;

          if (result && typeof result === 'object' && 'toolCalls' in result) {
            return {
              ...result,
              toolCalls: sanitizeToolCallsForTrace(
                (result as AgentResponse).toolCalls
              )
            };
          }

          return result;
        }
      }
    );

    return traceableChat(message, conversationId);
  }

  private async executeChatPipeline(
    message: string,
    conversationId: string | undefined,
    user: UserWithSettings
  ): Promise<AgentResponse> {
    const startTime = Date.now();

    const resolvedConversationId = conversationId ?? uuidv4();

    const baseCurrency = user.settings?.settings?.baseCurrency ?? 'USD';

    const tools = this.createTools({ userId: user.id, baseCurrency, user });

    let model: ChatOpenAI;

    try {
      model = this.createModel();
    } catch (error) {
      this.logger.error('Failed to create LLM model', error);

      throw new LlmUnavailableError(
        'The AI service is temporarily unavailable. Please try again in a few minutes.'
      );
    }

    const modelWithTools = model.bindTools(tools);

    const chatHistory = await this.getConversationHistory(
      resolvedConversationId
    );

    const messages: BaseMessage[] = [
      new SystemMessage(getSystemPrompt(baseCurrency)),
      ...chatHistory,
      new HumanMessage(message)
    ];

    const toolCallRecords: ToolCallRecord[] = [];
    const timing = { llmMs: 0, toolMs: 0 };

    let finalResponse: string;
    let tokenUsage: TokenUsage = {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0
    };

    try {
      const result = await this.runToolCallingLoop(
        modelWithTools,
        messages,
        tools,
        toolCallRecords,
        timing
      );

      finalResponse = result.content;
      tokenUsage = result.tokenUsage;
    } catch (error) {
      const errorCategory = categorizeError(error);

      this.logger.error(`Agent execution failed [${errorCategory}]`, error);

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // Check for LLM provider errors
      if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        throw new LlmUnavailableError(
          'The AI service is currently rate-limited. Please wait a moment and try again.'
        );
      }

      if (
        errorMessage.includes('timeout') ||
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('503')
      ) {
        throw new LlmUnavailableError(
          'The AI service is temporarily unavailable. Please try again in a few minutes.'
        );
      }

      // For other errors, return a graceful response
      const latencyMs = Date.now() - startTime;

      return {
        response:
          'I encountered an issue processing your request. This may be a temporary problem — please try rephrasing your question or try again shortly.',
        toolCalls: [],
        conversationId: resolvedConversationId,
        verification: [],
        metadata: {
          model:
            process.env.OPENROUTER_AGENT_MODEL ?? 'anthropic/claude-sonnet-4',
          tokensUsed: 0,
          latencyMs
        }
      };
    }

    // Run verification pipeline
    const verificationStart = Date.now();
    const verification = this.runVerification(finalResponse, toolCallRecords);
    const verificationMs = Date.now() - verificationStart;

    // Compute confidence score based on all verifications
    const hasToolErrors = toolCallRecords.some((tc) => {
      const output = tc.output as Record<string, unknown>;

      return output?.error === true;
    });

    const { score: confidenceScore, verificationResult: confidenceResult } =
      calculateConfidenceScore({
        toolCallCount: toolCallRecords.length,
        verificationResults: verification,
        hasToolErrors,
        dataRetrievedCount: toolCallRecords.filter((tc) => {
          const output = tc.output as Record<string, unknown>;

          return output?.error !== true;
        }).length
      });

    verification.push(confidenceResult);

    await this.saveConversationHistory(
      resolvedConversationId,
      message,
      finalResponse
    );

    const latencyMs = Date.now() - startTime;

    return {
      response: finalResponse,
      toolCalls: toolCallRecords,
      conversationId: resolvedConversationId,
      verification,
      metadata: {
        model:
          process.env.OPENROUTER_AGENT_MODEL ?? 'anthropic/claude-sonnet-4',
        tokensUsed: tokenUsage.totalTokens,
        latencyMs,
        confidenceScore,
        latencyBreakdown: {
          llmMs: timing.llmMs,
          toolMs: timing.toolMs,
          verificationMs
        },
        tokenDetail: {
          inputTokens: tokenUsage.inputTokens,
          outputTokens: tokenUsage.outputTokens
        }
      }
    };
  }

  private async runToolCallingLoop(
    model: ReturnType<ChatOpenAI['bindTools']>,
    messages: BaseMessage[],
    tools: DynamicStructuredTool[],
    toolCallRecords: ToolCallRecord[],
    timing: { llmMs: number; toolMs: number }
  ): Promise<{ content: string; tokenUsage: TokenUsage }> {
    const toolMap = new Map(tools.map((t) => [t.name, t]));
    let totalTokens: TokenUsage = {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0
    };

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const llmStart = Date.now();
      const response = await model.invoke(messages);

      timing.llmMs += Date.now() - llmStart;

      totalTokens = accumulateTokenUsage(
        totalTokens,
        extractTokenUsage(response)
      );

      messages.push(response);

      const toolCalls = response.tool_calls ?? [];

      if (toolCalls.length === 0) {
        // No tool calls — return the text response
        const content =
          typeof response.content === 'string'
            ? response.content
            : JSON.stringify(response.content);

        return { content, tokenUsage: totalTokens };
      }

      // Execute each tool call
      for (const toolCall of toolCalls) {
        const tool = toolMap.get(toolCall.name);

        if (!tool) {
          const errorResult = JSON.stringify({
            error: true,
            message: `Unknown tool: ${toolCall.name}`
          });

          messages.push(
            new ToolMessage({
              tool_call_id: toolCall.id ?? toolCall.name,
              content: errorResult
            })
          );

          continue;
        }

        const toolStart = Date.now();
        const result = await tool.invoke(toolCall.args);

        timing.toolMs += Date.now() - toolStart;

        toolCallRecords.push({
          name: toolCall.name,
          input: toolCall.args,
          output: this.safeParseJson(result)
        });

        messages.push(
          new ToolMessage({
            tool_call_id: toolCall.id ?? toolCall.name,
            content: result
          })
        );
      }
    }

    // If we exhausted iterations, get a final response without tools
    const llmStart = Date.now();
    const finalResponse = await model.invoke(messages);

    timing.llmMs += Date.now() - llmStart;

    totalTokens = accumulateTokenUsage(
      totalTokens,
      extractTokenUsage(finalResponse)
    );

    const content =
      typeof finalResponse.content === 'string'
        ? finalResponse.content
        : JSON.stringify(finalResponse.content);

    return { content, tokenUsage: totalTokens };
  }

  private createTools(context: ToolContext): DynamicStructuredTool[] {
    return [
      createPortfolioAnalysisTool(context, this.portfolioService),
      createMarketDataTool(
        context,
        this.dataProviderService,
        this.prismaService
      ),
      createBenchmarkCompareTool(
        context,
        this.benchmarkService,
        this.dataProviderService,
        this.portfolioService
      ),
      createSymbolSearchTool(context, this.dataProviderService),
      createWatchlistManageTool(
        context,
        this.watchlistService,
        this.dataProviderService
      )
    ];
  }

  private createModel(): ChatOpenAI {
    const modelName =
      process.env.OPENROUTER_AGENT_MODEL ?? 'anthropic/claude-sonnet-4';

    return new ChatOpenAI({
      modelName,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1'
      },
      apiKey: process.env.OPENROUTER_API_KEY,
      temperature: 0.1,
      maxTokens: 4096
    });
  }

  private runVerification(
    response: string,
    toolCalls: ToolCallRecord[]
  ): VerificationResult[] {
    const results: VerificationResult[] = [];

    try {
      results.push(validateTickerSymbols(response, toolCalls));
    } catch (error) {
      this.logger.warn('Ticker validation failed', error);
      results.push({
        type: 'ticker_validation',
        passed: false,
        details: 'Verification could not be completed.',
        severity: 'warning'
      });
    }

    try {
      results.push(validateNumericalCrosscheck(response, toolCalls));
    } catch (error) {
      this.logger.warn('Numerical crosscheck failed', error);
      results.push({
        type: 'numerical_crosscheck',
        passed: false,
        details: 'Numerical verification could not be completed.',
        severity: 'warning'
      });
    }

    try {
      results.push(validateDataFreshness(response, toolCalls));
    } catch (error) {
      this.logger.warn('Data freshness check failed', error);
      results.push({
        type: 'data_freshness',
        passed: false,
        details: 'Data freshness check could not be completed.',
        severity: 'warning'
      });
    }

    return results;
  }

  private async getConversationHistory(
    conversationId: string
  ): Promise<BaseMessage[]> {
    try {
      const key = `agent:conversation:${conversationId}`;
      const stored = await this.redisCacheService.get(key);

      if (!stored) {
        return [];
      }

      const parsed: StoredMessage[] = JSON.parse(stored);

      return mapStoredMessagesToChatMessages(parsed);
    } catch (error) {
      this.logger.warn(`Failed to load conversation ${conversationId}`, error);

      return [];
    }
  }

  private async saveConversationHistory(
    conversationId: string,
    userMessage: string,
    assistantMessage: string
  ): Promise<void> {
    try {
      const key = `agent:conversation:${conversationId}`;
      const existing = await this.getConversationHistory(conversationId);

      existing.push(new HumanMessage(userMessage));
      existing.push(new AIMessage(assistantMessage));

      const storedMessages = mapChatMessagesToStoredMessages(existing);

      await this.redisCacheService.set(
        key,
        JSON.stringify(storedMessages),
        AgentService.CONVERSATION_TTL_MS
      );
    } catch (error) {
      this.logger.warn(`Failed to save conversation ${conversationId}`, error);
    }
  }

  private safeParseJson(text: string): object {
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  }
}

export class LlmUnavailableError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'LlmUnavailableError';
  }
}
