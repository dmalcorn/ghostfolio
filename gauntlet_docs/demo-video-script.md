# Demo Video Script — Ghostfolio AI Finance Agent

**Target Duration:** 3-5 minutes
**Recording Tool:** Screen capture (e.g., OBS, Loom, QuickTime)
**Prerequisites:** Ghostfolio running locally with seeded portfolio data, agent API active

---

## Pre-Recording Checklist

- [ ] Ghostfolio server running (`npm run start:server`)
- [ ] Ghostfolio client running (`npm run start:client`)
- [ ] Navigate to `https://localhost:4200/en` and log in
- [ ] Verify seed portfolio has holdings visible in Portfolio page
- [ ] Test each demo query once before recording to confirm responses
- [ ] LangSmith dashboard open in a separate browser tab (https://smith.langchain.com)
- [ ] Terminal ready for eval suite run
- [ ] Clean browser — no distracting tabs or notifications

---

## Script

### [0:00 - 0:30] Introduction

**[Show: Ghostfolio portfolio dashboard]**

> "This is Ghostfolio — an open-source wealth management platform for tracking stocks, ETFs, and crypto. For AgentForge, I built an AI agent that lets users ask natural language questions about their financial data and get verified, data-grounded answers."

**[Show: Navigate to /ai-agent chat page]**

> "Here's the chat interface. Let me show you how it works."

---

### [0:30 - 1:30] Natural Language Queries & Tool Execution

**[Type or click example prompt: "What's in my portfolio?"]**

> "When I ask 'What's in my portfolio?', the agent selects the `portfolio_analysis` tool, queries the user's real Ghostfolio data through the existing Portfolio Service, and synthesizes a response."

**[Highlight: tool call badge in the response showing `portfolio_analysis` was called]**

> "You can see the tool call details here — the agent shows which tools it used and what data it retrieved."

**[Type: "What's the current price of AAPL?"]**

> "Market data queries use the `market_data` tool, which wraps Ghostfolio's data provider service — the same source the main app uses for real-time quotes."

**[Highlight: markdown-formatted response with price data]**

---

### [1:30 - 2:30] Multi-Tool & Multi-Turn Conversation

**[Type: "Compare my portfolio to the S&P 500"]**

> "This query chains two tools — `portfolio_analysis` to get the portfolio data, then `benchmark_compare` to fetch S&P 500 performance and calculate the comparison."

**[Highlight: multiple tool call badges in the response]**

**[Type follow-up: "How about compared to NASDAQ?"]**

> "The agent maintains conversation context across turns. It remembers we're talking about portfolio comparisons and adjusts — I didn't need to re-explain the context."

**[Highlight: response references prior comparison naturally]**

> "Conversation history is persisted in Redis with a 24-hour TTL, so context survives server restarts."

---

### [2:30 - 3:30] Verification & Confidence

**[Point out verification badges on previous responses]**

> "Every response runs through a verification pipeline. There are four types: ticker symbol validation confirms all mentioned symbols actually exist, numerical cross-checks verify allocations sum correctly, data freshness flags stale market data, and confidence scoring aggregates everything into a 0-to-100 score."

**[If a warning is visible, highlight it]**

> "When confidence drops below 70, the user sees a warning. This is critical for a finance domain — we never want users making decisions based on hallucinated data."

**[Type: "What's the price of XYZFAKE?"]**

> "And here's how it handles edge cases gracefully — an unknown ticker gets a helpful response, not a crash."

---

### [3:30 - 4:15] Evaluation Results

**[Switch to terminal]**

> "The agent is backed by a systematic eval framework — 66 test cases across four categories."

**[Show eval results — either run the suite or display saved results]**

```
Category        | Cases | Passed | Rate
----------------|-------|--------|------
Happy Path      |    23 |     23 | 100%
Edge Case       |    12 |     12 | 100%
Adversarial     |    12 |     12 | 100%
Multi-Step      |    12 |     12 | 100%
----------------|-------|--------|------
Total           |    66 |     66 | 100%
```

> "100% pass rate. The eval covers happy path queries, edge cases like unknown tickers and missing data, adversarial inputs like prompt injection attempts, and multi-step queries that require chaining 2-3 tools together."

---

### [4:15 - 4:45] Observability Dashboard

**[Switch to LangSmith dashboard in browser]**

> "Every request is traced in LangSmith. You can see the full chain — the LLM call, tool selections, tool execution results, and verification outcomes."

**[Click into a specific trace]**

> "For each request we track token usage, latency breakdown — how much time was spent in the LLM versus tool execution versus verification — and cost per query. Trace sanitization ensures no sensitive portfolio data leaks into the observability layer."

---

### [4:45 - 5:00] Wrap-up

**[Show: chat UI one more time]**

> "To summarize: 5 functional tools wrapping real Ghostfolio services, 66 eval test cases at 100% pass rate, 4 verification types with confidence scoring, full LangSmith observability, and a browser-based chat UI — all built in one week for AgentForge."

> "The agent is built with LangChain.js, deployed on Railway, and fully integrated into the existing open-source Ghostfolio codebase."

**[End screen]**

---

## Social Post Template

### Option A: X (Twitter)

> Built an AI finance agent for @GhostfolioApp in one week for @GauntletAI's AgentForge challenge.
>
> 5 tools, 66 eval test cases (100% pass rate), 4 verification types, LangSmith observability, and a chat UI — all integrated into an open-source wealth management platform.
>
> LangChain.js + NestJS + Claude Sonnet 4
>
> #AgentForge #AI #OpenSource

### Option B: LinkedIn

> Excited to share my AgentForge project from Gauntlet AI — an AI finance agent built into Ghostfolio, an open-source wealth management platform.
>
> In one week, I integrated:
>
> - 5 LangChain.js tools wrapping real financial services
> - 66 evaluation test cases with 100% pass rate
> - 4 verification types (ticker validation, numerical cross-check, data freshness, confidence scoring)
> - Full LangSmith observability with trace sanitization
> - Browser-based chat UI with accessibility features
>
> Built with TypeScript, NestJS, Angular, Claude Sonnet 4, and deployed on Railway.
>
> @GauntletAI #AgentForge #AI #OpenSource #FinTech

---

## Production Notes

- **Pacing:** Speak at a natural pace. Pause after each demo query to let the response load.
- **Errors:** If a query fails during recording, keep going — it demonstrates real error handling.
- **Window size:** Use a browser window that shows the full chat UI without scrolling.
- **Font size:** Increase browser zoom to 125% for terminal and chat readability.
- **Audio:** Use a quiet room. External mic recommended over laptop mic.
- **Length:** Aim for 4 minutes. Better slightly under 5 than over.
