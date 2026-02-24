---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2026-02-24'
project_name: 'Ghostfolio AI Agent (AgentForge)'
user_name: 'Diane'
inputDocuments:
  - gauntlet_docs/G4 Week 2 - AgentForge.pdf
  - gauntlet_docs/Decision.md
  - gauntlet_docs/PreSearch_Checklist_Finance.md
  - gauntlet_docs/agentforge-sprint-checklist.md
  - gauntlet_docs/documentation-approach.md
  - gauntlet_docs/prisma-upgrade-analysis.md
  - gauntlet_docs/agent-teams-reference.md
  - docs/index.md (brownfield documentation suite)
---

# Architecture Decision Document — Ghostfolio AI Agent

_A LangChain.js finance agent integrated into the Ghostfolio open-source wealth management platform._

---

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

| Category | Requirements | Architectural Impact |
|----------|-------------|---------------------|
| Natural Language Interface | Agent responds to finance domain queries in conversational English | LLM orchestration layer, prompt engineering, input parsing |
| Tool Execution | 5+ tools with structured schemas, successful execution, structured results | Tool registry, schema validation, service integration layer |
| Response Synthesis | Agent combines multi-tool results into coherent responses | Output formatting, citation tracking, response assembly |
| Conversation History | Multi-turn context preserved across turns | Persistent memory (Redis), session management |
| Error Handling | Graceful failures, no crashes, helpful error messages | Error boundary layer, fallback strategies per tool |
| Verification | 3+ domain-specific verification checks before returning responses | Verification pipeline, post-processing layer |
| Evaluation | 50+ test cases (20 happy path, 10 edge, 10 adversarial, 10 multi-step) | Eval harness, test data management, CI integration |
| Observability | Full trace logging, latency tracking, token usage, cost tracking | LangSmith integration, structured logging |
| Deployment | Publicly accessible, production-ready | Railway deployment, Docker, health checks |
| Open Source | Published package, PR, or public dataset | Package structure, documentation |

**Non-Functional Requirements:**

| NFR | Target | Architectural Driver |
|-----|--------|---------------------|
| Single-tool latency | <5 seconds | Efficient service calls, caching |
| Multi-step latency | <15 seconds | Parallel tool execution where possible |
| Tool success rate | >95% | Robust error handling, retry logic |
| Eval pass rate | >80% | Verification layer, prompt tuning |
| Hallucination rate | <5% | Source attribution, fact checking |
| Verification accuracy | >90% | Cross-referencing against data providers |
| Cost per query | <$0.05 simple, <$0.20 complex | Model selection, caching, prompt optimization |

**Scale & Complexity:**

- Primary domain: API backend (NestJS module within existing monorepo)
- Complexity level: Medium-high — brownfield integration with existing production services, LLM orchestration, domain-specific verification
- Estimated architectural components: 12 (agent module, 5 tools, 3 verification checks, memory layer, eval harness, system prompt)

### Technical Constraints & Dependencies

| Constraint | Impact |
|-----------|--------|
| Brownfield codebase (Ghostfolio) | Must follow existing NestJS module patterns, DI conventions, auth flow |
| Prisma 6 (no upgrade) | Standard Prisma client API, no ESM changes |
| CommonJS module system | LangChain packages must work in CJS context (they do) |
| OpenRouter as LLM gateway | Must use OpenAI-compatible API with custom baseURL |
| JWT authentication | Agent endpoint must be behind same auth guards |
| AGPLv3 license | All agent code must be AGPLv3-compatible |
| 24-hour MVP deadline | Architecture must support incremental delivery (3 tools first, then 5) |
| Redis already available | Leverage for memory and caching — no new infrastructure |

### Cross-Cutting Concerns

1. **Authentication propagation** — User identity must flow from JWT through agent service into every tool call.
2. **Data sensitivity** — Portfolio data is financial PII. LangSmith traces must not log full portfolio details.
3. **Financial disclaimers** — Every response must clarify outputs are informational, not financial advice.
4. **Currency handling** — Portfolio data is multi-currency. The agent must respect the user's `baseCurrency` setting.
5. **Data source attribution** — Responses should cite which data provider supplied market data.
6. **Rate limiting** — External data providers have rate limits. Tools must handle gracefully with cached fallbacks.

---

## Starter Template Evaluation (Brownfield)

### Primary Technology Domain

API Backend Module within an existing NestJS 11 monorepo managed by Nx.

This is NOT a greenfield project. We are adding a new NestJS endpoint module (`agent/`) into the existing Ghostfolio application.

### Inherited Architectural Decisions (From Ghostfolio — Locked)

| Decision | Value |
|----------|-------|
| Language | TypeScript (strict off, noUnusedLocals/Params on) |
| Module system | CommonJS (API), ESNext (libs) |
| Backend framework | NestJS 11.1.8 |
| ORM | Prisma 6.19.0 |
| Database | PostgreSQL |
| Cache/Queue | Redis + Bull |
| Auth | Passport JWT (180-day tokens) |
| Test framework | Jest 30 (ts-jest, Node env for API) |
| Formatting | Prettier (2-space, single quotes, no trailing commas) |
| Import order | `@ghostfolio/*` → third-party → relative |
| Build | Webpack via Nx |
| Monorepo | Nx workspace |

### New Dependencies to Add

```bash
npm install langchain @langchain/core @langchain/openai @langchain/community langsmith
```

| Package | Purpose | CJS Compatible |
|---------|---------|----------------|
| `langchain` | Core agent framework | Yes |
| `@langchain/core` | Base abstractions | Yes |
| `@langchain/openai` | ChatOpenAI (OpenRouter-compatible) | Yes |
| `@langchain/community` | Redis memory, additional integrations | Yes |
| `langsmith` | Tracing/observability | Yes |

---

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| ADR-01 | Agent Framework | LangChain.js | Native tool calling, agent executors, LangSmith integration. Vercel AI SDK too thin for agent orchestration. |
| ADR-03 | Tool Integration Pattern | NestJS service injection (not HTTP) | Follows existing AI module pattern. Eliminates HTTP overhead and internal auth complexity. |
| ADR-07 | LLM Model | Claude Sonnet 4 via OpenRouter (primary) | Reliable function/tool calling. Configurable via env var. GPT-4o as alternative, GPT-4o Mini as fallback. |
| ADR-09 | User Data Isolation | Hardcoded userId from JWT in every tool | Security-critical. Prevents prompt injection from accessing other users' data. |
| ADR-12 | Module Structure | New NestJS endpoint module at `endpoints/agent/` | Follows existing codebase pattern. Imports existing service modules. |

**Important Decisions (Shape Architecture):**

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| ADR-02 | Agent Topology | Single agent with tool routing | Multi-agent adds complexity with no user benefit at this scale. |
| ADR-04 | Conversation Memory | Redis via `RedisChatMessageHistory` | Redis already running. Survives server restarts. |
| ADR-05 | Tool Count | 3 MVP + 2 Phase 4 (5 total) | Incremental delivery aligned with sprint deadlines. |
| ADR-06 | benchmark_compare Design | Two-mode tool (list + compare) | LLM doesn't know available benchmarks. List mode enables discovery. |
| ADR-08 | Verification Strategy | 3 types: ticker validation (MVP), numerical cross-check (P4), data freshness (P4) | Project requires 3+. Build incrementally. |
| ADR-10 | Response Mode | Non-streaming MVP, design for streaming | Design the endpoint to support both modes. |
| ADR-11 | Prisma Version | Stay on Prisma 6 | ESM migration too risky for timeline. See prisma-upgrade-analysis.md. |

**Deferred Decisions (Post-MVP):**

| Decision | Deferral Rationale |
|----------|-------------------|
| Multi-agent architecture | Not needed until tool count exceeds ~10 |
| Streaming implementation | Design for it now, implement when UX is built |
| Frontend chat UI | MVP is API-only |
| Model routing (cheap vs expensive) | Optimize cost after MVP works reliably |
| Rate limiting on agent endpoint | Not needed for demo-scale usage |

### Data Architecture

**Conversation Memory:**
- Store: Redis (same instance as Bull queues)
- Library: `@langchain/community` `RedisChatMessageHistory`
- Key pattern: `agent:conversation:{conversationId}`
- TTL: 24 hours (configurable via env var)
- Session ID: UUID generated on first message, returned in response

**Tool Result Caching:**
- No additional caching — underlying services already cache via `RedisCacheService`

**No Schema Changes:**
- No new Prisma models for MVP
- Conversation history in Redis, not PostgreSQL

### Authentication & Security

**Endpoint Protection:**
```typescript
@UseGuards(AuthGuard('jwt'), HasPermissionGuard)
@HasPermission(permissions.accessAgentChat)
```

**User Context Propagation:**
```typescript
// Controller extracts user, binds into tool closures
const tools = this.agentService.createTools(request.user);
const response = await this.agentService.chat(message, conversationId, tools);
```

**Prompt Injection Mitigation:**
- System prompt includes explicit boundaries
- Tools never accept userId as an input parameter
- Input sanitization: strip control characters, limit message length (10KB)

**Data Leakage Prevention:**
- LangSmith: configure `hide_inputs`/`hide_outputs` on sensitive tool calls
- Follow existing `RedactValuesInResponseInterceptor` pattern

### API Design

**Agent Endpoint:**
```
POST /api/v1/agent/chat
  Auth: JWT Bearer token
  Body: { message: string, conversationId?: string }
  Response: {
    response: string,
    toolCalls: { name: string, input: object, output: object }[],
    conversationId: string,
    verification: { type: string, passed: boolean, details: string }[],
    metadata: { model: string, tokensUsed: number, latencyMs: number }
  }
```

**Error Handling (three tiers):**

| Tier | Behavior | Example |
|------|----------|---------|
| Tool-level | Return error as tool output string — LLM synthesizes helpful response | Symbol not found, empty portfolio |
| Agent-level | Return HTTP 200 with error in response body | LLM timeout, all tools failed |
| System-level | Return HTTP 500 — standard NestJS handling | Redis down, service injection failed |

### Infrastructure & Deployment

**Railway:** Single service (Ghostfolio Docker image), PostgreSQL add-on, Redis add-on.

**New Environment Variables:**
```
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=<langsmith-key>
LANGCHAIN_PROJECT=ghostfolio-agent
OPENROUTER_AGENT_MODEL=anthropic/claude-sonnet-4-20250514
```

### Tool Specifications

| Tool | Phase | Wraps Service | Input | Use Case |
|------|-------|---------------|-------|----------|
| `portfolio_analysis` | MVP | `PortfolioService.getDetails()` | `{ dateRange?, accountId? }` | "What's in my portfolio?" |
| `market_data` | MVP | `DataProviderService.getQuotes()` | `{ symbols: string[] }` | "What's the price of AAPL?" |
| `benchmark_compare` | MVP | `BenchmarkService` | `{ action: 'list'\|'compare', benchmarkSymbol?, dataSource?, dateRange? }` | "How do I compare to S&P 500?" |
| `symbol_search` | Phase 4 | `DataProviderService.search()` | `{ query: string }` | "Find me crypto ETFs" |
| `watchlist_manage` | Phase 4 | `WatchlistService` | `{ action: 'list'\|'add'\|'remove', symbol?: string, dataSource?: string }` | "Add AAPL to my watchlist" |

### Verification Specifications

| Verification | Phase | Implementation |
|-------------|-------|----------------|
| Ticker/Symbol Validation | MVP | Verify all symbols in response exist via `DataProviderService.getAssetProfiles()` |
| Numerical Cross-Check | Phase 4 | Verify allocation percentages sum to ~100%, verify returns against calculation engine |
| Data Freshness Check | Phase 4 | Verify market data timestamps, flag stale data on trading days (>24h old Mon-Fri) |

### LLM Model Configuration

| Priority | Model | OpenRouter ID |
|----------|-------|---------------|
| Primary | Claude Sonnet 4 | `anthropic/claude-sonnet-4-20250514` |
| Alternative | GPT-4o | `openai/gpt-4o` |
| Fallback | GPT-4o Mini | `openai/gpt-4o-mini` |

---

## Implementation Patterns & Consistency Rules

### Inherited Patterns (Ghostfolio Conventions)

| Category | Convention |
|----------|-----------|
| File naming | kebab-case (`portfolio-analysis.tool.ts`) |
| Class naming | PascalCase (`PortfolioAnalysisTool`) |
| Variable naming | camelCase (`portfolioDetails`) |
| Module pattern | NestJS `@Module` |
| Test location | Co-located `*.spec.ts` |
| Import order | `@ghostfolio/*` → third-party → relative |

### Tool Definition Pattern

```typescript
// tools/portfolio-analysis.tool.ts
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

interface ToolContext {
  userId: string;
  baseCurrency: string;
}

export function createPortfolioAnalysisTool(
  context: ToolContext,
  portfolioService: PortfolioService
): DynamicStructuredTool {
  return new DynamicStructuredTool({
    name: 'portfolio_analysis',
    description: '...',
    schema: z.object({ /* ... */ }),
    func: async (input) => {
      // Always use context.userId — NEVER accept userId from input
      // Return JSON.stringify(result)
    }
  });
}
```

**Mandatory tool rules:**
1. Export a factory function `create{Name}Tool(context, ...services)`
2. ToolContext as first parameter — always contains `userId` and `baseCurrency` from JWT
3. Zod schemas for input validation
4. Return `JSON.stringify()` — tools always return strings
5. Tool names use snake_case — `portfolio_analysis` (LLM convention)
6. File names use kebab-case — `portfolio-analysis.tool.ts` (Ghostfolio convention)

### Verification Pattern

```typescript
export interface VerificationResult {
  type: string;
  passed: boolean;
  details: string;
  severity: 'info' | 'warning' | 'error';
}
```

Verifications are pure functions: receive response + services, return result. They never modify the response.

### Error Handling Pattern

- **Tool-level:** try/catch inside tool func, return error as JSON string — let LLM handle it conversationally
- **Agent-level:** HTTP 200 with error in response body
- **System-level:** HTTP 500 via standard NestJS exception handling

### Agent Service Pattern

```typescript
@Injectable()
export class AgentService {
  async chat(message: string, conversationId: string | undefined, user: UserWithSettings): Promise<AgentResponse> {
    // 1. Create tools with user context bound
    // 2. Load or create conversation memory (Redis)
    // 3. Execute LangChain agent with tools + memory
    // 4. Run verification pipeline on response
    // 5. Return structured AgentResponse
  }

  createTools(user: UserWithSettings): DynamicStructuredTool[] {
    const context: ToolContext = { userId: user.id, baseCurrency: user.settings?.settings?.baseCurrency };
    return [
      createPortfolioAnalysisTool(context, this.portfolioService),
      createMarketDataTool(context, this.dataProviderService),
      createBenchmarkCompareTool(context, this.benchmarkService),
    ];
  }
}
```

### Eval Test Case Pattern

```typescript
interface EvalTestCase {
  id: string;                        // e.g., 'happy-001'
  category: 'happy' | 'edge' | 'adversarial' | 'multistep';
  input: string;
  expectedToolCalls: string[];
  expectedOutputContains: string[];
  expectedOutputNotContains?: string[];
  passCriteria: string;
}
```

Test data lives in `agent.eval-data.json`, separate from the test runner.

---

## Project Structure & Boundaries

### Agent Module Directory Structure

```
apps/api/src/app/endpoints/agent/
├── agent.module.ts
├── agent.controller.ts
├── agent.service.ts
├── agent.service.spec.ts
├── agent.eval.spec.ts
├── agent.eval-data.json
├── interfaces/
│   └── agent.interfaces.ts
├── tools/
│   ├── portfolio-analysis.tool.ts
│   ├── portfolio-analysis.tool.spec.ts
│   ├── market-data.tool.ts
│   ├── market-data.tool.spec.ts
│   ├── benchmark-compare.tool.ts
│   ├── benchmark-compare.tool.spec.ts
│   ├── symbol-search.tool.ts             # Phase 4
│   ├── symbol-search.tool.spec.ts        # Phase 4
│   ├── watchlist-manage.tool.ts          # Phase 4
│   └── watchlist-manage.tool.spec.ts     # Phase 4
├── verification/
│   ├── verification.interfaces.ts
│   ├── ticker-validation.ts
│   ├── ticker-validation.spec.ts
│   ├── numerical-crosscheck.ts           # Phase 4
│   └── data-freshness.ts                 # Phase 4
└── prompts/
    └── system-prompt.ts
```

### Existing Files Modified

| File | Change | Phase |
|------|--------|-------|
| `apps/api/src/app/app.module.ts` | Add `AgentModule` to imports | Phase 1 |
| `libs/common/src/lib/permissions.ts` | Add `accessAgentChat` permission | Phase 1 |
| `package.json` | Add LangChain dependencies | Phase 0 |
| `.env` / `.env.example` | Add `LANGCHAIN_*` and `OPENROUTER_AGENT_MODEL` vars | Phase 0 |

### Data Flow — Single Query Lifecycle

```
Client → POST /api/v1/agent/chat (JWT) → Agent Controller
  → AuthGuard validates JWT, extracts user
  → AgentService.chat(message, conversationId, user)
    → Create tools with bound userId
    → Load Redis conversation memory
    → LangChain AgentExecutor → LLM (OpenRouter)
      → LLM selects tool(s) → Tool calls service → Returns JSON
      → LLM synthesizes response
    → Verification pipeline (ticker validation, etc.)
    → Save conversation to Redis
  → Return AgentResponse (response, toolCalls, verification, metadata)
  → LangSmith receives full trace automatically
```

### Architectural Boundary Diagram

```
┌──────────────────────────────────────────────────────┐
│                  Agent Controller                      │
│          (auth boundary — JWT required)                │
└──────────────────────┬───────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────┐
│                  Agent Service                         │
│  ┌──────────────────────────────────────────────┐     │
│  │           LangChain AgentExecutor             │     │
│  │   System Prompt │ Memory (Redis) │ LLM        │     │
│  │                                               │     │
│  │   Tool Registry                               │     │
│  │   portfolio_analysis │ market_data            │     │
│  │   benchmark_compare  │ symbol_search          │     │
│  │   watchlist_manage                            │     │
│  └───────────────────┬──────────────────────────┘     │
│                      │                                 │
│  ┌───────────────────▼──────────────────────────┐     │
│  │         Verification Pipeline                 │     │
│  └──────────────────────────────────────────────┘     │
└──────────────────────┬───────────────────────────────┘
                       │ NestJS DI (service injection)
┌──────────────────────▼───────────────────────────────┐
│              Existing Ghostfolio Services              │
│  PortfolioService │ DataProviderService               │
│  BenchmarkService │ MarketDataService                 │
│         ↓                    ↓                         │
│  PostgreSQL (Prisma)   Yahoo/Alpha/CoinGecko          │
└───────────────────────────────────────────────────────┘
```

---

## Architecture Validation Results

### Coherence Validation: PASS

- All technology choices compatible (LangChain + CJS + NestJS + Redis + OpenRouter)
- Patterns align with technology stack
- No contradictory decisions

### Requirements Coverage: PASS

All 9 MVP requirements and all final submission requirements have architectural support.

### Implementation Readiness: PASS

- 12 ADRs documented with rationale
- Tool, verification, error handling, eval patterns specified with code examples
- Complete directory tree with file-level mapping

### Gap Analysis

**No critical gaps.** Important gaps (non-blocking):
- System prompt text authored during Phase 1 implementation
- LangChain agent type (`createToolCallingAgent` recommended over ReAct)
- Redis conversation TTL defaults to 24h, tune later
- Permission `accessAgentChat` recommended for all roles (ADMIN, PREMIUM, BASIC) for MVP

### Implementation Sequence

1. Install LangChain dependencies (Phase 0)
2. Create agent module structure — module, controller, service, interfaces (Phase 1)
3. Register AgentModule in app.module.ts (Phase 1)
4. Build `portfolio_analysis` tool (Phase 1)
5. Wire LangChain agent, test end-to-end (Phase 1)
6. Add `market_data` tool (Phase 2)
7. Add `benchmark_compare` tool (Phase 2)
8. Add Redis conversation memory (Phase 2)
9. Add error handling layer (Phase 2)
10. Add ticker validation verification (Phase 2)
11. Write 5 eval test cases (Phase 3)
12. Deploy to Railway (Phase 3)
13. Add `symbol_search` + `watchlist_manage` tools (Phase 4)
14. Add numerical cross-check + data freshness verification (Phase 4)
15. Expand eval dataset to 50+ cases (Phase 4)

---

## Cross-References

- **Sprint Checklist:** `gauntlet_docs/agentforge-sprint-checklist.md`
- **Project Requirements:** `gauntlet_docs/G4 Week 2 - AgentForge.pdf`
- **Pre-Search Checklist:** `gauntlet_docs/PreSearch_Checklist_Finance.md`
- **Brownfield Docs:** `docs/index.md`
- **Prisma Analysis:** `gauntlet_docs/prisma-upgrade-analysis.md`
