import { AgentErrorCategory } from '../types';

export interface ErrorPattern {
  /** Substring patterns to match against error.message (case-insensitive) */
  patterns: string[];
  /** Category to assign when matched */
  category: AgentErrorCategory;
}
export interface ErrorCategorizerOptions {
  /**
   * Custom error patterns to use instead of defaults.
   * Patterns are checked in order; the first match wins.
   */
  patterns?: ErrorPattern[];
  /**
   * Additional error class names that map directly to a category.
   * Default includes: { LlmUnavailableError: 'llm_failure' }
   */
  errorNameMap?: Record<string, AgentErrorCategory>;
}
/**
 * Classifies agent runtime errors into actionable categories.
 *
 * Uses pattern matching against the error message and error name
 * to sort errors into buckets for alerting, dashboards, and retry logic.
 */
export declare function categorizeError(
  error: unknown,
  options?: ErrorCategorizerOptions
): AgentErrorCategory;
//# sourceMappingURL=error-categorizer.d.ts.map
