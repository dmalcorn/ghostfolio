import { AgentErrorCategory } from '../types';

export interface ErrorPattern {
  /** Substring patterns to match against error.message (case-insensitive) */
  patterns: string[];
  /** Category to assign when matched */
  category: AgentErrorCategory;
}

/** Default error patterns for categorizing agent errors */
const DEFAULT_ERROR_PATTERNS: ErrorPattern[] = [
  {
    patterns: [
      '429',
      'rate limit',
      'timeout',
      'econnrefused',
      '503',
      'openrouter'
    ],
    category: 'llm_failure'
  },
  {
    patterns: ['validation', 'required', 'invalid', 'maximum length'],
    category: 'input_validation'
  },
  {
    patterns: ['verification', 'crosscheck'],
    category: 'verification_failure'
  },
  {
    patterns: ['prisma', 'portfolio', 'data provider', 'benchmark', 'symbol'],
    category: 'tool_failure'
  }
];

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
export function categorizeError(
  error: unknown,
  options: ErrorCategorizerOptions = {}
): AgentErrorCategory {
  if (!(error instanceof Error)) {
    return 'unknown';
  }

  const {
    patterns = DEFAULT_ERROR_PATTERNS,
    errorNameMap = { LlmUnavailableError: 'llm_failure' }
  } = options;

  // Check error name first
  if (error.name in errorNameMap) {
    return errorNameMap[error.name];
  }

  const msg = error.message.toLowerCase();

  // Check patterns in order
  for (const { patterns: matchers, category } of patterns) {
    if (matchers.some((p) => msg.includes(p))) {
      return category;
    }
  }

  return 'unknown';
}
