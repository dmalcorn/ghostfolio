import { ToolCallRecord } from '../interfaces/agent.interfaces';
import { validateNumericalCrosscheck } from './numerical-crosscheck';

describe('validateNumericalCrosscheck', () => {
  it('should pass when allocations sum to 100%', () => {
    const toolCalls: ToolCallRecord[] = [
      {
        name: 'portfolio_analysis',
        input: {},
        output: {
          holdings: [
            { symbol: 'VT', allocationInPercentage: '85.00' },
            { symbol: 'AMZN', allocationInPercentage: '15.00' }
          ]
        }
      }
    ];

    const result = validateNumericalCrosscheck('response', toolCalls);

    expect(result.type).toBe('numerical_crosscheck');
    expect(result.passed).toBe(true);
  });

  it('should pass when allocations are within 2% tolerance', () => {
    const toolCalls: ToolCallRecord[] = [
      {
        name: 'portfolio_analysis',
        input: {},
        output: {
          holdings: [
            { symbol: 'VT', allocationInPercentage: '84.00' },
            { symbol: 'AMZN', allocationInPercentage: '14.50' }
          ]
        }
      }
    ];

    const result = validateNumericalCrosscheck('response', toolCalls);

    expect(result.passed).toBe(true);
  });

  it('should fail when allocations deviate more than 2%', () => {
    const toolCalls: ToolCallRecord[] = [
      {
        name: 'portfolio_analysis',
        input: {},
        output: {
          holdings: [
            { symbol: 'VT', allocationInPercentage: '70.00' },
            { symbol: 'AMZN', allocationInPercentage: '15.00' }
          ]
        }
      }
    ];

    const result = validateNumericalCrosscheck('response', toolCalls);

    expect(result.passed).toBe(false);
    expect(result.severity).toBe('warning');
    expect(result.details).toContain('85.00%');
    expect(result.details).toContain('deviation');
  });

  it('should pass with no portfolio_analysis tool calls', () => {
    const toolCalls: ToolCallRecord[] = [
      {
        name: 'market_data',
        input: {},
        output: { quotes: { AAPL: { marketPrice: 150 } } }
      }
    ];

    const result = validateNumericalCrosscheck('response', toolCalls);

    expect(result.passed).toBe(true);
  });

  it('should pass with empty holdings array', () => {
    const toolCalls: ToolCallRecord[] = [
      {
        name: 'portfolio_analysis',
        input: {},
        output: { holdings: [] }
      }
    ];

    const result = validateNumericalCrosscheck('response', toolCalls);

    expect(result.passed).toBe(true);
  });

  it('should parse string percentage values correctly', () => {
    const toolCalls: ToolCallRecord[] = [
      {
        name: 'portfolio_analysis',
        input: {},
        output: {
          holdings: [
            { symbol: 'A', allocationInPercentage: '33.33' },
            { symbol: 'B', allocationInPercentage: '33.33' },
            { symbol: 'C', allocationInPercentage: '33.34' }
          ]
        }
      }
    ];

    const result = validateNumericalCrosscheck('response', toolCalls);

    expect(result.passed).toBe(true);
  });

  it('should pass for benchmark compare with reasonable ratio', () => {
    const toolCalls: ToolCallRecord[] = [
      {
        name: 'benchmark_compare',
        input: {},
        output: {
          mode: 'compare',
          portfolio: {
            netPerformancePercent: 10.5,
            annualizedPerformancePercent: 12.3
          }
        }
      }
    ];

    const result = validateNumericalCrosscheck('response', toolCalls);

    expect(result.passed).toBe(true);
  });

  it('should warn for benchmark compare with disproportionate ratio', () => {
    const toolCalls: ToolCallRecord[] = [
      {
        name: 'benchmark_compare',
        input: {},
        output: {
          mode: 'compare',
          portfolio: {
            netPerformancePercent: 0.5,
            annualizedPerformancePercent: 150
          }
        }
      }
    ];

    const result = validateNumericalCrosscheck('response', toolCalls);

    expect(result.passed).toBe(false);
    expect(result.details).toContain('disproportionate');
  });

  it('should skip benchmark compare in list mode', () => {
    const toolCalls: ToolCallRecord[] = [
      {
        name: 'benchmark_compare',
        input: {},
        output: {
          mode: 'list',
          benchmarks: [{ symbol: 'SPY' }]
        }
      }
    ];

    const result = validateNumericalCrosscheck('response', toolCalls);

    expect(result.passed).toBe(true);
  });

  it('should pass with empty tool calls', () => {
    const result = validateNumericalCrosscheck('response', []);

    expect(result.passed).toBe(true);
  });
});
