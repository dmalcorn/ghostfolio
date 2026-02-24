# Ghostfolio AI Agent Documentation

**Generated:** 2026-02-24
**Purpose:** Scoped brownfield documentation for building a LangChain.js AI agent
**Audience:** AI agents (dev, architect) and project owner (Diane)

---

## Documentation Index

| # | Document | Description | Agent Tool |
|---|----------|-------------|-----------|
| 1 | [Project Overview](project-overview.md) | Tech stack, architecture, module map, dependencies | — |
| 2 | [AI Integration](ai-integration.md) | Existing AI endpoint, LLM setup, extension points | Setup |
| 3 | [Portfolio Service](portfolio-service.md) | Endpoints, calculations, data structures | `portfolio_analysis` |
| 4 | [Market Data Services](market-data-services.md) | Data providers, caching, quotes, historical data | `market_data` |
| 5 | [Benchmarks Endpoint](benchmarks-endpoint.md) | Benchmark management, comparison, trends | `benchmark_compare` |
| 6 | [Authentication](authentication.md) | JWT, API Key, OAuth, guards, permissions | Agent auth |
| 7 | [Prisma Schema](prisma-schema.md) | Database models, enums, relations, data flow | All tools |

## Quick Reference

### MVP Agent Tools → Source Modules

| Agent Tool | Primary Service | Key Endpoint |
|-----------|----------------|-------------|
| `portfolio_analysis` | PortfolioService | `GET /portfolio/details`, `/performance`, `/report` |
| `market_data` | DataProviderService | `getQuotes()`, `getHistorical()`, `getAssetProfiles()` |
| `benchmark_compare` | BenchmarkService | `GET /benchmarks`, `GET /benchmarks/:ds/:sym/:date` |

### Agent Authentication

**Recommended:** API Key (`Authorization: Api-Key <key>`)
- See [Authentication](authentication.md) for setup details

### Key Files to Monitor

| File | Purpose |
|------|---------|
| `apps/api/src/app/endpoints/ai/` | AI integration point (extend here) |
| `apps/api/src/app/portfolio/portfolio.service.ts` | Core calculations (2,220 lines) |
| `apps/api/src/services/data-provider/data-provider.service.ts` | Data source orchestrator |
| `apps/api/src/services/benchmark/benchmark.service.ts` | Benchmark calculations |
| `libs/common/src/lib/permissions.ts` | Authorization rules (60+ permissions) |
| `libs/common/src/lib/config.ts` | Global constants |
| `prisma/schema.prisma` | Database schema |

### What's Missing (Must Add)

- LangChain.js dependencies (`langchain`, `@langchain/core`)
- Tool definitions and function calling logic
- Agent memory / conversation state
- Agent orchestration endpoints
- Streaming responses (SSE/WebSocket)

---

## Scope & Approach

This documentation was generated following the [documentation approach](../gauntlet_docs/documentation-approach.md):

- **Phase 1:** Quick broad scan of entire codebase structure
- **Phase 2:** Deep-dive on 6 AI-relevant areas
- **Out of scope:** Angular frontend, UI components, Storybook, subscriptions, i18n, CSS
