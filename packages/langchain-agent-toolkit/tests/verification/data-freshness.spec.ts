import { ToolCallRecord } from '../../src/types';
import { validateDataFreshness } from '../../src/verification/data-freshness';

describe('validateDataFreshness', () => {
  it('should pass with fresh data (< 24h)', () => {
    const toolCalls: ToolCallRecord[] = [
      {
        name: 'market_data',
        input: {},
        output: {
          quotes: { AAPL: { marketPrice: 150 } },
          retrievedAt: new Date().toISOString()
        }
      }
    ];

    const result = validateDataFreshness('response', toolCalls);

    expect(result.type).toBe('data_freshness');
    expect(result.passed).toBe(true);
  });

  it('should fail with stale equity data (> 24h)', () => {
    const staleDate = new Date(Date.now() - 25 * 60 * 60 * 1000);

    const toolCalls: ToolCallRecord[] = [
      {
        name: 'market_data',
        input: {},
        output: {
          quotes: { AAPL: { marketPrice: 150 } },
          retrievedAt: staleDate.toISOString()
        }
      }
    ];

    const result = validateDataFreshness('response', toolCalls);

    expect(result.passed).toBe(false);
    expect(result.severity).toBe('warning');
    expect(result.details).toContain('AAPL');
    expect(result.details).toContain('threshold: 24h');
  });

  it('should detect stale crypto data after 1 hour', () => {
    const staleDate = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const toolCalls: ToolCallRecord[] = [
      {
        name: 'market_data',
        input: {},
        output: {
          quotes: { 'BTC-USD': { marketPrice: 50000 } },
          retrievedAt: staleDate.toISOString()
        }
      }
    ];

    const result = validateDataFreshness('response', toolCalls);

    expect(result.passed).toBe(false);
    expect(result.details).toContain('BTC-USD');
    expect(result.details).toContain('threshold: 1h');
  });

  it('should pass when crypto data is less than 1h old', () => {
    const freshDate = new Date(Date.now() - 30 * 60 * 1000); // 30 min

    const toolCalls: ToolCallRecord[] = [
      {
        name: 'market_data',
        input: {},
        output: {
          quotes: { 'ETH-USD': { marketPrice: 3000 } },
          retrievedAt: freshDate.toISOString()
        }
      }
    ];

    const result = validateDataFreshness('response', toolCalls);

    expect(result.passed).toBe(true);
  });

  it('should gracefully handle missing retrievedAt field', () => {
    const toolCalls: ToolCallRecord[] = [
      {
        name: 'market_data',
        input: {},
        output: {
          quotes: { AAPL: { marketPrice: 150 } }
        }
      }
    ];

    const result = validateDataFreshness('response', toolCalls);

    expect(result.passed).toBe(true);
  });

  it('should accumulate issues from multiple stale sources', () => {
    const staleDate = new Date(Date.now() - 25 * 60 * 60 * 1000);

    const toolCalls: ToolCallRecord[] = [
      {
        name: 'market_data',
        input: {},
        output: {
          quotes: {
            AAPL: { marketPrice: 150 },
            MSFT: { marketPrice: 400 }
          },
          retrievedAt: staleDate.toISOString()
        }
      },
      {
        name: 'portfolio_analysis',
        input: {},
        output: {
          holdings: [],
          dataRetrievedAt: staleDate.toISOString()
        }
      }
    ];

    const result = validateDataFreshness('response', toolCalls);

    expect(result.passed).toBe(false);
    expect(result.details).toContain('AAPL');
    expect(result.details).toContain('MSFT');
    expect(result.details).toContain('Portfolio analysis data');
  });

  it('should detect stale portfolio data via dataRetrievedAt', () => {
    const staleDate = new Date(Date.now() - 25 * 60 * 60 * 1000);

    const toolCalls: ToolCallRecord[] = [
      {
        name: 'portfolio_analysis',
        input: {},
        output: {
          holdings: [],
          dataRetrievedAt: staleDate.toISOString()
        }
      }
    ];

    const result = validateDataFreshness('response', toolCalls);

    expect(result.passed).toBe(false);
    expect(result.details).toContain('Portfolio analysis data');
  });

  it('should detect stale benchmark data', () => {
    const staleDate = new Date(Date.now() - 25 * 60 * 60 * 1000);

    const toolCalls: ToolCallRecord[] = [
      {
        name: 'benchmark_compare',
        input: {},
        output: {
          mode: 'compare',
          retrievedAt: staleDate.toISOString()
        }
      }
    ];

    const result = validateDataFreshness('response', toolCalls);

    expect(result.passed).toBe(false);
    expect(result.details).toContain('Benchmark compare data');
  });

  it('should pass with empty tool calls', () => {
    const result = validateDataFreshness('response', []);

    expect(result.passed).toBe(true);
  });

  it('should accept custom thresholds', () => {
    const staleDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2h

    const toolCalls: ToolCallRecord[] = [
      {
        name: 'market_data',
        input: {},
        output: {
          quotes: { AAPL: { marketPrice: 150 } },
          retrievedAt: staleDate.toISOString()
        }
      }
    ];

    // With default 24h threshold, this would pass
    const passResult = validateDataFreshness('response', toolCalls);
    expect(passResult.passed).toBe(true);

    // With custom 1h threshold, this should fail
    const failResult = validateDataFreshness('response', toolCalls, {
      defaultThresholdMs: 3_600_000
    });
    expect(failResult.passed).toBe(false);
  });
});
