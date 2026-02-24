# Portfolio Service & Controller

**Generated:** 2026-02-24
**Scope:** Complete API surface for portfolio analysis (→ `portfolio_analysis` agent tool)
**Files:** `apps/api/src/app/portfolio/`

---

## Summary

The Portfolio module is the **core calculation engine** for Ghostfolio. It provides endpoints for portfolio composition, performance metrics, holdings analysis, risk assessment, and investment timeline. The service file alone is **2,220 lines** with complex interdependencies.

This module becomes the **`portfolio_analysis` tool** for the AI agent.

---

## Controller Endpoints

**File:** `portfolio.controller.ts`
**Base route:** `/api/v1/portfolio`
**All endpoints require:** `AuthGuard('jwt')` + `HasPermissionGuard`

### GET /portfolio/details

Full portfolio snapshot with holdings, accounts, platforms, and market classification.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `accounts` | string | — | Comma-separated account IDs |
| `assetClasses` | string | — | Asset class filter |
| `dataSource` | string | — | Data source filter |
| `range` | DateRange | `'max'` | Date range for analysis |
| `symbol` | string | — | Specific symbol filter |
| `tags` | string | — | Comma-separated tag IDs |
| `withMarkets` | string | `'false'` | Include market classification data |

**Response Shape:**
```typescript
{
  accounts: { [id]: { balance, currency, name, valueInBaseCurrency, valueInPercentage? } }
  createdAt: Date
  hasError: boolean
  holdings: { [symbol]: PortfolioPosition }
  platforms: { [id]: { balance, currency, name, valueInBaseCurrency, valueInPercentage? } }
  markets?: { developedMarkets, emergingMarkets, otherMarkets }
  marketsAdvanced?: { asiaPacific, europe, japan, northAmerica, emergingMarkets, otherMarkets }
  summary?: PortfolioSummary
}
```

### GET /portfolio/dividends

Dividend income over time.

**Additional Params:** `groupBy` (`'month'` | `'year'`)
**Response:** `{ dividends: InvestmentItem[] }`

### GET /portfolio/holding/:dataSource/:symbol

Detailed analysis for a single holding.

**Response Shape:**
```typescript
{
  activitiesCount: number
  averagePrice: number
  dataProviderInfo: DataProviderInfo
  dateOfFirstActivity: string
  dividendInBaseCurrency: number
  dividendYieldPercent: number
  feeInBaseCurrency: number
  grossPerformance: number
  grossPerformancePercent: number
  historicalData: HistoricalDataItem[]
  investmentInBaseCurrencyWithCurrencyEffect: number
  marketPrice: number
  marketPriceMax: number
  marketPriceMin: number
  netPerformance: number
  netPerformancePercent: number
  performances: Benchmark['performances']
  quantity: number
  SymbolProfile: EnhancedSymbolProfile
  tags: Tag[]
  value: number
}
```

### GET /portfolio/holdings

List of holdings with optional fuzzy search.

**Additional Params:** `holdingType` (`'ACTIVE'` | `'CLOSED'`), `query` (search string)
**Response:** `{ holdings: PortfolioPosition[] }`

### GET /portfolio/investments

Investment timeline with streak analysis.

**Additional Params:** `groupBy` (`'month'` | `'year'`)
**Response:**
```typescript
{
  investments: InvestmentItem[]
  streaks: { currentStreak: number, longestStreak: number }
}
```

### GET /portfolio/performance (v2)

Portfolio performance over time with chart data.

**Additional Params:** `withExcludedAccounts` (boolean string)
**Response:**
```typescript
{
  chart?: HistoricalDataItem[]
  firstOrderDate: Date
  hasErrors: boolean
  performance: {
    currentNetWorth: number
    currentValueInBaseCurrency: number
    netPerformance: number
    netPerformancePercentage: number
    netPerformancePercentageWithCurrencyEffect: number
    netPerformanceWithCurrencyEffect: number
    totalInvestment: number
    totalInvestmentValueWithCurrencyEffect: number
  }
  errors?: AssetProfileIdentifier[]
}
```

### GET /portfolio/report

Portfolio analysis with rule-based evaluation (risk analysis).

**Response:**
```typescript
{
  xRay: {
    categories: [
      {
        key: string       // e.g., 'currencyClusterRisk'
        name: string
        rules: PortfolioReportRule[]
      }
    ]
    statistics: { rulesActiveCount, rulesFulfilledCount }
  }
}
```

**Rule Categories:**
- Liquidity (buying power)
- Emergency fund adequacy
- Currency concentration risk
- Asset class balance
- Account concentration risk
- Economic market exposure (developed vs emerging)
- Regional market diversification

### PUT /portfolio/holding/:dataSource/:symbol/tags

Update tags on a holding. Requires `updateOrder` permission.

---

## Service: Key Public Methods

**File:** `portfolio.service.ts` (2,220 lines)

### Constructor Dependencies
```typescript
AccountBalanceService, AccountService, BenchmarkService,
PortfolioCalculatorFactory, DataProviderService,
ExchangeRateDataService, I18nService, ImpersonationService,
OrderService, RulesService, SymbolProfileService, UserService
```

### getDetails() — Core Method (278 lines)

Most comprehensive method. Builds complete portfolio snapshot.

**Steps:**
1. Validate user and impersonation
2. Get emergency fund setting
3. Fetch activities and calculate positions via PortfolioCalculator
4. Get cash details (balances in all accounts)
5. Calculate total and filtered values
6. Fetch symbol profiles for all holdings
7. Build holdings map with performance, classification, sectors, countries
8. Calculate aggregated market data
9. Apply asset class and holding type filters

### getHolding() — Single Holding Deep Dive

Fetches all activities, creates calculator, finds specific position, retrieves historical market data from first activity to today, calculates dividend yield (annualized), builds historical timeline.

### getPerformance() — Time-Series Performance

Gets account balance items and activities, creates calculator with both inputs, calculates snapshot and historical performance, filters by date range. Returns chart data and summary.

### getReport() — Risk Analysis

Gets full portfolio details with markets, instantiates 14+ rule evaluators, evaluates each against holdings. Returns category-grouped rules with status.

### getAccounts() / getAccountsWithAggregations()

Account values with dividends, interest, allocation percentages, cash balances.

### getDividends()

Extracts and aggregates dividend activities with optional grouping.

### getInvestments()

Investment timeline with streak analysis (consecutive investment months).

---

## Portfolio Calculator Factory

**File:** `calculator/portfolio-calculator.factory.ts`

Creates the appropriate calculator based on user preference:

| Type | Class | Best For |
|------|-------|----------|
| MWR | MwrPortfolioCalculator | Irregular deposits/withdrawals |
| TWR | TwrPortfolioCalculator | Comparing manager performance |
| ROI | RoiPortfolioCalculator | Simple return calculation |
| ROAI | RoaiPortfolioCalculator | Average investment weighted |

---

## Key Data Structures

### PortfolioPosition (Holdings)
```typescript
{
  activitiesCount, allocationInPercentage,
  assetClass?, assetSubClass?,
  countries: Country[], currency, dataSource,
  dateOfFirstActivity,
  dividend, exchange?,
  grossPerformance, grossPerformancePercent,
  grossPerformancePercentWithCurrencyEffect,
  investment, marketChange?, marketChangePercent?,
  marketPrice, markets?, marketsAdvanced?,
  name, netPerformance, netPerformancePercent,
  netPerformancePercentWithCurrencyEffect,
  quantity, sectors: Sector[], symbol,
  tags?, type?, url?,
  valueInBaseCurrency?, valueInPercentage?
}
```

### PortfolioSummary
```typescript
{
  activityCount, annualizedPerformancePercent,
  cash, dateOfFirstActivity,
  dividendInBaseCurrency,
  emergencyFund: { assets, cash, total },
  fees, fireWealth: { investmentNeeded, reinvestmentNeeded },
  grossPerformance, interestInBaseCurrency,
  liabilitiesInBaseCurrency,
  totalBuy, totalSell, totalValueInBaseCurrency,
  // + PortfolioPerformance fields
}
```

### HistoricalDataItem (Timeline Point)
```typescript
{
  date, averagePrice?, marketPrice?,
  netPerformance?, netPerformanceInPercentage?,
  netWorth?, totalInvestment?, value?
}
```

### Filter Types
```typescript
type Filter = {
  type: 'ACCOUNT' | 'ASSET_CLASS' | 'DATA_SOURCE' |
        'HOLDING_TYPE' | 'SEARCH_QUERY' | 'SYMBOL' | 'TAG'
  id: string
}
```

### DateRange
```typescript
type DateRange = '1d' | '1y' | '5y' | 'max' | 'mtd' | 'wtd' | 'ytd' | string
```

---

## Agent Tool Capabilities

What `portfolio_analysis` can answer:

| Question Type | Endpoint | Example |
|--------------|----------|---------|
| Allocation breakdown | GET /details | "What's my allocation by asset class?" |
| Holdings list | GET /holdings | "Show my active holdings" |
| Single holding deep dive | GET /holding/:ds/:sym | "Tell me about my AAPL position" |
| Performance over time | GET /performance | "What's my YTD return?" |
| Investment timeline | GET /investments | "How much have I invested in 2025?" |
| Dividend income | GET /dividends | "What's my dividend income by month?" |
| Risk analysis | GET /report | "Do I have concentration risk?" |
| Portfolio report | GET /report | "Run a portfolio X-ray" |

---

## Authentication & Access Control

- All endpoints require JWT authentication
- Impersonation supported via `Impersonation-Id` header (admin only)
- Subscription tier affects data visibility (Premium vs Basic)
- Restricted access users see only percentages, not absolute values
- ZEN mode converts values to percentages
