'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.validateNumericalCrosscheck = validateNumericalCrosscheck;
const DEFAULT_ALLOCATION_TOLERANCE = 2.0; // Allow 2% deviation from 100%
/**
 * Validates numerical consistency in agent tool outputs.
 *
 * Checks:
 * 1. Portfolio allocation percentages sum to approximately 100%
 * 2. Benchmark comparison performance metrics are internally consistent
 */
function validateNumericalCrosscheck(response, toolCalls, options = {}) {
  const {
    allocationTolerance = DEFAULT_ALLOCATION_TOLERANCE,
    allocationField = 'allocationInPercentage',
    portfolioToolName = 'portfolio_analysis',
    benchmarkToolName = 'benchmark_compare',
    maxPerformanceRatio = 10
  } = options;
  const issues = [];
  for (const call of toolCalls) {
    if (call.name === portfolioToolName) {
      const allocationIssue = checkAllocationSum(
        call.output,
        allocationTolerance,
        allocationField
      );
      if (allocationIssue) {
        issues.push(allocationIssue);
      }
    }
    if (call.name === benchmarkToolName) {
      const benchmarkIssue = checkBenchmarkConsistency(
        call.output,
        maxPerformanceRatio
      );
      if (benchmarkIssue) {
        issues.push(benchmarkIssue);
      }
    }
  }
  if (issues.length === 0) {
    return {
      type: 'numerical_crosscheck',
      passed: true,
      details: 'All numerical values are internally consistent.',
      severity: 'info'
    };
  }
  return {
    type: 'numerical_crosscheck',
    passed: false,
    details: issues.join(' '),
    severity: 'warning'
  };
}
function checkAllocationSum(output, tolerance, allocationField) {
  const record = output;
  const holdings = record?.holdings;
  if (!Array.isArray(holdings) || holdings.length === 0) {
    return null;
  }
  let sum = 0;
  for (const holding of holdings) {
    const h = holding;
    const alloc = parseFloat(String(h?.[allocationField] ?? '0'));
    if (!isNaN(alloc)) {
      sum += alloc;
    }
  }
  const deviation = Math.abs(sum - 100);
  if (deviation > tolerance) {
    return `Allocation percentages sum to ${sum.toFixed(2)}% (expected ~100%, deviation ${deviation.toFixed(2)}%).`;
  }
  return null;
}
function checkBenchmarkConsistency(output, maxRatio) {
  const record = output;
  if (record?.mode !== 'compare') {
    return null;
  }
  const portfolio = record?.portfolio;
  if (!portfolio) {
    return null;
  }
  const netPerfPercent = portfolio?.netPerformancePercent;
  const annualizedPercent = portfolio?.annualizedPerformancePercent;
  if (
    netPerfPercent != null &&
    annualizedPercent != null &&
    typeof netPerfPercent === 'number' &&
    typeof annualizedPercent === 'number' &&
    Math.abs(netPerfPercent) > 0.01
  ) {
    const ratio = Math.abs(annualizedPercent / netPerfPercent);
    if (ratio > maxRatio) {
      return `Annualized performance (${annualizedPercent}%) seems disproportionate to net performance (${netPerfPercent}%). Data may be unreliable for this date range.`;
    }
  }
  return null;
}
//# sourceMappingURL=numerical-crosscheck.js.map
