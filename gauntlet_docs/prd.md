---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation-skipped
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-12-complete
inputDocuments:
  - gauntlet_docs/G4 Week 2 - AgentForge.pdf
  - gauntlet_docs/PreSearch_Checklist_Finance.md
  - gauntlet_docs/product-brief-ghostfolio-2026-02-23.md
documentCounts:
  briefs: 1
  research: 0
  brainstorming: 0
  projectDocs: 0
workflowType: 'prd'
classification:
  projectType: web_app (API backend extension)
  domain: fintech
  complexity: high
  projectContext: brownfield
---

# Product Requirements Document — Ghostfolio AI Finance Agent

**Author:** Diane
**Date:** 2026-02-24

## Executive Summary

The Ghostfolio AI Finance Agent adds a conversational AI layer to Ghostfolio, the open-source wealth management platform, enabling users to query their portfolio data, retrieve live market information, and benchmark performance through natural language. Built with LangChain.js as a NestJS API module (`POST /api/v1/agent/chat`), the agent wraps Ghostfolio's existing services — portfolio calculations, market data providers (Yahoo Finance, Alpha Vantage, CoinGecko, EOD Historical Data, Financial Modeling Prep), and benchmark endpoints — as structured tools with domain-specific verification.

The agent targets two primary user types: self-directed investors who want faster insight extraction from their portfolio data without manual spreadsheet analysis, and less technical long-term investors who want plain-language answers to financial questions without learning analysis tools. Both currently rely on manual dashboard navigation or generic AI chatbots that lack access to real portfolio data and hallucinate financial information.

The project delivers across three deadlines: MVP (Tuesday) with 3 functional tools, conversation history, basic verification, and 5+ eval test cases deployed on Railway; Early Submission (Friday) expanding to a 50+ test case evaluation framework, 3+ verification types, and full LangSmith observability; Final Submission (Sunday) with 5 functional tools, AI cost analysis, architecture documentation, open source contribution, and demo.

### What Makes This Special

**Embedded, not external.** The agent lives inside Ghostfolio's API with direct access to the user's real portfolio data via Prisma and Ghostfolio's own calculation engine. No data export, no stale snapshots, no third-party integrations.

**Verified, not hallucinated.** Every response passes through domain-specific verification: ticker symbol validation, numerical cross-checks against Ghostfolio's calculations, and data freshness checks. In finance, hallucinated data costs real money — the verification layer is what makes this agent trustworthy.

**Evaluated, not hoped-for.** A rigorous 50+ test case evaluation framework (happy path, edge cases, adversarial inputs, multi-step reasoning) provides measurable quality guarantees with regression detection over time.

**Observable, not opaque.** Full LangSmith integration traces every request from input through reasoning to tool calls to output, with latency breakdown, token usage, and cost tracking per query.

**Open source, not locked in.** LangChain.js avoids vendor lock-in. Licensed AGPLv3 consistent with Ghostfolio. Designed for community extension with modular tool architecture and published eval datasets.

## Project Classification

| Attribute | Value |
|---|---|
| **Project Type** | Web application — API backend extension (NestJS module) |
| **Domain** | Fintech — portfolio management, market data, investment analysis |
| **Complexity** | High — financial calculations must be mathematically correct; wrong answers have monetary consequences; verification non-negotiable |
| **Project Context** | Brownfield — extending existing Ghostfolio platform (Angular 21 + NestJS + PostgreSQL/Prisma + Redis) |
| **Framework** | LangChain.js (TypeScript) with OpenRouter LLM routing |
| **Observability** | LangSmith (tracing, evals, cost tracking) |
| **Deployment** | Railway (PostgreSQL + Redis add-ons) |

## Success Criteria

### User Success

| Metric | Target | Measurement |
|---|---|---|
| Query-to-answer accuracy | >80% eval pass rate | Automated eval suite against ground truth |
| Response latency (single tool) | <5 seconds | LangSmith trace timing |
| Response latency (multi-step) | <15 seconds for 3+ tool chains | LangSmith trace timing |
| Hallucination rate | <5% unsupported claims | Verification layer flags + eval test cases |
| Conversation continuity | Context preserved across turns | Multi-turn eval scenarios |
| Error experience | Graceful message, not crash | Adversarial + edge case eval scenarios |

**What success feels like:** Alex asks 3 portfolio questions and gets verified, correct answers every time — faster than opening a spreadsheet. Maria types a plain-language question and gets a response she understands without Googling financial terms.

### Business Success

Business success = **pass the Gauntlet AI AgentForge gate.** There is no beyond-the-gate objective for this project.

| Gate Checkpoint | Deadline | Pass Criteria |
|---|---|---|
| MVP | Tuesday | All 9 MVP requirements passing, deployed on Railway |
| Early Submission | Friday | 50+ eval test cases, 3+ verification types, full LangSmith observability |
| Final | Sunday 10:59 PM CT | 5 tools, chat UI, architecture doc, cost analysis, open source contribution, demo video, social post |

### Technical Success

| Metric | Target |
|---|---|
| Tool execution success rate | >95% |
| Eval pass rate | >80% on full 50+ test suite |
| Verification accuracy | >90% correct flags |
| Trace coverage | 100% of requests traced in LangSmith |
| Latency tracking | Per-request breakdown (LLM, tool, total) |
| Token/cost tracking | Input/output per request, cost per query |
| Error categorization | All failures captured with context |

### Measurable Outcomes

The single measurable outcome is: **all gate deliverables submitted on time with passing criteria met at each checkpoint.** Specifically:
- Tuesday: deployed agent responds to end-to-end queries with 3 tools, 5+ eval test cases pass
- Friday: 50+ eval test cases with >80% pass rate, LangSmith dashboard showing full traces
- Sunday: 5 tools, chat UI, all submission artifacts complete and published

## Product Scope & Development Strategy

### MVP Strategy & Philosophy

**MVP Approach:** Problem-solving MVP — validate that Ghostfolio users want conversational portfolio access by shipping the smallest thing that proves the concept works end-to-end.

The MVP is intentionally narrow: one endpoint, three tools, in-memory storage. Not a stripped-down version of the final product — a proof that the core interaction pattern (user asks question → agent selects tools → tools query real data → verified response) works reliably. Everything else builds on this foundation.

**Resource Requirements:** Solo developer (Diane) with AI-assisted development (Claude Code, BMAD agents). No additional team members. The one-week timeline makes solo execution a feature, not a constraint — zero coordination overhead.

### Phase 1: MVP — Tuesday Deadline (3 Tools)

**Core Journey Supported:** Alex's happy path — ask portfolio questions, get verified answers from real data.

**All 9 AgentForge MVP gate requirements:**
- [ ] Agent responds to natural language queries in the finance domain
- [ ] 3 functional tools: `portfolio_analysis`, `market_data`, `benchmark_compare`
- [ ] Tool calls execute successfully and return structured results
- [ ] Agent synthesizes tool results into coherent responses
- [ ] Conversation history maintained across turns (in-memory)
- [ ] Basic error handling (graceful failure, not crashes)
- [ ] At least one domain-specific verification check (ticker symbol validation)
- [ ] 5+ eval test cases with expected outcomes
- [ ] Deployed and publicly accessible on Railway

**Explicitly NOT in MVP (deferred to Phase 2/3):**
- Chat UI (evaluators use the deployed API endpoint directly for Tuesday)
- Redis persistence (in-memory is fine for demo scale)
- Multiple verification types (one is sufficient for MVP gate)
- 50+ eval test cases (5+ is the gate)

### Phase 2: Early Submission — Friday

Builds on proven MVP foundation. Adds rigor, not features.
- Eval framework expanded to 50+ test cases (20+ happy path, 10+ edge cases, 10+ adversarial, 10+ multi-step)
- 3+ verification types (fact checking, confidence scoring, domain constraints)
- Full LangSmith observability (trace logging, latency tracking, token usage, cost monitoring, error categorization)
- Redis-backed conversation persistence (upgrade from in-memory)

**Dependency:** MVP must be stable. Cannot add eval rigor to a broken agent.

### Phase 3: Final Submission — Sunday

Adds breadth and polish for submission.
- 2 additional tools: `symbol_search` (wraps `DataProviderService.search()`), `watchlist_manage` (wraps `/api/v1/endpoints/watchlist`)
- Minimal Angular chat UI integrated into Ghostfolio client
- AI cost analysis with production projections (100 / 1K / 10K / 100K users)
- Agent architecture document (1-2 pages)
- Open source contribution (one type — final selection pending)
- Demo video (3-5 min)
- Social post (X or LinkedIn, tag @GauntletAI)

**Dependency:** Eval framework must be running (Friday). New tools get evaluated immediately.

### Vision (Future — Not In Scope)

Documented for completeness only. Zero work committed:
- Tax estimation tool (custom business logic)
- Compliance checking tool (regulatory rule engine)
- Multi-account cross-portfolio analysis
- Automated rebalancing suggestions with confidence scoring
- Predictive analytics leveraging historical patterns
- Community-driven tool plugin architecture

### Risk Mitigation Strategy

**Technical Risks:**

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| LangChain.js integration with NestJS has friction | Medium | High (blocks MVP) | Spike the integration first. Get one tool calling end-to-end before building the other two. |
| Ghostfolio service injection into LangChain tools is complex | Medium | Medium | Tools are thin wrappers — inject the service, call the method, return structured data. Don't over-abstract. |
| OpenRouter + LangChain configuration issues | Low | High (blocks agent) | Test LLM connectivity independently before integrating with tools. Fallback: direct OpenAI SDK if LangChain integration fails. |
| Railway deployment environment differs from local | Medium | Medium | Deploy early (day 1), not last. Test on Railway before Friday. |

**Timeline Risks:**

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| MVP takes longer than Tuesday | Medium | Critical (gate failure) | Ruthlessly cut scope. If 3 tools aren't working by Monday night, ship 2 and add the 3rd tool first thing Tuesday. |
| Eval framework is slower to build than expected | Medium | High | Start with simple assertion-based tests. Sophisticated eval can iterate. 50 simple tests beats 10 complex ones. |
| Chat UI takes too long on Sunday | Low | Medium | The chat UI is a stretch goal for Final. If it doesn't fit, a clean API demo with curl/Postman in the video is acceptable. |

**Resource Risks:**
- Solo developer — no backup if blocked. Mitigation: AI-assisted development (Claude Code) for boilerplate, test generation, and documentation.
- Learning curve on LangChain.js — mitigated by strong TypeScript and NestJS familiarity. LangChain's TypeScript docs are the primary reference.

## User Journeys

### Journey 1: Alex — "What's Actually Going On With My Portfolio?"

**Who:** Alex, 35, software engineer. Manages index ETFs, individual stocks, and a small crypto allocation across two brokerage accounts. Self-hosts Ghostfolio on a home server.

**Opening Scene:** It's Sunday evening. Alex has 30 minutes before dinner to check in on the portfolio. The markets had a volatile week — tech stocks dropped, crypto surged — and Alex wants to know the net impact without firing up a spreadsheet. The Ghostfolio dashboard shows individual holdings, but answering "how did I actually do this week?" requires clicking through multiple pages and doing mental math.

**Rising Action:** Alex opens the new chat interface and types: *"How is my portfolio performing this month?"* The agent invokes `portfolio_analysis`, pulls real holdings from Ghostfolio's database, and returns a summary: total value, month-over-month change, top gainers and losers — with real numbers from Alex's actual accounts.

Intrigued, Alex follows up: *"How does that compare to the S&P 500?"* The agent chains `portfolio_analysis` with `benchmark_compare`, calculates the delta, and reports that Alex is underperforming the benchmark by 1.2% this month, primarily due to overexposure in a single tech holding.

**Climax:** Alex asks: *"What's the current price of NVDA and how much of my portfolio is in tech?"* The agent chains `market_data` with `portfolio_analysis` and delivers a coherent answer: NVDA's current price with daily change, plus Alex's tech sector allocation at 42% — flagging that this exceeds typical diversification thresholds. This is the "aha" moment: three questions, three verified answers, insights that would have taken 20 minutes of dashboard navigation delivered in under a minute.

**Resolution:** Alex closes the laptop with a clear picture: portfolio is slightly trailing the benchmark, tech concentration is high, and NVDA's recent run-up is the reason. No spreadsheet opened. No generic chatbot hallucination. Real data, real answers. Alex makes a mental note to rebalance next week and still makes it to dinner on time.

**Capabilities revealed:** Multi-turn conversation, tool chaining (portfolio + benchmark + market data), sector allocation analysis, response synthesis across multiple tool results, conversation context persistence.

---

### Journey 2: Maria — "Am I Going to Be Okay?"

**Who:** Maria, 52, small business owner. Tracks her retirement portfolio in Ghostfolio. Checks in quarterly, not daily. Less technically sophisticated but drawn to Ghostfolio's privacy-first approach.

**Opening Scene:** Maria's friend mentioned that the market has been "really bad lately" over lunch. Maria hasn't checked her portfolio in two months and now she's worried. She opens Ghostfolio but the dashboard is overwhelming — charts, percentages, ticker symbols she doesn't remember buying. She doesn't know what "Sharpe ratio" means and doesn't want to learn.

**Rising Action:** Maria sees the chat interface and types what she's actually thinking: *"Am I diversified enough?"* The agent invokes `portfolio_analysis`, examines her holdings, and responds in plain language: "Your portfolio has 60% in large-cap US equities, 25% in international funds, 10% in bonds, and 5% in cash. Your US equity concentration is moderate — most financial advisors suggest keeping any single category below 50% for diversification."

Maria follows up: *"Should I be worried about the market right now?"* The agent recognizes this as a question requiring `market_data` and `benchmark_compare`. It pulls current market conditions and compares Maria's portfolio performance to the benchmark, then responds: "The S&P 500 is down 3.2% this month, but your portfolio is only down 1.8% because your bond and international holdings provided a buffer. Over the past year, you're up 8.4%."

**Climax:** Maria exhales. The agent didn't use jargon. It didn't tell her to "rebalance her asset allocation to reduce beta." It told her she's doing okay, with real numbers, in words she understands. She types: *"Thank you, that's exactly what I needed to know."*

**Resolution:** Maria closes Ghostfolio reassured. She didn't need to learn financial analysis. She asked a human question and got a human answer — backed by her real data. She'll check in again next quarter.

**Capabilities revealed:** Plain-language response generation, financial jargon avoidance, portfolio concentration analysis, benchmark comparison with context, emotional intelligence in response tone, handling queries that blend data retrieval with interpretation.

---

### Journey 3: Admin — "Getting This Running and Keeping It Healthy"

**Who:** Sam, a DevOps-minded user who self-hosts Ghostfolio for a small investment club of 5 friends. Sam set up the Docker deployment and manages the infrastructure.

**Opening Scene:** Sam sees the AI agent feature in the Ghostfolio changelog and wants to enable it for the group. Sam needs to configure the agent, verify it works, and monitor ongoing costs so the investment club's hosting budget doesn't blow up.

**Rising Action:** Sam follows the setup guide: adds `OPENROUTER_API_KEY` and `LANGSMITH_API_KEY` to the `.env` file, rebuilds the Docker container, and hits `POST /api/v1/agent/chat` with a test query. The agent responds successfully. Sam checks the LangSmith dashboard and confirms traces are flowing — input tokens, output tokens, latency, cost per query all visible.

Sam then tests with each club member's account to verify the agent respects JWT auth boundaries — each user only sees their own portfolio data, not anyone else's. Sam intentionally sends a malformed query and verifies the agent returns a graceful error, not a stack trace.

**Climax:** A week later, Sam checks the LangSmith cost dashboard and sees the club has made 47 queries at an average cost of $0.03 each — $1.41 total. Well within budget. One query failed (a ticker symbol that doesn't exist), and the error was properly categorized in the traces. The agent is running reliably with zero crashes.

**Resolution:** Sam reports to the club: "The AI agent is live, it costs us about $2/month, and everyone's data stays private." The group adopts it as their standard way to check portfolio health before their monthly meeting.

**Capabilities revealed:** Environment configuration, JWT-scoped data access (each user sees only their portfolio), LangSmith observability dashboard, cost monitoring, error categorization, graceful failure handling, multi-user deployment.

---

### Journey 4: Developer — "Adding a New Tool to the Agent"

**Who:** Jordan, an open-source contributor who uses Ghostfolio and discovers the AI agent module. Jordan is a TypeScript developer with LangChain experience and wants to contribute a new tool.

**Opening Scene:** Jordan finds the agent architecture doc and eval dataset in the GitHub repo. Wants to add a `dividend_history` tool that retrieves dividend payment history for holdings — something the existing 5 tools don't cover.

**Rising Action:** Jordan reads the architecture doc and sees the modular tool pattern: each tool is a LangChain `StructuredTool` subclass with a Zod schema, wrapping an existing Ghostfolio service. Jordan creates `dividend-history.tool.ts` following the same pattern as `portfolio-analysis.tool.ts`, registers it in the tool registry, and writes 5 eval test cases.

Jordan runs the existing eval suite — all 50+ existing tests still pass. The 5 new tests pass as well. Jordan checks the LangSmith traces for the new tool and confirms it's properly instrumented.

**Climax:** Jordan opens a PR with the new tool, the eval test cases, and updated architecture docs. The CI pipeline runs the full eval suite automatically and reports a green build.

**Resolution:** The tool is merged. Other Ghostfolio users benefit from dividend history queries. The eval dataset grows. The agent gets more capable without the original author doing any work.

**Capabilities revealed:** Modular tool architecture, clear tool development pattern, eval suite extensibility, CI-integrated eval runs, LangSmith instrumentation for new tools, open-source contribution workflow.

---

### Journey Requirements Summary

| Capability | Revealed By |
|---|---|
| Multi-turn conversation with context | Alex, Maria |
| Tool chaining (multiple tools per query) | Alex |
| Plain-language response generation | Maria |
| Portfolio analysis (holdings, allocation, performance) | Alex, Maria |
| Market data retrieval (prices, daily change) | Alex |
| Benchmark comparison (portfolio vs index) | Alex, Maria |
| Sector/concentration analysis | Alex, Maria |
| Ticker symbol validation | Alex, Admin |
| Graceful error handling | Admin |
| JWT-scoped data access (multi-user) | Admin |
| LangSmith observability & cost monitoring | Admin |
| Environment configuration (API keys) | Admin |
| Modular tool architecture | Developer |
| Eval suite extensibility | Developer |
| CI-integrated eval pipeline | Developer |
| Open-source contribution workflow | Developer |

## Domain-Specific Requirements

### Financial Disclaimer & Liability

- All agent responses must include a disclaimer: outputs are **informational only, not financial advice**
- The agent must never claim to be a financial advisor or recommend specific buy/sell actions with certainty
- Confidence scoring must surface uncertainty rather than presenting analysis as definitive
- Responses suggesting action (e.g., "you may want to rebalance") must be hedged, not directive

### Data Protection & Privacy

- Portfolio data is sensitive financial PII — the agent must not log full portfolio details to external observability tools
- LangSmith traces must sanitize or exclude raw portfolio holdings data; log tool names, latency, token counts, and cost — not the user's actual financial positions
- Verify OpenRouter's data retention policy: ensure LLM providers do not train on user financial data passed through prompts
- JWT auth boundaries enforced: each user's agent session accesses only their own portfolio data via Ghostfolio's existing auth system
- No portfolio data stored in conversation history beyond the active session (or if persisted in Redis, scoped to authenticated user with TTL)

### Hallucination Prevention (Domain-Critical)

- **Ticker symbol validation:** Verify every symbol exists in Ghostfolio's data providers before returning data. Never fabricate ticker symbols.
- **Numerical cross-check:** Portfolio calculations returned by the agent must match Ghostfolio's own calculation engine. Never generate made-up returns or allocation percentages.
- **Data freshness:** Market data must include timestamps. If data is stale (>24h for equities, >1h for crypto), flag it explicitly in the response.
- **Source attribution:** Every data-backed claim must be traceable to a specific tool call and data source.

### Prompt Injection Prevention

- Sanitize all user inputs before passing to LLM
- Use structured tool schemas (Zod) to constrain LLM outputs to valid parameter shapes
- System prompt with clear boundaries: "You are a financial analysis assistant. You do not execute trades, provide guaranteed returns, or share other users' data."
- Never execute raw user input as database queries or code

### Audit & Observability

- Log all AI-generated financial analysis with timestamps in LangSmith traces
- Track which data sources informed each response (which tool, which provider)
- Error categorization must distinguish between tool failures, LLM failures, and verification failures
- Maintain trace history for debugging and potential regulatory review

### Risk Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| LLM hallucinates financial data | User makes bad investment decisions | Verification layer cross-checks all numerical claims against Ghostfolio's calculation engine |
| Stale market data presented as current | User acts on outdated information | Data freshness timestamps on all market data; explicit staleness warnings |
| Portfolio data leaked via LLM provider | Privacy violation, loss of trust | Sanitize LangSmith traces; verify OpenRouter data policy; minimize portfolio data in prompts |
| Prompt injection extracts other user data | Security breach | JWT-scoped sessions; system prompt boundaries; input sanitization |
| Agent presented as financial advice | Legal liability | Mandatory disclaimers; hedged language for suggestions; confidence scoring |
| Cost overrun from excessive LLM calls | Budget impact for self-hosters | Per-query cost tracking in LangSmith; cost monitoring in admin journey |

### Regulatory Compliance Matrix

| Framework | Applicability | Rationale |
|---|---|---|
| PCI-DSS | N/A | No payment processing — agent reads portfolio data, does not execute transactions |
| AML/KYC | N/A | No financial transactions executed — agent is read-only analytical layer |
| SOX | N/A | Open-source project, not a public company |
| GDPR | Applicable | Portfolio data is financial PII; handled per Data Protection & Privacy section above |
| SOC 2 | Not required | Self-hosted open-source tool; no SaaS data handling commitments |
| AGPLv3 | Applicable | All code must be released under AGPLv3 consistent with Ghostfolio's license |

## API Backend Specific Requirements

### Project-Type Overview

The Ghostfolio AI Finance Agent is a NestJS API module extension with a minimal Angular chat UI. The core feature is a single REST endpoint (`POST /api/v1/agent/chat`) that accepts natural language queries, orchestrates LangChain.js tool calls against Ghostfolio's existing services, and returns verified responses. The chat UI is a thin Angular component consuming this endpoint.

### Endpoint Specification

| Endpoint | Method | Auth | Request | Response |
|---|---|---|---|---|
| `/api/v1/agent/chat` | POST | JWT (Bearer) | `{ message: string, conversationId?: string }` | `{ response: string, toolCalls: ToolCall[], conversationId: string, metadata: { latency: number, tokensUsed: number } }` |

**Follows existing patterns:**
- URI-based versioning (`/api/v1/...`) — consistent with Ghostfolio
- CORS enabled — consistent with Ghostfolio
- Global `ValidationPipe` with whitelist + transform — consistent with Ghostfolio
- JWT authentication via `AuthGuard` — consistent with Ghostfolio

### Authentication Model

- **Method:** JWT Bearer token (existing Ghostfolio auth system)
- **Scope:** Each agent session is scoped to the authenticated user's portfolio data. The agent's tool calls use the request user's context — never cross-user data access.
- **No new auth logic needed:** The agent endpoint uses the same `AuthGuard` and `@UseGuards()` pattern as existing Ghostfolio protected endpoints.

### Data Schemas

**Tool Call Schema (response payload):**
```
ToolCall {
  tool: string          // tool name (e.g., "portfolio_analysis")
  input: object         // parameters passed to tool
  output: object        // structured result from tool
  latencyMs: number     // execution time
  success: boolean      // whether tool executed successfully
}
```

**Conversation History (in-memory for MVP, Redis for Early Submission):**
```
ConversationEntry {
  conversationId: string
  userId: string        // JWT-scoped
  messages: Message[]   // { role: "user"|"assistant", content: string }
  createdAt: Date
  ttl: number           // auto-expire conversations
}
```

### Rate Limiting & Cost Control

- No explicit rate limiting for MVP (self-hosted, low user count)
- **Cost guardrail:** Per-query cost tracked via LangSmith. If a single query exceeds $0.50 (10x the target for complex queries), log a warning.
- **Future consideration:** Redis-based rate limiting per user (e.g., 100 queries/day) for multi-user deployments. Not in scope for this project.

### Error Codes

| Scenario | HTTP Status | Response |
|---|---|---|
| Valid query, successful response | 200 | Full response with tool calls |
| Invalid/missing JWT | 401 | Unauthorized |
| Malformed request body | 400 | Validation error details |
| Tool execution failure (partial) | 200 | Response with error context, failed tool flagged |
| LLM provider unavailable | 503 | Service unavailable, retry suggestion |
| Internal error | 500 | Generic error message (no stack trace) |

### Chat UI Requirements (Minimal)

- **Framework:** Angular component within existing Ghostfolio client
- **Route:** New page accessible from Ghostfolio's navigation (protected by `AuthGuard`)
- **Features (MVP):** Text input, message history display, loading indicator, error state display
- **Not needed:** Real-time streaming (request/response is sufficient), rich formatting, file uploads, voice input
- **Browser support:** Follows existing Ghostfolio browser matrix
- **SEO:** Not applicable (authenticated feature behind login)
- **Accessibility:** Follow existing Ghostfolio patterns (not a new accessibility scope)

### Implementation Considerations

- **Module location:** `apps/api/src/app/endpoints/agent/` — follows existing endpoint pattern
- **Tool files:** Each tool as a separate file (e.g., `portfolio-analysis.tool.ts`) in the agent module
- **Service injection:** Tools inject existing Ghostfolio services (PortfolioService, DataProviderService, etc.) via NestJS DI
- **LangChain integration:** `@langchain/openai` with `ChatOpenAI` configured to use OpenRouter's base URL
- **No new database tables for MVP:** Conversation history in-memory. Redis upgrade uses existing Redis infrastructure.
- **Configuration:** New environment variables: `OPENROUTER_API_KEY`, `LANGCHAIN_TRACING_V2`, `LANGCHAIN_API_KEY`, `LANGCHAIN_PROJECT`

## Functional Requirements

### Conversational Intelligence

- **FR1:** Authenticated users can send natural language queries about their financial data and receive coherent, contextual responses
- **FR2:** The agent can maintain conversation context across multiple turns within a session, referencing prior questions and answers
- **FR3:** The agent can determine which tool(s) to invoke based on the user's natural language query without explicit tool selection by the user
- **FR4:** The agent can chain multiple tools in a single response when a query requires data from more than one source
- **FR5:** The agent can synthesize results from multiple tool calls into a single coherent response
- **FR6:** The agent can generate plain-language responses validated by eval test cases to be understandable without financial expertise, adapting to the sophistication level implied by the query
- **FR7:** The agent can handle ambiguous queries by stating all assumptions explicitly in the response, or asking clarifying questions when multiple valid interpretations exist
- **FR8:** The system can persist conversation history beyond a single session, enabling users to resume prior conversations (Early Submission)

### Financial Data Tools

- **FR9:** Users can query their portfolio holdings, allocation percentages, and performance metrics through natural language (`portfolio_analysis` — MVP)
- **FR10:** Users can retrieve current market data (prices, daily changes, volume) for specific ticker symbols through natural language (`market_data` — MVP)
- **FR11:** Users can compare their portfolio performance against market benchmarks (e.g., S&P 500) with alpha and tracking difference calculations (`benchmark_compare` — MVP)
- **FR12:** Users can search for ticker symbols, asset names, and financial instruments through natural language, receiving matching results with data source attribution (`symbol_search` — Final)
- **FR13:** Users can manage their watchlist (view, add, remove symbols) through natural language (`watchlist_manage` — Final)
- **FR14:** Each tool returns structured results with data source attribution and timestamps
- **FR15:** Each tool operates against the authenticated user's real Ghostfolio data, not mocked or generic data

### Verification & Safety

- **FR16:** The agent validates ticker symbols exist in Ghostfolio's data providers before returning data about them (MVP)
- **FR17:** The agent cross-checks numerical claims (returns, allocations, gains/losses) against Ghostfolio's own calculation engine (Early Submission)
- **FR18:** The agent flags data freshness — if market data is stale (>24h equities, >1h crypto), the response includes an explicit staleness warning (Early Submission)
- **FR19:** The agent assigns confidence scores (0-100) to analytical responses, flagging results below 70% confidence explicitly for user awareness (Early Submission)
- **FR20:** All agent responses include a financial disclaimer indicating outputs are informational only, not financial advice
- **FR21:** The agent refuses requests for guaranteed returns, insider information, or specific buy/sell directives
- **FR22:** The agent refuses out-of-domain queries (medical, legal advice) with a clear boundary statement
- **FR22a:** The agent returns informative, non-technical error messages when tools fail, including what went wrong and suggested next steps — without exposing stack traces or internal errors (MVP)

### Evaluation Framework

- **FR23:** A test harness can execute eval test cases against the agent and report pass/fail results with details
- **FR24:** Eval test cases can validate correctness (expected output matches actual output against ground truth)
- **FR25:** Eval test cases can validate tool selection (agent chose the right tool for a given query)
- **FR26:** Eval test cases can validate safety (agent refuses harmful or out-of-domain requests)
- **FR27:** Eval test cases can validate edge cases (missing data, invalid input, ambiguous queries)
- **FR28:** Eval test cases can validate multi-step reasoning (queries requiring 2+ tool chains)
- **FR29:** The eval suite can run in CI and report results for regression detection
- **FR30:** Each eval test case includes: input query, expected tool calls, expected output pattern, and pass/fail criteria

### Observability & Monitoring

- **FR31:** Every agent request generates a full trace (input → reasoning → tool calls → output) in LangSmith
- **FR32:** Latency is tracked per request with breakdown by phase: LLM call time, tool execution time, total response time
- **FR33:** Token usage (input/output) and estimated cost are tracked per request
- **FR34:** Errors are captured and categorized by type: tool failure, LLM failure, verification failure, input validation failure
- **FR35:** Historical eval scores are tracked over time for regression detection
- **FR36:** Administrators can view observability data through LangSmith dashboards

### Security & Access Control

- **FR37:** Only authenticated users (valid JWT) can access the agent endpoint
- **FR38:** Each user's agent session accesses only their own portfolio data — no cross-user data exposure
- **FR39:** User inputs are sanitized before being passed to the LLM to prevent prompt injection
- **FR40:** The agent's system prompt enforces boundaries preventing data leakage, role deviation, or unauthorized actions
- **FR41:** Portfolio data is not logged in full to external observability tools — traces capture metadata (tool names, timing, cost) not raw financial positions

### Chat Interface

- **FR42:** Authenticated users can access a chat interface within Ghostfolio's client application (Final)
- **FR43:** Users can type messages and see agent responses displayed in a conversational format
- **FR44:** The chat interface displays a loading state while the agent processes a query
- **FR45:** The chat interface displays error states when the agent fails to respond

### Extensibility

- **FR45a:** Developers can extend the agent with new tools by implementing a standard tool interface and registering the tool, without modifying core agent logic

### Deployment & Configuration

- **FR46:** The agent can be enabled by providing required environment variables (OpenRouter API key, LangSmith credentials)
- **FR47:** The agent is deployable via the existing Ghostfolio Docker infrastructure with no additional services beyond what Ghostfolio already requires
- **FR48:** The application is deployable to Railway with PostgreSQL and Redis add-ons

## Non-Functional Requirements

### Performance

- **NFR1:** Single-tool agent queries return a complete response within 5 seconds measured end-to-end (request received to response sent)
- **NFR2:** Multi-step queries (3+ tool chains) return a complete response within 15 seconds end-to-end
- **NFR3:** Individual tool execution completes within 2 seconds per tool call (excluding LLM reasoning time)
- **NFR4:** Chat UI displays a loading indicator within 200ms of message submission (client-side responsiveness)
- **NFR5:** Conversation history retrieval from Redis completes within 500ms
- **NFR6:** Cold start penalty (first query after deployment) is acceptable up to 10 seconds; subsequent queries meet standard latency targets

### Security

*Policy requirements for data protection and privacy are defined in Domain-Specific Requirements. These NFRs specify measurable security thresholds.*

- **NFR7:** All API communication uses HTTPS (TLS 1.2+) — consistent with existing Ghostfolio deployment
- **NFR8:** JWT tokens are validated on every agent request; no caching of authentication state between requests
- **NFR9:** Agent sessions are isolated: concurrent users cannot observe, access, or influence each other's conversation state or portfolio data
- **NFR10:** LangSmith traces contain no raw portfolio values, account balances, or holding quantities — only tool names, execution timing, token counts, and cost metadata
- **NFR11:** LLM prompts include the minimum portfolio data necessary for the current query — no full portfolio dump per request
- **NFR12:** User input sanitization processes all queries before LLM submission; no raw user text is passed as executable instructions

### Reliability

- **NFR13:** The agent endpoint is available whenever the Ghostfolio API is running — no separate service dependencies beyond PostgreSQL and Redis (which Ghostfolio already requires)
- **NFR14:** Tool execution success rate exceeds 95% for well-formed inputs with valid data
- **NFR15:** If one tool in a multi-tool chain fails, remaining tools still execute; the response includes partial results with a clear indication of what failed and why
- **NFR16:** No unhandled exceptions reach the client — all errors are caught and returned as structured JSON error responses with appropriate HTTP status codes
- **NFR17:** Conversation history in Redis uses TTL-based expiration to prevent unbounded memory growth
- **NFR18:** The agent recovers gracefully from LLM provider outages (OpenRouter unavailable) with a 503 response and human-readable retry suggestion

### Integration

- **NFR19:** The agent works with any OpenRouter-supported LLM model — the model is configurable via environment variable, not hardcoded
- **NFR20:** LangSmith traces conform to the standard trace format for full dashboard functionality (trace viewer, latency analysis, cost tracking, eval scoring)
- **NFR21:** Agent tools use existing Ghostfolio service interfaces via NestJS dependency injection — no forked or duplicated service logic
- **NFR22:** The agent operates with whatever market data providers are configured in the host Ghostfolio instance (Yahoo Finance, Alpha Vantage, etc.) without provider-specific tool logic
