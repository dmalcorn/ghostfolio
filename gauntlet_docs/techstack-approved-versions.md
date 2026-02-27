# Tech Stack Approved Versions

_Quick reference for AI agents and developers. Do NOT upgrade any dependency without explicit approval._

**Source of truth:** `package.json` at Ghostfolio v2.242.0
**Last verified:** 2026-02-24
**Architecture doc:** `gauntlet_docs/architecture.md`

---

## Runtime & Infrastructure

| Component  | Version     | Notes                                |
| ---------- | ----------- | ------------------------------------ |
| Node.js    | >= 22.18.0  | Enforced in `engines` field          |
| PostgreSQL | 17 (Alpine) | `postgres:17-alpine` in devcontainer |
| Redis      | 8 (Alpine)  | `redis:8-alpine` in devcontainer     |
| TypeScript | 5.9.2       |                                      |
| Nx         | 22.4.5      | Monorepo build system                |

## Backend — NestJS (API)

| Package                    | Version | Notes         |
| -------------------------- | ------- | ------------- |
| `@nestjs/common`           | 11.1.8  |               |
| `@nestjs/core`             | 11.1.8  |               |
| `@nestjs/platform-express` | 11.1.8  |               |
| `@nestjs/config`           | 4.0.2   |               |
| `@nestjs/jwt`              | 11.0.1  |               |
| `@nestjs/passport`         | 11.0.5  |               |
| `@nestjs/bull`             | 11.0.4  |               |
| `@nestjs/cache-manager`    | 3.0.1   |               |
| `@nestjs/event-emitter`    | 3.0.1   |               |
| `@nestjs/schedule`         | 6.0.1   |               |
| `@nestjs/serve-static`     | 5.0.4   |               |
| `@nestjs/testing`          | 11.1.8  | devDependency |
| `@nestjs/schematics`       | 11.0.9  | devDependency |

## ORM & Database

| Package          | Version | Notes                                      |
| ---------------- | ------- | ------------------------------------------ |
| `prisma`         | 6.19.0  | **LOCKED — Do NOT upgrade to v7** (ADR-11) |
| `@prisma/client` | 6.19.0  | Must match `prisma` version                |

## Frontend — Angular (Client)

| Package                 | Version | Notes                                     |
| ----------------------- | ------- | ----------------------------------------- |
| `@angular/core`         | 21.1.1  | All `@angular/*` packages at this version |
| `@angular/cdk`          | 21.1.1  |                                           |
| `@angular/material`     | 21.1.1  |                                           |
| `@angular/cli`          | 21.1.1  | devDependency                             |
| `@angular/compiler-cli` | 21.1.1  | devDependency                             |
| `@ionic/angular`        | 8.7.8   |                                           |

## Queue & Cache

| Package       | Version | Notes                                          |
| ------------- | ------- | ---------------------------------------------- |
| `bull`        | 4.16.5  | Job queue (data-gathering, portfolio-snapshot) |
| `@keyv/redis` | 4.4.0   |                                                |

## Agent — LangChain (New for AgentForge)

| Package                | Version | Notes                              |
| ---------------------- | ------- | ---------------------------------- |
| `langchain`            | 1.2.28  | Core agent framework               |
| `@langchain/core`      | 1.1.29  | Base abstractions                  |
| `@langchain/openai`    | 1.2.11  | ChatOpenAI (OpenRouter-compatible) |
| `@langchain/community` | 1.1.18  | Redis memory, integrations         |
| `langsmith`            | 0.5.7   | Tracing/observability              |

> Pinned to exact versions after Railway deploy failure caused by `@langchain/openai` / `@langchain/core` version mismatch (2026-02-27).

## Auth & Security

| Package                   | Version | Notes |
| ------------------------- | ------- | ----- |
| `passport`                | 0.7.0   |       |
| `passport-jwt`            | 4.0.1   |       |
| `passport-google-oauth20` | 2.0.0   |       |
| `passport-headerapikey`   | 1.2.2   |       |
| `passport-openidconnect`  | 0.1.2   |       |
| `@simplewebauthn/browser` | 13.2.2  |       |
| `@simplewebauthn/server`  | 13.2.2  |       |
| `helmet`                  | 7.0.0   |       |

## Shared Libraries

| Package             | Version | Notes                  |
| ------------------- | ------- | ---------------------- |
| `rxjs`              | 7.8.1   |                        |
| `zone.js`           | 0.16.0  |                        |
| `date-fns`          | 4.1.0   |                        |
| `@date-fns/utc`     | 2.1.1   |                        |
| `lodash`            | 4.17.23 |                        |
| `big.js`            | 7.0.1   | Financial calculations |
| `class-transformer` | 0.5.1   |                        |
| `class-validator`   | 0.14.3  |                        |

## Charts & Visualization

| Package                     | Version | Notes           |
| --------------------------- | ------- | --------------- |
| `chart.js`                  | 4.5.1   |                 |
| `chartjs-adapter-date-fns`  | 3.0.0   |                 |
| `chartjs-chart-treemap`     | 3.1.0   |                 |
| `chartjs-plugin-annotation` | 3.1.0   |                 |
| `chartjs-plugin-datalabels` | 2.2.0   |                 |
| `svgmap`                    | 2.14.0  | World map chart |

## Data Providers & Integrations

| Package              | Version | Notes                           |
| -------------------- | ------- | ------------------------------- |
| `yahoo-finance2`     | 3.13.0  | Market data provider            |
| `alphavantage`       | 2.2.0   | Market data provider            |
| `cheerio`            | 1.2.0   | Web scraping for data providers |
| `google-spreadsheet` | 3.2.0   |                                 |
| `twitter-api-v2`     | 1.29.0  |                                 |
| `stripe`             | 20.3.0  | Subscription billing            |

## Testing

| Package                  | Version | Notes           |
| ------------------------ | ------- | --------------- |
| `jest`                   | 30.2.0  |                 |
| `@types/jest`            | 30.0.0  |                 |
| `jest-environment-jsdom` | 30.2.0  | Client/UI tests |
| `jest-preset-angular`    | 16.0.0  |                 |
| `ts-jest`                | 29.4.0  |                 |

## Build & Dev Tooling

| Package     | Version | Notes                                       |
| ----------- | ------- | ------------------------------------------- |
| `prettier`  | 3.8.1   |                                             |
| `eslint`    | 9.35.0  |                                             |
| `husky`     | 9.1.7   | Git hooks                                   |
| `storybook` | 10.1.10 | All `@storybook/*` packages at this version |
| `tslib`     | 2.8.1   |                                             |
| `ts-node`   | 10.9.2  |                                             |

## Miscellaneous

| Package                         | Version        | Notes                                        |
| ------------------------------- | -------------- | -------------------------------------------- |
| `@codewithdan/observable-store` | 2.2.15         | Client-side state                            |
| `@internationalized/number`     | 3.6.5          |                                              |
| `@openrouter/ai-sdk-provider`   | 0.7.2          |                                              |
| `ai`                            | 4.3.16         | Vercel AI SDK (existing, not used for agent) |
| `bootstrap`                     | 4.6.2          |                                              |
| `color`                         | 5.0.3          |                                              |
| `countries-and-timezones`       | 3.8.0          |                                              |
| `countries-list`                | 3.2.2          |                                              |
| `countup.js`                    | 2.9.0          |                                              |
| `dotenv`                        | 17.2.3         |                                              |
| `envalid`                       | 8.1.1          |                                              |
| `fast-redact`                   | 3.5.0          |                                              |
| `fuse.js`                       | 7.1.0          |                                              |
| `http-status-codes`             | 2.3.0          |                                              |
| `ionicons`                      | 8.0.13         |                                              |
| `jsonpath`                      | 1.1.1          |                                              |
| `marked`                        | 17.0.2         |                                              |
| `ms`                            | 3.0.0-canary.1 |                                              |
| `ng-extract-i18n-merge`         | 3.2.1          |                                              |
| `ngx-device-detector`           | 11.0.0         |                                              |
| `ngx-markdown`                  | 21.1.0         |                                              |
| `ngx-skeleton-loader`           | 12.0.0         |                                              |
| `open-color`                    | 1.9.1          |                                              |
| `papaparse`                     | 5.3.1          | Activity import CSV parser                   |
| `reflect-metadata`              | 0.2.2          |                                              |
| `tablemark`                     | 4.1.0          |                                              |

---

## Rules for Agents

1. **Do NOT run `npm update` or upgrade any package** unless explicitly instructed.
2. **Prisma must stay at 6.x** — see ADR-11 in the architecture document.
3. **All `@angular/*` packages must stay in lockstep** at the same version.
4. **All `@nestjs/*` packages must stay in lockstep** at the same version.
5. **All `@nx/*` packages must stay in lockstep** at the same version.
6. When adding a **new** dependency, document it here with its version before committing.
7. Use `npm install <package>@<version>` with an explicit version, never just `npm install <package>`.
8. If a LangChain package needs updating for a bug fix, update all `langchain`/`@langchain/*` packages together.
