<div align="center">

[<img src="https://avatars.githubusercontent.com/u/82473144?s=200" width="100" alt="Ghostfolio logo">](https://ghostfol.io)

# Ghostfolio + AI Finance Agent

**Open Source Wealth Management Software — Extended with an AI-Powered Financial Assistant**

[**Live Deployment**](https://ghostfolio-production-72a0.up.railway.app/) | [**Ghostfol.io**](https://ghostfol.io) | [**Live Demo**](https://ghostfol.io/en/demo) | [**FAQ**](https://ghostfol.io/en/faq)

[![Shield: License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-orange.svg)](https://www.gnu.org/licenses/agpl-3.0)

</div>

**Ghostfolio** is an open source wealth management software built with web technology. The application empowers busy people to keep track of stocks, ETFs or cryptocurrencies and make solid, data-driven investment decisions. The software is designed for personal use in continuous operation.

---

## AI Finance Agent (AgentForge Extension)

This fork extends Ghostfolio with a **domain-specific AI agent** for natural language financial queries. Built for the [Gauntlet AI](https://gauntlet.ai) AgentForge project (Week 2).

**Deployed at:** https://ghostfolio-production-72a0.up.railway.app/

### What It Does

Users can ask natural language questions about their financial data and receive coherent, data-driven responses. The agent retrieves real portfolio data, market prices, and benchmarks — then synthesizes them into actionable insights.

Example queries:

- "What's in my portfolio?"
- "What's the current price of AAPL and MSFT?"
- "How does my portfolio compare to the S&P 500?"

### Architecture

| Component       | Technology                              |
| --------------- | --------------------------------------- |
| Agent Framework | LangChain.js (TypeScript)               |
| LLM             | Claude Sonnet 4 via OpenRouter          |
| Observability   | LangSmith (project: `ghostfolio-agent`) |
| Backend         | NestJS (integrated into Ghostfolio API) |
| Database        | PostgreSQL 17 (Prisma ORM)              |
| Caching         | Redis 8                                 |
| Deployment      | Railway                                 |

### Tools (3)

| Tool                 | Purpose                                                                   |
| -------------------- | ------------------------------------------------------------------------- |
| `portfolio_analysis` | Retrieves user's portfolio holdings, allocations, and performance metrics |
| `market_data`        | Looks up current market prices for up to 10 symbols                       |
| `benchmark_compare`  | Lists benchmarks or compares portfolio performance vs. a benchmark        |

### Verification

- **Ticker Symbol Validation** — Post-response check that prevents the LLM from hallucinating fake ticker symbols by cross-referencing mentioned symbols against actual tool output data.

### Evaluation Framework

7 test cases covering happy paths, edge cases, safety boundaries, and multi-tool coordination. Run with:

```bash
npm run test:single -- apps/api/src/app/endpoints/agent/agent.eval.spec.ts
```

### Agent API Endpoint

```
POST /api/v1/agent/chat
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "message": "What's in my portfolio?",
  "conversationId": "optional-uuid-for-multi-turn"
}
```

### Chat UI

The AI agent includes a built-in chat interface. You must be logged in to access it.

| Environment          | URL                                                                  |
| -------------------- | -------------------------------------------------------------------- |
| **Local development** | `https://localhost:4200/en/ai-agent`                                |
| **Railway deployment** | `https://ghostfolio-production-72a0.up.railway.app/en/ai-agent`    |

> **Note:** The `/en/` prefix is the locale segment (English). It is required — navigating to just `/ai-agent` will not work. Replace `en` with another locale code (e.g., `de`, `fr`) if running in a different language.

The chat page is an authenticated route. Log in first (via _Get Started_ or the demo account if configured), then navigate to the URL above.

#### Quick Access from the Home Page

After logging in, you can reach the AI Agent directly from the home overview page:

- **Populated portfolio** (users with activities) — An "Ask the AI Agent" card appears below the performance metrics. It links directly to the chat page.
- **Empty portfolio** (welcome screen) — A 4th item in the onboarding checklist: "Talk to the AI Agent" with the description "Get personalized insights and ask questions about your investments."

Both entry points are guarded by the `accessAgentChat` permission and appear for users with ADMIN, USER, and DEMO roles.

### Try It Out — Example Commands

Once you're on the chat page, you can ask the agent natural language questions. Here are examples organized by category:

#### Portfolio Questions

- "What's in my portfolio?"
- "Show me my holdings"
- "How is my portfolio diversified?"
- "What's my performance this year?"
- "How much am I up or down?"
- "Tell me about my accounts"
- "What's my total net worth?"

You can also specify a time range: `1d`, `wtd`, `mtd`, `ytd`, `1y`, `5y`, or `max`.

#### Market Data / Price Quotes

- "What's the price of AAPL?"
- "Show me prices for MSFT, GOOGL, and NVDA" (up to 10 symbols at once)
- "What's Bitcoin trading at?"
- "Is the market open?"

#### Benchmark Comparisons

- "What benchmarks are available?"
- "How does my portfolio compare to the S&P 500?"
- "Am I beating the market?"
- "Compare my returns to Bitcoin over the last 5 years"

#### Combined / Multi-step Questions

The agent can chain tools together in a single query:

- "Show me my AAPL holding and its current market price"
- "What percentage of my portfolio is in tech, and how has it performed vs the S&P 500?"

#### What the Agent Will Not Do

- Execute trades or modify your portfolio
- Give specific financial advice ("Should I buy X?")
- Make price predictions ("Will BTC hit $100k?")
- Answer non-financial questions (medical, legal, etc.)

All responses include a disclaimer that the information is for educational purposes only and is not financial advice.

### Agent Environment Variables

| Variable                 | Description                                                        |
| ------------------------ | ------------------------------------------------------------------ |
| `OPENROUTER_API_KEY`     | Required. API key for OpenRouter LLM access.                       |
| `OPENROUTER_AGENT_MODEL` | Optional. Model ID (default: `anthropic/claude-sonnet-4`) |
| `LANGCHAIN_TRACING_V2`   | Set to `true` to enable LangSmith tracing                          |
| `LANGCHAIN_API_KEY`      | LangSmith API key for observability                                |
| `LANGCHAIN_PROJECT`      | LangSmith project name (default: `ghostfolio-agent`)               |

### Project Documents

| Document                 | Location                                       |
| ------------------------ | ---------------------------------------------- |
| MVP Requirements Mapping | `gauntlet_docs/mvp-requirements-mapping.md`    |
| Pre-Search Checklist     | `gauntlet_docs/PreSearch_Checklist_Finance.md` |
| Epics & Stories          | `gauntlet_docs/epics.md`                       |
| Architecture             | `gauntlet_docs/architecture.md`                |
| PRD                      | `gauntlet_docs/prd.md`                         |

---

<div align="center">

[<img src="./apps/client/src/assets/images/video-preview.jpg" width="600" alt="Preview image of the Ghostfolio video trailer">](https://www.youtube.com/watch?v=yY6ObSQVJZk)

</div>

## Ghostfolio Premium

Our official **[Ghostfolio Premium](https://ghostfol.io/en/pricing)** cloud offering is the easiest way to get started. Due to the time it saves, this will be the best option for most people. Revenue is used to cover operational costs for the hosting infrastructure and professional data providers, and to fund ongoing development.

If you prefer to run Ghostfolio on your own infrastructure, please find further instructions in the [Self-hosting](#self-hosting) section.

## Why Ghostfolio?

Ghostfolio is for you if you are...

- 💼 trading stocks, ETFs or cryptocurrencies on multiple platforms
- 🏦 pursuing a buy & hold strategy
- 🎯 interested in getting insights of your portfolio composition
- 👻 valuing privacy and data ownership
- 🧘 into minimalism
- 🧺 caring about diversifying your financial resources
- 🆓 interested in financial independence
- 🙅 saying no to spreadsheets
- 😎 still reading this list

## Features

- ✅ Create, update and delete transactions
- ✅ Multi account management
- ✅ Portfolio performance: Return on Average Investment (ROAI) for `Today`, `WTD`, `MTD`, `YTD`, `1Y`, `5Y`, `Max`
- ✅ Various charts
- ✅ Static analysis to identify potential risks in your portfolio
- ✅ Import and export transactions
- ✅ Dark Mode
- ✅ Zen Mode
- ✅ Progressive Web App (PWA) with a mobile-first design

<div align="center">

<img src="./apps/client/src/assets/images/screenshot.png" width="300" alt="Image of a phone showing the Ghostfolio app open">

</div>

## Technology Stack

Ghostfolio is a modern web application written in [TypeScript](https://www.typescriptlang.org) and organized as an [Nx](https://nx.dev) workspace.

### Backend

The backend is based on [NestJS](https://nestjs.com) using [PostgreSQL](https://www.postgresql.org) as a database together with [Prisma](https://www.prisma.io) and [Redis](https://redis.io) for caching.

### Frontend

The frontend is built with [Angular](https://angular.dev) and uses [Angular Material](https://material.angular.io) with utility classes from [Bootstrap](https://getbootstrap.com).

## Self-hosting

We provide official container images hosted on [Docker Hub](https://hub.docker.com/r/ghostfolio/ghostfolio) for `linux/amd64`, `linux/arm/v7` and `linux/arm64`.

<div align="center">

[<img src="./apps/client/src/assets/images/button-buy-me-a-coffee.png" width="150" alt="Buy me a coffee button"/>](https://www.buymeacoffee.com/ghostfolio)

</div>

### Supported Environment Variables

| Name                        | Type                  | Default Value         | Description                                                                                                                         |
| --------------------------- | --------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `ACCESS_TOKEN_SALT`         | `string`              |                       | A random string used as salt for access tokens                                                                                      |
| `API_KEY_COINGECKO_DEMO`    | `string` (optional)   |                       | The _CoinGecko_ Demo API key                                                                                                        |
| `API_KEY_COINGECKO_PRO`     | `string` (optional)   |                       | The _CoinGecko_ Pro API key                                                                                                         |
| `DATABASE_URL`              | `string`              |                       | The database connection URL, e.g. `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}?sslmode=prefer` |
| `ENABLE_FEATURE_AUTH_TOKEN` | `boolean` (optional)  | `true`                | Enables authentication via security token                                                                                           |
| `HOST`                      | `string` (optional)   | `0.0.0.0`             | The host where the Ghostfolio application will run on                                                                               |
| `JWT_SECRET_KEY`            | `string`              |                       | A random string used for _JSON Web Tokens_ (JWT)                                                                                    |
| `LOG_LEVELS`                | `string[]` (optional) |                       | The logging levels for the Ghostfolio application, e.g. `["debug","error","log","warn"]`                                            |
| `PORT`                      | `number` (optional)   | `3333`                | The port where the Ghostfolio application will run on                                                                               |
| `POSTGRES_DB`               | `string`              |                       | The name of the _PostgreSQL_ database                                                                                               |
| `POSTGRES_PASSWORD`         | `string`              |                       | The password of the _PostgreSQL_ database                                                                                           |
| `POSTGRES_USER`             | `string`              |                       | The user of the _PostgreSQL_ database                                                                                               |
| `REDIS_DB`                  | `number` (optional)   | `0`                   | The database index of _Redis_                                                                                                       |
| `REDIS_HOST`                | `string`              |                       | The host where _Redis_ is running                                                                                                   |
| `REDIS_PASSWORD`            | `string`              |                       | The password of _Redis_                                                                                                             |
| `REDIS_PORT`                | `number`              |                       | The port where _Redis_ is running                                                                                                   |
| `REQUEST_TIMEOUT`           | `number` (optional)   | `2000`                | The timeout of network requests to data providers in milliseconds                                                                   |
| `ROOT_URL`                  | `string` (optional)   | `http://0.0.0.0:3333` | The root URL of the Ghostfolio application, used for generating callback URLs and external links.                                   |

#### OpenID Connect OIDC (Experimental)

| Name                       | Type                  | Default Value                        | Description                                                                                          |
| -------------------------- | --------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `ENABLE_FEATURE_AUTH_OIDC` | `boolean` (optional)  | `false`                              | Enables authentication via _OpenID Connect_                                                          |
| `OIDC_AUTHORIZATION_URL`   | `string` (optional)   |                                      | Manual override for the OIDC authorization endpoint (falls back to the discovery from the issuer)    |
| `OIDC_CALLBACK_URL`        | `string` (optional)   | `${ROOT_URL}/api/auth/oidc/callback` | The OIDC callback URL                                                                                |
| `OIDC_CLIENT_ID`           | `string`              |                                      | The OIDC client ID                                                                                   |
| `OIDC_CLIENT_SECRET`       | `string`              |                                      | The OIDC client secret                                                                               |
| `OIDC_ISSUER`              | `string`              |                                      | The OIDC issuer URL, used to discover the OIDC configuration via `/.well-known/openid-configuration` |
| `OIDC_SCOPE`               | `string[]` (optional) | `["openid"]`                         | The OIDC scope to request, e.g. `["email","openid","profile"]`                                       |
| `OIDC_TOKEN_URL`           | `string` (optional)   |                                      | Manual override for the OIDC token endpoint (falls back to the discovery from the issuer)            |
| `OIDC_USER_INFO_URL`       | `string` (optional)   |                                      | Manual override for the OIDC user info endpoint (falls back to the discovery from the issuer)        |

### Run with Docker Compose

#### Prerequisites

- Basic knowledge of Docker
- Installation of [Docker](https://www.docker.com/products/docker-desktop)
- Create a local copy of this Git repository (clone)
- Copy the file `.env.example` to `.env` and populate it with your data (`cp .env.example .env`)

#### a. Run environment

Run the following command to start the Docker images from [Docker Hub](https://hub.docker.com/r/ghostfolio/ghostfolio):

```bash
docker compose -f docker/docker-compose.yml up -d
```

#### b. Build and run environment

Run the following commands to build and start the Docker images:

```bash
docker compose -f docker/docker-compose.build.yml build
docker compose -f docker/docker-compose.build.yml up -d
```

#### Setup

1. Open http://localhost:3333 in your browser
1. Create a new user via _Get Started_ (this first user will get the role `ADMIN`)

#### Demo Mode

Demo mode allows visitors to explore Ghostfolio with sample data without creating an account. When configured, a _Live Demo_ button appears on the landing page.

Demo mode is configured via the `Property` table in the database (key-value store), **not** via environment variables. You need to set two properties:

| Property Key      | Value                                      | Description                                                      |
| ----------------- | ------------------------------------------ | ---------------------------------------------------------------- |
| `DEMO_USER_ID`    | The `id` of the demo user (UUID)           | The user account whose portfolio will be shown in demo mode      |
| `DEMO_ACCOUNT_ID` | The `id` of the demo account (UUID)        | The account used when syncing demo activities                    |

**Steps to enable demo mode:**

1. Create a regular user account (this will be the demo user)
2. Add some sample activities to the demo user's portfolio
3. Insert the two properties into the database:
   ```sql
   INSERT INTO "Property" ("key", "value") VALUES ('DEMO_USER_ID', '"<USER_UUID>"');
   INSERT INTO "Property" ("key", "value") VALUES ('DEMO_ACCOUNT_ID', '"<ACCOUNT_UUID>"');
   ```
   **Note:** The value must be a JSON string (wrapped in double quotes inside single quotes).
4. Optionally, tag activities with the built-in demo tag (ID: `efa08cb3-9b9d-4974-ac68-db13a19c4874`) and use the admin _Sync Demo User Account_ action to refresh demo data

Once configured, the `/api/v1/info` endpoint will return a `demoAuthToken`, and the frontend landing page will show the demo access option. Visiting `/demo` will automatically sign in the visitor as the demo user in read-only mode.

#### Upgrade Version

1. Update the _Ghostfolio_ Docker image
   - Increase the version of the `ghostfolio/ghostfolio` Docker image in `docker/docker-compose.yml`
   - Run the following command if `ghostfolio:latest` is set:
     ```bash
     docker compose -f docker/docker-compose.yml pull
     ```

1. Run the following command to start the new Docker image:
   ```bash
   docker compose -f docker/docker-compose.yml up -d
   ```
   The container will automatically apply any required database schema migrations during startup.

### Home Server Systems (Community)

Ghostfolio is available for various home server systems, including [CasaOS](https://github.com/bigbeartechworld/big-bear-casaos), [Home Assistant](https://github.com/lildude/ha-addon-ghostfolio), [Runtipi](https://www.runtipi.io/docs/apps-available), [TrueCharts](https://truecharts.org/charts/stable/ghostfolio), [Umbrel](https://apps.umbrel.com/app/ghostfolio), and [Unraid](https://unraid.net/community/apps?q=ghostfolio).

## Development

For detailed information on the environment setup and development process, please refer to [DEVELOPMENT.md](./DEVELOPMENT.md).

## Public API

### Authorization: Bearer Token

Set the header for each request as follows:

```
"Authorization": "Bearer eyJh..."
```

You can get the _Bearer Token_ via `POST http://localhost:3333/api/v1/auth/anonymous` (Body: `{ "accessToken": "<INSERT_SECURITY_TOKEN_OF_ACCOUNT>" }`)

Deprecated: `GET http://localhost:3333/api/v1/auth/anonymous/<INSERT_SECURITY_TOKEN_OF_ACCOUNT>` or `curl -s http://localhost:3333/api/v1/auth/anonymous/<INSERT_SECURITY_TOKEN_OF_ACCOUNT>`.

### Health Check (experimental)

#### Request

`GET http://localhost:3333/api/v1/health`

**Info:** No Bearer Token is required for health check

#### Response

##### Success

`200 OK`

```
{
  "status": "OK"
}
```

### Import Activities

#### Prerequisites

[Bearer Token](#authorization-bearer-token) for authorization

#### Request

`POST http://localhost:3333/api/v1/import`

#### Body

```
{
  "activities": [
    {
      "currency": "USD",
      "dataSource": "YAHOO",
      "date": "2021-09-15T00:00:00.000Z",
      "fee": 19,
      "quantity": 5,
      "symbol": "MSFT",
      "type": "BUY",
      "unitPrice": 298.58
    }
  ]
}
```

| Field        | Type                | Description                                                         |
| ------------ | ------------------- | ------------------------------------------------------------------- |
| `accountId`  | `string` (optional) | Id of the account                                                   |
| `comment`    | `string` (optional) | Comment of the activity                                             |
| `currency`   | `string`            | `CHF` \| `EUR` \| `USD` etc.                                        |
| `dataSource` | `string`            | `COINGECKO` \| `GHOSTFOLIO` [^1] \| `MANUAL` \| `YAHOO`             |
| `date`       | `string`            | Date in the format `ISO-8601`                                       |
| `fee`        | `number`            | Fee of the activity                                                 |
| `quantity`   | `number`            | Quantity of the activity                                            |
| `symbol`     | `string`            | Symbol of the activity (suitable for `dataSource`)                  |
| `type`       | `string`            | `BUY` \| `DIVIDEND` \| `FEE` \| `INTEREST` \| `LIABILITY` \| `SELL` |
| `unitPrice`  | `number`            | Price per unit of the activity                                      |

#### Response

##### Success

`201 Created`

##### Error

`400 Bad Request`

```
{
  "error": "Bad Request",
  "message": [
    "activities.1 is a duplicate activity"
  ]
}
```

### Portfolio (experimental)

#### Prerequisites

Grant access of type _Public_ in the _Access_ tab of _My Ghostfolio_.

#### Request

`GET http://localhost:3333/api/v1/public/<INSERT_ACCESS_ID>/portfolio`

**Info:** No Bearer Token is required for authorization

#### Response

##### Success

```
{
  "performance": {
    "1d": {
      "relativeChange": 0 // normalized from -1 to 1
    };
    "ytd": {
      "relativeChange": 0 // normalized from -1 to 1
    },
    "max": {
      "relativeChange": 0 // normalized from -1 to 1
    }
  }
}
```

## Community Projects

Discover a variety of community projects for Ghostfolio: https://github.com/topics/ghostfolio

Are you building your own project? Add the `ghostfolio` topic to your _GitHub_ repository to get listed as well. [Learn more →](https://docs.github.com/en/articles/classifying-your-repository-with-topics)

## Contributing

Ghostfolio is **100% free** and **open source**. We encourage and support an active and healthy community that accepts contributions from the public - including you.

Not sure what to work on? We have [some ideas](https://github.com/ghostfolio/ghostfolio/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22%20no%3Aassignee), even for [newcomers](https://github.com/ghostfolio/ghostfolio/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22%20no%3Aassignee). Please join the Ghostfolio [Slack](https://join.slack.com/t/ghostfolio/shared_invite/zt-vsaan64h-F_I0fEo5M0P88lP9ibCxFg) channel or post to [@ghostfolio\_](https://x.com/ghostfolio_) on _X_. We would love to hear from you.

If you like to support this project, become a [**Sponsor**](https://github.com/sponsors/ghostfolio), get [**Ghostfolio Premium**](https://ghostfol.io/en/pricing) or [**Buy me a coffee**](https://www.buymeacoffee.com/ghostfolio).

## Sponsors

<div align="center">
  <a href="https://www.testmuai.com?utm_medium=sponsor&utm_source=ghostfolio" target="_blank" title="TestMu AI - AI Powered Testing Tool">
    <img alt="TestMu AI Logo" height="45" src="https://assets.testmuai.com/resources/images/logos/logo.svg" />
  </a>
</div>

## Analytics

![Alt](https://repobeats.axiom.co/api/embed/281a80b2d0c4af1162866c24c803f1f18e5ed60e.svg 'Repobeats analytics image')

## License

© 2021 - 2026 [Ghostfolio](https://ghostfol.io)

Licensed under the [AGPLv3 License](https://www.gnu.org/licenses/agpl-3.0.html).

[^1]: Available with [**Ghostfolio Premium**](https://ghostfol.io/en/pricing).
