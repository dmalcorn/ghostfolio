# Authentication Patterns

**Generated:** 2026-02-24
**Scope:** Auth flow, guards, permissions — what the AI agent needs for API calls
**Files:** `apps/api/src/app/auth/`, `apps/api/src/guards/`, `libs/common/src/lib/permissions.ts`

---

## Summary

Ghostfolio supports 5 authentication methods: **JWT** (primary), **API Key** (recommended for agent), **OAuth** (Google + OIDC), **WebAuthn**, and **Anonymous tokens**. Authorization uses a flat permission system with role-based mapping (60+ permissions across ADMIN, USER, DEMO, INACTIVE roles).

---

## Authentication Methods

### 1. JWT (Primary — All Clients)

**Strategy:** `passport-jwt`
**Header:** `Authorization: Bearer <token>`
**Secret:** `JWT_SECRET_KEY` environment variable
**Expiration:** 180 days

**Validation Flow:**
```
Request → Extract Bearer token → Verify JWT signature
  → Decode { id } → Fetch user from database
  → Check role (reject INACTIVE → 429)
  → Record analytics → Attach user to request
```

### 2. API Key (Recommended for Agent)

**Strategy:** `passport-headerapikey`
**Header:** `Authorization: Api-Key <key>`
**Hashing:** PBKDF2 (100,000 iterations, SHA256)
**Storage:** Hashed in `ApiKey` table

**How to use:**
1. Authenticate as user via JWT
2. Call `POST /api-keys` to generate key (requires `createApiKey` permission)
3. Use key in all subsequent requests: `Authorization: Api-Key <key>`
4. Key never expires (only revoked by user)

**Validation Flow:**
```
Request → Extract Api-Key header → Hash with PBKDF2
  → Lookup hashed key in database → Fetch associated user
  → Same checks as JWT (role, analytics)
```

### 3. Google OAuth

**Endpoints:**
- `GET /auth/google` — Redirect to Google consent screen
- `GET /auth/google/callback` — Process response, issue JWT

**Config:** `GOOGLE_CLIENT_ID`, `GOOGLE_SECRET`

### 4. OIDC (OpenID Connect)

**Endpoints:**
- `GET /auth/oidc` — Redirect to OIDC provider
- `GET /auth/oidc/callback` — Process response, issue JWT

**Config:** `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_SCOPE`
**Discovery:** Auto-discovers from `/.well-known/openid-configuration`

### 5. WebAuthn (FIDO2)

**Endpoints:**
- `POST /auth/webauthn/generate-registration-options`
- `POST /auth/webauthn/verify-attestation`
- `POST /auth/webauthn/generate-authentication-options`
- `POST /auth/webauthn/verify-authentication`

### 6. Anonymous Access Token

**Endpoint:** `POST /auth/anonymous` with `{ accessToken: string }`
**Returns:** `{ authToken: string }` (JWT)

---

## Authorization: Guards & Permissions

### HasPermissionGuard

**File:** `apps/api/src/guards/has-permission.guard.ts`

Enforces role-based access control via decorator.

**Usage:**
```typescript
@HasPermission(permissions.accessAdminControl)
@UseGuards(AuthGuard('jwt'), HasPermissionGuard)
public async adminEndpoint() { ... }
```

**Logic:**
1. Read `@HasPermission()` metadata from route handler
2. If no decorator → allow access
3. If decorator exists → check `request.user.permissions` array
4. Missing permission → 403 FORBIDDEN

### Permission System

**File:** `libs/common/src/lib/permissions.ts`

60+ permission strings mapped to roles via `getPermissions(role)`.

**Key Permissions for Agent:**

| Permission | Purpose | ADMIN | USER | DEMO |
|-----------|---------|:---:|:---:|:---:|
| `readAiPrompt` | Access AI features | Yes | Yes | Yes |
| `accessAssistant` | Use chat assistant | Yes | Yes | Yes |
| `accessHoldingsChart` | View holdings | Yes | Yes | Yes |
| `createOrder` | Record transactions | Yes | Yes | — |
| `readMarketData` | Read all market data | Yes | — | — |
| `readMarketDataOfOwnAssetProfile` | Read own asset data | — | Yes | — |
| `accessAdminControl` | Admin panel | Yes | — | — |
| `impersonateAllUsers` | View any user's data | Yes | — | — |
| `createApiKey` | Generate API key | Yes | Yes | — |

### Role Hierarchy

| Role | Level | Description |
|------|-------|-------------|
| ADMIN | Full | All permissions, admin panel, impersonation |
| USER | Standard | Own data access, basic operations |
| DEMO | Limited | Read-only, no modifications |
| INACTIVE | Blocked | All requests return 429 |

---

## User Context in Requests

**Type:** `RequestWithUser`

```typescript
type RequestWithUser = Request & {
  user: UserWithSettings
}
```

**UserWithSettings Shape:**
```typescript
{
  id: string
  role: Role
  provider: Provider
  accessesGet: Access[]         // Delegated access grants
  accounts: Account[]
  activityCount: number
  permissions?: string[]        // Flat permission array
  settings: Settings & {
    settings: UserSettings      // Language, currency, experimental flags
  }
  subscription?: {
    expiresAt?: Date
    offer: SubscriptionOffer
    type: SubscriptionType
  }
}
```

---

## Impersonation (Admin Feature)

**Header:** `Impersonation-Id: <userId>`

Allows admins to view another user's portfolio data.
- Requires `impersonateAllUsers` permission
- Target user's data is accessed while request runs as admin
- Used in portfolio endpoints for support/debugging

---

## Agent Authentication Strategy

**Recommended: API Key**

```
1. Create a service account user in database (role: USER or custom)
2. Assign appropriate permissions
3. Generate API key via POST /api-keys
4. Agent includes in every request:
   Authorization: Api-Key <key>
5. Agent inherits user's permissions and settings
```

**Why API Key over JWT:**
- No expiration (JWT expires in 180 days)
- No refresh mechanism needed
- Simpler header format
- Same validation pipeline, same user context

**Security Considerations:**
- API key should have **minimum required permissions**
- Store key securely (environment variable, secrets manager)
- Monitor via analytics (activityCount, lastRequestAt)
- Consider rate limiting for agent requests
