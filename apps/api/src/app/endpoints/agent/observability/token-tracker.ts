import type { AIMessage } from '@langchain/core/messages';

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export function extractTokenUsage(response: AIMessage): TokenUsage {
  // Prefer usage_metadata (newer LangChain format)
  const usageMeta = (response as any).usage_metadata as
    | {
        input_tokens?: number;
        output_tokens?: number;
        total_tokens?: number;
      }
    | undefined;

  if (usageMeta?.input_tokens != null) {
    return {
      inputTokens: usageMeta.input_tokens ?? 0,
      outputTokens: usageMeta.output_tokens ?? 0,
      totalTokens: usageMeta.total_tokens ?? 0
    };
  }

  // Fallback: response_metadata.tokenUsage (OpenAI format)
  const responseMeta = (response as any).response_metadata as
    | {
        tokenUsage?: {
          promptTokens?: number;
          completionTokens?: number;
          totalTokens?: number;
        };
      }
    | undefined;

  const tokenUsage = responseMeta?.tokenUsage;

  if (tokenUsage) {
    return {
      inputTokens: tokenUsage.promptTokens ?? 0,
      outputTokens: tokenUsage.completionTokens ?? 0,
      totalTokens: tokenUsage.totalTokens ?? 0
    };
  }

  return { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
}

export function accumulateTokenUsage(
  existing: TokenUsage,
  addition: TokenUsage
): TokenUsage {
  return {
    inputTokens: existing.inputTokens + addition.inputTokens,
    outputTokens: existing.outputTokens + addition.outputTokens,
    totalTokens: existing.totalTokens + addition.totalTokens
  };
}
