import { ToolCallRecord } from '../interfaces/agent.interfaces';
import { VerificationResult } from './verification.interfaces';

/**
 * Validates that ticker symbols mentioned in the agent's response
 * were actually present in tool output data. This prevents the LLM
 * from fabricating data about symbols it did not retrieve.
 */
export function validateTickerSymbols(
  response: string,
  toolCalls: ToolCallRecord[]
): VerificationResult {
  const knownSymbols = extractKnownSymbols(toolCalls);

  if (knownSymbols.size === 0) {
    return {
      type: 'ticker_validation',
      passed: true,
      details: 'No tool calls with symbol data to validate against.',
      severity: 'info'
    };
  }

  // Extract potential ticker symbols from the response
  // Matches patterns like AAPL, MSFT, BTC, VT, SPY, etc. (1-10 uppercase letters/digits)
  const mentionedSymbols = new Set(
    response.match(/\b[A-Z][A-Z0-9]{0,9}\b/g) ?? []
  );

  // Filter out common English words that look like tickers
  const falsePositives = new Set([
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
    'HAS',
    'HER',
    'LOW',
    'MAN',
    'OUR',
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

  const suspiciousSymbols: string[] = [];

  for (const symbol of mentionedSymbols) {
    if (falsePositives.has(symbol)) {
      continue;
    }

    // If this looks like a ticker and is NOT in our known symbols,
    // and it's not a common abbreviation, flag it
    if (symbol.length >= 2 && symbol.length <= 6 && !knownSymbols.has(symbol)) {
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

function extractKnownSymbols(toolCalls: ToolCallRecord[]): Set<string> {
  const symbols = new Set<string>();

  for (const call of toolCalls) {
    const output = call.output as Record<string, unknown>;

    // Extract symbols from portfolio_analysis output
    if (output?.holdings && Array.isArray(output.holdings)) {
      for (const holding of output.holdings) {
        if ((holding as Record<string, unknown>)?.symbol) {
          symbols.add(String((holding as Record<string, unknown>).symbol));
        }
      }
    }

    // Extract symbols from market_data output (future)
    if (output?.quotes && typeof output.quotes === 'object') {
      for (const symbol of Object.keys(
        output.quotes as Record<string, unknown>
      )) {
        symbols.add(symbol);
      }
    }
  }

  return symbols;
}
