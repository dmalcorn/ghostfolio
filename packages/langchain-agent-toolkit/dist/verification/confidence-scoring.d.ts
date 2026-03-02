import { VerificationResult } from '../types';

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
export declare function calculateConfidenceScore(
  factors: ConfidenceFactors,
  options?: ConfidenceScoreOptions
): {
  score: number;
  verificationResult: VerificationResult;
};
//# sourceMappingURL=confidence-scoring.d.ts.map
