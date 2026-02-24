# Existing AI Integration

**Generated:** 2026-02-24
**Scope:** Complete documentation of the current AI endpoint for agent development
**Files:** `apps/api/src/app/endpoints/ai/`

---

## Summary

Ghostfolio has a **minimal, prompt-generation-focused AI implementation** using the **Vercel AI SDK** connected to **OpenRouter** as the LLM provider. It generates structured prompts from portfolio data — it does **not** execute agentic workflows. The `generateText()` method exists but is **not wired to any endpoint**.

**LangChain.js is NOT installed.** It must be added as a dependency.

---

## File Structure

```
apps/api/src/app/endpoints/ai/
├── ai.module.ts       # NestJS module with dependencies
├── ai.controller.ts   # HTTP endpoint handler
└── ai.service.ts      # Prompt generation & LLM calls
```

## AI Module

**File:** `ai.module.ts`

**Imports** (all modules available to the AI service):
- ApiModule, BenchmarkModule, ConfigurationModule, DataProviderModule
- ExchangeRateDataModule, I18nModule, ImpersonationModule, MarketDataModule
- OrderModule, PortfolioSnapshotQueueModule, PrismaModule, PropertyModule
- RedisCacheModule, SymbolProfileModule, UserModule

**Providers:**
- AccountBalanceService, AccountService, AiService, CurrentRateService
- MarketDataService, PortfolioCalculatorFactory, PortfolioService, RulesService

## AI Controller

**File:** `ai.controller.ts`

### Endpoint: GET /api/v1/ai/prompt/:mode

```typescript
@Get('prompt/:mode')
@HasPermission(permissions.readAiPrompt)
@UseGuards(AuthGuard('jwt'), HasPermissionGuard)
public async getPrompt(
  @Param('mode') mode: AiPromptMode,
  @Query('accounts') filterByAccounts?: string,
  @Query('assetClasses') filterByAssetClasses?: string,
  @Query('dataSource') filterByDataSource?: string,
  @Query('symbol') filterBySymbol?: string,
  @Query('tags') filterByTags?: string
): Promise<AiPromptResponse>
```

**Parameters:**
| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `mode` | path | `'analysis' \| 'portfolio'` | Yes | Prompt type |
| `accounts` | query | string | No | Comma-separated account IDs |
| `assetClasses` | query | string | No | Asset class filter |
| `dataSource` | query | string | No | Data source filter |
| `symbol` | query | string | No | Symbol filter |
| `tags` | query | string | No | Tag filter |

**Response:** `{ prompt: string }`

**Security:** JWT required + `readAiPrompt` permission

## AI Service

**File:** `ai.service.ts`

**Dependencies:**
```typescript
constructor(
  private readonly portfolioService: PortfolioService,
  private readonly propertyService: PropertyService
)
```

**LLM Libraries:**
```typescript
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';  // Vercel AI SDK
```

### Method: getPrompt()

Generates a structured AI prompt from portfolio holdings.

**Process:**
1. Calls `PortfolioService.getDetails()` with user's filters
2. Extracts holdings, sorts by allocation (descending)
3. Builds markdown table with columns: Name, Symbol, Currency, Asset Class, Asset Sub Class, Allocation %
4. Returns based on mode:
   - `'portfolio'` — Holdings table only
   - `'analysis'` — Full analysis prompt with system instructions

**Analysis Prompt Template:**
```
You are a neutral financial assistant. Please analyze the following
investment portfolio (base currency being {userCurrency}) in simple words.

{holdings table}

Structure your answer with these sections:
- Overview
- Risk Assessment
- Advantages
- Disadvantages
- Target Group
- Optimization Ideas
- Conclusion

Provide your answer in the following language: {languageCode}.
```

### Method: generateText() (UNUSED)

```typescript
public async generateText({ prompt }: { prompt: string })
```

Calls OpenRouter LLM directly from the backend. **Currently not called by any endpoint.**

**Implementation:**
1. Retrieves API key from database: `PROPERTY_API_KEY_OPENROUTER`
2. Retrieves model name from database: `PROPERTY_OPENROUTER_MODEL`
3. Creates OpenRouter client
4. Calls Vercel AI SDK `generateText()`

## Type Definitions

**AiPromptMode:** `libs/common/src/lib/types/ai-prompt-mode.type.ts`
```typescript
export type AiPromptMode = 'analysis' | 'portfolio';
```

**AiPromptResponse:** `libs/common/src/lib/interfaces/responses/ai-prompt-response.interface.ts`
```typescript
export interface AiPromptResponse {
  prompt: string;
}
```

## Configuration

**Stored in database Property table (not environment variables):**

| Property Key | Constant | Purpose |
|-------------|----------|---------|
| `API_KEY_OPENROUTER` | `PROPERTY_API_KEY_OPENROUTER` | OpenRouter API key |
| `OPENROUTER_MODEL` | `PROPERTY_OPENROUTER_MODEL` | Model identifier |

**Set via:** Admin control panel or direct database insertion.

## Permission

| Role | Has `readAiPrompt`? |
|------|:---:|
| ADMIN | Yes |
| USER | Yes |
| DEMO | Yes |

## Data Flow

```
Client → GET /api/v1/ai/prompt/:mode
    → AuthGuard (JWT)
    → HasPermissionGuard (readAiPrompt)
    → AiController.getPrompt()
        → Build filters from query params
        → AiService.getPrompt()
            → PortfolioService.getDetails() → Holdings data
            → Transform to markdown table (tablemark library)
            → Return mode-specific prompt
    → Response: { prompt: string }
```

## Implications for LangChain.js Agent

### What Exists
- Permission system for AI features
- Portfolio data pipeline (holdings → structured table)
- OpenRouter configuration in database
- Module dependencies already wired (portfolio, market data, benchmarks)

### What's Missing
- LangChain.js dependencies
- Tool definitions & function calling
- Agent memory / conversation state
- Streaming responses
- Multi-turn conversations
- Agent orchestration logic

### Recommended Approach
1. Keep existing AI endpoint for backward compatibility
2. Add new agent endpoints alongside (e.g., `/api/v1/agent/...`)
3. Reuse the same module imports (PortfolioService, DataProviderService, etc.)
4. Use PropertyService for agent configuration (model, temperature, etc.)
5. Leverage existing permission system (`readAiPrompt` or new permissions)
