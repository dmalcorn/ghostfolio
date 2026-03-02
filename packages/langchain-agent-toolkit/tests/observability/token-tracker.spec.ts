import {
  accumulateTokenUsage,
  extractTokenUsage
} from '../../src/observability/token-tracker';

describe('extractTokenUsage', () => {
  it('should extract from usage_metadata (preferred format)', () => {
    const msg = {
      content: 'test',
      usage_metadata: {
        input_tokens: 100,
        output_tokens: 50,
        total_tokens: 150
      }
    };

    const usage = extractTokenUsage(msg);

    expect(usage.inputTokens).toBe(100);
    expect(usage.outputTokens).toBe(50);
    expect(usage.totalTokens).toBe(150);
  });

  it('should fallback to response_metadata.tokenUsage', () => {
    const msg = {
      content: 'test',
      response_metadata: {
        tokenUsage: {
          promptTokens: 200,
          completionTokens: 75,
          totalTokens: 275
        }
      }
    };

    const usage = extractTokenUsage(msg);

    expect(usage.inputTokens).toBe(200);
    expect(usage.outputTokens).toBe(75);
    expect(usage.totalTokens).toBe(275);
  });

  it('should return zeros when neither is present', () => {
    const msg = { content: 'test' };
    const usage = extractTokenUsage(msg);

    expect(usage.inputTokens).toBe(0);
    expect(usage.outputTokens).toBe(0);
    expect(usage.totalTokens).toBe(0);
  });

  it('should prefer usage_metadata over response_metadata', () => {
    const msg = {
      content: 'test',
      usage_metadata: {
        input_tokens: 10,
        output_tokens: 5,
        total_tokens: 15
      },
      response_metadata: {
        tokenUsage: {
          promptTokens: 999,
          completionTokens: 999,
          totalTokens: 1998
        }
      }
    };

    const usage = extractTokenUsage(msg);

    expect(usage.inputTokens).toBe(10);
    expect(usage.totalTokens).toBe(15);
  });
});

describe('accumulateTokenUsage', () => {
  it('should correctly sum two TokenUsage objects', () => {
    const a = { inputTokens: 100, outputTokens: 50, totalTokens: 150 };
    const b = { inputTokens: 200, outputTokens: 75, totalTokens: 275 };

    const result = accumulateTokenUsage(a, b);

    expect(result.inputTokens).toBe(300);
    expect(result.outputTokens).toBe(125);
    expect(result.totalTokens).toBe(425);
  });

  it('should handle zeros', () => {
    const a = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
    const b = { inputTokens: 50, outputTokens: 25, totalTokens: 75 };

    const result = accumulateTokenUsage(a, b);

    expect(result).toEqual(b);
  });
});
