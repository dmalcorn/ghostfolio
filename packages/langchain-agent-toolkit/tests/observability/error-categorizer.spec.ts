import { categorizeError } from '../../src/observability/error-categorizer';

describe('categorizeError', () => {
  it('should categorize rate limit errors as llm_failure', () => {
    expect(categorizeError(new Error('429 Too Many Requests'))).toBe(
      'llm_failure'
    );
    expect(categorizeError(new Error('rate limit exceeded'))).toBe(
      'llm_failure'
    );
  });

  it('should categorize timeout/connection errors as llm_failure', () => {
    expect(categorizeError(new Error('Request timeout'))).toBe('llm_failure');
    expect(categorizeError(new Error('ECONNREFUSED'))).toBe('llm_failure');
    expect(categorizeError(new Error('503 Service Unavailable'))).toBe(
      'llm_failure'
    );
  });

  it('should categorize OpenRouter errors as llm_failure', () => {
    expect(categorizeError(new Error('OpenRouter API returned error'))).toBe(
      'llm_failure'
    );
  });

  it('should categorize LlmUnavailableError as llm_failure', () => {
    const error = new Error('Service unavailable');

    error.name = 'LlmUnavailableError';

    expect(categorizeError(error)).toBe('llm_failure');
  });

  it('should categorize validation errors as input_validation', () => {
    expect(categorizeError(new Error('Validation failed'))).toBe(
      'input_validation'
    );
    expect(categorizeError(new Error('Field is required'))).toBe(
      'input_validation'
    );
    expect(categorizeError(new Error('Invalid input format'))).toBe(
      'input_validation'
    );
    expect(categorizeError(new Error('Exceeds maximum length'))).toBe(
      'input_validation'
    );
  });

  it('should categorize Prisma/service errors as tool_failure', () => {
    expect(categorizeError(new Error('Prisma client error'))).toBe(
      'tool_failure'
    );
    expect(categorizeError(new Error('Portfolio service failed'))).toBe(
      'tool_failure'
    );
    expect(
      categorizeError(new Error('Data provider returned empty result'))
    ).toBe('tool_failure');
    expect(categorizeError(new Error('Benchmark not found'))).toBe(
      'tool_failure'
    );
  });

  it('should categorize verification errors', () => {
    expect(categorizeError(new Error('Verification pipeline error'))).toBe(
      'verification_failure'
    );
    expect(categorizeError(new Error('Crosscheck failed'))).toBe(
      'verification_failure'
    );
  });

  it('should return unknown for unrecognized errors', () => {
    expect(categorizeError(new Error('Something went wrong'))).toBe('unknown');
  });

  it('should return unknown for non-Error values', () => {
    expect(categorizeError('string error')).toBe('unknown');
    expect(categorizeError(null)).toBe('unknown');
    expect(categorizeError(42)).toBe('unknown');
  });

  it('should accept custom patterns', () => {
    const result = categorizeError(new Error('Anthropic API failed'), {
      patterns: [{ patterns: ['anthropic'], category: 'llm_failure' }]
    });

    expect(result).toBe('llm_failure');
  });

  it('should accept custom error name map', () => {
    const error = new Error('custom');

    error.name = 'MyCustomError';

    const result = categorizeError(error, {
      errorNameMap: { MyCustomError: 'tool_failure' }
    });

    expect(result).toBe('tool_failure');
  });
});
