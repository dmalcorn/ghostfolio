# Ghostfolio Project Overview

**Generated:** 2026-02-24
**Scope:** Brownfield scan for AI agent integration (LangChain.js)
**Audience:** AI agents (dev, architect) and project owner

---

## Project Classification

- **Name:** Ghostfolio
- **Version:** 2.242.0
- **License:** AGPL-3.0
- **Type:** Open-source wealth management software (stocks, ETFs, cryptocurrencies)
- **Architecture:** Full-stack TypeScript monorepo managed by **Nx 22.4.5**

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend | NestJS | 11.1.8 |
| Frontend | Angular | 21.1.1 |
| ORM | Prisma | 6.19.0 |
| Database | PostgreSQL | — |
| Cache/Queue | Redis + Bull | 4.16.5 |
| Build System | Nx | 22.4.5 |
| Testing | Jest | 30.0.0 |
| Node.js | Required | >= 22.18.0 |

## Project Structure

```
workspace/
├── apps/
│   ├── api/                    # NestJS backend (REST API, port 3333)
│   └── client/                 # Angular frontend SPA (port 4200, HTTPS)
├── libs/
│   ├── common/                 # Shared DTOs, interfaces, types (API & client)
│   └── ui/                     # Angular component library (40+ components)
├── prisma/                     # Database schema, migrations, seed
├── docker/                     # Docker Compose files (dev, prod, build)
├── scripts/                    # CI/CD and utility scripts
└── docs/                       # Project documentation (this folder)
```

## Path Aliases (tsconfig.base.json)

```
@ghostfolio/api/*      → apps/api/src/*
@ghostfolio/client/*   → apps/client/src/app/*
@ghostfolio/common/*   → libs/common/src/lib/*
@ghostfolio/ui/*       → libs/ui/src/lib/*
```

## API Architecture

### Bootstrap Configuration
- **CORS:** Enabled globally
- **API Versioning:** URI-based (`/api/v1/...`)
- **Global Validation:** ValidationPipe (whitelist + transform)
- **Body Limit:** 10MB (for activity imports)
- **Security:** Helmet middleware

### Domain Modules (apps/api/src/app/)

22 domain modules following pattern: `{feature}.module.ts`, `{feature}.controller.ts`, `{feature}.service.ts`

| Module | Purpose | AI Relevant? |
|--------|---------|:---:|
| `access/` | Portfolio sharing & access control | Yes |
| `account/` | User investment accounts | Yes |
| `account-balance/` | Historical account balances | Yes |
| `admin/` | Admin operations & analytics | — |
| `asset/` | Asset management | — |
| `auth/` | JWT + OAuth + WebAuthn + API Key auth | Yes |
| `auth-device/` | WebAuthn devices | — |
| `cache/` | Cache management | — |
| `exchange-rate/` | Exchange rate data | Yes |
| `export/` | CSV/JSON export | — |
| `health/` | Health check | — |
| `import/` | Activity import | — |
| `info/` | App info | — |
| `logo/` | Asset logo delivery | — |
| `order/` | Trading transactions | Yes |
| `platform/` | Broker/exchange platforms | — |
| `portfolio/` | **Core** — Analysis, performance, risk | **Critical** |
| `redis-cache/` | Redis operations | — |
| `subscription/` | Stripe subscriptions | — |
| `symbol/` | Symbol/asset profiles | Yes |
| `user/` | User accounts & settings | Yes |
| `endpoints/` | Standalone API endpoints (see below) | Yes |

### Endpoint Modules (apps/api/src/app/endpoints/)

| Endpoint | Purpose | AI Relevant? |
|----------|---------|:---:|
| `ai/` | AI text generation (OpenRouter) | **Critical** |
| `api-keys/` | API key management | Yes |
| `assets/` | Asset data | — |
| `benchmarks/` | Benchmark data & comparison | **Critical** |
| `data-providers/` | Data source configs | Yes |
| `market-data/` | Market data queries | **Critical** |
| `platforms/` | Broker listings | — |
| `public/` | Public/anonymous endpoints | — |
| `sitemap/` | XML sitemap | — |
| `tags/` | Tag management | — |
| `watchlist/` | Watchlist operations | — |

### Cross-Cutting Services (apps/api/src/services/)

| Service | Purpose | AI Relevant? |
|---------|---------|:---:|
| `data-provider/` | Abstracts 9 data sources | **Critical** |
| `market-data/` | Market data caching & querying | **Critical** |
| `benchmark/` | Benchmark analytics | **Critical** |
| `exchange-rate-data/` | Exchange rate calculations | Yes |
| `prisma/` | Database access | Yes |
| `redis-cache/` | Redis caching | Yes |
| `configuration/` | App configuration | Yes |
| `property/` | System key-value store | Yes |
| `queues/data-gathering/` | Bull queue for data fetching | — |
| `queues/portfolio-snapshot/` | Bull queue for snapshots | — |
| `cron/` | Scheduled tasks | — |
| `symbol-profile/` | Asset symbol metadata | Yes |
| `api-key/` | API key generation/validation | Yes |
| `impersonation/` | Admin user impersonation | — |
| `tag/` | Tag service | — |
| `i18n/` | Internationalization | — |

## Common Library (libs/common/src/lib/)

Framework-agnostic shared code:

| File/Directory | Purpose |
|---------------|---------|
| `config.ts` | Global constants (colors, queues, TTLs, data sources) |
| `permissions.ts` | Role-based permission system (60+ permissions) |
| `helper.ts` | Utility functions (financial calculations) |
| `dtos/` | API request/response contracts (30+ DTOs) |
| `interfaces/` | Domain model types (30+ interfaces) |
| `routes/` | Centralized route definitions |
| `types/` | Shared type definitions |

## Key Dependencies for Agent Integration

### Already Available
- **ai** (4.3.16) — Vercel AI SDK
- **@openrouter/ai-sdk-provider** (0.7.2) — OpenRouter provider
- **big.js** (7.0.1) — Arbitrary precision decimals
- **date-fns** (4.1.0) — Date manipulation
- **bull** (4.16.5) — Job queues
- **rxjs** (7.8.1) — Reactive streams
- **fuse.js** — Fuzzy search
- **cheerio** (1.2.0) — HTML parsing

### Must Add for LangChain.js Agent
- **langchain** / **@langchain/core** / **@langchain/community**
- **LangSmith** SDK (observability — env vars already configured)
- Agent-specific dependencies (tools, memory, etc.)

## Environment & Docker

### Dev Services
```bash
docker compose -f docker/docker-compose.dev.yml up -d  # PostgreSQL + Redis
```

### Key Environment Variables
```
DATABASE_URL=postgresql://...
REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
JWT_SECRET_KEY
ACCESS_TOKEN_SALT
```

### LangSmith (Pre-configured)
```
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=...
LANGCHAIN_PROJECT=ghostfolio-agent
```

## Integration Points for AI Agent

1. **DataProviderService** — Abstraction over 9 data sources (pluggable, retry logic)
2. **PortfolioService** — 2,220-line calculation engine (performance, risk, allocation)
3. **BenchmarkService** — Comparative analysis with market benchmarks
4. **PropertyService** — Runtime config store (model selection, feature flags, API keys)
5. **Queue System (Bull)** — Async processing for long-running agent tasks
6. **Existing AI Endpoint** — `/api/v1/ai/prompt/:mode` (prompt generation, ready for enhancement)
