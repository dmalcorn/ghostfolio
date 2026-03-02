'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.categorizeError = categorizeError;
/** Default error patterns for categorizing agent errors */
const DEFAULT_ERROR_PATTERNS = [
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
/**
 * Classifies agent runtime errors into actionable categories.
 *
 * Uses pattern matching against the error message and error name
 * to sort errors into buckets for alerting, dashboards, and retry logic.
 */
function categorizeError(error, options = {}) {
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
//# sourceMappingURL=error-categorizer.js.map
