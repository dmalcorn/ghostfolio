'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.validateTickerSymbols = validateTickerSymbols;
/** Built-in false positives: common English words and abbreviations */
const DEFAULT_FALSE_POSITIVES = new Set([
  'A',
  'I',
  'AM',
  'AN',
  'AS',
  'AT',
  'BE',
  'BY',
  'DO',
  'GO',
  'HE',
  'IF',
  'IN',
  'IS',
  'IT',
  'ME',
  'MY',
  'NO',
  'OF',
  'OK',
  'ON',
  'OR',
  'SO',
  'TO',
  'UP',
  'US',
  'WE',
  'AND',
  'ARE',
  'BUT',
  'CAN',
  'DID',
  'FOR',
  'GET',
  'HAD',
  'HAS',
  'HER',
  'HIM',
  'HIS',
  'HOW',
  'ITS',
  'LET',
  'MAY',
  'NEW',
  'NOT',
  'NOW',
  'OLD',
  'OUR',
  'OWN',
  'SAY',
  'SHE',
  'THE',
  'TOO',
  'TRY',
  'USE',
  'WAY',
  'WHO',
  'ALL',
  'ANY',
  'DAY',
  'END',
  'FEW',
  'GOT',
  'LOW',
  'MAN',
  'PUT',
  'RUN',
  'SET',
  'USD',
  'EUR',
  'GBP',
  'CHF',
  'JPY',
  'CAD',
  'AUD',
  'NZD',
  'ETF',
  'BUY',
  'NOTE',
  'THIS',
  'THAT',
  'WITH',
  'FROM',
  'HAVE',
  'WILL',
  'YOUR',
  'BEEN',
  'EACH',
  'MAKE',
  'LIKE',
  'LONG',
  'LOOK',
  'MANY',
  'SOME',
  'SUCH',
  'THAN',
  'THEM',
  'THEN',
  'TIME',
  'VERY',
  'WHEN',
  'ONLY',
  'OVER',
  'ALSO'
]);
/**
 * Validates that ticker symbols mentioned in the agent's response
 * were actually present in tool output data. This prevents the LLM
 * from fabricating data about symbols it did not retrieve.
 */
function validateTickerSymbols(response, toolCalls, options = {}) {
  const {
    additionalFalsePositives,
    extractSymbols = defaultExtractKnownSymbols,
    minTickerLength = 2,
    maxTickerLength = 6
  } = options;
  const knownSymbols = extractSymbols(toolCalls);
  if (knownSymbols.size === 0) {
    return {
      type: 'ticker_validation',
      passed: true,
      details: 'No tool calls with symbol data to validate against.',
      severity: 'info'
    };
  }
  // Extract potential ticker symbols from the response
  const mentionedSymbols = new Set(
    response.match(/\b[A-Z][A-Z0-9]{0,9}\b/g) ?? []
  );
  // Merge false positive lists
  const falsePositives = additionalFalsePositives
    ? new Set([...DEFAULT_FALSE_POSITIVES, ...additionalFalsePositives])
    : DEFAULT_FALSE_POSITIVES;
  const suspiciousSymbols = [];
  for (const symbol of mentionedSymbols) {
    if (falsePositives.has(symbol)) {
      continue;
    }
    if (
      symbol.length >= minTickerLength &&
      symbol.length <= maxTickerLength &&
      !knownSymbols.has(symbol)
    ) {
      suspiciousSymbols.push(symbol);
    }
  }
  if (suspiciousSymbols.length === 0) {
    return {
      type: 'ticker_validation',
      passed: true,
      details: 'All mentioned symbols were found in tool output data.',
      severity: 'info'
    };
  }
  return {
    type: 'ticker_validation',
    passed: false,
    details: `Symbols mentioned in response but not found in tool data: ${suspiciousSymbols.join(', ')}. These may be fabricated.`,
    severity: 'warning'
  };
}
/**
 * Default symbol extractor that handles common tool output formats:
 * - `holdings[].symbol` (portfolio tools)
 * - `quotes.{SYMBOL}` (market data tools)
 * - `benchmark.symbol` and `benchmarks[].symbol` (benchmark tools)
 */
function defaultExtractKnownSymbols(toolCalls) {
  const symbols = new Set();
  for (const call of toolCalls) {
    const output = call.output;
    // Extract from holdings arrays
    if (output?.holdings && Array.isArray(output.holdings)) {
      for (const holding of output.holdings) {
        if (holding?.symbol) {
          symbols.add(String(holding.symbol));
        }
      }
    }
    // Extract from quotes maps
    if (output?.quotes && typeof output.quotes === 'object') {
      for (const symbol of Object.keys(output.quotes)) {
        symbols.add(symbol);
      }
    }
    // Extract from single benchmark
    if (output?.benchmark && typeof output.benchmark === 'object') {
      const benchmark = output.benchmark;
      if (benchmark?.symbol) {
        symbols.add(String(benchmark.symbol));
      }
    }
    // Extract from benchmark arrays
    if (output?.benchmarks && Array.isArray(output.benchmarks)) {
      for (const b of output.benchmarks) {
        const benchmark = b;
        if (benchmark?.symbol) {
          symbols.add(String(benchmark.symbol));
        }
      }
    }
  }
  return symbols;
}
//# sourceMappingURL=ticker-validation.js.map
