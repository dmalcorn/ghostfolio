import { VerificationResult } from './verification.interfaces';

const LOW_CONFIDENCE_THRESHOLD = 70;

export interface ConfidenceFactors {
  toolCallCount: number;
  verificationResults: VerificationResult[];
  hasToolErrors: boolean;
  dataRetrievedCount: number;
}

export function calculateConfidenceScore(factors: ConfidenceFactors): {
  score: number;
  verificationResult: VerificationResult;
} {
  let score = 100;

  // Deduct for no tool calls (agent guessed without data)
  if (factors.toolCallCount === 0) {
    score -= 40;
  }

  // Deduct for each failed verification
  for (const result of factors.verificationResults) {
    if (!result.passed) {
      switch (result.severity) {
        case 'error':
          score -= 25;
          break;
        case 'warning':
          score -= 15;
          break;
        case 'info':
          score -= 5;
          break;
      }
    }
  }

  // Deduct for tool errors
  if (factors.hasToolErrors) {
    score -= 20;
  }

  // Deduct for missing data retrieval
  if (factors.dataRetrievedCount === 0 && factors.toolCallCount > 0) {
    score -= 15;
  }

  // Clamp to 0-100
  score = Math.max(0, Math.min(100, score));

  const passed = score >= LOW_CONFIDENCE_THRESHOLD;
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
