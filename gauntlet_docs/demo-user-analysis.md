# Demo User Analysis for AI Agent Evaluation

**Date:** 2026-02-26
**Status:** Analysis only — not yet implemented (preserving OpenRouter credits for evaluators)

## Goal

Make it seamless for an evaluator to visit the deployed site and try the AI agent without account setup friction.

## Current Demo Flow

Most of the plumbing already exists. The `DEMO` role already has `accessAgentChat` permission (`libs/common/src/lib/permissions.ts:115`). The end-to-end flow:

1. Visitor lands on `/` — backend serves `/api/v1/info` with a `demoAuthToken` JWT
2. Visitor clicks **"Live Demo"** button — navigates to `/demo`
3. `demo-page.component.ts` saves the JWT to storage, redirects to `/`
4. Visitor is now authenticated as the demo user
5. They navigate to `/ai-agent` — `AuthGuard` passes, `accessAgentChat` permission check passes — chat works

### Key Files

| File                                                    | Purpose                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------- |
| `apps/api/src/services/demo/demo.service.ts`            | Demo user account syncing                                     |
| `apps/api/src/app/info/info.service.ts`                 | Provides `demoAuthToken` in API response                      |
| `apps/client/src/app/pages/demo/demo-page.component.ts` | Demo login page logic                                         |
| `libs/common/src/lib/permissions.ts`                    | Defines DEMO role (6 permissions including `accessAgentChat`) |
| `apps/api/src/app/endpoints/agent/agent.controller.ts`  | AI agent endpoint with `accessAgentChat` guard                |
| `prisma/schema.prisma`                                  | DEMO role enum (line 343)                                     |
| `libs/common/src/lib/routes/routes.ts`                  | Demo route definition                                         |
| `libs/common/src/lib/config.ts`                         | Demo-related constants (`PROPERTY_DEMO_USER_ID`, etc.)        |

### Demo User Permissions (DEMO role)

```
accessAgentChat
accessAssistant
accessHoldingsChart
createUserAccount
readAiPrompt
readWatchlist
```

### Demo User Restrictions

- Can only change `benchmark` or `dateRange` settings (all other setting changes blocked)
- Cannot create API keys, enable data providers, read market data of markets, or report data glitches

## Friction Points for Evaluators

### 1. Demo user must exist in the database

The demo token is generated only if `PROPERTY_DEMO_USER_ID` is set in the `Property` table. If not configured in Railway, the "Live Demo" button won't appear. Required setup:

- Create a demo user record in the database
- Set `DEMO_USER_ID` and `DEMO_ACCOUNT_ID` in the `Property` table
- Populate demo portfolio data (activities tagged with `TAG_ID_DEMO`: `efa08cb3-9b9d-4974-ac68-db13a19c4874`)

### 2. No direct link to AI agent after demo login

After clicking "Live Demo", the user lands on the home/portfolio page. They must find and navigate to `/ai-agent` themselves — no obvious signpost.

### 3. Demo user portfolio data

The AI agent queries the authenticated user's portfolio. If the demo account has no holdings/activities, agent responses will be empty/unhelpful. The demo account needs realistic sample data (diverse holdings, multiple accounts) for the agent to demonstrate its capabilities.

### 4. API key for LLM provider

The agent needs `OPENAI_API_KEY` (OpenRouter) configured in the Railway environment. Without it, the agent endpoint returns 503.

## Recommended Changes (If Implementing)

| Priority | Change                                                | Effort      | Details                                                                                                    |
| -------- | ----------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------- |
| **Must** | Ensure demo user + portfolio data exist in Railway DB | Config/seed | Create user, account, and tagged activities                                                                |
| **Must** | Ensure `OPENAI_API_KEY` is set in Railway env         | Config      | Already done for personal use; verify it works for demo user                                               |
| **Nice** | Redirect demo login to `/ai-agent` instead of `/`     | ~5 lines    | In `demo-page.component.ts`, change `this.router.navigate(['/'])` to `this.router.navigate(['/ai-agent'])` |
| **Nice** | Add "AI Agent" link in sidebar/header for demo users  | Small       | Ensures discoverability even if they navigate away                                                         |
| **Nice** | Add helper text on AI agent page                      | Small       | e.g., "Try asking about your demo portfolio" for demo users                                                |

## Why Not Implementing Now

The AI agent uses OpenRouter credits per query. Enabling the demo user publicly would allow anyone to consume credits. Until evaluators need it, holding off preserves the budget for when it matters most. This analysis ensures rapid implementation if/when requested.
