'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.validateDataFreshness = validateDataFreshness;
const DEFAULT_STALENESS_THRESHOLD_MS = 86400000; // 24 hours
const DEFAULT_CRYPTO_STALENESS_THRESHOLD_MS = 3600000; // 1 hour
/**
 * Validates that data returned by agent tools is not stale.
 *
 * Checks timestamps in tool output against configurable freshness thresholds.
 * Crypto assets use a shorter threshold (default: 1h) than equities (default: 24h).
 */
function validateDataFreshness(response, toolCalls, options = {}) {
  const {
    defaultThresholdMs = DEFAULT_STALENESS_THRESHOLD_MS,
    cryptoThresholdMs = DEFAULT_CRYPTO_STALENESS_THRESHOLD_MS,
    isCryptoSymbol: isCryptoFn = defaultIsCryptoSymbol,
    toolChecks = {
      market_data: 'quotes',
      portfolio_analysis: 'timestamp',
      benchmark_compare: 'timestamp'
    }
  } = options;
  const issues = [];
  const now = Date.now();
  for (const call of toolCalls) {
    const checkType = toolChecks[call.name];
    if (!checkType) {
      continue;
    }
    const output = call.output;
    const retrievedAt = output?.retrievedAt ?? output?.dataRetrievedAt;
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
      const quotes = output?.quotes;
      if (quotes) {
        for (const symbol of Object.keys(quotes)) {
          const threshold = isCryptoFn(symbol)
            ? cryptoThresholdMs
            : defaultThresholdMs;
          if (ageMs > threshold) {
            const hours = (ageMs / 3600000).toFixed(1);
            const limit = isCryptoFn(symbol) ? '1h' : '24h';
            issues.push(
              `${symbol} data is ${hours}h old (threshold: ${limit}).`
            );
          }
        }
      }
    }
    if (checkType === 'timestamp' && ageMs > defaultThresholdMs) {
      const hours = (ageMs / 3600000).toFixed(1);
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
function defaultIsCryptoSymbol(symbol) {
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
//# sourceMappingURL=data-freshness.js.map
