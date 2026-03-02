import { VerificationResult } from '../types';

const DEFAULT_LOW_CONFIDENCE_THRESHOLD = 70;

export interface ConfidenceFactors {
  /** Number of tool calls the agent made */
  toolCallCount: number;
  /** Results from all verification checks */
  verificationResults: VerificationResult[];
  /** Whether any tool call threw an error */
  hasToolErrors: boolean;
  /** Number of tool calls that returned data successfully */
  dataRetrievedCount: number;
}

export interface ConfidenceScoreOptions {
  /** Score threshold below which the result is marked as not passed (default: 70) */
  lowConfidenceThreshold?: number;
  /** Points deducted when agent made no tool calls (default: 40) */
  noToolCallsPenalty?: number;
  /** Points deducted per failed verification with 'error' severity (default: 25) */
  errorPenalty?: number;
  /** Points deducted per failed verification with 'warning' severity (default: 15) */
  warningPenalty?: number;
  /** Points deducted per failed verification with 'info' severity (default: 5) */
  infoPenalty?: number;
  /** Points deducted when tool calls threw errors (default: 20) */
  toolErrorPenalty?: number;
  /** Points deducted when tools were called but returned no data (default: 15) */
  noDataPenalty?: number;
}

/**
 * Calculates a 0-100 confidence score for an agent's response based on
 * tool usage, verification results, and data retrieval success.
 *
 * Higher scores indicate more reliable responses. Scores below the
 * low-confidence threshold (default: 70) are flagged as potentially unreliable.
 */
export function calculateConfidenceScore(
  factors: ConfidenceFactors,
  options: ConfidenceScoreOptions = {}
): {
  score: number;
  verificationResult: VerificationResult;
} {
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
