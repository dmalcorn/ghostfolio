export interface AgentChatResponse {
  response: string;
  toolCalls: AgentToolCallRecord[];
  conversationId: string;
  verification: AgentVerificationResult[];
  metadata: AgentChatMetadata;
}

export interface AgentToolCallRecord {
  name: string;
  input: object;
  output: object;
}

export interface AgentVerificationResult {
  type: string;
  passed: boolean;
  details: string;
  severity: 'info' | 'warning' | 'error';
}

export interface AgentChatMetadata {
  model: string;
  tokensUsed: number;
  latencyMs: number;
}
