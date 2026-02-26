import { ToolCallRecord } from '../interfaces/agent.interfaces';
import { VerificationResult } from './verification.interfaces';

const EQUITY_STALENESS_THRESHOLD_MS = 86_400_000; // 24 hours
const CRYPTO_STALENESS_THRESHOLD_MS = 3_600_000; // 1 hour

export function validateDataFreshness(
  response: string,
  toolCalls: ToolCallRecord[]
): VerificationResult {
  const issues: string[] = [];
  const now = Date.now();

  for (const call of toolCalls) {
    const output = call.output as Record<string, unknown>;
    const retrievedAt =
      (output?.retrievedAt as string) ?? (output?.dataRetrievedAt as string);

    if (!retrievedAt || typeof retrievedAt !== 'string') {
      continue;
    }

    // Strip timezone label suffix (e.g., " ET") for parsing
    const cleanTimestamp = retrievedAt.replace(/\s+[A-Z]{1,4}$/, '');
    const retrievedTime = new Date(cleanTimestamp).getTime();

    if (isNaN(retrievedTime)) {
      continue;
    }

    const ageMs = now - retrievedTime;

    if (call.name === 'market_data') {
      const quotes = output?.quotes as
        | Record<string, Record<string, unknown>>
        | undefined;

      if (quotes) {
        for (const symbol of Object.keys(quotes)) {
          const threshold = isCryptoSymbol(symbol)
            ? CRYPTO_STALENESS_THRESHOLD_MS
            : EQUITY_STALENESS_THRESHOLD_MS;

          if (ageMs > threshold) {
            const hours = (ageMs / 3_600_000).toFixed(1);
            const limit = isCryptoSymbol(symbol) ? '1h' : '24h';

            issues.push(
              `${symbol} data is ${hours}h old (threshold: ${limit}).`
            );
          }
        }
      }
    }

    if (
      call.name === 'portfolio_analysis' &&
      ageMs > EQUITY_STALENESS_THRESHOLD_MS
    ) {
      const hours = (ageMs / 3_600_000).toFixed(1);

      issues.push(`Portfolio data is ${hours}h old.`);
    }

    if (
      call.name === 'benchmark_compare' &&
      ageMs > EQUITY_STALENESS_THRESHOLD_MS
    ) {
      const hours = (ageMs / 3_600_000).toFixed(1);

      issues.push(`Benchmark data is ${hours}h old.`);
    }
  }

  if (issues.length === 0) {
    return {
      type: 'data_freshness',
      passed: true,
      details: 'All data is within acceptable freshness thresholds.',
      severity: 'info'
    };
  }

  return {
    type: 'data_freshness',
    passed: false,
    details: `Stale data detected: ${issues.join(' ')}`,
    severity: 'warning'
  };
}

function isCryptoSymbol(symbol: string): boolean {
  const cryptoPatterns = [
    /^BTC/i,
    /^ETH/i,
    /^XRP/i,
    /^SOL/i,
    /^ADA/i,
    /^DOGE/i,
    /^DOT/i,
    /^MATIC/i,
    /^AVAX/i,
    /^LINK/i,
    /-USD$/i,
    /-EUR$/i,
    /-GBP$/i
  ];

  return cryptoPatterns.some((p) => p.test(symbol));
}
