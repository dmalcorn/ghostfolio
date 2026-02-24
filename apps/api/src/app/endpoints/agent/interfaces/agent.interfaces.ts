import type { UserWithSettings } from '@ghostfolio/common/types';

export interface ToolContext {
  userId: string;
  baseCurrency: string;
  user: UserWithSettings;
}

export interface AgentResponse {
  response: string;
  toolCalls: ToolCallRecord[];
  conversationId: string;
  verification: VerificationResult[];
  metadata: AgentMetadata;
}

export interface ToolCallRecord {
  name: string;
  input: object;
  output: object;
}

export interface VerificationResult {
  type: string;
  passed: boolean;
  details: string;
  severity: 'info' | 'warning' | 'error';
}

export interface AgentMetadata {
  model: string;
  tokensUsed: number;
  latencyMs: number;
}

export interface ChatRequestDto {
  message: string;
  conversationId?: string;
}
