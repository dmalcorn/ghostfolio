import { VerificationResult } from '../../src/types';
import { calculateConfidenceScore } from '../../src/verification/confidence-scoring';

describe('calculateConfidenceScore', () => {
  it('should return 100 when all verifications pass and tools called', () => {
    const verifications: VerificationResult[] = [
      {
        type: 'ticker_validation',
        passed: true,
        details: '',
        severity: 'info'
      },
      {
        type: 'numerical_crosscheck',
        passed: true,
        details: '',
        severity: 'info'
      },
      { type: 'data_freshness', passed: true, details: '', severity: 'info' }
    ];

    const { score, verificationResult } = calculateConfidenceScore({
      toolCallCount: 2,
      verificationResults: verifications,
      hasToolErrors: false,
      dataRetrievedCount: 2
    });

    expect(score).toBe(100);
    expect(verificationResult.passed).toBe(true);
    expect(verificationResult.type).toBe('confidence_score');
  });

  it('should deduct 40 for no tool calls', () => {
    const { score } = calculateConfidenceScore({
      toolCallCount: 0,
      verificationResults: [],
      hasToolErrors: false,
      dataRetrievedCount: 0
    });

    expect(score).toBe(60);
  });

  it('should deduct 15 for each warning failure', () => {
    const verifications: VerificationResult[] = [
      { type: 'test', passed: false, details: '', severity: 'warning' }
    ];

    const { score } = calculateConfidenceScore({
      toolCallCount: 1,
      verificationResults: verifications,
      hasToolErrors: false,
      dataRetrievedCount: 1
    });

    expect(score).toBe(85);
  });

  it('should deduct 25 for each error failure', () => {
    const verifications: VerificationResult[] = [
      { type: 'test', passed: false, details: '', severity: 'error' }
    ];

    const { score } = calculateConfidenceScore({
      toolCallCount: 1,
      verificationResults: verifications,
      hasToolErrors: false,
      dataRetrievedCount: 1
    });

    expect(score).toBe(75);
  });

  it('should deduct 20 for tool errors', () => {
    const { score } = calculateConfidenceScore({
      toolCallCount: 1,
      verificationResults: [],
      hasToolErrors: true,
      dataRetrievedCount: 0
    });

    // 100 - 20 (tool errors) - 15 (no data retrieved with tool calls) = 65
    expect(score).toBe(65);
  });

  it('should deduct 15 when tools called but no data retrieved', () => {
    const { score } = calculateConfidenceScore({
      toolCallCount: 1,
      verificationResults: [],
      hasToolErrors: false,
      dataRetrievedCount: 0
    });

    expect(score).toBe(85);
  });

  it('should mark score below 70 as not passed with warning', () => {
    const { score, verificationResult } = calculateConfidenceScore({
      toolCallCount: 0,
      verificationResults: [
        { type: 'test', passed: false, details: '', severity: 'warning' }
      ],
      hasToolErrors: false,
      dataRetrievedCount: 0
    });

    // 100 - 40 (no tools) - 15 (warning) = 45
    expect(score).toBe(45);
    expect(verificationResult.passed).toBe(false);
    expect(verificationResult.severity).toBe('warning');
    expect(verificationResult.details).toContain('Low confidence');
  });

  it('should clamp score to 0 minimum', () => {
    const verifications: VerificationResult[] = [
      { type: 'a', passed: false, details: '', severity: 'error' },
      { type: 'b', passed: false, details: '', severity: 'error' },
      { type: 'c', passed: false, details: '', severity: 'error' }
    ];

    const { score } = calculateConfidenceScore({
      toolCallCount: 0,
      verificationResults: verifications,
      hasToolErrors: true,
      dataRetrievedCount: 0
    });

    expect(score).toBe(0);
  });

  it('should not deduct for passed verifications', () => {
    const verifications: VerificationResult[] = [
      { type: 'a', passed: true, details: '', severity: 'warning' },
      { type: 'b', passed: true, details: '', severity: 'error' }
    ];

    const { score } = calculateConfidenceScore({
      toolCallCount: 1,
      verificationResults: verifications,
      hasToolErrors: false,
      dataRetrievedCount: 1
    });

    expect(score).toBe(100);
  });

  it('should accumulate deductions from multiple failures', () => {
    const verifications: VerificationResult[] = [
      { type: 'a', passed: false, details: '', severity: 'warning' },
      { type: 'b', passed: false, details: '', severity: 'warning' }
    ];

    const { score } = calculateConfidenceScore({
      toolCallCount: 1,
      verificationResults: verifications,
      hasToolErrors: false,
      dataRetrievedCount: 1
    });

    // 100 - 15 - 15 = 70
    expect(score).toBe(70);
  });

  it('should accept custom penalty options', () => {
    const { score } = calculateConfidenceScore(
      {
        toolCallCount: 0,
        verificationResults: [],
        hasToolErrors: false,
        dataRetrievedCount: 0
      },
      { noToolCallsPenalty: 10 }
    );

    expect(score).toBe(90);
  });

  it('should accept custom low-confidence threshold', () => {
    const { verificationResult } = calculateConfidenceScore(
      {
        toolCallCount: 0,
        verificationResults: [],
        hasToolErrors: false,
        dataRetrievedCount: 0
      },
      { lowConfidenceThreshold: 50 }
    );

    // Score is 60, threshold is 50 — should pass
    expect(verificationResult.passed).toBe(true);
  });
});
