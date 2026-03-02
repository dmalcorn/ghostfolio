import { ToolCallRecord, VerificationResult } from '../types';

export interface NumericalCrosscheckOptions {
  /** Percentage tolerance for allocation sum check (default: 2.0) */
  allocationTolerance?: number;
  /**
   * Field name in holdings objects that contains the allocation percentage.
   * Default: 'allocationInPercentage'
   */
  allocationField?: string;
  /**
   * Tool name that returns portfolio holdings with allocations.
   * Default: 'portfolio_analysis'
   */
  portfolioToolName?: string;
  /**
   * Tool name that returns benchmark comparison data.
   * Default: 'benchmark_compare'
   */
  benchmarkToolName?: string;
  /** Maximum acceptable ratio between annualized and net performance (default: 10) */
  maxPerformanceRatio?: number;
}
/**
 * Validates numerical consistency in agent tool outputs.
 *
 * Checks:
 * 1. Portfolio allocation percentages sum to approximately 100%
 * 2. Benchmark comparison performance metrics are internally consistent
 */
export declare function validateNumericalCrosscheck(
  response: string,
  toolCalls: ToolCallRecord[],
  options?: NumericalCrosscheckOptions
): VerificationResult;
//# sourceMappingURL=numerical-crosscheck.d.ts.map
