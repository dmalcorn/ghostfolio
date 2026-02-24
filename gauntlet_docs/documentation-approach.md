# Brownfield Documentation Approach — Ghostfolio AI Agent Project

**Created:** 2026-02-24
**Author:** Mary (Business Analyst Agent) in collaboration with Diane
**Purpose:** Define the scoped documentation strategy for the Ghostfolio brownfield codebase, optimized for AI agent development.

---

## Context

This is a brownfield documentation effort for the Ghostfolio project. The goal is NOT to document the entire codebase exhaustively, but to produce targeted documentation that enables building a LangChain.js AI agent on top of the existing Ghostfolio platform.

## Audience

- **Primary:** AI agents (dev agent, architect agent, etc.) that will implement the LangChain.js agent
- **Secondary:** Diane (project owner), who scans the docs but relies heavily on AI agents

Documentation should be optimized for AI consumption — precise, structured, and context-rich.

## Approach: Hybrid Quick Scan + Deep-Dive

### Phase 1 — Quick Broad Scan

A fast sweep across the entire codebase structure to:
- Confirm project classification (multi-part: NestJS API + Angular client)
- Map the high-level module structure
- Identify anything pertinent to the AI agent project that wasn't previously considered
- Catch hidden dependencies, patterns, or services that the AI agent might need
- Produce a concise project overview and source tree analysis

**What this is NOT:** An exhaustive read of every source file. We scan structure, configs, manifests, and critical directories — not every line of code.

### Phase 2 — Deep-Dive on AI-Relevant Areas

Focused, exhaustive documentation of the specific modules needed to build the AI agent:

1. **Existing AI Integration** (`apps/api/src/app/endpoints/ai/`)
   - AI service, controller, module
   - What LLM it calls, what data it passes, what services it injects
   - These injected services are tool candidates

2. **Portfolio Service & Controller** (`apps/api/src/app/portfolio/`)
   - Endpoints, request/response shapes, authentication requirements
   - This becomes the `portfolio_analysis` tool

3. **Market Data / Data Provider Services** (`apps/api/src/services/market-data/`, `apps/api/src/services/data-provider/`)
   - How market data is fetched and cached
   - This becomes the `market_data` tool

4. **Benchmarks Endpoint** (`apps/api/src/app/endpoints/benchmarks/`)
   - Benchmark comparison capabilities
   - This becomes the `benchmark_compare` tool

5. **Authentication Patterns** (`apps/client/src/app/core/auth*`, API guards)
   - How auth works, JWT handling, guards
   - The agent needs to understand auth context for API calls

6. **Relevant Prisma Models** (`prisma/schema.prisma`)
   - User, Account, Order, SymbolProfile, MarketData models
   - Data shapes that flow through the tools

## Scope Boundaries

### In Scope
- Everything listed in Phase 1 and Phase 2 above
- Any surprising findings from Phase 1 that are pertinent to the AI agent project

### Out of Scope (unless Phase 1 reveals relevance)
- Angular frontend components and routing (agent is API-only for MVP)
- UI library / Storybook components
- Subscription management
- Admin module (unless it has relevant data access patterns)
- CSS/styling
- i18n/localization

## Output Location

Documentation will be saved to `/workspace/docs/` (the project_knowledge path from config).

## Source of Scope Decision

This scope was derived from the sprint checklist (`gauntlet_docs/agentforge-sprint-checklist.md`), specifically:
- **Step 0.3** — Test the Existing AI Integration (understand and document existing AI services)
- **Step 1.1** — Understand the API Endpoints You'll Wrap (portfolio, market data, benchmarks)
