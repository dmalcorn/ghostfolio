'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.calculateConfidenceScore = calculateConfidenceScore;
const DEFAULT_LOW_CONFIDENCE_THRESHOLD = 70;
/**
 * Calculates a 0-100 confidence score for an agent's response based on
 * tool usage, verification results, and data retrieval success.
 *
 * Higher scores indicate more reliable responses. Scores below the
 * low-confidence threshold (default: 70) are flagged as potentially unreliable.
 */
function calculateConfidenceScore(factors, options = {}) {
  const {
    lowConfidenceThreshold = DEFAULT_LOW_CONFIDENCE_THRESHOLD,
    noToolCallsPenalty = 40,
    errorPenalty = 25,
    warningPenalty = 15,
    infoPenalty = 5,
    toolErrorPenalty = 20,
    noDataPenalty = 15
  } = options;
  let score = 100;
  // Deduct for no tool calls (agent guessed without data)
  if (factors.toolCallCount === 0) {
    score -= noToolCallsPenalty;
  }
  // Deduct for each failed verification
  for (const result of factors.verificationResults) {
    if (!result.passed) {
      switch (result.severity) {
        case 'error':
          score -= errorPenalty;
          break;
        case 'warning':
          score -= warningPenalty;
          break;
        case 'info':
          score -= infoPenalty;
          break;
      }
    }
  }
  // Deduct for tool errors
  if (factors.hasToolErrors) {
    score -= toolErrorPenalty;
  }
  // Deduct for missing data retrieval
  if (factors.dataRetrievedCount === 0 && factors.toolCallCount > 0) {
    score -= noDataPenalty;
  }
  // Clamp to 0-100
  score = Math.max(0, Math.min(100, score));
  const passed = score >= lowConfidenceThreshold;
  const details = passed
    ? `Confidence score: ${score}/100.`
    : `Low confidence score: ${score}/100. Results may be unreliable.`;
  return {
    score,
    verificationResult: {
      type: 'confidence_score',
      passed,
      details,
      severity: passed ? 'info' : 'warning'
    }
  };
}
//# sourceMappingURL=confidence-scoring.js.map
