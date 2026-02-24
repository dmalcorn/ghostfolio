# Prisma Upgrade Analysis: 6.19.0 → 7.4.1

**Date:** 2026-02-23
**Decision:** Stay on Prisma 6
**Status:** Analysis complete — no action required

---

## Background

During dev container startup, `npm install` triggers `prisma generate` (via the `postinstall` hook), which displays the following notice:

```
┌─────────────────────────────────────────────────────────┐
│  Update available 6.19.0 -> 7.4.1                       │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘
```

This is an informational notice, not a deprecation or security warning. Prisma 6.19.0 continues to function correctly.

---

## Codebase Impact Assessment

### Scale of Prisma Usage

| Metric | Value |
|--------|-------|
| Files importing `@prisma/client` | **156** |
| Files in `apps/api/src` | 68 |
| Files in `libs/common/src` | 32 |
| Files in `apps/client/src` | 46 |
| Files in `libs/ui/src` | 10 |
| Total migration files | 107 |

### Feature Usage Audit

| Feature | Used? | Location | Prisma 7 Impact |
|---------|-------|----------|-----------------|
| PrismaClient instantiation | Yes | `apps/api/src/services/prisma/prisma.service.ts` | Must change (extends PrismaClient) |
| Middleware (`.use()`) | **No** | — | N/A |
| Metrics (`$metrics`) | **No** | — | N/A |
| Client Extensions (`$extends`) | Yes (1 location) | `apps/api/src/app/admin/admin.service.ts:702-746` | Medium effort — API changes |
| Interactive transactions | Yes (2 locations) | `apps/api/src/services/market-data/market-data.service.ts` | Syntax changes required |
| Raw queries (`$queryRawUnsafe`) | Yes (1 location) | `apps/api/src/services/data-provider/data-provider.service.ts:378` | Low effort |
| Seed file | Yes | `prisma/seed.mts` (already ESM) | Medium effort — import path changes |

---

## Migration Blockers

### 1. ESM-Only Requirement (HIGH)

Prisma 7 is ESM-only. The Ghostfolio API builds as CommonJS:

- `apps/api/tsconfig.app.json` sets `"module": "commonjs"`
- `tsconfig.base.json` sets `"module": "esnext"`

Converting the NestJS API from CJS to ESM is a significant refactor that ripples through Webpack config, every import in the API, and potentially NestJS module loading.

### 2. 156 Import Path Changes (HIGH)

Prisma 7 moves generated code out of `node_modules`. The new `prisma-client` generator requires an explicit `output` path (e.g., `../generated/prisma`). Every `import { ... } from '@prisma/client'` across 156 files must be updated to the new path.

### 3. Driver Adapters Now Required (MEDIUM)

Prisma 7 requires driver adapters for all databases. For PostgreSQL, this means adding `@prisma/adapter-pg` + `pg` as new dependencies and wiring them into `PrismaService`.

### 4. Generator Configuration Changes (LOW)

The `schema.prisma` generator must change:

**Current (Prisma 6):**
```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = []
  binaryTargets   = ["debian-openssl-3.0.x", "linux-arm64-openssl-3.0.x", "native"]
}
```

**Required for Prisma 7:**
```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}
```

- `binaryTargets` is removed entirely (Prisma 7 eliminated the Rust engine)
- `previewFeatures` is removed (empty anyway)
- `output` is now required

### 5. Behavioral Changes (LOW)

- `prisma migrate dev` and `prisma db push` no longer auto-run `prisma generate`
- Automatic seeding after `prisma migrate dev` / `prisma migrate reset` is removed
- `--skip-generate` and `--skip-seed` flags removed
- `--schema` and `--url` flags removed from `prisma db execute`

---

## Benefits of Prisma 7 (If Upgraded)

| Benefit | Detail |
|---------|--------|
| 3x faster queries | Biggest gains on large result sets |
| 90% smaller bundle | 14MB → 1.6MB (7MB → 600KB gzipped) |
| No platform-specific binaries | Eliminates `binaryTargets` headaches |
| 70% faster type generation | Collaboration with ArkType creator |
| New Prisma Studio | Rich relationship visualization |
| TypeScript-native engine | No Rust/WASM boundary overhead |

---

## Decision: Stay on Prisma 6

### Rationale

1. **Disproportionate effort for a brownfield project.** The ESM migration alone is a multi-day effort with high regression risk across 156 files and the entire API module system.

2. **Prisma 6.19.0 is functional and stable.** The "update available" notice is informational. There are no known security vulnerabilities or critical bugs forcing an upgrade.

3. **Performance gains are not a bottleneck.** The 3x query speed and 90% bundle reduction are meaningful for high-scale applications but unlikely to be a bottleneck for a personal finance tracker.

4. **Prisma 7 is still maturing.** At version 7.4.1, there are still patch releases being issued for regressions (e.g., cursor-based pagination fix in 7.4.1). Letting it mature reduces early-adoption risk.

5. **Better to bundle with a larger refactor.** If the project later migrates to full ESM (e.g., alongside a NestJS or Angular major version bump), the Prisma 7 upgrade can be absorbed into that effort at lower marginal cost.

### When to Reconsider

- If Prisma 6 reaches end-of-life or stops receiving security patches
- If the project migrates to full ESM for other reasons
- If a NestJS major version upgrade creates a natural opportunity
- If Prisma 7 reaches a more mature state (7.x.x) with proven stability

---

## References

- [Prisma 7 Release Announcement](https://www.prisma.io/blog/announcing-prisma-orm-7-0-0)
- [Upgrade to Prisma ORM 7 — Official Guide](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7)
- [Prisma 7.4.1 Release Notes](https://github.com/prisma/prisma/releases/tag/7.4.1)
- [Prisma Changelog](https://www.prisma.io/changelog)
