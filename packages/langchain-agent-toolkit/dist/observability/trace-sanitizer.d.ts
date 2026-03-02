import { ToolCallRecord } from '../types';

export interface TraceSanitizerOptions {
  /**
   * Map of tool names to the fields that should be redacted from their output.
   * Each entry specifies which fields to replace with '[REDACTED]'.
   *
   * Default configuration redacts sensitive financial data:
   * - portfolio tools: quantity, marketPrice, valueInBaseCurrency, netPerformance, investment, balance
   * - benchmark tools: netPerformance, currentNetWorth, totalInvestment
   */
  redactionRules?: Record<string, RedactionRule>;
  /** The replacement string for redacted values (default: '[REDACTED]') */
  redactedValue?: string;
}
export interface RedactionRule {
  /** Fields to redact in holdings array items */
  holdingFields?: string[];
  /** Fields to redact in account array items */
  accountFields?: string[];
  /** Fields to redact in the summary object */
  summaryFields?: string[];
  /** Fields to redact in a nested 'portfolio' object (e.g., benchmark comparison) */
  portfolioFields?: string[];
}
/**
 * Redacts sensitive fields from tool call outputs before sending to
 * observability platforms (e.g., LangSmith traces).
 *
 * Returns a deep clone — the original toolCalls array is never mutated.
 */
export declare function sanitizeToolCallsForTrace(
  toolCalls: ToolCallRecord[],
  options?: TraceSanitizerOptions
): ToolCallRecord[];
//# sourceMappingURL=trace-sanitizer.d.ts.map
