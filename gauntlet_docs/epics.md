---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
status: complete
completedAt: '2026-02-24'
project_name: 'Ghostfolio AI Finance Agent (AgentForge)'
user_name: 'Diane'
epicCount: 8
storyCount: 28
frCoverage: '48/48'
agentTeamPoints: 4
inputDocuments:
  - gauntlet_docs/prd.md
  - gauntlet_docs/architecture.md
  - gauntlet_docs/product-brief-ghostfolio-2026-02-23.md
  - gauntlet_docs/agentforge-sprint-checklist.md
  - gauntlet_docs/agent-teams-reference.md
  - gauntlet_docs/Decision.md
---

# Ghostfolio AI Finance Agent - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for the Ghostfolio AI Finance Agent, decomposing the requirements from the PRD, Architecture, and supporting documents into implementable stories. Epics are structured around the 3 deadline gates (MVP Tuesday, Early Submission Friday, Final Sunday) and optimized for agent teams parallelization where applicable.

## Requirements Inventory

### Functional Requirements

- **FR1:** Authenticated users can send natural language queries about their financial data and receive coherent, contextual responses
- **FR2:** The agent can maintain conversation context across multiple turns within a session, referencing prior questions and answers
- **FR3:** The agent can determine which tool(s) to invoke based on the user's natural language query without explicit tool selection by the user
- **FR4:** The agent can chain multiple tools in a single response when a query requires data from more than one source
- **FR5:** The agent can synthesize results from multiple tool calls into a single coherent response
- **FR6:** The agent can generate plain-language responses validated by eval test cases to be understandable without financial expertise, adapting to the sophistication level implied by the query
- **FR7:** The agent can handle ambiguous queries by stating all assumptions explicitly in the response, or asking clarifying questions when multiple valid interpretations exist
- **FR8:** The system can persist conversation history beyond a single session, enabling users to resume prior conversations (Early Submission)
- **FR9:** Users can query their portfolio holdings, allocation percentages, and performance metrics through natural language (`portfolio_analysis` — MVP)
- **FR10:** Users can retrieve current market data (prices, daily changes, volume) for specific ticker symbols through natural language (`market_data` — MVP)
- **FR11:** Users can compare their portfolio performance against market benchmarks (e.g., S&P 500) with alpha and tracking difference calculations (`benchmark_compare` — MVP)
- **FR12:** Users can search for ticker symbols, asset names, and financial instruments through natural language, receiving matching results with data source attribution (`symbol_search` — Final)
- **FR13:** Users can manage their watchlist (view, add, remove symbols) through natural language (`watchlist_manage` — Final)
- **FR14:** Each tool returns structured results with data source attribution and timestamps
- **FR15:** Each tool operates against the authenticated user's real Ghostfolio data, not mocked or generic data
- **FR16:** The agent validates ticker symbols exist in Ghostfolio's data providers before returning data about them (MVP)
- **FR17:** The agent cross-checks numerical claims (returns, allocations, gains/losses) against Ghostfolio's own calculation engine (Early Submission)
- **FR18:** The agent flags data freshness — if market data is stale (>24h equities, >1h crypto), the response includes an explicit staleness warning (Early Submission)
- **FR19:** The agent assigns confidence scores (0-100) to analytical responses, flagging results below 70% confidence explicitly for user awareness (Early Submission)
- **FR20:** All agent responses include a financial disclaimer indicating outputs are informational only, not financial advice
- **FR21:** The agent refuses requests for guaranteed returns, insider information, or specific buy/sell directives
- **FR22:** The agent refuses out-of-domain queries (medical, legal advice) with a clear boundary statement
- **FR22a:** The agent returns informative, non-technical error messages when tools fail, including what went wrong and suggested next steps — without exposing stack traces or internal errors (MVP)
- **FR23:** A test harness can execute eval test cases against the agent and report pass/fail results with details
- **FR24:** Eval test cases can validate correctness (expected output matches actual output against ground truth)
- **FR25:** Eval test cases can validate tool selection (agent chose the right tool for a given query)
- **FR26:** Eval test cases can validate safety (agent refuses harmful or out-of-domain requests)
- **FR27:** Eval test cases can validate edge cases (missing data, invalid input, ambiguous queries)
- **FR28:** Eval test cases can validate multi-step reasoning (queries requiring 2+ tool chains)
- **FR29:** The eval suite can run in CI and report results for regression detection
- **FR30:** Each eval test case includes: input query, expected tool calls, expected output pattern, and pass/fail criteria
- **FR31:** Every agent request generates a full trace (input → reasoning → tool calls → output) in LangSmith
- **FR32:** Latency is tracked per request with breakdown by phase: LLM call time, tool execution time, total response time
- **FR33:** Token usage (input/output) and estimated cost are tracked per request
- **FR34:** Errors are captured and categorized by type: tool failure, LLM failure, verification failure, input validation failure
- **FR35:** Historical eval scores are tracked over time for regression detection
- **FR36:** Administrators can view observability data through LangSmith dashboards
- **FR37:** Only authenticated users (valid JWT) can access the agent endpoint
- **FR38:** Each user's agent session accesses only their own portfolio data — no cross-user data exposure
- **FR39:** User inputs are sanitized before being passed to the LLM to prevent prompt injection
- **FR40:** The agent's system prompt enforces boundaries preventing data leakage, role deviation, or unauthorized actions
- **FR41:** Portfolio data is not logged in full to external observability tools — traces capture metadata (tool names, timing, cost) not raw financial positions
- **FR42:** Authenticated users can access a chat interface within Ghostfolio's client application (Final)
- **FR43:** Users can type messages and see agent responses displayed in a conversational format
- **FR44:** The chat interface displays a loading state while the agent processes a query
- **FR45:** The chat interface displays error states when the agent fails to respond
- **FR45a:** Developers can extend the agent with new tools by implementing a standard tool interface and registering the tool, without modifying core agent logic
- **FR46:** The agent can be enabled by providing required environment variables (OpenRouter API key, LangSmith credentials)
- **FR47:** The agent is deployable via the existing Ghostfolio Docker infrastructure with no additional services beyond what Ghostfolio already requires
- **FR48:** The application is deployable to Railway with PostgreSQL and Redis add-ons

### NonFunctional Requirements

- **NFR1:** Single-tool agent queries return a complete response within 5 seconds measured end-to-end (request received to response sent)
- **NFR2:** Multi-step queries (3+ tool chains) return a complete response within 15 seconds end-to-end
- **NFR3:** Individual tool execution completes within 2 seconds per tool call (excluding LLM reasoning time)
- **NFR4:** Chat UI displays a loading indicator within 200ms of message submission (client-side responsiveness)
- **NFR5:** Conversation history retrieval from Redis completes within 500ms
- **NFR6:** Cold start penalty (first query after deployment) is acceptable up to 10 seconds; subsequent queries meet standard latency targets
- **NFR7:** All API communication uses HTTPS (TLS 1.2+) — consistent with existing Ghostfolio deployment
- **NFR8:** JWT tokens are validated on every agent request; no caching of authentication state between requests
- **NFR9:** Agent sessions are isolated: concurrent users cannot observe, access, or influence each other's conversation state or portfolio data
- **NFR10:** LangSmith traces contain no raw portfolio values, account balances, or holding quantities — only tool names, execution timing, token counts, and cost metadata
- **NFR11:** LLM prompts include the minimum portfolio data necessary for the current query — no full portfolio dump per request
- **NFR12:** User input sanitization processes all queries before LLM submission; no raw user text is passed as executable instructions
- **NFR13:** The agent endpoint is available whenever the Ghostfolio API is running — no separate service dependencies beyond PostgreSQL and Redis (which Ghostfolio already requires)
- **NFR14:** Tool execution success rate exceeds 95% for well-formed inputs with valid data
- **NFR15:** If one tool in a multi-tool chain fails, remaining tools still execute; the response includes partial results with a clear indication of what failed and why
- **NFR16:** No unhandled exceptions reach the client — all errors are caught and returned as structured JSON error responses with appropriate HTTP status codes
- **NFR17:** Conversation history in Redis uses TTL-based expiration to prevent unbounded memory growth
- **NFR18:** The agent recovers gracefully from LLM provider outages (OpenRouter unavailable) with a 503 response and human-readable retry suggestion
- **NFR19:** The agent works with any OpenRouter-supported LLM model — the model is configurable via environment variable, not hardcoded
- **NFR20:** LangSmith traces conform to the standard trace format for full dashboard functionality (trace viewer, latency analysis, cost tracking, eval scoring)
- **NFR21:** Agent tools use existing Ghostfolio service interfaces via NestJS dependency injection — no forked or duplicated service logic
- **NFR22:** The agent operates with whatever market data providers are configured in the host Ghostfolio instance (Yahoo Finance, Alpha Vantage, etc.) without provider-specific tool logic

### Additional Requirements

- **AR1:** Brownfield integration — new module at `apps/api/src/app/endpoints/agent/` following existing NestJS endpoint patterns
- **AR2:** Tool factory pattern — `create{Name}Tool(context, ...services)` with `ToolContext` carrying `userId` + `baseCurrency` from JWT
- **AR3:** LangChain agent type — `createToolCallingAgent` (recommended over ReAct)
- **AR4:** OpenRouter config — `ChatOpenAI` with custom `baseURL`, model configurable via `OPENROUTER_AGENT_MODEL` env var
- **AR5:** Redis conversation memory — `RedisChatMessageHistory` from `@langchain/community`, key pattern `agent:conversation:{conversationId}`, 24h TTL
- **AR6:** Verification pipeline — pure functions returning `VerificationResult`, never modify response
- **AR7:** 3-tier error handling — Tool-level (JSON string), Agent-level (HTTP 200 with error), System-level (HTTP 500)
- **AR8:** Permission addition — `accessAgentChat` in `libs/common/src/lib/permissions.ts`
- **AR9:** Module registration — `AgentModule` imported in `apps/api/src/app/app.module.ts`
- **AR10:** No new Prisma models — conversation history lives in Redis
- **AR11:** LangSmith data sanitization — `hide_inputs`/`hide_outputs` on sensitive tool calls
- **AR12:** Dependency installation — `langchain`, `@langchain/core`, `@langchain/openai`, `@langchain/community`, `langsmith`
- **AR13:** Phase-gated delivery — MVP (Tue) → Early Sub (Fri) → Final (Sun), architecture supports incremental delivery
- **AR14:** Agent Teams parallelization — Phase 2 (tool building), Phase 4 (eval expansion), Phase 5 (final deliverables) are candidates for parallel agent teams work

### FR Coverage Map

| FR    | Epic   | Description                                  |
| ----- | ------ | -------------------------------------------- |
| FR1   | Epic 1 | NL queries → contextual responses            |
| FR2   | Epic 2 | Multi-turn conversation context              |
| FR3   | Epic 1 | Auto tool selection                          |
| FR4   | Epic 2 | Multi-tool chaining                          |
| FR5   | Epic 1 | Multi-tool result synthesis                  |
| FR6   | Epic 1 | Plain-language adaptive responses            |
| FR7   | Epic 1 | Ambiguous query handling                     |
| FR8   | Epic 5 | Persistent conversation history (Redis)      |
| FR9   | Epic 1 | portfolio_analysis tool                      |
| FR10  | Epic 2 | market_data tool                             |
| FR11  | Epic 2 | benchmark_compare tool                       |
| FR12  | Epic 6 | symbol_search tool                           |
| FR13  | Epic 6 | watchlist_manage tool                        |
| FR14  | Epic 1 | Structured results with attribution          |
| FR15  | Epic 1 | Real user data, not mocked                   |
| FR16  | Epic 1 | Ticker symbol validation                     |
| FR17  | Epic 5 | Numerical cross-check                        |
| FR18  | Epic 5 | Data freshness flagging                      |
| FR19  | Epic 5 | Confidence scoring                           |
| FR20  | Epic 1 | Financial disclaimer                         |
| FR21  | Epic 1 | Refuses guaranteed returns                   |
| FR22  | Epic 1 | Refuses out-of-domain queries                |
| FR22a | Epic 1 | Graceful error messages                      |
| FR23  | Epic 3 | Eval test harness                            |
| FR24  | Epic 3 | Correctness validation                       |
| FR25  | Epic 3 | Tool selection validation                    |
| FR26  | Epic 3 | Safety validation                            |
| FR27  | Epic 3 | Edge case validation                         |
| FR28  | Epic 4 | Multi-step reasoning validation              |
| FR29  | Epic 4 | CI-integrated eval                           |
| FR30  | Epic 3 | Eval case format (input, expected, criteria) |
| FR31  | Epic 5 | Full LangSmith traces                        |
| FR32  | Epic 5 | Latency tracking                             |
| FR33  | Epic 5 | Token/cost tracking                          |
| FR34  | Epic 5 | Error categorization                         |
| FR35  | Epic 4 | Historical eval regression tracking          |
| FR36  | Epic 5 | Admin LangSmith dashboard                    |
| FR37  | Epic 1 | JWT-only access                              |
| FR38  | Epic 1 | User-scoped data                             |
| FR39  | Epic 1 | Input sanitization                           |
| FR40  | Epic 1 | System prompt boundaries                     |
| FR41  | Epic 5 | No raw portfolio data in traces              |
| FR42  | Epic 7 | Chat interface                               |
| FR43  | Epic 7 | Conversational display                       |
| FR44  | Epic 7 | Loading state                                |
| FR45  | Epic 7 | Error state                                  |
| FR45a | Epic 6 | Tool extensibility                           |
| FR46  | Epic 1 | Environment variable configuration           |
| FR47  | Epic 1 | Docker deployment                            |
| FR48  | Epic 3 | Railway deployment                           |

## Epic List

### Epic 1: Conversational Portfolio Intelligence (Foundation)

Users can ask natural language questions about their portfolio and receive verified, accurate responses from an AI agent using their real Ghostfolio data. This is the sequential spine — everything else builds on it.
**Deadline:** MVP (Tuesday)
**Agent Teams:** NO — sequential by design
**FRs covered:** FR1, FR3, FR5, FR6, FR7, FR9, FR14, FR15, FR16, FR20, FR21, FR22, FR22a, FR37, FR38, FR39, FR40, FR46, FR47

### Epic 2: Market Data & Benchmark Analysis (MVP Completion)

Users can get current market prices and compare portfolio performance against benchmarks, including multi-tool queries and multi-turn conversations.
**Deadline:** MVP (Tuesday)
**Agent Teams:** YES — Teammate 1: market_data tool, Teammate 2: benchmark_compare tool, Lead: conversation memory + integration
**FRs covered:** FR2, FR4, FR10, FR11

### Epic 3: MVP Quality Gate & Deployment

The agent is publicly accessible, tested with 5+ eval cases, and deployed for evaluators.
**Deadline:** MVP (Tuesday)
**Agent Teams:** NO — tight deadline, sequential
**FRs covered:** FR23, FR24, FR25, FR26, FR27, FR30, FR48

### Epic 4: Evaluation Rigor (Early Submission)

Agent quality is systematically measured with 50+ test cases across 4 categories with CI integration.
**Deadline:** Early Submission (Friday)
**Agent Teams:** YES — Teammate 1: happy path (20+), Teammate 2: edge + adversarial (20+), Teammate 3: multi-step (10+), Lead: CI + reporting
**FRs covered:** FR28, FR29, FR30 (expanded), FR35

### Epic 5: Advanced Verification & Observability (Early Submission)

Users receive confidence-scored, cross-checked answers with freshness warnings. Administrators see full LangSmith traces. Conversations persist via Redis.
**Deadline:** Early Submission (Friday)
**Agent Teams:** Optional — 2 independent workstreams (verification + observability) but smaller scope
**FRs covered:** FR8, FR17, FR18, FR19, FR31, FR32, FR33, FR34, FR36, FR41

### Epic 6: Extended Agent Capabilities (Final)

Users can search for symbols and manage their watchlist through conversation.
**Deadline:** Final (Sunday)
**Agent Teams:** YES — Teammate 1: symbol_search, Teammate 2: watchlist_manage, Lead: registration + integration
**FRs covered:** FR12, FR13, FR45a

### Epic 7: Browser Chat Experience (Final) — COMPLETE

Users can chat with the agent directly in Ghostfolio's web interface. LOWEST PRIORITY — skip if time-pressured (API demo acceptable per PRD).
**Deadline:** Final (Sunday)
**Agent Teams:** NO — single component
**FRs covered:** FR42, FR43, FR44, FR45
**Completed:** 2026-02-26 — Full chat UI at `/ai-agent` with permission gating, auto-focus, clickable example prompts, tool call visualization, verification alerts, error handling, loading states, markdown rendering, and accessibility (aria-labels, roles).

### Epic 8: Submission Deliverables (Final)

Evaluators receive a complete submission package: cost analysis, architecture doc, open source contribution, demo video, and social post.
**Deadline:** Final (Sunday) 10:59 PM CT
**Agent Teams:** YES — Teammate 1: cost analysis, Teammate 2: architecture doc, Teammate 3: OSS + social post, Lead: demo coordination + packaging
**FRs covered:** Project requirements (non-FR deliverables)

---

## Epic 1: Conversational Portfolio Intelligence (Foundation)

Users can ask natural language questions about their portfolio and receive verified, accurate responses from an AI agent using their real Ghostfolio data. One tool (portfolio_analysis), full agent infrastructure, basic verification, basic safety, and error handling. This must work end-to-end before anything parallelizes.

### Story 1.1: Verify Local Development Environment

As a **developer**,
I want to verify Ghostfolio runs locally with Docker services and seeded portfolio data, and test the existing AI integration,
So that I have a confirmed working foundation to build the AI agent on.

**Acceptance Criteria:**

**Given** Docker services configured
**When** `docker compose -f docker/docker-compose.dev.yml up -d` is run
**Then** PostgreSQL and Redis containers are running and healthy

**Given** containers are running
**When** `npm run database:setup` is run
**Then** schema is pushed and seed data is loaded

**Given** database is seeded
**When** `npm run start:server` is run
**Then** API responds at `http://localhost:3333/api/v1/`

**Given** API is running
**When** Prisma Studio is opened (`npm run database:gui`)
**Then** sample portfolio data (holdings, accounts, orders) is visible

**Given** API is running with OpenRouter key configured
**When** the existing AI endpoint is tested with an auth token
**Then** the response confirms LLM connectivity works

---

### Story 1.2: Install Agent Dependencies & Configure Environment

As a **developer**,
I want LangChain.js, LangSmith, and OpenRouter dependencies installed and environment variables configured,
So that I can build the agent using the chosen framework with observability from day one.

**Acceptance Criteria:**

**Given** the project root
**When** `npm install langchain @langchain/core @langchain/openai @langchain/community langsmith` is run
**Then** all packages install without dependency conflicts

**Given** packages installed
**When** `.env` is updated with `LANGCHAIN_TRACING_V2=true`, `LANGCHAIN_API_KEY`, `LANGCHAIN_PROJECT=ghostfolio-agent`, `OPENROUTER_AGENT_MODEL`
**Then** environment variables are configured

**Given** env vars set
**When** a simple LangChain smoke test runs (import ChatOpenAI, call OpenRouter)
**Then** LLM responds and a trace appears in the LangSmith dashboard

**Given** the project builds
**When** `npm run build:production` is run
**Then** no compilation errors from new dependencies

---

### Story 1.3: Create Agent Endpoint with Portfolio Analysis Tool

As a **user**,
I want to send natural language questions about my portfolio to an API endpoint and receive accurate, structured responses using my real Ghostfolio data,
So that I can understand my holdings and performance without navigating the dashboard.

**Acceptance Criteria:**

**Given** the agent module at `apps/api/src/app/endpoints/agent/`
**When** `AgentModule` is imported in `app.module.ts` with `accessAgentChat` permission added
**Then** the module registers without errors

**Given** a valid JWT token
**When** `POST /api/v1/agent/chat` is called with `{ message: "What's in my portfolio?" }`
**Then** the response contains `{ response, toolCalls, conversationId, metadata }`

**Given** `portfolio_analysis` tool wrapping `PortfolioService.getDetails()`
**When** the agent receives a portfolio question
**Then** it selects `portfolio_analysis` automatically and returns real holdings data with allocation percentages

**Given** the tool executes
**When** results are returned
**Then** each result includes data source attribution and timestamps (FR14)

**Given** a request without JWT
**When** `POST /api/v1/agent/chat` is called
**Then** HTTP 401 Unauthorized is returned

**Given** User A's JWT
**When** the agent queries portfolio data
**Then** only User A's data is returned — never another user's (FR38)

**Given** user input contains control characters or injection attempts
**When** the input is processed
**Then** it is sanitized before reaching the LLM (FR39)

---

### Story 1.4: Add System Prompt with Safety Boundaries & Ticker Verification

As a **user**,
I want the agent to include financial disclaimers, refuse inappropriate requests, and verify ticker symbols before returning data,
So that I can trust it operates within safe boundaries and won't mislead me with fabricated information.

**Acceptance Criteria:**

**Given** any agent response
**When** returned to the user
**Then** it includes a financial disclaimer: informational only, not financial advice (FR20)

**Given** a query asking for guaranteed returns or buy/sell directives
**When** the agent processes it
**Then** it politely refuses with a boundary statement (FR21)

**Given** a query about medical or legal advice
**When** the agent processes it
**Then** it refuses with a clear out-of-domain statement (FR22)

**Given** a query mentioning ticker symbols
**When** the agent responds
**Then** all symbols are validated against Ghostfolio's data providers before data is returned (FR16)

**Given** a query about non-existent ticker "XYZFAKE123"
**When** the agent processes it
**Then** it reports the symbol was not found rather than fabricating data

**Given** the system prompt
**When** inspected
**Then** it includes explicit boundaries: no trade execution, no guaranteed returns, no cross-user data access (FR40)

---

### Story 1.5: Add Error Handling & Response Quality

As a **user**,
I want clear, helpful error messages when something goes wrong and responses that adapt to my financial sophistication level,
So that I always understand what happened regardless of my expertise.

**Acceptance Criteria:**

**Given** a tool execution failure
**When** the error occurs
**Then** the response includes a non-technical explanation and suggested next steps (FR22a)

**Given** an LLM provider outage (OpenRouter unavailable)
**When** the agent cannot reach the LLM
**Then** HTTP 503 is returned with a human-readable retry suggestion (NFR18)

**Given** unexpected input (empty string, >10KB, special characters)
**When** sent to the agent
**Then** it handles gracefully without crashing — no unhandled exceptions reach the client (NFR16)

**Given** a simple question like "Am I diversified enough?"
**When** the agent responds
**Then** it uses plain language without unexplained financial jargon (FR6)

**Given** an ambiguous query
**When** the agent processes it
**Then** it states assumptions explicitly or asks a clarifying question (FR7)

---

### Story 1.6: Early Railway Deployment (Smoke Test)

As a **developer**,
I want Ghostfolio deployed to Railway with PostgreSQL and Redis add-ons in a minimal configuration,
So that I catch deployment and environment issues early rather than on Tuesday night.

**Acceptance Criteria:**

**Given** a Railway account with connected GitHub repo
**When** the deployment is configured
**Then** Railway builds the Ghostfolio Docker image successfully

**Given** Railway add-ons for PostgreSQL and Redis
**When** provisioned
**Then** they are accessible from the deployed application

**Given** environment variables mirrored from local `.env` to Railway dashboard
**When** the deployed app starts
**Then** no configuration errors — the app is healthy

**Given** the deployed URL
**When** `POST /api/v1/agent/chat` is called with a test query
**Then** it responds (confirms routing, auth, and agent endpoint are live)

---

## Epic 2: Market Data & Benchmark Analysis (MVP Completion)

Users can get current market prices for any symbol and compare their portfolio performance against benchmarks like the S&P 500 — including multi-tool queries and multi-turn conversations. Two additional tools built in parallel via agent teams.

### Story 2.1: Market Data Tool

As a **user**,
I want to ask for current market prices, daily changes, and volume for any ticker symbol,
So that I can check market conditions without leaving Ghostfolio.

**Acceptance Criteria:**

**Given** `market_data` tool in `tools/market-data.tool.ts`
**When** "What's the current price of AAPL?" is sent
**Then** the agent selects `market_data` and returns current price with daily change

**Given** multiple symbols requested
**When** "Show me prices for AAPL, MSFT, and GOOGL" is sent
**Then** the tool returns data for all three symbols with data source attribution

**Given** an invalid symbol
**When** queried
**Then** the tool returns a descriptive "symbol not found" message, not a crash

**Given** the tool completes
**When** checked in LangSmith
**Then** a trace shows full tool execution with latency

**Agent Teams:** Teammate 1 owns `tools/market-data.tool.ts` + `tools/market-data.tool.spec.ts`

---

### Story 2.2: Benchmark Comparison Tool

As a **user**,
I want to compare my portfolio performance against market benchmarks like the S&P 500,
So that I understand whether I'm outperforming or underperforming the market.

**Acceptance Criteria:**

**Given** `benchmark_compare` tool in `tools/benchmark-compare.tool.ts` with two modes
**When** "What benchmarks are available?" is sent
**Then** it returns available benchmarks the user can compare against (list mode)

**Given** a compare request like "How does my portfolio compare to the S&P 500?"
**When** processed
**Then** it returns portfolio return vs benchmark return with alpha and tracking difference

**Given** a date range specified
**When** the comparison runs
**Then** it uses that date range for both portfolio and benchmark

**Given** no benchmark specified
**When** a comparison is requested
**Then** the tool uses a sensible default or asks for clarification

**Agent Teams:** Teammate 2 owns `tools/benchmark-compare.tool.ts` + `tools/benchmark-compare.tool.spec.ts`

---

### Story 2.3: Multi-Turn Conversation Memory

As a **user**,
I want the agent to remember what we discussed earlier in our conversation,
So that I can ask follow-up questions without repeating context.

**Acceptance Criteria:**

**Given** a first message sent without `conversationId`
**When** the response is returned
**Then** it includes a new `conversationId` for follow-ups

**Given** a follow-up referencing "it" or "my portfolio" from a previous turn
**When** sent with the same `conversationId`
**Then** the agent uses prior context to interpret the query (FR2)

**Given** in-memory storage for MVP
**When** the server restarts
**Then** conversations are lost (acceptable — Redis upgrade in Epic 5)

**Agent Teams:** Lead owns this story (no file conflicts with tool teammates)

---

### Story 2.4: Multi-Tool Query Chaining

As a **user**,
I want to ask complex questions requiring multiple tools in one response,
So that I get comprehensive analysis without asking multiple separate questions.

**Acceptance Criteria:**

**Given** a query requiring portfolio + market data (e.g., "What's my portfolio value and what's NVDA at?")
**When** processed
**Then** the agent chains both tools and synthesizes a single coherent response (FR4, FR5)

**Given** a query requiring portfolio + benchmark
**When** processed
**Then** both tools execute and results are combined meaningfully

**Given** one tool in a chain fails
**When** the other succeeds
**Then** partial results are returned with a clear indication of what failed (NFR15)

**Given** multi-tool queries
**When** latency is measured
**Then** total response time is under 15 seconds (NFR2)

---

## Epic 3: MVP Quality Gate & Deployment

The agent is publicly accessible, tested with 5+ eval cases proving it works correctly, and deployed for evaluators to use. This is the MVP gate checkpoint.

### Story 3.1: Evaluation Framework Foundation

As a **developer**,
I want a test harness that executes eval test cases and reports pass/fail with details,
So that I have a repeatable, extensible way to verify agent correctness.

**Acceptance Criteria:**

**Given** `agent.eval.spec.ts` and `agent.eval-data.json` exist
**When** `npm run test:single -- agent.eval.spec.ts` is run
**Then** the harness executes all cases and reports results

**Given** eval cases in the JSON file
**When** loaded by the harness
**Then** each includes: input query, expected tool calls, expected output pattern, pass/fail criteria (FR30)

**Given** the harness design
**When** new cases are added to the JSON
**Then** they are automatically picked up without code changes

---

### Story 3.2: MVP Eval Test Cases (5+)

As a **developer**,
I want 5+ eval test cases covering happy path, error handling, multi-tool, and safety scenarios,
So that I can prove the agent works for the MVP gate.

**Acceptance Criteria:**

**Given** test case 1 (portfolio query)
**When** executed
**Then** `portfolio_analysis` is selected and response contains holdings (FR24)

**Given** test case 2 (market data)
**When** executed
**Then** `market_data` is selected and response contains a price (FR25)

**Given** test case 3 (benchmark)
**When** executed
**Then** `benchmark_compare` is selected and response contains comparison metrics (FR25)

**Given** test case 4 (invalid symbol)
**When** executed
**Then** graceful error handling occurs (FR26, FR27)

**Given** test case 5 (multi-tool)
**When** executed
**Then** multiple tools are called and results synthesized (FR28)

**Given** all 5+ test cases
**When** the eval suite runs
**Then** pass/fail results are documented with details

---

### Story 3.3: MVP Gate Verification & Final Deployment

As a **developer**,
I want to verify all 9 MVP requirements pass on the deployed Railway URL,
So that I can submit with confidence.

**Acceptance Criteria:**

**Given** the deployed Railway URL
**When** all 9 MVP requirements are checked against the live deployment
**Then** all pass:

1. NL finance queries → correct responses
2. 3 functional tools execute
3. Structured tool results
4. Coherent response synthesis
5. Conversation history across turns
6. Graceful error handling
7. Ticker validation verification
8. 5+ eval cases documented
9. Publicly accessible URL

**Given** MVP verified
**When** GitHub repo is pushed
**Then** all code committed and deployed URL documented for submission

---

## Epic 4: Evaluation Rigor (Early Submission)

Agent quality is systematically measured with 50+ test cases across 4 categories, with CI integration for regression detection. Four eval categories authored in parallel by agent teammates.

### Story 4.1: Happy Path Eval Scenarios (20+)

As a **developer**,
I want 20+ happy path eval test cases covering diverse portfolio, market, and benchmark queries,
So that I demonstrate the agent handles the full range of expected queries correctly.

**Acceptance Criteria:**

**Given** happy-path test data in `agent.eval-data.json`
**When** 20+ scenarios are authored
**Then** they cover: varied portfolio questions, multiple symbols, date ranges, allocation queries, performance queries, different phrasings

**Given** each test case
**When** executed
**Then** expected tool selection matches actual (FR25) and expected output patterns present (FR24)

**Agent Teams:** Teammate 1. Writes to happy-path section of eval data file.

---

### Story 4.2: Edge Case & Adversarial Eval Scenarios (20+)

As a **developer**,
I want 10+ edge case and 10+ adversarial eval test cases,
So that I prove the agent handles boundary conditions and malicious inputs safely.

**Acceptance Criteria:**

**Given** edge case scenarios
**When** 10+ are authored
**Then** they cover: empty portfolio, missing data, invalid date ranges, very long input, special characters, ambiguous queries, symbols with no market data

**Given** adversarial scenarios
**When** 10+ are authored
**Then** they cover: prompt injection, cross-user data requests, guaranteed returns, out-of-domain queries, code execution attempts

**Given** each adversarial case
**When** the agent processes it
**Then** it refuses appropriately without leaking information (FR26)

**Agent Teams:** Teammate 2. Writes to edge-case and adversarial sections of eval data file.

---

### Story 4.3: Multi-Step Reasoning Eval Scenarios (10+)

As a **developer**,
I want 10+ multi-step reasoning eval test cases requiring 2+ tool chains,
So that I demonstrate complex analytical query handling.

**Acceptance Criteria:**

**Given** multi-step scenarios
**When** 10+ are authored
**Then** they cover: portfolio + benchmark comparison, market data + portfolio allocation analysis, follow-up questions referencing prior context, queries requiring all 3 tools

**Given** each multi-step case
**When** executed
**Then** expected tool chain matches actual tool chain (FR28)

**Given** multi-step cases
**When** latency is measured
**Then** responses complete within 15 seconds (NFR2)

**Agent Teams:** Teammate 3. Writes to multi-step section of eval data file.

---

### Story 4.4: CI-Integrated Eval Pipeline & Regression Tracking

As a **developer**,
I want the eval suite to run in CI and track historical pass rates,
So that regressions are detected automatically when code changes.

**Acceptance Criteria:**

**Given** the eval suite
**When** integrated into the CI pipeline (Jest via Nx)
**Then** it runs automatically on relevant code changes (FR29)

**Given** eval run results
**When** historical scores are recorded
**Then** regression detection is possible over time (FR35)

**Given** the full 50+ test suite
**When** executed
**Then** overall pass rate exceeds 80% (NFR14)

**Given** eval results
**When** documented
**Then** pass rates are broken down by category (happy path, edge, adversarial, multi-step)

---

## Epic 5: Advanced Verification & Observability (Early Submission)

Users receive answers with confidence scores, numerical cross-checks, and data freshness warnings. Administrators see full LangSmith traces with latency, cost, and error categorization. Conversations persist across sessions via Redis.

### Story 5.1: Redis Conversation Persistence

As a **user**,
I want my conversations with the agent to survive server restarts and be accessible across sessions,
So that I can pick up where I left off without re-explaining context.

**Acceptance Criteria:**

**Given** Redis is running
**When** a conversation is created
**Then** messages are stored in Redis with key pattern `agent:conversation:{conversationId}`

**Given** a `conversationId` from a previous session
**When** the user sends a new message with that `conversationId`
**Then** previous context is loaded and the conversation continues

**Given** Redis TTL configuration
**When** a conversation is idle for 24 hours
**Then** it is automatically expired (NFR17)

**Given** Redis retrieval
**When** conversation history is loaded
**Then** it completes within 500ms (NFR5)

---

### Story 5.2: Numerical Cross-Check Verification

As a **user**,
I want the agent to verify that numerical claims in its responses match Ghostfolio's own calculations,
So that I can trust the portfolio numbers are mathematically correct, not hallucinated.

**Acceptance Criteria:**

**Given** a response containing allocation percentages
**When** verification runs
**Then** it checks that allocations sum to approximately 100%

**Given** a response containing return percentages
**When** verification runs
**Then** it cross-checks against Ghostfolio's calculation engine

**Given** a verification failure
**When** the discrepancy exceeds a threshold
**Then** the response includes a warning about potential inaccuracy

**Given** verification results
**When** returned in the response
**Then** they follow the `VerificationResult` interface: `{ type, passed, details, severity }` (FR17)

---

### Story 5.3: Data Freshness & Confidence Scoring

As a **user**,
I want to know when market data is stale and how confident the agent is in its analysis,
So that I don't make decisions based on outdated or uncertain information.

**Acceptance Criteria:**

**Given** market data in the response
**When** the data is older than 24 hours for equities (or 1 hour for crypto) on a trading day
**Then** the response includes an explicit staleness warning (FR18)

**Given** an analytical response
**When** confidence scoring is applied
**Then** a score 0-100 is assigned based on data completeness and verification results (FR19)

**Given** a confidence score below 70%
**When** included in the response
**Then** it is explicitly flagged for user awareness

**Given** all three verification types active
**When** a response is generated
**Then** verification results array includes entries for ticker validation, numerical cross-check, and data freshness

---

### Story 5.4: LangSmith Observability & Trace Sanitization

As an **administrator**,
I want full LangSmith traces with latency breakdowns, token costs, and error categorization — but without exposing raw portfolio data,
So that I can monitor agent health and costs while protecting user privacy.

**Acceptance Criteria:**

**Given** every agent request
**When** processed
**Then** a full trace (input → reasoning → tool calls → output) appears in LangSmith (FR31)

**Given** a trace
**When** inspected
**Then** it shows latency breakdown: LLM call time, tool execution time, total response time (FR32)

**Given** a trace
**When** inspected
**Then** it shows token usage (input/output) and estimated cost per request (FR33)

**Given** a tool failure
**When** the error is traced
**Then** it is categorized by type: tool failure, LLM failure, verification failure, input validation failure (FR34)

**Given** sensitive tool calls
**When** traced to LangSmith
**Then** raw portfolio values, account balances, and holding quantities are NOT included — only metadata (FR41, NFR10)

**Given** LangSmith dashboards
**When** accessed by an administrator
**Then** they show trace viewer, latency analysis, cost tracking, and eval scoring (FR36, NFR20)

---

## Epic 6: Extended Agent Capabilities (Final)

Users can search for ticker symbols and financial instruments by name, and manage their watchlist (view, add, remove) through conversation. Two additional tools built in parallel via agent teams.

### Story 6.1: Symbol Search Tool

As a **user**,
I want to search for ticker symbols and financial instruments by name through conversation,
So that I can find the right symbol before querying market data or adding to my watchlist.

**Acceptance Criteria:**

**Given** the `symbol_search` tool in `tools/symbol-search.tool.ts`
**When** "Find me crypto ETFs" is sent
**Then** matching symbols are returned with names and data sources

**Given** a search query
**When** results are returned
**Then** they include symbol, name, data source, and currency for each match (FR12)

**Given** a short query (< 2 characters)
**When** submitted
**Then** the tool returns a message asking for a more specific search term

**Given** search results
**When** the user follows up with a market data query using a found symbol
**Then** the agent correctly chains `symbol_search` → `market_data`

**Given** the tool implements the standard factory pattern
**When** registered
**Then** it follows `create{Name}Tool(context, ...services)` convention (FR45a)

**Agent Teams:** Teammate 1 owns `tools/symbol-search.tool.ts` + `tools/symbol-search.tool.spec.ts`

---

### Story 6.2: Watchlist Management Tool

As a **user**,
I want to view, add to, and remove from my watchlist through conversation,
So that I can manage my market watch targets without navigating the dashboard.

**Acceptance Criteria:**

**Given** the `watchlist_manage` tool in `tools/watchlist-manage.tool.ts`
**When** "Show me my watchlist" is sent
**Then** the user's current watchlist items are returned with names and current performance

**Given** a request "Add AAPL to my watchlist"
**When** processed
**Then** the symbol is added to the user's watchlist via WatchlistService

**Given** a request "Remove MSFT from my watchlist"
**When** processed
**Then** the symbol is removed from the user's watchlist

**Given** a non-existent symbol
**When** the user tries to add it
**Then** the tool validates the symbol first and returns an error if not found

**Given** CRUD operations
**When** executed
**Then** only the authenticated user's watchlist is affected (FR38)

**Agent Teams:** Teammate 2 owns `tools/watchlist-manage.tool.ts` + `tools/watchlist-manage.tool.spec.ts`

---

## Epic 7: Browser Chat Experience (Final) — COMPLETE

Users can chat with the agent directly in Ghostfolio's web interface, with loading indicators and error states. **LOWEST PRIORITY** — skip if time-pressured. API demo is acceptable per PRD.

### Story 7.1: Angular Chat Component — COMPLETE

As a **user**,
I want to chat with the agent directly in Ghostfolio's web interface instead of using API calls,
So that I have a convenient, integrated experience within the app I already use.

**Acceptance Criteria:**

**Given** an authenticated user
**When** they navigate to the chat route in Ghostfolio
**Then** they see a chat interface with a text input and message history area

**Given** the chat input
**When** a message is typed and submitted
**Then** it is sent to `POST /api/v1/agent/chat` and the response is displayed conversationally (FR43)

**Given** a pending response
**When** the agent is processing
**Then** a loading indicator is visible within 200ms of submission (FR44, NFR4)

**Given** an agent error
**When** the response fails
**Then** an error state is displayed with a helpful message (FR45)

**Given** the chat component
**When** implemented
**Then** it follows existing Ghostfolio Angular patterns (standalone component, `gf-` selector prefix, lazy-loaded route)

---

## Epic 8: Submission Deliverables (Final)

All deliverables for the final AgentForge submission: cost analysis, architecture documentation, open source contribution, demo video, and social post. Deadline: Sunday 10:59 PM CT.

### Story 8.1: AI Cost Analysis Document

As an **evaluator**,
I want a cost analysis showing actual development spend and production projections for different user scales,
So that I can assess the economic viability of the agent.

**Acceptance Criteria:**

**Given** actual LLM API costs from development
**When** documented
**Then** total spend and per-query costs are reported

**Given** production projections
**When** calculated for 100 / 1K / 10K / 100K users
**Then** assumptions are clearly documented (queries per user per day, average tokens per query, model pricing)

**Given** the analysis
**When** reviewed
**Then** it includes recommendations for cost optimization (model routing, caching, prompt optimization)

**Agent Teams:** Teammate 1.

---

### Story 8.2: Agent Architecture Document (1-2 pages)

As an **evaluator**,
I want a 1-2 page architecture document covering the agent's design, tools, verification, and eval results,
So that I can assess the technical quality and decision-making behind the implementation.

**Acceptance Criteria:**

**Given** the architecture document
**When** authored
**Then** it covers: domain & use cases, agent architecture (LangChain.js, tool design), verification strategy, eval results (pass rates), observability setup, open source contribution

**Given** eval results
**When** included
**Then** actual pass rates and failure analysis from the 50+ test suite are reported

**Given** the document
**When** reviewed
**Then** it is 1-2 pages, concise, with clear diagrams

**Agent Teams:** Teammate 2.

---

### Story 8.3: Open Source Contribution

As an **evaluator and the open source community**,
I want a published open source contribution (eval dataset, npm package, or documentation),
So that others can benefit from and build upon this work.

**Acceptance Criteria:**

**Given** contribution type selection
**When** chosen
**Then** one of: eval dataset (published), npm package (published), or documentation/tutorial is created

**Given** the contribution
**When** published
**Then** it is publicly accessible with a documented link

**Given** the contribution
**When** reviewed
**Then** it is licensed AGPLv3 consistent with Ghostfolio

**Agent Teams:** Teammate 3.

---

### Story 8.4: Demo Video & Social Post

As an **evaluator**,
I want a 3-5 minute demo video showing the agent in action and a social post sharing the project,
So that the submission is complete with all required deliverables.

**Acceptance Criteria:**

**Given** the demo video
**When** recorded
**Then** it shows: agent responding to NL queries, tool execution with structured results, eval results, and observability dashboard (3-5 minutes)

**Given** the social post
**When** published on X or LinkedIn
**Then** it tags @GauntletAI and shares the project

**Given** all deliverables
**When** packaged for submission
**Then** everything is submitted before 10:59 PM CT Sunday

**Note:** Demo video requires Diane's hands-on involvement — not delegable to agent.
