# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ghostfolio is an open-source wealth management software for tracking stocks, ETFs, and cryptocurrencies. It is a full-stack TypeScript monorepo managed by **Nx**, with a **NestJS** API backend, **Angular** frontend, **PostgreSQL** database (via **Prisma** ORM), and **Redis** for caching/queues.

## Common Commands

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Start API (hot reload) | `npm run start:server` |
| Start client | `npm run start:client` |
| Run all tests | `npm test` |
| Test API only | `npm run test:api` |
| Test UI lib only | `npm run test:ui` |
| Test common lib | `npm run test:common` |
| Run single test file | `npm run test:single -- <path>` |
| Lint all projects | `npm run lint` |
| Format check | `npm run format:check` |
| Format fix | `npm run format:write` |
| Production build | `npm run build:production` |
| DB push schema | `npm run database:push` |
| DB setup (push + seed) | `npm run database:setup` |
| DB migration | `npm run prisma migrate dev --name <name>` |
| DB GUI (Prisma Studio) | `npm run database:gui` |
| Generate Prisma types | `npm run database:generate-typings` |
| Storybook | `npm run start:storybook` |
| Extract i18n locales | `npm run extract-locales` |
| **Local CI (full)** | `scripts/ci-local.sh` |

The `test:single` script runs via `nx run api:test --test-file <filename>`. Tests require environment variables loaded from `.env.example` (the `npm test` script does this automatically via `dotenv-cli`).

## Project Structure

```
apps/
  api/              # NestJS backend (REST API, port 3333)
  client/           # Angular frontend (SPA, port 4200 via HTTPS)
libs/
  common/           # Shared DTOs, interfaces, types, helpers (framework-agnostic)
  ui/               # Angular component library (40+ components, Storybook)
prisma/             # Schema, migrations, seed
docker/             # Docker Compose files (dev, prod, build)
scripts/            # CI and utility scripts
```

**Path aliases** (defined in `tsconfig.base.json`):
- `@ghostfolio/api/*` → `apps/api/src/*`
- `@ghostfolio/client/*` → `apps/client/src/app/*`
- `@ghostfolio/common/*` → `libs/common/src/lib/*`
- `@ghostfolio/ui/*` → `libs/ui/src/lib/*`

## Architecture

### API (`apps/api/src/`)

NestJS application with URI-based versioning (`/api/v1/...`), CORS enabled, global validation pipes (`ValidationPipe` with whitelist + transform), and 10MB body limit for activity imports.

**Module layout** (`apps/api/src/app/`):
- **Domain modules**: `access/`, `account/`, `admin/`, `auth/`, `order/`, `portfolio/`, `symbol/`, `user/`, `subscription/`, etc. Each follows the pattern: `{feature}.module.ts`, `{feature}.controller.ts`, `{feature}.service.ts`
- **Endpoints** (`endpoints/`): Standalone route handlers for `ai/`, `api-keys/`, `assets/`, `benchmarks/`, `data-providers/`, `market-data/`, `platforms/`, `public/`, `tags/`, `watchlist/`
- **Services** (`apps/api/src/services/`): Cross-cutting concerns — `configuration/`, `cron/`, `data-provider/`, `exchange-rate-data/`, `market-data/`, `prisma/`, `queues/` (Bull queues for data-gathering and portfolio-snapshot), `property/`, `tag/`

### Client (`apps/client/src/app/`)

Angular 21 standalone component architecture with lazy-loaded routes. Routes are defined centrally in `@ghostfolio/common/routes/routes` and split into `publicRoutes` and `internalRoutes` (protected by `AuthGuard`).

**Key directories**:
- `pages/`: Feature pages, each with its own `{page}-page.routes.ts` for lazy loading
- `components/`: Shared app-level components (header, footer, dialogs)
- `core/`: `auth.guard.ts`, `auth.interceptor.ts` (adds JWT to requests), `http-response.interceptor.ts`
- `services/`: `user/user.service.ts` (uses `ObservableStore` for client-side state), `cache.service.ts`, `token-storage.service.ts`

Client is served via HTTPS at `https://localhost:4200/en`. To change language, modify the `--configuration=development-en` flag in the `start:client` script (e.g., `development-de`).

### Common Library (`libs/common/src/lib/`)

Framework-agnostic shared code used by both API and client:
- `config.ts`: Global constants (colors, queue settings, TTL values, data sources, asset classes)
- `permissions.ts`: Role-based permission system (used with `without()` in `UserService` for feature flags)
- `helper.ts`: Utility functions (financial calculations, transformations)
- `dtos/`: API request/response contracts
- `interfaces/`: Domain model types (Portfolio, User, Account, Holding, etc.)
- `routes/`: Centralized route definitions shared between frontend routing and navigation
- `types/`: Shared type definitions (date-range, granularity, holding-type, etc.)

### UI Library (`libs/ui/src/lib/`)

40+ reusable Angular components with Storybook stories:
- Data tables: `accounts-table/`, `activities-table/`, `holdings-table/`
- Charts: `line-chart/`, `portfolio-proportion-chart/`, `treemap-chart/`, `world-map-chart/`
- Selectors: `currency-selector/`, `symbol-autocomplete/`, `tags-selector/`

## Code Conventions

### Style (Prettier + EditorConfig)
- 2-space indentation, single quotes, no trailing commas, 80-char print width
- Unix line endings (LF), UTF-8
- Import order enforced by `@trivago/prettier-plugin-sort-imports`:
  1. `@ghostfolio/*` imports
  2. Third-party imports
  3. Relative imports
- HTML attribute ordering via `prettier-plugin-organize-attributes` (Angular structural directives, inputs, two-way bindings, outputs)

### Naming
- **API modules**: `{feature}.controller.ts`, `{feature}.service.ts`, `{feature}.module.ts`
- **Client components**: `{feature}.component.ts`, `.html`, `.scss` — selector prefix: `gf-`
- **Tests**: `{filename}.spec.ts` (co-located with source)
- **Stories**: `{filename}.stories.ts`

### TypeScript
- Strict mode is **off**, but `noUnusedLocals` and `noUnusedParameters` are enforced
- Target: ES2015, module resolution: bundler

### Experimental Features
- **Backend**: Remove permission in `UserService` using `without()`
- **Frontend**: Guard with `@if (user?.settings?.isExperimentalFeatures) {}` in templates

## Database (Prisma + PostgreSQL)

- Schema: `prisma/schema.prisma`
- Key models: `User`, `Account`, `Order`, `SymbolProfile`, `MarketData`, `Access`, `Tag`, `AccountBalance`, `Platform`, `Subscription`
- Key enums: `Type` (BUY, SELL, DIVIDEND, FEE, INTEREST, LIABILITY), `DataSource`, `AssetClass`, `Role` (ADMIN, BASIC, PREMIUM)
- After changing `schema.prisma`, run `npm run database:push` to sync (prototyping) or `npm run prisma migrate dev --name <name>` to create a migration

## Testing

- **Framework**: Jest 30
- **API tests**: Node environment, ts-jest
- **Client/UI tests**: jsdom environment, jest-preset-angular
- Run a single test: `npm run test:single -- <path>`
- Tests require env vars from `.env.example` — the `npm test` command loads these automatically

## Git Hooks (Husky)

- **pre-commit**: Runs `affected:lint` (against main) and `format:check` on uncommitted files
- **pre-push**: Runs `scripts/ci-local.sh` — full pipeline: lint, format check, test, production build

## AgentForge Project Context

This Ghostfolio fork is being extended with an AI agent for the **AgentForge** training project (Gauntlet AI, Week 2). Key project documents live in `gauntlet_docs/`.

- **Sprint Checklist:** `gauntlet_docs/agentforge-sprint-checklist.md` — the master checklist for all tasks, deadlines, and progress. Check this FIRST when starting a new session to understand where things stand and what to do next.
- **Project Requirements:** `gauntlet_docs/G4 Week 2 - AgentForge.pdf`
- **Pre-Search Checklist:** `gauntlet_docs/PreSearch_Checklist_Finance.md`
- **Decision Document:** `gauntlet_docs/Decision.md`
- **Prisma Analysis:** `gauntlet_docs/prisma-upgrade-analysis.md`

### Key Technical Decisions

- **Agent Framework:** LangChain.js (TypeScript) — NOT Vercel AI SDK
- **Observability:** LangSmith (already configured from previous project)
- **Deployment:** Railway
- **MVP Tools (3):** portfolio_analysis, market_data, benchmark_compare
- **Stay on Prisma 6** (do not upgrade to Prisma 7)
- **Agent Teams enabled** for parallel work in Phases 2, 4, and 5. **Read `gauntlet_docs/agent-teams-reference.md` before using.** Agent Teams is NOT the same as subagents — see the reference for critical differences and rules.
- **Scoped brownfield documentation:** See `gauntlet_docs/documentation-approach.md` for the documentation strategy.

## Prompt Logging

**IMPORTANT: All AI agents must follow these prompt logging conventions automatically.**

### Development Prompt Logs (Conversations with AI Assistants)

Log all significant interactions with AI assistants (Claude Code, BMAD agents, etc.) during development.

- **Location:** `gauntlet_docs/dev-prompts/`
- **Naming:** `dev-prompts-YYYY-MM-DD.md` (one file per day, e.g., `dev-prompts-2026-02-23.md`)
- **Auto-logging behavior:** At the end of each significant conversation or task completion, **append** a summary entry to today's dev prompt log file. If the file does not yet exist for today's date, create it with a `# Development Prompt Log — YYYY-MM-DD` header, then append. **NEVER overwrite or recreate an existing log file** — always append to the end.
- **Entry format:**
  ```
  ### Prompt N — Short Title
  **User:** Brief summary of what was asked
  **Agent:** Brief summary of what was done/decided/produced
  **Artifacts:** List any files created or modified
  ---
  ```
- **What to log:** Decisions made, analysis performed, code generated, documents created, significant troubleshooting. Do NOT log trivial follow-ups or clarifications.
- **Historical log:** Sessions prior to 2026-02-23 were merged into `gauntlet_docs/dev-prompts/dev-prompts-2026-02-23.md` (Sessions 1-2). There is no separate archive file.

### Agent Runtime Prompt Logs (Built into the AI Agent)

The AI agent's runtime prompts (user queries, LLM reasoning, tool calls, responses) are captured automatically by **LangSmith** tracing. No manual file logging is needed for agent runtime prompts.

- LangSmith project: `ghostfolio-agent`
- Environment variables: `LANGCHAIN_TRACING_V2=true`, `LANGCHAIN_API_KEY`, `LANGCHAIN_PROJECT`

## Timezone

The project owner (Diane) is in **Mountain Time (America/Denver)**. When creating or naming date-stamped files (e.g., `dev-prompts-YYYY-MM-DD.md`), always use the current date in Mountain Time, not UTC. This applies to all timestamps in filenames, frontmatter, and log entries.

## Environment Setup

- Node.js >= 22.18.0
- Copy `.env.dev` to `.env` and fill in passwords/secrets
- Dev services: `docker compose -f docker/docker-compose.dev.yml up -d` (PostgreSQL + Redis)
- SSL: Generate `localhost.cert` and `localhost.pem` in `apps/client/` for HTTPS dev server
- `NX_ADD_PLUGINS=false` is set in `.env.dev` to disable Nx inferred tasks
