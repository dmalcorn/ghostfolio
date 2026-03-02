# Agent Architecture Summary — Ghostfolio AI Finance Agent

**Project:** Ghostfolio AI Finance Agent (AgentForge)
**Date:** 2026-02-26
**Full Architecture:** See `gauntlet_docs/architecture.md` (12 ADRs, 528 lines)

---

## Domain & Use Cases

The Ghostfolio AI Finance Agent adds conversational portfolio intelligence to Ghostfolio, an open-source wealth management platform. Users ask natural language questions about their financial data — portfolio holdings, market prices, benchmark comparisons, symbol lookups, and watchlist management — and receive verified, data-grounded responses. The agent is integrated as a NestJS module within the existing Ghostfolio monorepo, accessing real user data through established services with full authentication and data isolation.

---

## Agent Architecture

**Framework:** LangChain.js with a tool-calling agent executor
**LLM:** Claude Sonnet 4 via OpenRouter (fallbacks: GPT-4o, GPT-4o Mini)
**Memory:** Redis-backed conversation persistence (24h TTL)
**Auth:** JWT-scoped — user identity flows from token through every tool call

### Tools (5)

| Tool                 | Service Wrapped                 | Example Query             |
| -------------------- | ------------------------------- | ------------------------- |
| `portfolio_analysis` | PortfolioService.getDetails()   | "What's in my portfolio?" |
| `market_data`        | DataProviderService.getQuotes() | "Price of AAPL?"          |
| `benchmark_compare`  | BenchmarkService                | "Compare me to S&P 500"   |
| `symbol_search`      | DataProviderService.search()    | "Find crypto ETFs"        |
| `watchlist_manage`   | WatchlistService                | "Add TSLA to watchlist"   |

Each tool is a factory function receiving a `ToolContext` (userId + baseCurrency from JWT) and NestJS services via dependency injection. Tools use Zod schema validation for inputs and return structured JSON. The userId is never accepted as tool input — it is always hardcoded from the JWT, preventing prompt injection from accessing other users' data.

### Data Flow

```
User ──► Angular Chat UI (/ai-agent)
              │
              ▼
    POST /api/v1/agent/chat (JWT)
              │
              ▼
      ┌─── Agent Controller (AuthGuard) ───┐
      │                                     │
      │   Agent Service                     │
      │   ├── LangChain AgentExecutor       │
      │   │   ├── System Prompt             │
      │   │   ├── Redis Memory              │
      │   │   ├── LLM (OpenRouter)          │
      │   │   └── Tool Registry (5 tools)   │
      │   │         │                       │
      │   │         ▼                       │
      │   │   Existing Ghostfolio Services  │
      │   │   (Portfolio, DataProvider,     │
      │   │    Benchmark, Watchlist)        │
      │   │         │                       │
      │   │         ▼                       │
      │   │   PostgreSQL + External APIs    │
      │   │                                 │
      │   └── Verification Pipeline         │
      │                                     │
      └── Response + Metadata ──────────────┘
              │
              ▼
         LangSmith (traces)
```

---

## Verification Strategy

Four verification types run post-response before returning to the user:

| Verification              | What It Checks                                                              | Severity |
| ------------------------- | --------------------------------------------------------------------------- | -------- |
| **Ticker Validation**     | All symbols in response exist in data providers                             | error    |
| **Numerical Cross-Check** | Allocation percentages sum to ~100%, returns match calculations             | warning  |
| **Data Freshness**        | Market data timestamps are current (flags >24h stale on trading days)       | warning  |
| **Confidence Scoring**    | Aggregates verification results into 0-100 score; <70 triggers user warning | info     |

Verifications are pure functions — they inspect the response and tool outputs but never modify them. Results are surfaced in the chat UI as badges alongside each agent response.

---

## Evaluation Results

**66 test cases** across 4 categories, achieving a **100% pass rate** (66/66):

| Category    | Cases | Pass Rate | Coverage                                                   |
| ----------- | ----- | --------- | ---------------------------------------------------------- |
| Happy Path  | 23    | 100%      | Standard portfolio, market, and benchmark queries          |
| Edge Case   | 12    | 100%      | Unknown tickers, missing data, mixed valid/invalid inputs  |
| Adversarial | 12    | 100%      | Prompt injection, cross-user data requests, role deviation |
| Multi-Step  | 12    | 100%      | Queries requiring 2-3 chained tool calls                   |

Each test case validates: correct tool selection, expected output patterns present, no unexpected/unsafe patterns. Results output as structured JSON for CI regression tracking. All multi-step queries complete within 15 seconds (meets NFR2 target).

---

## Observability

All agent requests are traced via **LangSmith** (project: `ghostfolio-agent`) with automatic capture of:

- **Token usage:** input/output tokens per request (accumulated across multi-turn loops)
- **Latency breakdown:** LLM time, tool execution time, verification time, total end-to-end
- **Cost per query:** computed from token counts and model pricing
- **Error categorization:** tool_execution_error, llm_error, verification_error, unknown
- **Trace sanitization:** portfolio quantities, balances, and investment amounts are redacted before sending to LangSmith to prevent financial data leakage

---

## Open Source Contribution

**Published npm package:** [`langchain-agent-toolkit`](https://www.npmjs.com/package/langchain-agent-toolkit) (v0.1.0)

The verification and observability layers were extracted into a standalone, framework-agnostic npm package that any LangChain tool-calling agent can use. The package includes:

- **Verification:** Confidence scoring, data freshness validation, numerical consistency checks, ticker symbol hallucination detection
- **Observability:** Error categorization, token usage tracking, trace sanitization (PII redaction)

All functions are pure TypeScript with configurable options — no dependency on NestJS, Ghostfolio, or any specific LLM provider. 58 unit tests, AGPL-3.0 licensed.

Source: `packages/langchain-agent-toolkit/` in this repository.
