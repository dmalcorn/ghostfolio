import { ToolCallRecord, VerificationResult } from '../types';

const DEFAULT_STALENESS_THRESHOLD_MS = 86_400_000; // 24 hours
const DEFAULT_CRYPTO_STALENESS_THRESHOLD_MS = 3_600_000; // 1 hour

export interface DataFreshnessOptions {
  /** Default staleness threshold in ms for non-crypto data (default: 24h) */
  defaultThresholdMs?: number;
  /** Staleness threshold in ms for crypto data (default: 1h) */
  cryptoThresholdMs?: number;
  /**
   * Custom function to determine if a symbol is a cryptocurrency.
   * Default detects common crypto prefixes (BTC, ETH, etc.) and
   * currency-pair suffixes (-USD, -EUR, -GBP).
   */
  isCryptoSymbol?: (symbol: string) => boolean;
  /**
   * Tool names whose output should be checked for staleness.
   * Each entry maps a tool name to the type of staleness check:
   * - 'quotes': check each symbol in output.quotes (e.g., market data tools)
   * - 'timestamp': check the top-level retrievedAt/dataRetrievedAt (e.g., portfolio tools)
   *
   * Default: { market_data: 'quotes', portfolio_analysis: 'timestamp', benchmark_compare: 'timestamp' }
   */
  toolChecks?: Record<string, 'quotes' | 'timestamp'>;
}

/**
 * Validates that data returned by agent tools is not stale.
 *
 * Checks timestamps in tool output against configurable freshness thresholds.
 * Crypto assets use a shorter threshold (default: 1h) than equities (default: 24h).
 */
export function validateDataFreshness(
  response: string,
  toolCalls: ToolCallRecord[],
  options: DataFreshnessOptions = {}
): VerificationResult {
  const {
    defaultThresholdMs = DEFAULT_STALENESS_THRESHOLD_MS,
    cryptoThresholdMs = DEFAULT_CRYPTO_STALENESS_THRESHOLD_MS,
    isCryptoSymbol: isCryptoFn = defaultIsCryptoSymbol,
    toolChecks = {
      market_data: 'quotes' as const,
      portfolio_analysis: 'timestamp' as const,
      benchmark_compare: 'timestamp' as const
    }
  } = options;

  const issues: string[] = [];
  const now = Date.now();

  for (const call of toolCalls) {
    const checkType = toolChecks[call.name];

    if (!checkType) {
      continue;
    }

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

    if (checkType === 'quotes') {
      const quotes = output?.quotes as
        | Record<string, Record<string, unknown>>
        | undefined;

      if (quotes) {
        for (const symbol of Object.keys(quotes)) {
          const threshold = isCryptoFn(symbol)
            ? cryptoThresholdMs
            : defaultThresholdMs;

          if (ageMs > threshold) {
            const hours = (ageMs / 3_600_000).toFixed(1);
            const limit = isCryptoFn(symbol) ? '1h' : '24h';

            issues.push(
              `${symbol} data is ${hours}h old (threshold: ${limit}).`
            );
          }
        }
      }
    }

    if (checkType === 'timestamp' && ageMs > defaultThresholdMs) {
      const hours = (ageMs / 3_600_000).toFixed(1);
      const label =
        call.name.charAt(0).toUpperCase() +
        call.name.slice(1).replace(/_/g, ' ');

      issues.push(`${label} data is ${hours}h old.`);
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

function defaultIsCryptoSymbol(symbol: string): boolean {
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
