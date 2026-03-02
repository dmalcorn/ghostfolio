/**
 * Record of a single tool call made by an LLM agent.
 */
export interface ToolCallRecord {
  /** The name of the tool that was called */
  name: string;
  /** The input arguments passed to the tool */
  input: object;
  /** The structured output returned by the tool */
  output: object;
}
/**
 * Result of a single verification check on an agent's response.
 */
export interface VerificationResult {
  /** Identifier for this verification type (e.g. 'ticker_validation', 'data_freshness') */
  type: string;
  /** Whether the verification passed */
  passed: boolean;
  /** Human-readable explanation of the result */
  details: string;
  /** Severity level: 'error' blocks response, 'warning' flags to user, 'info' is logged only */
  severity: 'info' | 'warning' | 'error';
}
/**
 * Metadata about an agent's response for observability and cost tracking.
 */
export interface AgentMetadata {
  /** The LLM model ID used */
  model: string;
  /** Total tokens consumed (input + output) */
  tokensUsed: number;
  /** End-to-end latency in milliseconds */
  latencyMs: number;
  /** Confidence score from the verification pipeline (0-100) */
  confidenceScore?: number;
  /** Breakdown of where time was spent */
  latencyBreakdown?: {
    llmMs: number;
    toolMs: number;
    verificationMs: number;
  };
  /** Detailed token breakdown */
  tokenDetail?: {
    inputTokens: number;
    outputTokens: number;
  };
}
/**
 * Token usage statistics for a single LLM call.
 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}
/**
 * Error category for agent failures.
 */
export type AgentErrorCategory =
  | 'tool_failure'
  | 'llm_failure'
  | 'verification_failure'
  | 'input_validation'
  | 'unknown';
//# sourceMappingURL=types.d.ts.map
