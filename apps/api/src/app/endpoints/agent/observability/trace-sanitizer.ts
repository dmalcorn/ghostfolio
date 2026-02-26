import { ToolCallRecord } from '../interfaces/agent.interfaces';

const PORTFOLIO_REDACT_FIELDS = [
  'quantity',
  'marketPrice',
  'valueInBaseCurrency',
  'netPerformance',
  'investment',
  'balance'
];

const BENCHMARK_REDACT_FIELDS = [
  'netPerformance',
  'currentNetWorth',
  'totalInvestment'
];

export function sanitizeToolCallsForTrace(
  toolCalls: ToolCallRecord[]
): ToolCallRecord[] {
  return toolCalls.map((tc) => ({
    name: tc.name,
    input: tc.input,
    output: sanitizeToolOutput(tc.name, tc.output)
  }));
}

function sanitizeToolOutput(toolName: string, output: object): object {
  const clone = JSON.parse(JSON.stringify(output));

  if (toolName === 'portfolio_analysis') {
    sanitizePortfolioOutput(clone);
  }

  if (toolName === 'benchmark_compare') {
    sanitizeBenchmarkOutput(clone);
  }

  return clone;
}

function sanitizePortfolioOutput(output: Record<string, unknown>): void {
  if (Array.isArray(output.holdings)) {
    for (const holding of output.holdings) {
      for (const field of PORTFOLIO_REDACT_FIELDS) {
        if (field in holding) {
          holding[field] = '[REDACTED]';
        }
      }
    }
  }

  if (Array.isArray(output.accounts)) {
    for (const account of output.accounts) {
      if ('balance' in account) {
        account.balance = '[REDACTED]';
      }

      if ('valueInBaseCurrency' in account) {
        account.valueInBaseCurrency = '[REDACTED]';
      }
    }
  }

  if (output.summary && typeof output.summary === 'object') {
    const summary = output.summary as Record<string, unknown>;

    if ('netWorth' in summary) {
      summary.netWorth = '[REDACTED]';
    }

    if ('totalInvestment' in summary) {
      summary.totalInvestment = '[REDACTED]';
    }

    if ('netPerformance' in summary) {
      summary.netPerformance = '[REDACTED]';
    }
  }
}

function sanitizeBenchmarkOutput(output: Record<string, unknown>): void {
  if (output.portfolio && typeof output.portfolio === 'object') {
    const portfolio = output.portfolio as Record<string, unknown>;

    for (const field of BENCHMARK_REDACT_FIELDS) {
      if (field in portfolio) {
        portfolio[field] = '[REDACTED]';
      }
    }
  }
}
