# AI Cost Analysis — Ghostfolio AI Finance Agent

**Project:** Ghostfolio AI Finance Agent (AgentForge)
**Date:** 2026-02-26
**Author:** Diane (with AI-assisted development)

---

## 1. Model Configuration & Pricing

| Parameter           | Value                                                   |
| ------------------- | ------------------------------------------------------- |
| Primary Model       | Claude Sonnet 4 (`anthropic/claude-sonnet-4`)           |
| LLM Gateway         | OpenRouter                                              |
| Input Token Price   | $3.00 per 1M tokens                                     |
| Output Token Price  | $15.00 per 1M tokens                                    |
| Fallback Model      | GPT-4o Mini (`openai/gpt-4o-mini`) — $0.15/$0.60 per 1M |
| Per-Query Guardrail | $0.50 max (triggers warning if exceeded)                |

---

## 2. Actual Development Costs

### Development Activity Breakdown

| Activity                             | Estimated Queries | Avg Tokens (In/Out) | Estimated Cost |
| ------------------------------------ | ----------------- | ------------------- | -------------- |
| Manual testing (iterative)           | ~200              | 800 / 400           | ~$1.68         |
| Eval suite runs (66 cases x ~5 runs) | ~330              | 600 / 350           | ~$1.32         |
| Prompt tuning iterations             | ~50               | 1000 / 500          | ~$0.53         |
| Multi-turn conversation testing      | ~30               | 1500 / 600          | ~$0.41         |
| Edge case / adversarial testing      | ~40               | 500 / 300           | ~$0.24         |
| **Total Development Estimate**       | **~650 queries**  |                     | **~$4.18**     |

**Note:** Actual cumulative costs are tracked in the LangSmith dashboard (project: `ghostfolio-agent`). The estimates above are derived from token tracking built into the agent service (`token-tracker.ts`) and typical query patterns observed during development.

### Token Tracking Implementation

The agent tracks token usage per request via `extractTokenUsage()` in `observability/token-tracker.ts`:

- Extracts `input_tokens` and `output_tokens` from LLM responses
- Accumulates across multi-turn tool-calling loops
- Reports in response metadata and LangSmith traces

---

## 3. Per-Query Cost Estimates

### Cost by Query Complexity

| Complexity | Example Query                                                   | Tools Called              | Avg Input Tokens | Avg Output Tokens | Est. Cost |
| ---------- | --------------------------------------------------------------- | ------------------------- | ---------------- | ----------------- | --------- |
| Simple     | "What's in my portfolio?"                                       | 1 (portfolio_analysis)    | ~500             | ~300              | ~$0.006   |
| Medium     | "What's the price of AAPL and MSFT?"                            | 1 (market_data)           | ~600             | ~400              | ~$0.008   |
| Standard   | "Compare my portfolio to S&P 500"                               | 2 (portfolio + benchmark) | ~1,000           | ~600              | ~$0.012   |
| Complex    | "Analyze my portfolio, check prices, and compare to benchmarks" | 3+ tools                  | ~2,000           | ~1,200            | ~$0.024   |
| Multi-turn | Follow-up with conversation context                             | 1-2 + history             | ~2,500           | ~800              | ~$0.020   |

**All query types fall well within PRD guardrails:** <$0.05 (simple) and <$0.20 (complex).

### Cost Components per Request

| Component            | Token Impact                            | Notes                                 |
| -------------------- | --------------------------------------- | ------------------------------------- |
| System prompt        | ~300 tokens (input)                     | Fixed per request                     |
| User message         | ~20-100 tokens (input)                  | Variable                              |
| Conversation history | ~0-2000 tokens (input)                  | Grows with turns, capped by Redis TTL |
| Tool schemas         | ~200 tokens (input)                     | 5 tool definitions                    |
| Tool call + result   | ~100-500 tokens per tool (input/output) | Varies by tool response size          |
| Agent response       | ~200-600 tokens (output)                | Natural language synthesis            |

---

## 4. Production Projections

### Assumptions

| Parameter                   | Value                                 | Rationale                                          |
| --------------------------- | ------------------------------------- | -------------------------------------------------- |
| Queries per user per day    | 2                                     | Conservative; power users may do 5-10, most do 0-1 |
| Active user rate            | 100% of registered                    | Upper bound for cost estimation                    |
| Query mix                   | 60% simple, 30% standard, 10% complex | Based on development usage patterns                |
| Weighted avg cost per query | $0.010                                | (0.6 x $0.006) + (0.3 x $0.012) + (0.1 x $0.024)   |
| Days per month              | 30                                    | Calendar month                                     |

### Monthly Cost Projections

| Scale          | Active Users | Queries/Day | Queries/Month | Monthly LLM Cost | Cost/User/Month |
| -------------- | ------------ | ----------- | ------------- | ---------------- | --------------- |
| **Hobby**      | 100          | 200         | 6,000         | **$60**          | $0.60           |
| **Startup**    | 1,000        | 2,000       | 60,000        | **$600**         | $0.60           |
| **Growth**     | 10,000       | 20,000      | 600,000       | **$6,000**       | $0.60           |
| **Enterprise** | 100,000      | 200,000     | 6,000,000     | **$60,000**      | $0.60           |

### Annual Cost Projections

| Scale          | Active Users | Annual LLM Cost | With Infrastructure\* |
| -------------- | ------------ | --------------- | --------------------- |
| **Hobby**      | 100          | $720            | ~$1,200               |
| **Startup**    | 1,000        | $7,200          | ~$9,600               |
| **Growth**     | 10,000       | $72,000         | ~$80,000              |
| **Enterprise** | 100,000      | $720,000        | ~$760,000             |

_Infrastructure includes Redis, PostgreSQL, Railway hosting (estimated ~$40-3,300/mo depending on scale)._

---

## 5. Cost Optimization Recommendations

### Tier 1: Immediate Wins (No Architecture Changes)

| Optimization               | Savings                     | Implementation                                                                                              |
| -------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Prompt compression**     | 10-15%                      | Minimize system prompt tokens; use concise tool descriptions                                                |
| **Response caching**       | 20-40% for repeated queries | Cache common portfolio summaries in Redis (5-min TTL). Identical queries within TTL return cached response. |
| **Tool output truncation** | 5-10%                       | Limit portfolio holdings to top 20 in tool response; paginate on request                                    |

### Tier 2: Model Routing (Medium Effort)

| Optimization                 | Savings                  | Implementation                                                                                                                                                   |
| ---------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tiered model selection**   | 50-70% on simple queries | Route simple queries (single tool, no context) to GPT-4o Mini ($0.15/$0.60 per 1M) instead of Claude Sonnet 4. Use a lightweight classifier or keyword matching. |
| **Confidence-based routing** | 10-20% overall           | If first pass with cheap model produces high-confidence response, skip expensive model                                                                           |

**Projected savings with model routing:**

| Scale         | Without Routing | With Routing (60% to Mini) | Savings |
| ------------- | --------------- | -------------------------- | ------- |
| 1,000 users   | $600/mo         | ~$250/mo                   | 58%     |
| 10,000 users  | $6,000/mo       | ~$2,500/mo                 | 58%     |
| 100,000 users | $60,000/mo      | ~$25,000/mo                | 58%     |

### Tier 3: Architecture Changes (Higher Effort)

| Optimization                   | Savings                                | Implementation                                                                                                                     |
| ------------------------------ | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Streaming responses**        | Perceived latency reduction (not cost) | Stream tokens as generated; improves UX without cost change                                                                        |
| **Conversation summarization** | 15-25% on multi-turn                   | Summarize long conversations instead of passing full history as context                                                            |
| **Batch processing**           | 10-20% at scale                        | Batch non-urgent queries (e.g., daily portfolio summaries) for bulk API pricing                                                    |
| **Fine-tuned model**           | 40-60%                                 | Train a smaller model on successful query/response pairs. Significant upfront cost but lower per-query. Only viable at 10K+ users. |

---

## 6. Break-Even Analysis

### At What Scale Does AI Pay for Itself?

Ghostfolio is open-source and self-hostable. The AI agent adds cost but also adds significant value (user engagement, retention, accessibility of financial data).

| Pricing Model                       | Break-Even Point                  | Notes                                              |
| ----------------------------------- | --------------------------------- | -------------------------------------------------- |
| Premium subscription ($5/mo)        | ~12 paying users cover Hobby tier | $60/mo LLM ÷ $5/user                               |
| Freemium (AI = premium feature)     | Conversion rate dependent         | If 10% convert, need 120 free users for Hobby tier |
| Self-hosted (user pays own API key) | $0 platform cost                  | Users bring their own OpenRouter/API key           |

---

## 7. Key Takeaways

1. **Development costs were minimal** — estimated ~$4 total for the entire build, including all eval suite runs
2. **Per-query costs are low** — $0.006-$0.024 per query, well within PRD guardrails
3. **Linear scaling** — costs scale linearly with users; no surprising cost cliffs
4. **Model routing is the biggest lever** — routing simple queries to GPT-4o Mini saves ~58% at any scale
5. **Self-hosting option** — users bringing their own API keys eliminates platform LLM costs entirely
