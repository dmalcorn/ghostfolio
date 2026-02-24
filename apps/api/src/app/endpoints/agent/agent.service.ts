import { PortfolioService } from '@ghostfolio/api/app/portfolio/portfolio.service';
import { ConfigurationService } from '@ghostfolio/api/services/configuration/configuration.service';
import type { UserWithSettings } from '@ghostfolio/common/types';

import { AIMessage, HumanMessage } from '@langchain/core/messages';
import {
  ChatPromptTemplate,
  MessagesPlaceholder
} from '@langchain/core/prompts';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { ChatOpenAI } from '@langchain/openai';
import { Injectable, Logger } from '@nestjs/common';
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents';
import { v4 as uuidv4 } from 'uuid';

import {
  AgentResponse,
  ToolCallRecord,
  ToolContext
} from './interfaces/agent.interfaces';
import { getSystemPrompt } from './prompts/system-prompt';
import { createPortfolioAnalysisTool } from './tools/portfolio-analysis.tool';
import { validateTickerSymbols } from './verification/ticker-validation';
import { VerificationResult } from './verification/verification.interfaces';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  private conversations = new Map<
    string,
    { messages: (HumanMessage | AIMessage)[] }
  >();

  public constructor(
    private readonly configurationService: ConfigurationService,
    private readonly portfolioService: PortfolioService
  ) {}

  public async chat(
    message: string,
    conversationId: string | undefined,
    user: UserWithSettings
  ): Promise<AgentResponse> {
    const startTime = Date.now();

    const resolvedConversationId = conversationId ?? uuidv4();

    const baseCurrency = user.settings?.settings?.baseCurrency ?? 'USD';

    const tools = this.createTools({ userId: user.id, baseCurrency });

    let model: ChatOpenAI;

    try {
      model = this.createModel();
    } catch (error) {
      this.logger.error('Failed to create LLM model', error);

      throw new LlmUnavailableError(
        'The AI service is temporarily unavailable. Please try again in a few minutes.'
      );
    }

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', getSystemPrompt(baseCurrency)],
      new MessagesPlaceholder('chat_history'),
      ['human', '{input}'],
      new MessagesPlaceholder('agent_scratchpad')
    ]);

    const agent = await createToolCallingAgent({
      llm: model,
      tools,
      prompt
    });

    const executor = new AgentExecutor({
      agent,
      tools,
      maxIterations: 5,
      returnIntermediateSteps: true
    });

    const chatHistory = this.getConversationHistory(resolvedConversationId);

    let result: { output: string; intermediateSteps?: unknown[] };

    try {
      result = await executor.invoke({
        input: message,
        chat_history: chatHistory
      });
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

    const toolCalls = this.extractToolCalls(
      result.intermediateSteps as {
        action: { tool: string; toolInput: object };
        observation: string;
      }[]
    );

    // Run verification pipeline
    const verification = this.runVerification(result.output, toolCalls);

    this.saveConversationHistory(
      resolvedConversationId,
      message,
      result.output
    );

    const latencyMs = Date.now() - startTime;

    return {
      response: result.output,
      toolCalls,
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

  private createTools(context: ToolContext): DynamicStructuredTool[] {
    return [createPortfolioAnalysisTool(context, this.portfolioService)];
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

  private extractToolCalls(
    intermediateSteps: {
      action: { tool: string; toolInput: object };
      observation: string;
    }[]
  ): ToolCallRecord[] {
    if (!intermediateSteps) {
      return [];
    }

    return intermediateSteps.map((step) => ({
      name: step.action.tool,
      input: step.action.toolInput,
      output: this.safeParseJson(step.observation)
    }));
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
