import { PortfolioService } from '@ghostfolio/api/app/portfolio/portfolio.service';
import { BenchmarkService } from '@ghostfolio/api/services/benchmark/benchmark.service';
import { DataProviderService } from '@ghostfolio/api/services/data-provider/data-provider.service';
import { PrismaService } from '@ghostfolio/api/services/prisma/prisma.service';
import type { UserWithSettings } from '@ghostfolio/common/types';

import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage
} from '@langchain/core/messages';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { ChatOpenAI } from '@langchain/openai';
import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import {
  AgentResponse,
  ToolCallRecord,
  ToolContext
} from './interfaces/agent.interfaces';
import { getSystemPrompt } from './prompts/system-prompt';
import { createBenchmarkCompareTool } from './tools/benchmark-compare.tool';
import { createMarketDataTool } from './tools/market-data.tool';
import { createPortfolioAnalysisTool } from './tools/portfolio-analysis.tool';
import { validateTickerSymbols } from './verification/ticker-validation';
import { VerificationResult } from './verification/verification.interfaces';

const MAX_ITERATIONS = 5;

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  private conversations = new Map<
    string,
    { messages: (HumanMessage | AIMessage)[] }
  >();

  public constructor(
    private readonly benchmarkService: BenchmarkService,
    private readonly dataProviderService: DataProviderService,
    private readonly portfolioService: PortfolioService,
    private readonly prismaService: PrismaService
  ) {}

  public async chat(
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

    const chatHistory = this.getConversationHistory(resolvedConversationId);

    const messages: BaseMessage[] = [
      new SystemMessage(getSystemPrompt(baseCurrency)),
      ...chatHistory,
      new HumanMessage(message)
    ];

    const toolCallRecords: ToolCallRecord[] = [];

    let finalResponse: string;

    try {
      finalResponse = await this.runToolCallingLoop(
        modelWithTools,
        messages,
        tools,
        toolCallRecords
      );
    } catch (error) {
      this.logger.error('Agent execution failed', error);

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
            process.env.OPENROUTER_AGENT_MODEL ??
            'anthropic/claude-sonnet-4-20250514',
          tokensUsed: 0,
          latencyMs
        }
      };
    }

    // Run verification pipeline
    const verification = this.runVerification(finalResponse, toolCallRecords);

    this.saveConversationHistory(
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
          process.env.OPENROUTER_AGENT_MODEL ??
          'anthropic/claude-sonnet-4-20250514',
        tokensUsed: 0,
        latencyMs
      }
    };
  }

  private async runToolCallingLoop(
    model: ReturnType<ChatOpenAI['bindTools']>,
    messages: BaseMessage[],
    tools: DynamicStructuredTool[],
    toolCallRecords: ToolCallRecord[]
  ): Promise<string> {
    const toolMap = new Map(tools.map((t) => [t.name, t]));

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const response = await model.invoke(messages);

      messages.push(response);

      const toolCalls = response.tool_calls ?? [];

      if (toolCalls.length === 0) {
        // No tool calls — return the text response
        return typeof response.content === 'string'
          ? response.content
          : JSON.stringify(response.content);
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

        const result = await tool.invoke(toolCall.args);

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
    const finalResponse = await model.invoke(messages);

    return typeof finalResponse.content === 'string'
      ? finalResponse.content
      : JSON.stringify(finalResponse.content);
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
      )
    ];
  }

  private createModel(): ChatOpenAI {
    const modelName =
      process.env.OPENROUTER_AGENT_MODEL ??
      'anthropic/claude-sonnet-4-20250514';

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

    return results;
  }

  private getConversationHistory(
    conversationId: string
  ): (HumanMessage | AIMessage)[] {
    return this.conversations.get(conversationId)?.messages ?? [];
  }

  private saveConversationHistory(
    conversationId: string,
    userMessage: string,
    assistantMessage: string
  ): void {
    const existing = this.conversations.get(conversationId);
    const messages = existing?.messages ?? [];

    messages.push(new HumanMessage(userMessage));
    messages.push(new AIMessage(assistantMessage));

    this.conversations.set(conversationId, { messages });
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
