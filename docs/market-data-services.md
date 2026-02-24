# Market Data & Data Provider Services

**Generated:** 2026-02-24
**Scope:** Market data retrieval, caching, and data provider architecture (→ `market_data` agent tool)
**Files:** `apps/api/src/services/market-data/`, `apps/api/src/services/data-provider/`, `apps/api/src/app/endpoints/market-data/`, `apps/api/src/app/symbol/`

---

## Summary

The market data system uses a **pluggable data provider architecture** abstracting 9 external data sources through a common interface. The `DataProviderService` orchestrates all retrieval with multi-level caching (Redis + database). This becomes the **`market_data` tool** for the AI agent.

---

## Architecture Overview

```
DataProviderService (orchestrator)
    ├── Redis cache (TTL: 1 min for quotes)
    ├── MarketDataService (DB persistence)
    └── Data Providers (9 implementations)
        ├── Yahoo Finance (primary, free)
        ├── CoinGecko (crypto)
        ├── Financial Modeling Prep
        ├── Alpha Vantage
        ├── EOD Historical Data (premium)
        ├── Ghostfolio (federated)
        ├── Manual (user-defined + web scraping)
        ├── Google Sheets
        └── Rapid API (Fear & Greed Index)
```

---

## Data Provider Interface

Every provider implements:

```typescript
interface DataProviderInterface {
  canHandle(symbol: string): boolean;
  getAssetProfile({ symbol, requestTimeout? }): Promise<Partial<SymbolProfile>>;
  getDataProviderInfo(): DataProviderInfo;
  getDividends({ symbol, from, to, granularity? }): Promise<{[date]: {marketPrice}}>;
  getHistorical({ symbol, from, to, granularity? }): Promise<{[symbol]: {[date]: {marketPrice}}}>;
  getMaxNumberOfSymbolsPerRequest?(): number;
  getName(): DataSource;
  getQuotes({ symbols[], requestTimeout? }): Promise<{[symbol]: DataProviderResponse}>;
  getTestSymbol(): string;
  search({ query, includeIndices? }): Promise<LookupResponse>;
}
```

---

## Data Providers Summary

| Provider | DataSource Enum | API Key Env Var | Free? | Specializes In |
|----------|----------------|-----------------|:---:|----------------|
| Yahoo Finance | YAHOO | — | Yes | Stocks, ETFs, currencies, crypto |
| CoinGecko | COINGECKO | `API_KEY_COINGECKO_DEMO/PRO` | Yes | Cryptocurrency prices |
| Financial Modeling Prep | FINANCIAL_MODELING_PREP | `API_KEY_FINANCIAL_MODELING_PREP` | No | Stocks, fundamentals, crypto |
| Alpha Vantage | ALPHA_VANTAGE | `API_KEY_ALPHA_VANTAGE` | Yes | Crypto daily data |
| EOD Historical Data | EOD_HISTORICAL_DATA | `API_KEY_EOD_HISTORICAL_DATA` | No | Global stocks/ETFs (premium) |
| Ghostfolio | GHOSTFOLIO | `PROPERTY_API_KEY_GHOSTFOLIO` | No | Federated instances |
| Manual | MANUAL | — | Yes | User-defined + web scraping |
| Google Sheets | GOOGLE_SHEETS | `GOOGLE_SHEETS_*` | Yes | User-provided data |
| Rapid API | RAPID_API | `API_KEY_RAPID_API` | No | Fear & Greed Index |

---

## DataProviderService — Key Methods

**File:** `apps/api/src/services/data-provider/data-provider.service.ts`

### getQuotes() — Real-time Prices (Primary Method)

```typescript
getQuotes({ items, requestTimeout?, useCache?, user? })
  → Promise<{[symbol]: DataProviderResponse}>
```

**Flow:**
1. Check Redis cache for each item (TTL: `CACHE_QUOTES_TTL`, default 1 min)
2. Group cache misses by DataSource
3. Chunk by provider's max request size
4. Call providers in parallel (`Promise.all`)
5. Handle derived currencies (e.g., USDGBP from USDEUR)
6. Cache results in Redis + store as INTRADAY in MarketData table

**Response per symbol:**
```typescript
{
  currency: string,
  dataSource: DataSource,
  marketPrice: number,
  marketState: 'open' | 'closed' | 'delayed' | 'offline'
}
```

### getHistorical() — DB-Backed Historical Data

```typescript
getHistorical(items, granularity?, from, to)
  → Promise<{[symbol]: {[date]: {marketPrice}}}>
```

Reads from **database** (MarketData table). Used for portfolio calculations.

### getHistoricalRaw() — Provider-Based Historical Data

```typescript
getHistoricalRaw({ assetProfileIdentifiers, from, to })
  → Promise<{[symbol]: {[date]: {marketPrice}}}>
```

Fetches directly from **external APIs**. Used for data import and refresh.

### getAssetProfiles() — Asset Metadata

```typescript
getAssetProfiles(items: AssetProfileIdentifier[])
  → Promise<{[symbol]: Partial<SymbolProfile>}>
```

Batch fetches name, currency, assetClass, assetSubClass from providers.

### search() — Symbol Lookup

```typescript
search({ query, includeIndices?, user })
  → Promise<LookupResponse>
```

Searches across all active providers. Filters by subscription tier.

### getDividends() — Dividend History

```typescript
getDividends({ dataSource, symbol, from, to, granularity? })
  → Promise<{[date]: {marketPrice}}>
```

### getDataProvider() — Provider Selection

```typescript
getDataProvider(providerName: DataSource) → DataProviderInterface
```

Checks `PROPERTY_DATA_SOURCE_MAPPING` for runtime overrides, then falls back to direct match.

---

## Data Source Mapping (Runtime Override)

Admins can override providers at runtime via the `PROPERTY_DATA_SOURCE_MAPPING` property:
- Example: Map YAHOO → FINANCIAL_MODELING_PREP
- Stored in database Property table
- Loaded during `onModuleInit()`

---

## MarketData Service — Database Layer

**File:** `apps/api/src/services/market-data/market-data.service.ts`

Low-level CRUD for the MarketData table.

| Method | Purpose |
|--------|---------|
| `get()` | Fetch single record by dataSource/symbol/date |
| `getMax()` | Get highest price record for symbol |
| `getRange()` | Paginated fetch for date range (50K per page) |
| `getRangeCount()` | Count records in range |
| `updateMarketData()` | Upsert single record |
| `updateMany()` | Batch upsert via transaction |
| `replaceForSymbol()` | Atomic delete-then-insert (prevents data loss) |
| `deleteMany()` | Delete all data for symbol |

---

## API Endpoints

### GET /market-data/markets

Fear & Greed Index for stocks and cryptocurrencies.

**Response:**
```typescript
{
  fearAndGreedIndex: {
    CRYPTOCURRENCIES: SymbolItem,
    STOCKS: SymbolItem
  }
}
```

### GET /market-data/:dataSource/:symbol

All market data history for a symbol (admin).

**Response:** `{ assetProfile, marketData: MarketData[] }`

### POST /market-data/:dataSource/:symbol

Bulk upsert market data (admin).

**Body:** `{ marketData: [{ date, marketPrice }] }`

### GET /symbol/lookup?query=...

Symbol search across all providers. Min 2 characters.

### GET /symbol/:dataSource/:symbol

Current quote + optional historical data.

### GET /symbol/:dataSource/:symbol/:dateString

Historical price for a specific date.

---

## Data Enhancers

Post-processing pipeline to enrich asset profiles:

| Enhancer | What It Adds | Applies To |
|----------|-------------|-----------|
| Yahoo Finance | Countries, sectors, holdings, morningstarId | Most assets |
| OpenFIGI | FIGI identifiers | Stocks, ETFs |
| Trackinsight | Holdings, sectors, countries, CUSIP, ISIN | ETFs, Mutual Funds |

---

## Caching Strategy

| Level | Storage | TTL | Purpose |
|-------|---------|-----|---------|
| Quote Cache | Redis | 1 minute | Avoid repeated provider calls |
| INTRADAY Records | PostgreSQL | — | Persistence fallback |
| Benchmark Cache | Redis | 2 hours | Benchmark calculations |
| Derived Currencies | Computed | Per-request | Mathematical transformation |

---

## Configuration

| Env Var | Default | Purpose |
|---------|---------|---------|
| `DATA_SOURCES` | `[COINGECKO, MANUAL, YAHOO]` | Active providers |
| `DATA_SOURCE_EXCHANGE_RATES` | `YAHOO` | Currency conversion provider |
| `DATA_SOURCE_IMPORT` | `YAHOO` | Default for CSV imports |
| `CACHE_QUOTES_TTL` | `60000` (1 min) | Redis quote cache |
| `REQUEST_TIMEOUT` | `3000` (3 sec) | HTTP timeout |

---

## Agent Tool Capabilities

What `market_data` can answer:

| Question Type | Method | Example |
|--------------|--------|---------|
| Current price | getQuotes() | "What's AAPL trading at?" |
| Historical price | getHistorical() | "What was BTC price on Jan 1, 2025?" |
| Asset info | getAssetProfiles() | "What sector is MSFT in?" |
| Symbol search | search() | "Find ticker for Tesla" |
| Dividend history | getDividends() | "Show AAPL dividend history" |
| Market sentiment | GET /markets | "What's the Fear & Greed Index?" |
