import { sanitizeToolCallsForTrace } from '../../src/observability/trace-sanitizer';
import { ToolCallRecord } from '../../src/types';

describe('sanitizeToolCallsForTrace', () => {
  it('should redact sensitive portfolio holding fields', () => {
    const toolCalls: ToolCallRecord[] = [
      {
        name: 'portfolio_analysis',
        input: {},
        output: {
          holdings: [
            {
              symbol: 'VT',
              name: 'Vanguard Total World',
              allocationInPercentage: '85.00',
              netPerformancePercent: '12.00',
              quantity: 50,
              marketPrice: 108.5,
              valueInBaseCurrency: 5425,
              netPerformance: 580,
              investment: 4845
            }
          ]
        }
      }
    ];

    const sanitized = sanitizeToolCallsForTrace(toolCalls);
    const holding = (sanitized[0].output as any).holdings[0];

    // Should be redacted
    expect(holding.quantity).toBe('[REDACTED]');
    expect(holding.marketPrice).toBe('[REDACTED]');
    expect(holding.valueInBaseCurrency).toBe('[REDACTED]');
    expect(holding.netPerformance).toBe('[REDACTED]');
    expect(holding.investment).toBe('[REDACTED]');

    // Should be preserved
    expect(holding.symbol).toBe('VT');
    expect(holding.name).toBe('Vanguard Total World');
    expect(holding.allocationInPercentage).toBe('85.00');
    expect(holding.netPerformancePercent).toBe('12.00');
  });

  it('should redact account balances and values', () => {
    const toolCalls: ToolCallRecord[] = [
      {
        name: 'portfolio_analysis',
        input: {},
        output: {
          holdings: [],
          accounts: [
            {
              name: 'Main Brokerage',
              currency: 'USD',
              balance: 500,
              valueInBaseCurrency: 6382.5
            }
          ]
        }
      }
    ];

    const sanitized = sanitizeToolCallsForTrace(toolCalls);
    const account = (sanitized[0].output as any).accounts[0];

    expect(account.balance).toBe('[REDACTED]');
    expect(account.valueInBaseCurrency).toBe('[REDACTED]');
    expect(account.name).toBe('Main Brokerage');
    expect(account.currency).toBe('USD');
  });

  it('should redact summary financial data', () => {
    const toolCalls: ToolCallRecord[] = [
      {
        name: 'portfolio_analysis',
        input: {},
        output: {
          holdings: [],
          summary: {
            netWorth: 6882.5,
            totalInvestment: 5732,
            netPerformance: 650.5,
            netPerformancePercent: 0.1135
          }
        }
      }
    ];

    const sanitized = sanitizeToolCallsForTrace(toolCalls);
    const summary = (sanitized[0].output as any).summary;

    expect(summary.netWorth).toBe('[REDACTED]');
    expect(summary.totalInvestment).toBe('[REDACTED]');
    expect(summary.netPerformance).toBe('[REDACTED]');
    expect(summary.netPerformancePercent).toBe(0.1135);
  });

  it('should redact benchmark portfolio financial data', () => {
    const toolCalls: ToolCallRecord[] = [
      {
        name: 'benchmark_compare',
        input: {},
        output: {
          mode: 'compare',
          portfolio: {
            netPerformancePercent: 10.5,
            netPerformance: 650,
            currentNetWorth: 6882,
            totalInvestment: 5732
          },
          benchmark: {
            symbol: 'SPY',
            name: 'S&P 500'
          }
        }
      }
    ];

    const sanitized = sanitizeToolCallsForTrace(toolCalls);
    const portfolio = (sanitized[0].output as any).portfolio;

    expect(portfolio.netPerformance).toBe('[REDACTED]');
    expect(portfolio.currentNetWorth).toBe('[REDACTED]');
    expect(portfolio.totalInvestment).toBe('[REDACTED]');
    expect(portfolio.netPerformancePercent).toBe(10.5);
  });

  it('should pass market data through unchanged', () => {
    const toolCalls: ToolCallRecord[] = [
      {
        name: 'market_data',
        input: { symbols: ['AAPL'] },
        output: {
          quotes: {
            AAPL: {
              symbol: 'AAPL',
              marketPrice: 150,
              currency: 'USD'
            }
          },
          retrievedAt: '2026-02-26T00:00:00Z'
        }
      }
    ];

    const sanitized = sanitizeToolCallsForTrace(toolCalls);

    expect(sanitized[0].output).toEqual(toolCalls[0].output);
  });

  it('should not mutate the original toolCalls array', () => {
    const toolCalls: ToolCallRecord[] = [
      {
        name: 'portfolio_analysis',
        input: {},
        output: {
          holdings: [{ symbol: 'VT', quantity: 50, marketPrice: 108 }]
        }
      }
    ];

    sanitizeToolCallsForTrace(toolCalls);
    const holding = (toolCalls[0].output as any).holdings[0];

    expect(holding.quantity).toBe(50);
    expect(holding.marketPrice).toBe(108);
  });

  it('should handle empty tool calls array', () => {
    const sanitized = sanitizeToolCallsForTrace([]);

    expect(sanitized).toEqual([]);
  });

  it('should accept custom redaction rules', () => {
    const toolCalls: ToolCallRecord[] = [
      {
        name: 'my_custom_tool',
        input: {},
        output: {
          holdings: [{ symbol: 'X', secretScore: 99, publicName: 'Test' }]
        }
      }
    ];

    const sanitized = sanitizeToolCallsForTrace(toolCalls, {
      redactionRules: {
        my_custom_tool: {
          holdingFields: ['secretScore']
        }
      }
    });

    const holding = (sanitized[0].output as any).holdings[0];

    expect(holding.secretScore).toBe('[REDACTED]');
    expect(holding.publicName).toBe('Test');
    expect(holding.symbol).toBe('X');
  });
});
