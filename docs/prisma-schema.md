# Prisma Schema & Data Models

**Generated:** 2026-02-24
**Scope:** Database models relevant to AI agent tools
**File:** `prisma/schema.prisma`

---

## Summary

PostgreSQL database with Prisma 6.19.0 ORM. 17 core models, 10 enums. The critical data flow for agent tools is: **User → Account → Order → SymbolProfile → MarketData**.

**Important:** Do NOT upgrade to Prisma 7 (per project decision).

---

## Core Models for Agent Tools

### User

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (uuid) | PK |
| `provider` | Provider enum | ANONYMOUS, GOOGLE, OIDC, INTERNET_IDENTITY |
| `role` | Role enum | ADMIN, USER, DEMO, INACTIVE |
| `accessToken` | String? | OAuth token |
| `createdAt` | DateTime | Account creation |
| `updatedAt` | DateTime | Auto-updated |

**Key Relations:** accounts[], activities (Order[]), tags[], watchlist (SymbolProfile[]), settings, subscription[]

### Account

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | Composite PK with userId |
| `userId` | String | FK → User |
| `name` | String? | User-friendly name |
| `platformId` | String? | FK → Platform |
| `currency` | String? | Account base currency |
| `balance` | Float | Current balance (default: 0) |
| `isExcluded` | Boolean | Exclude from portfolio calculations |

**Composite PK:** `(id, userId)`
**Relations:** activities (Order[]), balances (AccountBalance[]), platform

### Order (Transaction/Activity)

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (uuid) | PK |
| `userId` | String | FK → User |
| `accountId` | String? | FK → Account (composite) |
| `symbolProfileId` | String | FK → SymbolProfile |
| `type` | Type enum | BUY, SELL, DIVIDEND, FEE, INTEREST, LIABILITY |
| `quantity` | Float | Number of units |
| `unitPrice` | Float | Price per unit |
| `fee` | Float | Transaction fee |
| `currency` | String? | Transaction currency |
| `date` | DateTime | Transaction date |
| `isDraft` | Boolean | Draft status |

**Relations:** SymbolProfile, tags (Tag[], many-to-many), account (Account)

### SymbolProfile

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (uuid) | PK |
| `dataSource` | DataSource enum | YAHOO, COINGECKO, etc. |
| `symbol` | String | Trading symbol |
| `currency` | String | Quote currency |
| `name` | String? | Human name |
| `assetClass` | AssetClass? | EQUITY, FIXED_INCOME, etc. |
| `assetSubClass` | AssetSubClass? | STOCK, ETF, BOND, etc. |
| `isin` | String? | ISIN identifier |
| `cusip` | String? | CUSIP identifier |
| `figi` | String? | FIGI identifier |
| `isActive` | Boolean | Delisted = false |
| `holdings` | Json? | Top holdings (ETF decomposition) |
| `sectors` | Json? | Sector allocations |
| `countries` | Json? | Geographic exposures |
| `scraperConfiguration` | Json? | Web scraping config |

**Unique:** `(dataSource, symbol)`
**Relations:** activities (Order[]), SymbolProfileOverrides, watchedBy (User[])

### MarketData

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (uuid) | PK |
| `dataSource` | DataSource enum | Price source |
| `symbol` | String | Trading symbol |
| `date` | DateTime | Price date |
| `marketPrice` | Float | Price in quote currency |
| `state` | MarketDataState | CLOSE or INTRADAY |

**Unique:** `(dataSource, date, symbol)`

### AccountBalance

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (uuid) | PK |
| `accountId` | String | FK → Account |
| `userId` | String | FK → User |
| `date` | DateTime | Snapshot date |
| `value` | Float | Account value |

**Unique:** `(accountId, date)`

---

## Supporting Models

### Tag
- `id`, `name`, `userId?`
- Many-to-many with Order
- Unique: `(name, userId)`

### Platform
- `id`, `name?`, `url` (unique)
- One-to-many with Account

### Access
- `id`, `userId` (grantor), `granteeUserId?`
- `permissions`: AccessPermission[] (READ, READ_RESTRICTED)
- `settings`: Json

### Settings
- `userId` (PK), `settings` (Json)
- Stores: language, timezone, currency, isExperimentalFeatures

### SymbolProfileOverrides
- `symbolProfileId` (PK, FK → SymbolProfile)
- Override: `name?`, `assetClass?`, `assetSubClass?`, `sectors?`, `countries?`, `holdings?`
- Agent should prefer overrides over base data

### Property
- `key` (PK), `value`
- System key-value store (API keys, model names, feature flags)

---

## Enums

### DataSource
```
ALPHA_VANTAGE | COINGECKO | EOD_HISTORICAL_DATA |
FINANCIAL_MODELING_PREP | GHOSTFOLIO | GOOGLE_SHEETS |
MANUAL | RAPID_API | YAHOO
```

### Type (Transaction)
```
BUY | SELL | DIVIDEND | FEE | INTEREST | LIABILITY
```

### AssetClass
```
EQUITY | FIXED_INCOME | COMMODITY | LIQUIDITY |
REAL_ESTATE | ALTERNATIVE_INVESTMENT
```

### AssetSubClass
```
STOCK | ETF | MUTUALFUND | BOND | CASH |
CRYPTOCURRENCY | COMMODITY | PRECIOUS_METAL |
PRIVATE_EQUITY | COLLECTIBLE
```

### Role
```
ADMIN | USER | DEMO | INACTIVE
```

### MarketDataState
```
CLOSE | INTRADAY
```

### AccessPermission
```
READ | READ_RESTRICTED
```

### Provider
```
ANONYMOUS | GOOGLE | INTERNET_IDENTITY | OIDC
```

---

## Critical Data Flow for Agent Tools

### Portfolio Analysis
```
User → Account[] → Order[] → SymbolProfile → MarketData
                                    ↓
                              sectors, countries, holdings (JSON)
                                    ↓
                        SymbolProfileOverrides (corrections)
```

### Market Data Lookup
```
SymbolProfile (by symbol + dataSource)
  → MarketData (time-series prices)
  → AssetClass + sectors + countries (classification)
```

### Benchmark Comparison
```
Portfolio (Order + SymbolProfile aggregation)
  → vs Benchmark MarketData time-series
  → Currency conversion via ExchangeRateData
```

---

## Cascading Deletes

- User deleted → all Access, Account, Order, Tag, ApiKey, Subscription
- Account deleted → all Order, AccountBalance
- SymbolProfile deleted → SymbolProfileOverrides

---

## PrismaService Pattern

**File:** `apps/api/src/services/prisma/prisma.service.ts`

- Extends `PrismaClient` as NestJS injectable singleton
- `onModuleInit()` → connects to database
- `onModuleDestroy()` → disconnects
- Modules import `PrismaModule` to inject `PrismaService`

```typescript
// Usage pattern throughout codebase:
this.prisma.user.findUnique({ where: { id } })
this.prisma.order.findMany({ where: { userId }, include: { tags: true } })
this.prisma.marketData.findFirst({ where: { symbol, date } })
this.prisma.$transaction([...operations])
```
