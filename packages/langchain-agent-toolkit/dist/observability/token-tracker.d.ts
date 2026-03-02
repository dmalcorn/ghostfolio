import { TokenUsage } from '../types';

/**
 * Extracts token usage from a LangChain AIMessage response object.
 *
 * Handles two common formats:
 * 1. `usage_metadata` — newer LangChain format (preferred)
 * 2. `response_metadata.tokenUsage` — OpenAI/legacy format (fallback)
 *
 * Returns zero counts if neither format is found.
 *
 * @param response - An AIMessage object from @langchain/core/messages (passed as `any` to avoid hard dependency)
 */
export declare function extractTokenUsage(response: any): TokenUsage;
/**
 * Accumulates token usage from multiple LLM calls.
 */
export declare function accumulateTokenUsage(
  existing: TokenUsage,
  addition: TokenUsage
): TokenUsage;
//# sourceMappingURL=token-tracker.d.ts.map
