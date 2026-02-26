import { ToolCallRecord } from '../interfaces/agent.interfaces';
import { VerificationResult } from './verification.interfaces';

const ALLOCATION_SUM_TOLERANCE = 2.0; // Allow 2% deviation from 100%

export function validateNumericalCrosscheck(
  response: string,
  toolCalls: ToolCallRecord[]
): VerificationResult {
  const issues: string[] = [];

  for (const call of toolCalls) {
    if (call.name === 'portfolio_analysis') {
      const allocationIssue = checkAllocationSum(call.output);

      if (allocationIssue) {
        issues.push(allocationIssue);
      }
    }

    if (call.name === 'benchmark_compare') {
      const benchmarkIssue = checkBenchmarkConsistency(call.output);

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

function checkAllocationSum(output: object): string | null {
  const record = output as Record<string, unknown>;
  const holdings = record?.holdings;

  if (!Array.isArray(holdings) || holdings.length === 0) {
    return null;
  }

  let sum = 0;

  for (const holding of holdings) {
    const h = holding as Record<string, unknown>;
    const alloc = parseFloat(String(h?.allocationInPercentage ?? '0'));

    if (!isNaN(alloc)) {
      sum += alloc;
    }
  }

  const deviation = Math.abs(sum - 100);

  if (deviation > ALLOCATION_SUM_TOLERANCE) {
    return `Allocation percentages sum to ${sum.toFixed(2)}% (expected ~100%, deviation ${deviation.toFixed(2)}%).`;
  }

  return null;
}

function checkBenchmarkConsistency(output: object): string | null {
  const record = output as Record<string, unknown>;

  if (record?.mode !== 'compare') {
    return null;
  }

  const portfolio = record?.portfolio as Record<string, unknown> | undefined;

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

    if (ratio > 10) {
      return `Annualized performance (${annualizedPercent}%) seems disproportionate to net performance (${netPerfPercent}%). Data may be unreliable for this date range.`;
    }
  }

  return null;
}
