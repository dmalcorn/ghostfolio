---
stepsCompleted: [1, 2, 3, 4, 5, 6]
status: complete
inputDocuments:
  - gauntlet_docs/G4 Week 2 - AgentForge.pdf
  - gauntlet_docs/Decision.md
  - gauntlet_docs/agentforge-sprint-checklist.md
  - gauntlet_docs/PreSearch_Checklist_Finance.md
  - gauntlet_docs/documentation-approach.md
  - gauntlet_docs/prisma-upgrade-analysis.md
date: 2026-02-24
author: Diane
---

# Product Brief: Ghostfolio AI Finance Agent

## Executive Summary

The Ghostfolio AI Finance Agent extends the open-source Ghostfolio wealth management platform with an intelligent, conversational AI agent that enables users to interact with their financial data through natural language. Built with LangChain.js and integrated directly into Ghostfolio's NestJS API, the agent provides tool-equipped, verification-layered financial analysis grounded in the user's real portfolio data and live market feeds — not generic AI responses.

The project delivers a production-ready agent with structured tool calling, multi-turn conversation, domain-specific verification, a comprehensive evaluation framework (50+ test cases), and full observability via LangSmith. It is developed as part of the Gauntlet AI AgentForge program and will be contributed back to the open-source community.

---

## Core Vision

### Problem Statement

Self-directed investors using Ghostfolio can view dashboards and charts, but they cannot *converse* with their financial data. Answering questions like "How does my portfolio compare to the S&P 500?" or "What's my allocation by sector?" requires manual navigation, mental math, or external tools. The existing AI integration in Ghostfolio (OpenRouter + Vercel AI SDK) provides a minimal prompt-based interaction with no structured tool calling, no verification layer, no conversation memory, and no evaluation framework — making it unsuitable for production use in a high-stakes financial domain.

### Problem Impact

- **Time cost:** Users spend unnecessary effort manually cross-referencing dashboards, running calculations, and comparing their holdings to benchmarks
- **Accessibility gap:** Less technically sophisticated investors cannot easily extract insights from their own data without financial analysis skills
- **Trust gap:** Generic AI chatbots hallucinate ticker symbols, fabricate returns, and offer unverified financial claims — eroding user trust in AI-assisted finance
- **Missed insight:** Without an analytical assistant, users may overlook portfolio concentration risks, underperformance relative to benchmarks, or rebalancing opportunities

### Why Existing Solutions Fall Short

- **Generic AI chatbots** (ChatGPT, Claude, etc.) lack access to the user's actual portfolio data, provide unverified financial information, and cannot execute real queries against live market data providers
- **Ghostfolio's current AI feature** is a thin prompt layer with no tool calling, no structured output, no conversation history, and no verification — it cannot reliably answer portfolio-specific questions
- **Third-party portfolio analyzers** require data export/import, breaking the integrated experience and introducing data staleness
- **No existing solution** combines direct database access to portfolio data, live market data provider integration, domain-specific verification, and conversational AI in a single open-source package

### Proposed Solution

A production-ready AI agent embedded within Ghostfolio's NestJS API that:

**MVP Capabilities (3 Core Tools):**
- **Portfolio Analysis** — Queries the user's real holdings, allocation percentages, and performance metrics directly from Ghostfolio's database
- **Market Data** — Retrieves current prices, daily changes, and volume data from Ghostfolio's integrated data providers (Yahoo Finance, Alpha Vantage, CoinGecko, EOD Historical Data, Financial Modeling Prep)
- **Benchmark Comparison** — Compares portfolio performance against market benchmarks (S&P 500, etc.) with alpha and tracking difference calculations

**Production Infrastructure:**
- Multi-turn conversation with persistent history
- Domain-specific verification (ticker symbol validation, numerical cross-checks, data freshness)
- Graceful error handling with informative fallback responses
- Comprehensive evaluation framework (50+ test cases: happy path, edge cases, adversarial, multi-step)
- Full observability via LangSmith (trace logging, latency tracking, token usage, cost monitoring)
- Publicly deployed and accessible via Railway

**Future Vision (Post-MVP Capabilities):**
- **Transaction Categorization** — Automatic categorization of transactions with spending pattern detection
- **Tax Estimation** — Estimated tax liability calculations based on portfolio gains, with tax-loss harvesting suggestions
- **Compliance Checking** — Validation of transactions against financial regulations with violation and warning detection
- **Watchlist Management** — Conversational management of market watchlists
- **Multi-Account Analysis** — Cross-account portfolio aggregation and analysis
- **Automated Rebalancing Suggestions** — AI-driven recommendations for portfolio rebalancing with confidence scoring
- **Predictive Analytics** — Forward-looking analysis leveraging historical performance patterns

### Key Differentiators

1. **Embedded, not external** — The agent lives inside Ghostfolio's API with direct access to the user's real portfolio data and Ghostfolio's calculation engine. No data export, no stale snapshots, no third-party integrations required.
2. **Verified, not hallucinated** — Every response passes through domain-specific verification: ticker symbol validation, numerical cross-checks against Ghostfolio's own calculations, and data freshness checks. Confidence scoring surfaces uncertainty rather than hiding it.
3. **Evaluated, not hoped-for** — A rigorous evaluation framework with 50+ test cases (including adversarial inputs and multi-step reasoning) provides measurable quality guarantees. Eval results are tracked over time for regression detection.
4. **Observable, not opaque** — Full LangSmith integration traces every request from input through reasoning to tool calls to output, with latency, token usage, and cost tracking. Failures are captured and categorized, not silently swallowed.
5. **Open source, not locked in** — Built on LangChain.js (avoiding vendor lock-in), designed for community contribution, and licensed under AGPLv3 consistent with Ghostfolio's own license.

### Open Source Contribution

This project will contribute back to the open-source community through one of the following paths (final selection pending):

| Contribution Type | Description |
|---|---|
| **New Agent Package** | Publish the Ghostfolio finance agent as a reusable npm package |
| **Eval Dataset** | Release the 50+ test case evaluation suite as a public dataset for financial agent testing |
| **Tool Integration** | Build and release reusable LangChain.js tool wrappers for financial platforms |
| **Documentation** | Comprehensive guide/tutorial for building domain-specific agents on brownfield codebases |

---

## Target Users

### Primary Users

**Persona: "Alex" — The Self-Directed Investor**

Alex is a 35-year-old software engineer who manages a diversified portfolio of index ETFs, individual stocks, and a small crypto allocation across two brokerage accounts. Alex self-hosts Ghostfolio on a home server to maintain full control over financial data privacy. While comfortable with technology, Alex is not a financial analyst — portfolio performance calculations, benchmark comparisons, and allocation drift analysis are tedious and error-prone when done manually.

- **Motivation:** Make informed investment decisions without paying for a financial advisor or spending hours in spreadsheets
- **Current workaround:** Navigates multiple Ghostfolio dashboard pages, exports data to spreadsheets for analysis, and occasionally asks ChatGPT generic finance questions (but doesn't trust the answers because they're not grounded in real portfolio data)
- **Pain point:** "I can *see* my holdings, but I can't easily *understand* what they mean — am I overexposed to tech? How am I doing vs the market? Should I rebalance?"
- **Success moment:** Asks "How does my portfolio compare to the S&P 500 this year?" and gets a verified, data-grounded answer in seconds — with real numbers from their actual holdings

**Persona: "Maria" — The Hands-Off Long-Term Investor**

Maria is a 52-year-old small business owner who uses Ghostfolio to track her retirement portfolio. She checks in quarterly rather than daily. She's less technically sophisticated than Alex but was drawn to Ghostfolio for its privacy-first approach. Maria finds the existing dashboards overwhelming and wishes she could just *ask* what she needs to know.

- **Motivation:** Confidence that her retirement savings are on track without needing to learn financial analysis tools
- **Current workaround:** Relies on her brokerage's basic summary views, which don't aggregate across accounts, and occasionally asks financially savvy friends for a gut-check
- **Pain point:** "I don't want to learn what Sharpe ratio means — I just want to know: am I on track?"
- **Success moment:** Types "Am I diversified enough?" and gets a plain-language answer that identifies her 60% concentration in a single sector, with a suggestion to review

### Secondary Users

**Open-Source Developers & Contributors**

Developers in the Ghostfolio community who may extend the agent with new tools, contribute eval test cases, or adapt the agent framework for other financial platforms. Their needs are: clean architecture, well-documented tool schemas, and a modular design that supports extension without forking.

**Ghostfolio Instance Administrators**

Users who run Ghostfolio instances for small groups (family, investment clubs). They benefit from the agent's ability to serve multiple authenticated users, each seeing only their own portfolio data through Ghostfolio's existing JWT-based auth system.

### User Journey

**Discovery → Value for "Alex" (Primary Persona):**

1. **Discovery:** Alex sees the agent feature announced in Ghostfolio's changelog or the open-source contribution post. Immediately interested because it solves a pain point they've had since day one.
2. **Onboarding:** Agent is available at `POST /api/v1/agent/chat` — no additional setup beyond the existing Ghostfolio deployment. Alex sends their first query: "What's in my portfolio?"
3. **Core Usage:** Alex begins each week by asking the agent 2-3 questions: portfolio performance, market data on holdings they're watching, and benchmark comparisons. Replaces the manual spreadsheet ritual.
4. **"Aha!" Moment:** Alex asks a multi-step question — "Show me my holdings, then compare my tech allocation to the S&P 500" — and the agent chains two tools together and delivers a coherent analysis. Alex realizes this is fundamentally different from a generic chatbot.
5. **Long-term:** The agent becomes the primary way Alex interacts with portfolio data. Dashboard visits decrease as conversational queries replace manual navigation.

---

## Success Metrics

### User Success Metrics

| Metric | Target | Measurement |
|---|---|---|
| Query-to-answer accuracy | >80% eval pass rate | Automated eval suite against ground truth |
| Response latency (single tool) | <5 seconds | LangSmith trace timing |
| Response latency (multi-step) | <15 seconds for 3+ tool chains | LangSmith trace timing |
| Hallucination rate | <5% unsupported claims | Eval test cases + verification layer flags |
| Conversation continuity | Context preserved across turns | Multi-turn eval scenarios |
| Error experience | Graceful message, not crash | Adversarial + edge case eval scenarios |

**What "success" feels like for Alex:** Asks 3 different portfolio questions and gets verified, correct answers every time — faster than opening a spreadsheet.

**What "success" feels like for Maria:** Asks a plain-language question and gets a response she understands without needing to Google financial terminology.

### Business Objectives

This project serves two strategic purposes simultaneously:

**1. Gauntlet AI AgentForge Deliverables (Gate Requirements)**
- MVP with all 9 requirements passing by Tuesday deadline
- 50+ eval test cases with documented pass/fail by Friday early submission
- Full observability dashboard via LangSmith
- Production deployment on Railway
- Open source contribution published
- Architecture document, cost analysis, demo video, and social post by Sunday final deadline

**2. Open Source Community Value**
- A reusable pattern for adding AI agents to existing open-source platforms
- A financial domain eval dataset that other agent builders can benchmark against
- Documented architecture decisions that help others avoid pitfalls (e.g., Prisma 6 vs 7, LangChain.js vs Vercel AI SDK)

### Key Performance Indicators

**Agent Quality KPIs**

| KPI | Target | Phase |
|---|---|---|
| Functional tools | 3 minimum (portfolio analysis, market data, benchmark compare) | MVP |
| Tool execution success rate | >95% | MVP onward |
| Eval test cases | 5+ (MVP), 50+ (Early Submission) | Phased |
| Eval pass rate | >80% on full suite | Early Submission |
| Verification accuracy | >90% correct flags | Early Submission |
| Domain verification types | 3+ (fact checking, confidence scoring, domain constraints) | Early Submission |

**Observability KPIs**

| KPI | Target | Phase |
|---|---|---|
| Trace coverage | 100% of requests traced in LangSmith | Early Submission |
| Latency tracking | Per-request breakdown (LLM, tool, total) | Early Submission |
| Token usage tracking | Input/output per request, cost per query | Early Submission |
| Error categorization | All failures captured with context | Early Submission |

**Cost KPIs**

| KPI | Target | Phase |
|---|---|---|
| Cost per simple query | <$0.05 | Final |
| Cost per complex analysis | <$0.20 | Final |
| Production projections | Documented for 100 / 1K / 10K / 100K users | Final |

---

## MVP Scope

### Core Features

**1. Agent Chat Endpoint**
- `POST /api/v1/agent/chat` — accepts `{ message, conversationId? }`, returns `{ response, toolCalls, conversationId }`
- Built as a new NestJS module (`apps/api/src/app/endpoints/agent/`) following existing Ghostfolio patterns
- LangChain.js agent with OpenRouter LLM (via `ChatOpenAI` with custom base URL)

**2. Three Functional Tools**

| Tool | Wraps | Input | Output |
|---|---|---|---|
| `portfolio_analysis` | Portfolio service (`/api/v1/portfolio/details`) | `{ accountId?, dateRange? }` | Holdings, allocation %, performance metrics |
| `market_data` | Data provider service (Yahoo Finance, etc.) | `{ symbols[], metrics? }` | Current prices, daily change, volume |
| `benchmark_compare` | Benchmarks endpoint (`/api/v1/endpoints/benchmarks`) | `{ benchmarkSymbol?, dateRange? }` | Portfolio return vs benchmark, alpha, tracking difference |

**3. Conversation History**
- Multi-turn context persistence keyed by `conversationId`
- In-memory storage for MVP (Redis-backed upgrade path available)

**4. Domain-Specific Verification**
- Ticker symbol validation — verify symbols exist before returning data
- Additional verification types (numerical cross-check, data freshness) targeted for Early Submission

**5. Error Handling**
- Invalid ticker symbols return helpful "symbol not found" messages
- Tool execution failures return graceful error messages (not stack traces)
- Unexpected input (empty, very long, special characters) handled without crashes

**6. Evaluation Suite**
- 5+ test cases for MVP (happy path, error case, multi-tool)
- Test harness designed to scale to 50+ cases
- Each case: input query, expected tool calls, expected output, pass/fail criteria

**7. Deployment**
- Publicly accessible via Railway
- PostgreSQL + Redis as Railway add-ons
- Environment variables mirrored from local `.env`

### Out of Scope for MVP

| Feature | Rationale | When |
|---|---|---|
| Transaction categorization tool | Not in the 3 core tools; adds complexity without solving the primary query use case | Early Submission or later |
| Tax estimation tool | Requires custom business logic beyond wrapping existing endpoints | Post-MVP future |
| Compliance checking tool | Requires regulatory rule engine not present in Ghostfolio | Post-MVP future |
| Watchlist management tool | Lower priority; users can manage watchlists via existing UI | Post-MVP future |
| Frontend chat UI | Agent is API-only for MVP; Angular frontend integration deferred | Post-MVP |
| Redis-backed conversation storage | In-memory is sufficient for MVP scale; Redis upgrade is straightforward | Early Submission |
| Advanced verification (3+ types) | MVP requires one verification check; full verification layer is Early Submission | Early Submission |
| 50+ eval test cases | MVP requires 5+; expansion to 50+ is Early Submission scope | Early Submission |
| Observability dashboard | LangSmith traces flow for MVP; formal dashboard is Early Submission | Early Submission |
| Cost analysis document | Final submission deliverable, not MVP | Final |
| Demo video / social post | Final submission deliverables | Final |

### MVP Success Criteria

All 9 AgentForge MVP requirements must pass:

- [ ] Agent responds to natural language queries in the finance domain
- [ ] At least 3 functional tools the agent can invoke
- [ ] Tool calls execute successfully and return structured results
- [ ] Agent synthesizes tool results into coherent responses
- [ ] Conversation history maintained across turns
- [ ] Basic error handling (graceful failure, not crashes)
- [ ] At least one domain-specific verification check
- [ ] Simple evaluation: 5+ test cases with expected outcomes
- [ ] Deployed and publicly accessible

**Go/no-go signal:** If all 9 boxes are checked and the deployed URL responds to at least one end-to-end query, MVP is complete.

### Future Vision

The MVP establishes the foundation for a progressively richer financial AI assistant:

**Early Submission (Friday):** Expand eval to 50+ cases, add 3+ verification types (fact checking, confidence scoring, domain constraints), full LangSmith observability dashboard, and Redis-backed conversation persistence.

**Final Submission (Sunday):** AI cost analysis with production projections, architecture document, open source contribution, demo video, and social post.

**Post-Project Roadmap:**
- Additional tools (transaction categorization, tax estimation, compliance checking, watchlist management)
- Angular frontend chat UI integrated into Ghostfolio's client
- Multi-account cross-portfolio analysis
- Automated rebalancing suggestions with confidence scoring
- Predictive analytics leveraging historical performance patterns
- Community-driven tool contributions via modular plugin architecture
