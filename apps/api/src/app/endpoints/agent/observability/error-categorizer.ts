export type AgentErrorCategory =
  | 'tool_failure'
  | 'llm_failure'
  | 'verification_failure'
  | 'input_validation'
  | 'unknown';

export function categorizeError(error: unknown): AgentErrorCategory {
  if (!(error instanceof Error)) {
    return 'unknown';
  }

  const msg = error.message.toLowerCase();

  // LLM provider errors
  if (
    msg.includes('429') ||
    msg.includes('rate limit') ||
    msg.includes('timeout') ||
    msg.includes('econnrefused') ||
    msg.includes('503') ||
    msg.includes('openrouter') ||
    error.name === 'LlmUnavailableError'
  ) {
    return 'llm_failure';
  }

  // Input validation
  if (
    msg.includes('validation') ||
    msg.includes('required') ||
    msg.includes('invalid') ||
    msg.includes('maximum length')
  ) {
    return 'input_validation';
  }

  // Verification
  if (msg.includes('verification') || msg.includes('crosscheck')) {
    return 'verification_failure';
  }

  // Tool failures (Prisma, data provider, portfolio service)
  if (
    msg.includes('prisma') ||
    msg.includes('portfolio') ||
    msg.includes('data provider') ||
    msg.includes('benchmark') ||
    msg.includes('symbol')
  ) {
    return 'tool_failure';
  }

  return 'unknown';
}
