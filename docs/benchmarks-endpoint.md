# Benchmarks Endpoint

**Generated:** 2026-02-24
**Scope:** Benchmark comparison capabilities (→ `benchmark_compare` agent tool)
**Files:** `apps/api/src/app/endpoints/benchmarks/`, `apps/api/src/services/benchmark/`

---

## Summary

The Benchmarks system manages market benchmark assets (e.g., S&P 500, Bitcoin) and provides performance comparison against user portfolios. It calculates all-time highs, trend analysis (50-day and 200-day moving averages), and market condition classification. Benchmarks are stored as system properties and cached in Redis.

---

## API Endpoints

**Base route:** `/api/v1/benchmarks`

### GET /benchmarks (Public)

Returns all active benchmarks with current performance metrics. **No authentication required.**

**Response:**
```typescript
{
  benchmarks: [
    {
      dataSource: string,           // e.g., "YAHOO"
      symbol: string,               // e.g., "^GSPC"
      name: string,                 // e.g., "S&P 500"
      marketCondition: 'ALL_TIME_HIGH' | 'BEAR_MARKET' | 'NEUTRAL_MARKET',
      performances: {
        allTimeHigh: {
          date: Date,               // ATH date
          performancePercent: number // % change from ATH
        }
      },
      trend50d: BenchmarkTrend,     // 50-day moving average
      trend200d: BenchmarkTrend     // 200-day moving average
    }
  ]
}
```

**Market Condition Logic:**
- `>= 0%` from ATH → `ALL_TIME_HIGH`
- `<= -20%` from ATH → `BEAR_MARKET`
- Otherwise → `NEUTRAL_MARKET`

### GET /benchmarks/:dataSource/:symbol/:startDateString (Authenticated)

Compares a benchmark's performance against a user's portfolio timeline.

**Guards:** JWT + HasPermissionGuard

**Path Params:**
| Param | Type | Description |
|-------|------|-------------|
| `dataSource` | DataSource | Provider enum |
| `symbol` | string | Benchmark symbol |
| `startDateString` | string | ISO date (portfolio start) |

**Query Params:** `range`, `accounts`, `assetClasses`, `dataSource`, `symbol`, `tags`, `withExcludedAccounts`

**Headers:** `Impersonation-Id` (optional, admin only)

**Response:**
```typescript
{
  marketData: [
    { date: string, value: number }  // Percentage from start
  ]
}
```

**Calculation:**
```
For each date in portfolio timeline:
  benchmark_return = ((price_today * fx_rate) / (price_start * fx_rate_start) - 1) * 100
```

### POST /benchmarks (Admin Only)

Add a benchmark. Permission: `accessAdminControl`

**Body:** `{ dataSource: DataSource, symbol: string }`
**Response:** `{ id, dataSource, symbol, name }`

### DELETE /benchmarks/:dataSource/:symbol (Admin Only)

Remove a benchmark. Permission: `accessAdminControl`

---

## Core Benchmark Service

**File:** `apps/api/src/services/benchmark/benchmark.service.ts`

### Key Methods

| Method | Purpose |
|--------|---------|
| `getBenchmarks()` | All benchmarks with metrics (cached 2 hours) |
| `getBenchmarkAssetProfiles()` | Benchmark asset definitions |
| `addBenchmark()` | Add new benchmark to system |
| `deleteBenchmark()` | Remove benchmark |
| `getBenchmarkTrends()` | Calculate 50d and 200d moving averages |
| `calculateChangeInPercentage()` | Utility: (current/base) - 1 |
| `getMarketCondition()` | Classify ATH/Bear/Neutral |

### Caching
- Redis key: `BENCHMARKS`
- TTL: 2 hours (when all data is available)
- Invalidated on add/delete

### Data Requirements
- Last 400 days of historical data (for trend calculations)
- Current quotes from data providers
- All-time high prices from MarketDataService

---

## BenchmarksService (Endpoint-Specific)

**File:** `apps/api/src/app/endpoints/benchmarks/benchmarks.service.ts`

### getMarketDataForUser()

Compares benchmark against user's portfolio timeline.

**Steps:**
1. Get user's portfolio performance via `PortfolioService.getPerformance()`
2. Fetch benchmark market prices for all dates in timeline
3. Fetch currency exchange rates (benchmark currency → user base currency)
4. Calculate percentage change from start for each date
5. Return time-series of `{ date, value }` pairs

---

## Agent Tool Capabilities

What `benchmark_compare` can answer:

| Question Type | Source | Example |
|--------------|--------|---------|
| Market condition | GET /benchmarks | "Is the S&P 500 at an all-time high?" |
| Benchmark list | GET /benchmarks | "What benchmarks are available?" |
| Performance vs portfolio | GET /:ds/:sym/:date | "How did my portfolio compare to S&P 500 this year?" |
| Trend analysis | getBenchmarkTrends() | "What's the 50-day trend for Bitcoin?" |
| Market sentiment | Market condition | "Are we in a bear market?" |

---

## Configuration

- Benchmarks stored in Property table as `PROPERTY_BENCHMARKS`
- Format: Array of `{ symbolProfileId, enableSharing? }`
- Managed by admin through POST/DELETE endpoints
