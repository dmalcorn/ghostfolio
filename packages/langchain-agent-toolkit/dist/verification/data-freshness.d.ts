import { ToolCallRecord, VerificationResult } from '../types';

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
export declare function validateDataFreshness(
  response: string,
  toolCalls: ToolCallRecord[],
  options?: DataFreshnessOptions
): VerificationResult;
//# sourceMappingURL=data-freshness.d.ts.map
