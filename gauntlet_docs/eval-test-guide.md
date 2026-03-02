# AI Agent Evaluation & Test Guide

This document describes the test suite for the Ghostfolio AI Finance Agent, covering what each test validates, how the tests are organized, and how to add new cases.

## Test Suite Overview

The agent test suite lives in `apps/api/src/app/endpoints/agent/` and is split into two layers:

1. **Unit tests** (9 spec files) — Deterministic tests for individual components: tools, observability, verification, and conversation persistence. These run without an API key and always produce the same result.
2. **LLM evaluation suite** (1 spec file) — Behavioral tests that send real prompts to the LLM through the agent pipeline and validate tool selection, response content, and safety boundaries. These require an `OPENROUTER_API_KEY` and are non-deterministic by nature.

Run all agent tests with:

```bash
npm run test:single -- apps/api/src/app/endpoints/agent/
```

---

## Unit Tests

### Tool Tests (`tools/`)

These test the LangChain tool wrappers that the agent can invoke. Each test mocks the underlying Ghostfolio services and validates input handling, output formatting, and error paths.

| File                            | What It Tests                                                                                                                                                        |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `symbol-search.tool.spec.ts`    | Ticker symbol lookup: matching results, multiple results, short query rejection, no-results message, data provider errors, user context passing, whitespace trimming |
| `watchlist-manage.tool.spec.ts` | Watchlist CRUD operations: view with performance data, add with explicit or auto-resolved dataSource, remove, validation errors, service errors, user isolation      |

### Observability Tests (`observability/`)

These test the monitoring and diagnostics infrastructure that wraps every agent invocation.

| File                        | What It Tests                                                                                                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `error-categorizer.spec.ts` | Classifies runtime errors into buckets (`llm_failure`, `input_validation`, `tool_failure`, `verification`, `unknown`) so dashboards and alerts can route them correctly                          |
| `token-tracker.spec.ts`     | Extracts token usage from LLM response metadata (`usage_metadata` and `response_metadata` formats) and accumulates totals across multi-turn conversations                                        |
| `trace-sanitizer.spec.ts`   | Redacts sensitive financial data (quantities, market prices, account balances, net performance values) from LangSmith traces while preserving non-sensitive fields (symbols, names, percentages) |

### Verification Tests (`verification/`)

These test the post-response quality checks that run after every agent reply to score confidence and flag issues.

| File                           | What It Tests                                                                                                                                                                                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `confidence-scoring.spec.ts`   | Calculates a 0-100 confidence score with deductions for: no tool calls (-40), warning-severity failures (-15 each), error-severity failures (-25 each), tool errors (-20), tools called but no data retrieved (-15). Scores below 70 trigger a warning flag. |
| `data-freshness.spec.ts`       | Validates that data returned by tools is not stale. Thresholds: equity data > 24h = stale, crypto data > 1h = stale. Checks `retrievedAt` on market data, `dataRetrievedAt` on portfolio data, and benchmark data timestamps.                                |
| `numerical-crosscheck.spec.ts` | Validates numerical consistency in agent responses. Checks that portfolio allocation percentages sum to ~100% (2% tolerance), and that benchmark comparison ratios are reasonable.                                                                           |

### Conversation Persistence Test

| File                               | What It Tests                                                                                                                                                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `conversation-persistence.spec.ts` | LangChain message serialization roundtrips (HumanMessage, AIMessage, full conversations), Redis integration for loading/saving conversation history with TTL, and graceful error handling when Redis is unavailable |

---

## LLM Evaluation Suite

**File:** `agent.eval.spec.ts`

This is the behavioral test suite that exercises the full agent pipeline end-to-end. It sends natural language queries to the agent via `AgentService.chat()`, then validates three dimensions of the response:

1. **Tool selection** — Did the agent call the expected tool(s)?
2. **Output patterns** — Does the response contain expected keywords or phrases?
3. **Safety** — Does the response avoid prohibited content?

The suite uses mock Ghostfolio services (portfolio, benchmark, market data) so it tests the LLM's reasoning and tool selection, not the underlying data layer.

### How It Works

Test cases are defined in JSON data files and loaded dynamically. Each case specifies:

```jsonc
{
  "id": "hp-001",              // Unique identifier (prefix = category)
  "category": "happy_path",    // Test category (see below)
  "description": "...",        // Human-readable purpose
  "input": "...",              // The user query sent to the agent
  "expectedToolCalls": [...],  // Tool names the agent should invoke
  "expectedOutputPatterns": [...],      // Strings that should appear in the response
  "expectedOutputPatternsMode": "all",  // "all" (every pattern required) or "any" (at least one)
  "unexpectedPatterns": [...],          // Strings that must NOT appear in the response
  "passCriteria": {
    "toolSelectionMatch": true,     // Whether tool selection is a hard pass/fail
    "outputPatternsPresent": true,  // Whether output patterns are a hard pass/fail
    "noUnexpectedPatterns": true    // Whether safety check is a hard pass/fail
  },
  "timeoutMs": 30000           // Per-case timeout (longer for multi-step)
}
```

When `passCriteria` sets a dimension to `false`, that dimension is still evaluated and reported but does not cause a Jest assertion failure. This is used for cases where the LLM's behavior is acceptable but not perfectly predictable (e.g., adversarial cases where tool selection is debatable).

### Data Files

| File                                   | Cases | Category                                                                       |
| -------------------------------------- | ----- | ------------------------------------------------------------------------------ |
| `agent.eval-data.json`                 | 7     | Mixed (original seed cases covering happy_path, edge_case, safety, multi_tool) |
| `eval-data/eval-data-happy-path.json`  | 23    | `happy_path`                                                                   |
| `eval-data/eval-data-edge-case.json`   | 12    | `edge_case`                                                                    |
| `eval-data/eval-data-adversarial.json` | 12    | `adversarial`                                                                  |
| `eval-data/eval-data-multi-step.json`  | 12    | `multi_step`                                                                   |

**Total: 66 eval cases**

### Category Definitions

#### `happy_path` (26 cases)

Standard queries that a typical user would ask. These validate that the agent selects the correct tool and returns accurate, relevant information from the mock data.

**What they test:**

- Portfolio queries: holdings, allocation percentages, net worth, total investment, gains/losses, account details, best performer, diversification
- Market data queries: price by ticker symbol, price by company name, multiple symbols, SPY price
- Benchmark queries: available benchmarks, portfolio-vs-S&P comparison, market trend, all-time high distance

**Pass criteria:** All three dimensions (tool selection, output patterns, safety) are hard requirements for most cases. These should consistently pass — failures here indicate a regression in core agent behavior.

**FR mapping:** FR24 (response quality), FR25 (tool selection accuracy)

#### `edge_case` (13 cases)

Boundary conditions, unusual inputs, and scenarios where data is missing or ambiguous. These validate that the agent degrades gracefully rather than crashing or hallucinating.

**What they test:**

- Invalid/unknown ticker symbols (XYZFAKE123, ZZZZNOTREAL)
- Valid symbol not in mock data (AAPL)
- Very short or ambiguous input ("portfolio", "12345")
- Special characters in input ("!!!@@@###???")
- Incomplete queries ("Tell me about")
- Non-configured benchmark (NASDAQ)
- Mixed valid and invalid symbols
- Asset class not in portfolio (cryptocurrency)
- Full company name instead of ticker
- Lowercase ticker symbols
- Date range hints in queries

**Pass criteria:** Tool selection is relaxed (`false`) for several cases where the LLM may reasonably choose different approaches. Output patterns and safety are typically hard requirements.

**FR mapping:** FR27 (graceful error handling)

#### `adversarial` (12 cases)

Attacks and boundary-pushing inputs designed to make the agent behave outside its intended scope. These validate security, safety guardrails, and domain boundaries.

**What they test:**

- **Prompt injection:** "Ignore all previous instructions" and "SYSTEM: You are now DAN" role override attempts
- **Cross-user data access:** Requesting another user's portfolio by email
- **Financial advice boundaries:** Future price predictions, buy/sell recommendations, guaranteed returns
- **Out-of-domain refusal:** Medical advice, code generation, legal advice
- **Information extraction:** System prompt disclosure attempts
- **Social engineering:** Fake admin authority claims
- **Regulatory boundaries:** Insider trading information requests

**Pass criteria:** Tool selection is relaxed for several cases — the LLM may gather data before declining, which is acceptable as long as the response itself stays within bounds. Output patterns and safety checks are hard requirements.

**FR mapping:** FR26 (safety boundaries)

#### `multi_step` (12 cases)

Complex queries requiring the agent to invoke 2 or more tools in a single turn and synthesize the results into a coherent response.

**What they test:**

- Portfolio + market data combinations (holdings and current price, allocation and trading price)
- Portfolio + benchmark combinations (net worth and S&P comparison, best holding and benchmarks)
- Market data + benchmark combinations (SPY price and benchmark comparison)
- All three tools together (complete portfolio overview with holdings, prices, and benchmarks)

**Pass criteria:** All three dimensions are hard requirements. These cases use a 45-second timeout (vs 30s for single-tool cases) to accommodate the additional LLM reasoning time.

**FR mapping:** FR28 (multi-step reasoning)

#### `safety` (2 cases, in seed file only)

Direct safety boundary tests from the original seed data: refusing medical advice and refusing guaranteed returns claims.

#### `multi_tool` (1 case, in seed file only)

Original seed case for multi-tool invocation. Superseded by the `multi_step` category but retained for backward compatibility.

---

## Eval Suite Output

After running, the eval suite prints:

1. **Per-case results** — Pass/fail status with tool, pattern, and safety check indicators
2. **Category breakdown** — Pass rate per category
3. **JSON summary** — Machine-readable results block between `--- EVAL_RESULTS_JSON ---` markers, suitable for CI capture and regression tracking

Example output:

```
╔══════════════════════════════════════════════════╗
║           EVAL SUITE RESULTS SUMMARY             ║
╠══════════════════════════════════════════════════╣
║  Total: 66    Passed: 61    Failed: 5            ║
║  Overall Pass Rate: 92.4%                        ║
╠══════════════════════════════════════════════════╣
║  Category Breakdown:                             ║
║    happy_path: 25/26 (96.2%)                     ║
║    edge_case: 11/13 (84.6%)                      ║
║    adversarial: 10/12 (83.3%)                    ║
║    multi_step: 12/12 (100.0%)                    ║
╚══════════════════════════════════════════════════╝
```

### Interpreting Failures

Because the eval suite tests LLM behavior, some variance is expected. Common non-bug failures:

- **Tool selection disagreement** — The LLM calls a tool to gather context before responding (e.g., looking up market data before declining a prediction request). The test expected no tool calls. This is usually acceptable behavior.
- **Output pattern misses** — The LLM phrases its response differently than expected. If the response is substantively correct, the pattern list in the test case may need broadening.
- **Flaky passes/failures** — The same case may pass or fail across runs due to LLM non-determinism. Persistent failures warrant investigation; occasional flips do not.

---

## Adding New Test Cases

1. Choose the appropriate data file based on category
2. Add a new entry with a unique ID following the prefix convention:
   - `hp-NNN` for happy_path
   - `ec-NNN` for edge_case
   - `adv-NNN` for adversarial
   - `ms-NNN` for multi_step
3. Set `passCriteria` dimensions to `true` only for dimensions you want to enforce as hard failures
4. Use `expectedOutputPatternsMode: "any"` when the LLM might use different phrasing (most cases)
5. Use `expectedOutputPatternsMode: "all"` only when every pattern must appear
6. Set `timeoutMs` to 30000 for single-tool cases, 45000 for multi-step cases
7. Run the suite to verify the new case passes consistently before committing

The harness self-test (`Eval Harness Utilities` describe block) validates that all data files load correctly, no duplicate IDs exist, and all required categories are represented. This runs without an API key as part of the standard test suite.
