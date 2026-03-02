import { ToolCallRecord, VerificationResult } from '../types';

export interface TickerValidationOptions {
  /**
   * Set of uppercase words to ignore when scanning for ticker symbols.
   * These common English words and abbreviations would otherwise
   * trigger false positives. Merged with the built-in list.
   */
  additionalFalsePositives?: Set<string>;
  /**
   * Custom function to extract known symbols from tool call outputs.
   * Override this if your tools use a different output format than
   * the default extractors (which handle `holdings[].symbol`,
   * `quotes.{SYMBOL}`, and `benchmarks[].symbol`).
   */
  extractSymbols?: (toolCalls: ToolCallRecord[]) => Set<string>;
  /** Minimum ticker length to flag (default: 2) */
  minTickerLength?: number;
  /** Maximum ticker length to flag (default: 6) */
  maxTickerLength?: number;
}
/**
 * Validates that ticker symbols mentioned in the agent's response
 * were actually present in tool output data. This prevents the LLM
 * from fabricating data about symbols it did not retrieve.
 */
export declare function validateTickerSymbols(
  response: string,
  toolCalls: ToolCallRecord[],
  options?: TickerValidationOptions
): VerificationResult;
//# sourceMappingURL=ticker-validation.d.ts.map
