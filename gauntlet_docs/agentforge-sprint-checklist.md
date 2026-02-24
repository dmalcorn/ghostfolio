# AgentForge Sprint Checklist — Ghostfolio Finance Agent

**Created:** 2026-02-23, 8:30 PM MT
**MVP Deadline:** 2026-02-24, 11:00 PM MT (~26.5 hours)
**Early Submission:** 2026-02-28 (Friday)
**Final Submission:** 2026-03-01, 10:59 PM CT (Sunday)

---

## Situation Summary

- **Project:** Build a production-ready AI agent for Ghostfolio (finance domain)
- **Brownfield codebase:** Ghostfolio — TypeScript monorepo, NestJS API, Angular frontend, PostgreSQL + Redis
- **Existing AI integration:** Ghostfolio already has OpenRouter + Vercel AI SDK wired up at `apps/api/src/app/endpoints/ai/`
- **Our approach:** Replace/extend with **LangChain.js** (TypeScript) + **LangSmith** for observability
- **Deployment target:** Railway
- **Key advantage:** Diane has strong finance domain expertise + LangSmith already set up from a previous project

---

## MVP Requirements (All 9 Required to Pass)

These are the hard gate items from the project doc. Every checkbox below MUST be checked before submission:

- [ ] Agent responds to natural language queries in the finance domain
- [ ] At least 3 functional tools the agent can invoke
- [ ] Tool calls execute successfully and return structured results
- [ ] Agent synthesizes tool results into coherent responses
- [ ] Conversation history maintained across turns
- [ ] Basic error handling (graceful failure, not crashes)
- [ ] At least one domain-specific verification check
- [ ] Simple evaluation: 5+ test cases with expected outcomes
- [ ] Deployed and publicly accessible

---

## PHASE 0: Foundation (Tonight, Feb 23)

**Goal:** Ghostfolio running locally, dependencies installed, existing AI tested.

### Step 0.1 — Verify Ghostfolio Runs Locally
- [ ] Confirm Docker services are running: `docker ps` should show PostgreSQL + Redis containers
- [ ] If not running: `docker compose -f docker/docker-compose.dev.yml up -d`
- [ ] Copy `.env.example` to `.env` if not already done: `cp .env.example .env`
- [ ] Fill in required `.env` values (database URL, Redis URL, JWT secret)
- [ ] Run database setup: `npm run database:setup` (pushes schema + seeds data)
- [ ] Start the API server: `npm run start:server`
- [ ] Start the client: `npm run start:client`
- [ ] Verify: API responds at `http://localhost:3333/api/v1/` and client loads at `https://localhost:4200/en`
- [ ] **CRITICAL:** Confirm you have sample portfolio data seeded (check via Prisma Studio: `npm run database:gui`)

**If blocked:** Check `apps/api/src/main.ts` for port configuration, check Docker logs for DB/Redis errors.

### Step 0.2 — Get OpenRouter API Key
- [ ] Sign up at openrouter.ai (free tier available)
- [ ] Generate an API key
- [ ] Add to `.env` file as `PROPERTY_API_KEY_OPENROUTER=your_key_here`
- [ ] Verify the key works by testing the existing AI endpoint (Step 0.3)

### Step 0.3 — Test the Existing AI Integration
- [ ] With the API running, test: `curl http://localhost:3333/api/v1/ai/prompt/portfolio` (may need auth token)
- [x] Read and understand the existing AI service: `apps/api/src/app/endpoints/ai/ai.service.ts`
- [x] Read the AI controller: `apps/api/src/app/endpoints/ai/ai.controller.ts`
- [x] Read the AI module: `apps/api/src/app/endpoints/ai/ai.module.ts`
- [x] Document what you find: What LLM does it call? What data does it pass? What does it return?
- [x] **Key insight to capture:** What existing services does the AI module inject? These are your tool candidates.

### Step 0.4 — Install LangChain.js Dependencies
- [ ] Install core packages: `npm install langchain @langchain/core @langchain/openai`
- [ ] Install LangSmith (if not already a dependency): `npm install langsmith`
- [ ] Verify LangSmith environment variables are in `.env`:
  - `LANGCHAIN_TRACING_V2=true`
  - `LANGCHAIN_API_KEY=your_langsmith_key`
  - `LANGCHAIN_PROJECT=ghostfolio-agent`
- [ ] Verify no dependency conflicts with existing packages (check `npm install` output for errors)

**Phase 0 complete when:** Ghostfolio loads in browser, you can log in, and you see seeded portfolio data.

---

## PHASE 1: First Tool End-to-End (Tonight → Early Morning)

**Goal:** One working tool with LangChain — natural language in, structured result out.

### Step 1.1 — Understand the API Endpoints You'll Wrap

Before writing agent code, understand what you're wrapping:

- [x] Read the portfolio controller: `apps/api/src/app/portfolio/portfolio.controller.ts`
  - Find the endpoint for portfolio details (likely `GET /api/v1/portfolio/details`)
  - Note the required parameters and authentication
- [ ] Test the portfolio endpoint directly via curl or Postman (with auth token)
- [x] Document the response shape — this becomes your tool's output schema
- [x] Read the symbol/market data endpoints in `apps/api/src/app/endpoints/`
- [x] Read the benchmarks endpoint in `apps/api/src/app/endpoints/benchmarks/`

### Step 1.2 — Create the Agent Module Structure

Create a new NestJS module for the LangChain agent:

- [ ] Create directory: `apps/api/src/app/endpoints/agent/`
- [ ] Create files:
  - `agent.module.ts` — NestJS module
  - `agent.controller.ts` — REST endpoint(s) for the agent
  - `agent.service.ts` — Core agent logic with LangChain
  - `tools/` subdirectory for tool definitions
  - `tools/portfolio-analysis.tool.ts` — First tool
- [ ] Register the module in the app module
- [ ] Create a basic POST endpoint: `POST /api/v1/agent/chat`
  - Input: `{ message: string, conversationId?: string }`
  - Output: `{ response: string, toolCalls: array, conversationId: string }`

### Step 1.3 — Build the portfolio_analysis Tool

- [ ] Define the tool using LangChain's `DynamicStructuredTool` or `tool()` function
- [ ] Tool schema:
  - Name: `portfolio_analysis`
  - Description: "Analyzes the user's portfolio holdings, allocation percentages, and performance metrics"
  - Input: `{ accountId?: string, dateRange?: string }` (optional filters)
  - Output: structured JSON with holdings, allocations, performance
- [ ] Implementation: Call Ghostfolio's internal portfolio service (inject via NestJS DI)
- [ ] Wire the tool into a LangChain agent (use `createToolCallingAgent` or `AgentExecutor`)
- [ ] Configure the LLM (OpenRouter via `ChatOpenAI` with custom base URL)

### Step 1.4 — Test First Tool End-to-End

- [ ] Send a test query: "What's in my portfolio?" via `POST /api/v1/agent/chat`
- [ ] Verify: LLM receives the query → selects portfolio_analysis tool → tool executes → LLM synthesizes response
- [ ] Check LangSmith dashboard: verify the trace appears with full input/output chain
- [ ] Test with 2-3 different phrasings: "Show me my holdings", "What's my allocation?", "How is my portfolio performing?"
- [ ] **DO NOT proceed to Phase 2 until this works reliably**

**Phase 1 complete when:** You can ask a natural language question about your portfolio and get a correct, structured answer back.

---

### Agent Teams Opportunity — Phase 2 Tool Building

> **Claude Code Agent Teams** is enabled in settings (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`). Phase 2 is an excellent candidate for Agent Teams because the three tools (`market_data`, `benchmark_compare`, conversation history) are **independent modules in separate files** with no shared-file conflicts.
>
> **Recommended team structure:**
> - **Lead:** Coordinates and handles Step 2.3 (Conversation History) + Step 2.4 (Error Handling) + Step 2.5 (Verification)
> - **Teammate 1:** Builds `market_data` tool (Step 2.1) — `tools/market-data.tool.ts`
> - **Teammate 2:** Builds `benchmark_compare` tool (Step 2.2) — `tools/benchmark-compare.tool.ts`
>
> **Why it works here:** Each tool is a separate file, wraps a different Ghostfolio service, and has independent tests. No file-level conflicts. Teammates can message each other if they discover shared patterns (e.g., common error handling for data provider calls).
>
> **Why NOT in Phase 1:** Phase 1 is sequential by design — you need the first tool working end-to-end before parallelizing. Don't use Agent Teams here.
>
> **Setup:** Just describe the team structure in natural language in your Claude Code session. No special commands needed.
>
> **IMPORTANT: Read `gauntlet_docs/agent-teams-reference.md` before using Agent Teams.** It explains how Agent Teams differs from subagents and the critical rules for avoiding file conflicts.

---

## PHASE 2: Expand to 3 Tools + Core Features (Morning, Feb 24)

**Goal:** Three working tools, conversation history, error handling, one verification check.

### Step 2.1 — Build market_data Tool

- [ ] Create `tools/market-data.tool.ts`
- [ ] Tool schema:
  - Name: `market_data`
  - Description: "Retrieves current market data for stocks, ETFs, or cryptocurrencies"
  - Input: `{ symbols: string[], metrics?: string[] }`
  - Output: current prices, daily change, volume, etc.
- [ ] Implementation: Wrap Ghostfolio's existing data provider service (Yahoo Finance, etc.)
- [ ] Test: "What's the current price of AAPL?" → tool call → correct response
- [ ] Verify trace appears in LangSmith

### Step 2.2 — Build benchmark_compare Tool

- [ ] Create `tools/benchmark-compare.tool.ts`
- [ ] Tool schema:
  - Name: `benchmark_compare`
  - Description: "Compares portfolio performance against a market benchmark like S&P 500"
  - Input: `{ benchmarkSymbol?: string, dateRange?: string }`
  - Output: portfolio return vs benchmark return, alpha, tracking difference
- [ ] Implementation: Wrap Ghostfolio's benchmarks endpoint
- [ ] Test: "How does my portfolio compare to the S&P 500?" → tool call → correct response
- [ ] Verify trace appears in LangSmith

### Step 2.3 — Add Conversation History

- [ ] Implement conversation memory using LangChain's `BufferMemory` or `ChatMessageHistory`
- [ ] Store conversations keyed by `conversationId`
- [ ] For MVP: in-memory storage is fine (Redis-backed can come later)
- [ ] Test: Multi-turn conversation works ("What's in my portfolio?" → "How does it compare to S&P 500?" where "it" refers to the portfolio from the previous turn)
- [ ] Verify the conversation context is visible in LangSmith traces

### Step 2.4 — Add Basic Error Handling

- [ ] Tool execution failures return a graceful error message (not a stack trace)
- [ ] Invalid ticker symbols return a helpful message ("I couldn't find data for symbol XYZ")
- [ ] LLM timeout/failure returns a retry message
- [ ] Agent doesn't crash on unexpected input (empty string, very long input, special characters)
- [ ] Test each error path manually

### Step 2.5 — Add Domain-Specific Verification Check

- [ ] Implement at least ONE verification before returning responses:
  - **Recommended:** Ticker symbol validation — verify all ticker symbols mentioned in the response actually exist in market data before returning
  - **Alternative:** Numerical cross-check — verify portfolio allocation percentages sum to ~100%
  - **Alternative:** Data freshness check — verify market data is not stale (> 24 hours old on a trading day)
- [ ] The verification should be visible in the response (e.g., "Data verified as of [timestamp]" or confidence indicator)
- [ ] Log verification results in LangSmith traces

**Phase 2 complete when:** All 3 tools work, conversation persists across turns, errors are handled gracefully, and at least one verification check runs on responses.

---

## PHASE 3: Eval + Deploy (Afternoon, Feb 24)

**Goal:** 5+ test cases passing, deployed to public URL.

### Step 3.1 — Write Eval Test Cases (Design for Scale to 50)

Create a test file that can grow: `apps/api/src/app/endpoints/agent/agent.eval.spec.ts`

- [ ] Design the test harness structure:
  - Each test case = `{ input: string, expectedToolCalls: string[], expectedOutputContains: string[], passCriteria: string }`
  - Test cases loaded from a JSON/YAML file for easy expansion
- [ ] Write test case 1: "What's my portfolio allocation?" → expects `portfolio_analysis` tool → response contains holding names
- [ ] Write test case 2: "What's the current price of AAPL?" → expects `market_data` tool → response contains a dollar amount
- [ ] Write test case 3: "How does my portfolio compare to the S&P 500?" → expects `benchmark_compare` tool → response contains comparison metrics
- [ ] Write test case 4: "Tell me about my holdings and then compare them to the market" → expects multi-tool call → coherent combined response
- [ ] Write test case 5: "What's the price of XYZFAKE123?" → expects graceful error handling → response indicates symbol not found
- [ ] Run all 5 tests and document pass/fail results
- [ ] **Keep the test data file separate** — this will grow to 50+ for Friday's submission

### Step 3.2 — Deploy to Railway

- [ ] Create a Railway account at railway.app (if not already done)
- [ ] Connect your GitHub repository to Railway
- [ ] Add services:
  - PostgreSQL database (Railway add-on)
  - Redis (Railway add-on)
  - Ghostfolio app (from your Dockerfile or Docker Compose)
- [ ] Configure environment variables in Railway dashboard (mirror your `.env`)
- [ ] Deploy and verify the app loads at the Railway-provided URL
- [ ] Test the agent endpoint on the deployed URL: `POST https://your-app.railway.app/api/v1/agent/chat`
- [ ] Verify at least one query works end-to-end on the deployed version

### Step 3.3 — Final MVP Verification

Go through every MVP requirement and verify:

- [ ] **Natural language queries:** Agent responds to 3+ different finance queries correctly
- [ ] **3 functional tools:** portfolio_analysis, market_data, benchmark_compare all execute
- [ ] **Structured results:** Tool calls return JSON, not unstructured text
- [ ] **Coherent synthesis:** Agent combines tool results into readable responses
- [ ] **Conversation history:** Multi-turn conversation works (context preserved)
- [ ] **Error handling:** Bad input produces helpful message, not crash
- [ ] **Verification check:** At least one domain check runs (ticker validation, etc.)
- [ ] **5+ eval test cases:** All 5 tests documented with pass/fail
- [ ] **Deployed:** Public URL works, at least one query succeeds

### Step 3.4 — Submit MVP

- [ ] Ensure GitHub repo is up to date with all code pushed
- [ ] Document the deployed URL
- [ ] Submit before 11:00 PM MT Tuesday

**Phase 3 complete when:** All 9 MVP requirements pass and submission is in.

---

### Agent Teams Opportunity — Phase 4 Eval Expansion

> **Phase 4's eval expansion to 50+ test cases is a strong Agent Teams candidate.** The four test categories are independent and can be authored in parallel without file conflicts (each writes to separate test data files or sections).
>
> **Recommended team structure:**
> - **Lead:** Designs the test harness structure and coordinates, handles pass rate documentation
> - **Teammate 1:** Writes 20+ happy path scenarios
> - **Teammate 2:** Writes 10+ edge cases + 10+ adversarial inputs
> - **Teammate 3:** Writes 10+ multi-step reasoning scenarios
>
> **Also consider for Phase 4.2-4.3:** Observability setup and verification layer are independent workstreams that could run as separate teammates while eval expansion proceeds.
>
> **IMPORTANT: Read `gauntlet_docs/agent-teams-reference.md` before using Agent Teams.** It explains how Agent Teams differs from subagents and the critical rules for avoiding file conflicts.

---

## PHASE 4: Early Submission (Wednesday → Friday)

**Goal:** 50 eval test cases, observability dashboard, verification layer.

### Step 4.1 — Expand Eval Dataset to 50+
- [ ] 20+ happy path scenarios (various portfolio questions, market queries, comparisons)
- [ ] 10+ edge cases (missing data, boundary conditions, empty portfolio, no market data available)
- [ ] 10+ adversarial inputs (prompt injection attempts, out-of-domain queries, requests for guaranteed returns)
- [ ] 10+ multi-step reasoning scenarios (questions requiring 2+ tool calls)
- [ ] Each case: input query, expected tool calls, expected output, pass/fail criteria
- [ ] Automate eval runs via Jest (already configured in Ghostfolio)
- [ ] Document pass rates

### Step 4.2 — Observability via LangSmith
- [ ] Verify all agent traces are flowing to LangSmith
- [ ] Set up LangSmith datasets for eval runs
- [ ] Track metrics: latency, token usage, tool success rate, cost per query
- [ ] Reuse/adapt the Python LangSmith analysis program from previous project
- [ ] Create or export an observability dashboard/report

### Step 4.3 — Verification Layer (3+ Verification Types)
- [ ] Fact Checking: cross-reference numerical claims against data provider responses
- [ ] Confidence Scoring: quantify certainty on recommendations
- [ ] Domain Constraints: validate financial calculations are mathematically correct (e.g., allocations sum to 100%)
- [ ] Output Validation: structured response format with data source citations

---

### Agent Teams Opportunity — Phase 5 Final Deliverables

> **Phase 5 has 5+ independent deliverables** that can be parallelized. Each is a separate document/artifact with no file conflicts.
>
> **Recommended team structure:**
> - **Lead:** Coordinates, handles final submission packaging (Step 5.6)
> - **Teammate 1:** AI Cost Analysis (Step 5.1) — research + projections
> - **Teammate 2:** Agent Architecture Document (Step 5.2) — 1-2 page writeup
> - **Teammate 3:** Open Source Contribution prep (Step 5.3) + Social Post draft (Step 5.5)
>
> **Note:** Demo Video (Step 5.4) requires Diane's hands-on involvement and cannot be delegated to an agent.
>
> **IMPORTANT: Read `gauntlet_docs/agent-teams-reference.md` before using Agent Teams.** It explains how Agent Teams differs from subagents and the critical rules for avoiding file conflicts.

---

## PHASE 5: Final Submission (Saturday → Sunday 10:59 PM CT)

### Step 5.1 — AI Cost Analysis
- [ ] Track actual development spend (LLM API costs, tokens consumed)
- [ ] Create production cost projections for 100 / 1K / 10K / 100K users
- [ ] Document assumptions

### Step 5.2 — Agent Architecture Document (1-2 pages)
- [ ] Domain & Use Cases
- [ ] Agent Architecture (LangChain.js, tool design, reasoning approach)
- [ ] Verification Strategy
- [ ] Eval Results (pass rates, failure analysis)
- [ ] Observability Setup
- [ ] Open Source Contribution

### Step 5.3 — Open Source Contribution
- [ ] Choose contribution type (recommend: New Agent Package as npm package or Eval Dataset)
- [ ] Publish and document the link

### Step 5.4 — Demo Video (3-5 min)
- [ ] Show agent responding to natural language finance queries
- [ ] Show tool execution and structured results
- [ ] Show eval results and observability dashboard

### Step 5.5 — Social Post
- [ ] Share on X or LinkedIn
- [ ] Tag @GauntletAI

### Step 5.6 — Final Submission
- [ ] All deliverables packaged and submitted by Sunday 10:59 PM CT

---

## Quick Reference: Key File Paths

| What | Path |
|------|------|
| Existing AI Service | `apps/api/src/app/endpoints/ai/ai.service.ts` |
| Existing AI Controller | `apps/api/src/app/endpoints/ai/ai.controller.ts` |
| Portfolio Controller | `apps/api/src/app/portfolio/portfolio.controller.ts` |
| Portfolio Service | `apps/api/src/app/portfolio/portfolio.service.ts` |
| Market Data Service | `apps/api/src/services/market-data/market-data.service.ts` |
| Data Provider Service | `apps/api/src/services/data-provider/data-provider.service.ts` |
| Benchmarks Endpoint | `apps/api/src/app/endpoints/benchmarks/` |
| Prisma Schema | `prisma/schema.prisma` |
| App Module | `apps/api/src/app/app.module.ts` |
| Environment Config | `.env` (copy from `.env.example`) |
| Docker Dev Compose | `docker/docker-compose.dev.yml` |
| Project Requirements | `gauntlet_docs/G4 Week 2 - AgentForge.pdf` |
| Pre-Search Checklist | `gauntlet_docs/PreSearch_Checklist_Finance.md` |
| Previous Next Steps | `gauntlet_docs/next_steps.md` |
| Decision Document | `gauntlet_docs/Decision.md` |
| Prompt Log | `gauntlet_docs/prompt_log.md` |

## Quick Reference: Commands

| Task | Command |
|------|---------|
| Start Docker services | `docker compose -f docker/docker-compose.dev.yml up -d` |
| Install dependencies | `npm install` |
| Database setup | `npm run database:setup` |
| Start API server | `npm run start:server` |
| Start client | `npm run start:client` |
| Run tests | `npm test` |
| Run single test | `npm run test:single -- <path>` |
| Prisma Studio (DB GUI) | `npm run database:gui` |
| Generate Prisma types | `npm run database:generate-typings` |

---

## Decision Log

| Decision | Rationale | Date |
|----------|-----------|------|
| Finance domain (Ghostfolio) | Stronger resonance, existing AI infra, cleaner integration | 2/23 |
| LangChain.js over Vercel AI SDK | Avoid Vercel lock-in, native LangSmith integration, better tool calling | 2/23 |
| LangSmith for observability | Already set up from previous project, native LangChain integration | 2/23 |
| 3 tools for MVP (not 5) | Project requires minimum 3, reduce scope for deadline | 2/23 |
| Railway for deployment | Docker support, PostgreSQL/Redis add-ons, team recommendation | 2/23 |
| Stay on Prisma 6 | ESM migration too risky for timeline, see prisma-upgrade-analysis.md | 2/23 |
| Agent Teams for Phases 2, 4, 5 | Parallel tool building, eval generation, and final deliverables. Not for Phase 1 (sequential) or Phase 3 MVP (tight deadline). Enabled in settings.json. | 2/24 |
| Scoped brownfield docs | Quick broad scan + deep-dive on AI-relevant modules only. See `gauntlet_docs/documentation-approach.md` | 2/24 |

---

## Prompt Log Guidance

**Two types of prompt logging are required:**

1. **Development Prompts (your conversations with AI assistants):**
   - Continue logging in `gauntlet_docs/prompt_log.md`
   - Focus on significant decision points, not every keystroke
   - This is for your submission to show your development process
   - The Pre-Search doc says: "Save your AI conversation as a reference document"

2. **Agent Runtime Prompts (built into your agent via LangSmith):**
   - These are automatically captured when LangSmith tracing is enabled
   - Every user query → LLM reasoning → tool call → response is traced
   - This is the observability requirement, due at Early Submission (Friday)
   - Your existing Python LangSmith analysis program can pull this data

**You do NOT need to capture every single Claude Code prompt in exhaustive detail.**

---

*Last updated: 2026-02-24*
*Next action: Phase 0 — Step 0.1 (verify Ghostfolio runs locally), Step 0.2 (OpenRouter key), then remainder of Step 0.3 (test AI endpoint via curl)*
