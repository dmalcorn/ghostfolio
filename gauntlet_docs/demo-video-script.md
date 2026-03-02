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

### [0:00 - 0:25] Introduction

**[Show: Ghostfolio portfolio dashboard]**

> "This is Ghostfolio — an open-source wealth management platform for tracking stocks, ETFs, and crypto. For AgentForge, I built an AI agent that lets users ask natural language questions about their financial data and get verified, data-grounded answers."

**[Show: Navigate to /ai-agent chat page]**

> "Here's the chat interface. Let me walk through all five tools."

---

### [0:25 - 1:00] Tool 1: portfolio_analysis

**[Type or click example prompt: "What's in my portfolio?"]**

> "When I ask 'What's in my portfolio?', the agent selects the `portfolio_analysis` tool, queries the user's real Ghostfolio data through the existing Portfolio Service, and synthesizes a response."

**[Expand the Tool Calls accordion to show `portfolio_analysis` was called]**

> "You can see the tool call details here — the agent shows which tools it used and what data it retrieved. Below that, the metadata line shows the model, latency, and token count."

**[Click the thumbs up button on this response]**

> "Users can also give feedback on each response — thumbs up or thumbs down. This is stored in the database for tracking response quality over time."

---

### [1:00 - 1:25] Tool 2: market_data

**[Type: "What's the current price of AAPL and MSFT?"]**

> "Market data queries use the `market_data` tool, which wraps Ghostfolio's data provider service — the same source the main app uses for real-time quotes."

**[Expand Tool Calls to show `market_data` was called]**

---

### [1:25 - 1:55] Tool 3: benchmark_compare

**[Type: "Compare my portfolio to the S&P 500"]**

> "This query chains two tools — `portfolio_analysis` to get the portfolio data, then `benchmark_compare` to fetch S&P 500 performance and calculate the comparison."

**[Expand Tool Calls to show both tools were called]**

> "The agent maintains conversation context across turns — powered by Redis with a 24-hour TTL."

---

### [1:55 - 2:15] Tool 4: symbol_search

**[Type: "Search for Vanguard ETFs"]**

> "The `symbol_search` tool lets users find ticker symbols by name or keyword. It wraps Ghostfolio's data provider search, returning matching symbols with their asset class and data source."

**[Expand Tool Calls to show `symbol_search` was called]**

---

### [2:15 - 2:40] Tool 5: watchlist_manage

**[Type: "Show my watchlist"]**

> "The fifth tool is `watchlist_manage` — it can view, add, or remove items from the user's watchlist. Let me add one."

**[Type: "Add TSLA to my watchlist"]**

> "The agent resolves the symbol and adds it. All five tools wrap real Ghostfolio services with full authentication — the user ID comes from the JWT, never from the prompt."

**[Click thumbs down on this response to show toggle behavior, then click thumbs up to switch it]**

> "Feedback is toggle-able — clicking the other thumb switches the vote."

---

### [2:40 - 3:15] Verification & Edge Cases

**[Point out verification badges on previous responses]**

> "Every response runs through four verification checks before being returned: ticker symbol validation confirms all mentioned symbols actually exist in the tool output, numerical cross-checks verify allocations sum correctly, data freshness flags stale market data, and confidence scoring aggregates everything into a 0-to-100 score."

**[Type: "What's the price of XYZFAKE?"]**

> "Edge cases are handled gracefully — an unknown ticker gets a helpful response, not a crash."

---

### [3:15 - 3:45] Evaluation Results

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

> "100% pass rate. The eval covers happy path queries, edge cases like unknown tickers, adversarial inputs like prompt injection attempts, and multi-step queries that chain 2-3 tools."

---

### [3:45 - 4:30] Observability — LangSmith

**[Switch to LangSmith dashboard in browser tab]**

> "Every request is traced in LangSmith. Here's the project dashboard showing all agent interactions."

**[Point to the trace list — show rows with latency and status columns]**

> "Each row is one agent request. You can see the status, total latency, and token usage at a glance."

**[Click into a specific trace — pick one of the queries you just ran]**

> "Clicking into a trace shows the full execution chain: the LLM call, which tools were selected, the tool inputs and outputs, and the verification pipeline."

**[Point out the latency breakdown within the trace]**

> "We track a full latency breakdown — how much time was spent in the LLM versus tool execution versus verification."

**[Point out token usage in the trace]**

> "Token usage is tracked per request — input tokens, output tokens, and total. This feeds into our cost analysis. Importantly, trace sanitization redacts sensitive financial data like portfolio balances before anything reaches LangSmith."

---

### [4:30 - 4:50] Wrap-up

**[Switch back to chat UI]**

> "To summarize: 5 functional tools wrapping real Ghostfolio services, 66 eval test cases at 100% pass rate, 4 verification types with confidence scoring, full LangSmith observability, user feedback capture, and a browser-based chat UI — all built in one week for AgentForge."

> "Built with LangChain.js and TypeScript, deployed on Railway, and fully integrated into the existing open-source Ghostfolio codebase. The verification and observability layers are published as a reusable npm package — `langchain-agent-toolkit`."

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
