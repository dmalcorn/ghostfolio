# langchain-agent-toolkit

Verification, observability, and quality scoring utilities for LangChain tool-calling agents.

Built in production for the [Ghostfolio AI Finance Agent](https://github.com/ghostfolio/ghostfolio) — extracted as a reusable package for any domain-specific LLM agent.

## Installation

```bash
npm install langchain-agent-toolkit
```

## What's Included

### Verification (Post-Response Quality Checks)

Validate your agent's responses before returning them to users.

| Function                      | What It Does                                                                               |
| ----------------------------- | ------------------------------------------------------------------------------------------ |
| `calculateConfidenceScore`    | Scores agent responses 0-100 based on tool usage, verification results, and data retrieval |
| `validateDataFreshness`       | Detects stale data in tool outputs (configurable per-asset thresholds)                     |
| `validateNumericalCrosscheck` | Checks numerical consistency (e.g., allocations sum to ~100%)                              |
| `validateTickerSymbols`       | Detects hallucinated ticker symbols not present in tool output                             |

### Observability (Monitoring & Diagnostics)

Track costs, classify errors, and sanitize traces for production agents.

| Function                    | What It Does                                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `categorizeError`           | Classifies errors into actionable buckets: `llm_failure`, `tool_failure`, `input_validation`, `verification_failure`, `unknown` |
| `extractTokenUsage`         | Extracts token counts from LangChain AIMessage (supports both `usage_metadata` and `response_metadata` formats)                 |
| `accumulateTokenUsage`      | Sums token usage across multi-turn agent loops                                                                                  |
| `sanitizeToolCallsForTrace` | Redacts sensitive fields from tool outputs before sending to LangSmith/other trace backends                                     |

## Quick Start

### Confidence Scoring

```typescript
import {
  calculateConfidenceScore,
  VerificationResult
} from 'langchain-agent-toolkit';

const verifications: VerificationResult[] = [
  { type: 'ticker_validation', passed: true, details: '', severity: 'info' },
  {
    type: 'data_freshness',
    passed: false,
    details: 'Stale data',
    severity: 'warning'
  }
];

const { score, verificationResult } = calculateConfidenceScore({
  toolCallCount: 2,
  verificationResults: verifications,
  hasToolErrors: false,
  dataRetrievedCount: 2
});

console.log(score); // 85 (100 - 15 for warning)
console.log(verificationResult.passed); // true (above 70 threshold)
```

### Data Freshness Validation

```typescript
import { validateDataFreshness, ToolCallRecord } from 'langchain-agent-toolkit';

const toolCalls: ToolCallRecord[] = [
  {
    name: 'market_data',
    input: { symbols: ['AAPL'] },
    output: {
      quotes: { AAPL: { marketPrice: 150 } },
      retrievedAt: new Date(Date.now() - 25 * 3600000).toISOString() // 25h ago
    }
  }
];

const result = validateDataFreshness('AAPL is at $150', toolCalls);
console.log(result.passed); // false
console.log(result.details); // "Stale data detected: AAPL data is 25.0h old (threshold: 24h)."
```

### Ticker Symbol Hallucination Detection

```typescript
import { validateTickerSymbols, ToolCallRecord } from 'langchain-agent-toolkit';

const toolCalls: ToolCallRecord[] = [
  {
    name: 'portfolio_analysis',
    input: {},
    output: { holdings: [{ symbol: 'AAPL' }, { symbol: 'MSFT' }] }
  }
];

// LLM response mentions GOOGL but it wasn't in the tool output
const result = validateTickerSymbols(
  'Your portfolio has AAPL, MSFT, and GOOGL performing well.',
  toolCalls
);

console.log(result.passed); // false
console.log(result.details); // "Symbols mentioned in response but not found in tool data: GOOGL."
```

### Error Categorization

```typescript
import { categorizeError } from 'langchain-agent-toolkit';

categorizeError(new Error('429 Too Many Requests')); // 'llm_failure'
categorizeError(new Error('Validation failed')); // 'input_validation'
categorizeError(new Error('Prisma client error')); // 'tool_failure'
categorizeError(new Error('Something unknown')); // 'unknown'
```

### Token Tracking

```typescript
import {
  extractTokenUsage,
  accumulateTokenUsage
} from 'langchain-agent-toolkit';

// Works with LangChain AIMessage objects
const usage = extractTokenUsage(aiMessage);
console.log(usage); // { inputTokens: 100, outputTokens: 50, totalTokens: 150 }

// Accumulate across multi-turn conversations
const total = accumulateTokenUsage(turn1Usage, turn2Usage);
```

### Trace Sanitization

```typescript
import {
  sanitizeToolCallsForTrace,
  ToolCallRecord
} from 'langchain-agent-toolkit';

const toolCalls: ToolCallRecord[] = [
  {
    name: 'portfolio_analysis',
    input: {},
    output: {
      holdings: [{ symbol: 'AAPL', quantity: 100, marketPrice: 150 }],
      summary: { netWorth: 50000 }
    }
  }
];

const sanitized = sanitizeToolCallsForTrace(toolCalls);
// holdings[0].quantity  => '[REDACTED]'
// holdings[0].symbol    => 'AAPL' (preserved)
// summary.netWorth      => '[REDACTED]'
```

## Customization

All functions accept an options object for customization:

```typescript
// Custom freshness thresholds
validateDataFreshness(response, toolCalls, {
  defaultThresholdMs: 12 * 3600000, // 12 hours instead of 24
  cryptoThresholdMs: 30 * 60000, // 30 minutes instead of 1 hour
  isCryptoSymbol: (s) => s.startsWith('X') // custom crypto detection
});

// Custom confidence scoring weights
calculateConfidenceScore(factors, {
  lowConfidenceThreshold: 60, // more lenient
  errorPenalty: 30, // harsher on errors
  warningPenalty: 10 // more lenient on warnings
});

// Custom redaction rules for your domain
sanitizeToolCallsForTrace(toolCalls, {
  redactionRules: {
    my_tool: {
      holdingFields: ['secretField', 'pii'],
      summaryFields: ['totalValue']
    }
  }
});

// Custom error patterns
categorizeError(error, {
  patterns: [
    { patterns: ['anthropic', 'claude'], category: 'llm_failure' },
    { patterns: ['database', 'sql'], category: 'tool_failure' }
  ]
});
```

## Types

The package exports all TypeScript interfaces:

```typescript
import type {
  ToolCallRecord,
  VerificationResult,
  AgentMetadata,
  TokenUsage,
  AgentErrorCategory,
  ConfidenceFactors,
  ConfidenceScoreOptions,
  DataFreshnessOptions,
  NumericalCrosscheckOptions,
  TickerValidationOptions,
  ErrorCategorizerOptions,
  ErrorPattern,
  TraceSanitizerOptions,
  RedactionRule
} from 'langchain-agent-toolkit';
```

## Framework Compatibility

- **LangChain.js** — `extractTokenUsage` works with `AIMessage` from `@langchain/core/messages`
- **Vercel AI SDK** — Types are compatible; pass tool call records in the standard format
- **Custom agents** — No framework dependency except for token tracking (which accepts `any`)

## Origin

Extracted from the [Ghostfolio AI Finance Agent](https://github.com/ghostfolio/ghostfolio), built for the [Gauntlet AI](https://gauntlet.ai) AgentForge training program. The verification and observability patterns were developed to solve real production problems: LLM hallucination of financial data, stale market prices, cost tracking across multi-turn conversations, and PII protection in observability traces.

## License

AGPL-3.0 — consistent with [Ghostfolio](https://github.com/ghostfolio/ghostfolio).
