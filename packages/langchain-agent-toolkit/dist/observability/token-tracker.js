'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.extractTokenUsage = extractTokenUsage;
exports.accumulateTokenUsage = accumulateTokenUsage;
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
function extractTokenUsage(response) {
  // Prefer usage_metadata (newer LangChain format)
  const usageMeta = response?.usage_metadata;
  if (usageMeta?.input_tokens != null) {
    return {
      inputTokens: usageMeta.input_tokens ?? 0,
      outputTokens: usageMeta.output_tokens ?? 0,
      totalTokens: usageMeta.total_tokens ?? 0
    };
  }
  // Fallback: response_metadata.tokenUsage (OpenAI format)
  const responseMeta = response?.response_metadata;
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
/**
 * Accumulates token usage from multiple LLM calls.
 */
function accumulateTokenUsage(existing, addition) {
  return {
    inputTokens: existing.inputTokens + addition.inputTokens,
    outputTokens: existing.outputTokens + addition.outputTokens,
    totalTokens: existing.totalTokens + addition.totalTokens
  };
}
//# sourceMappingURL=token-tracker.js.map
