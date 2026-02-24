# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CollabBoard is a real-time collaborative whiteboard SPA. Users sign in (Google or email/password), then interact with an infinite canvas containing sticky notes, rectangles, and multiplayer cursors — all synced via Firestore.

## Commands

| Command                                  | Purpose                                     |
| ---------------------------------------- | ------------------------------------------- |
| `npm run serve`                          | Dev server (localhost:8080) with hot reload |
| `npm run build`                          | Production build to `dist/`                 |
| `npm run lint`                           | ESLint with auto-fix                        |
| `npm test`                               | Run Jest tests                              |
| `npm run test:watch`                     | Jest in watch mode                          |
| `firebase deploy --only hosting`         | Deploy frontend to Firebase Hosting         |
| `firebase deploy --only firestore:rules` | Deploy Firestore security rules             |

Run a single test file: `npx jest src/__tests__/useAuth.spec.ts`

## Architecture

**Stack:** Vue 3 + TypeScript + Konva (canvas) + Firebase (Auth, Firestore)

### Data flow

All real-time sync goes through Firestore `onSnapshot` listeners. There is one shared board (`boardId = 'default'`). Writes use last-write-wins; there is no conflict resolution.

```
App.vue  ──>  composables  ──>  Firestore
                                  ├── boards/default          (view: pan/zoom state)
                                  ├── boards/default/objects  (stickies, rectangles)
                                  └── boards/default/cursors  (per-user cursor + name)
```

### Key composables (`src/composables/`)

- **useAuth** — Firebase Auth state, sign-in (Google/email), sign-out. Uses `onAuthStateChanged` listener.
- **useBoardObjects** — CRUD for stickies and rectangles. Subscribes to `boards/{boardId}/objects` collection. Exports reactive `boardObjects` ref.
- **useCursorSync** — Writes current user's cursor position to Firestore, subscribes to others' cursors. Throttled at 25ms via `requestAnimationFrame`.
- **useViewSync** — Shared pan/zoom state on the board document's `view` field. All users see the same viewport.

### Component structure

- **App.vue** — Auth gate: shows `AuthLogin` or the main app (header + `Whiteboard`). Wires composables together, derives presence from cursor data.
- **Whiteboard.vue** — Konva `v-stage` with layers: background, stickies, shapes, cursors. Handles pan (stage drag), zoom (wheel), object create/move/edit. Receives composable methods as props. Includes toolbar and FPS/performance overlay.
- **AuthLogin.vue** (`src/views/`) — Google and email/password sign-in/sign-up form.

### Firebase config (`src/firebase.ts`)

Reads `VUE_APP_FIREBASE_*` env vars (6 total). `vue.config.js` explicitly loads `.env` / `.env.local` and injects them via `webpack.DefinePlugin`. For local dev use `.env.local`; for production builds use `.env.production`. Neither file is committed.

### Cloud Functions (`functions/`)

Scaffolded but currently empty (no exported functions). Uses Firebase Functions v7 with `maxInstances: 10` global option. Has its own `package.json` — run `npm install` inside `functions/` separately.

## Testing

Tests live in `src/__tests__/*.spec.ts`. Jest is configured with `ts-jest`, `jsdom` environment, and `@vue/vue3-jest` for `.vue` transforms. The `@/` path alias maps to `src/`.

Tests mock Firebase modules (`firebase/auth`, `firebase/firestore`, `../firebase`) so they run fully offline.

## Environment Setup

Firebase config requires six `VUE_APP_FIREBASE_*` environment variables in `.env.local` (dev) or `.env.production` (prod). The app uses separate Firebase projects for dev and production. See `docs/Dev-Environment-Setup.md` for details.

## Firestore Rules

`firestore.rules` requires authentication for all operations. Cursor documents enforce `request.auth.uid == userId` for writes. Deploy with: `firebase deploy --only firestore:rules`.

## Throttling

- Cursor writes: 25ms throttle + `requestAnimationFrame`
- Object drag writes: 80ms throttle (batched during drag, final write on dragend)
- View (pan/zoom) writes: 60ms throttle

## Agent Teams Orchestration

This project uses Claude Code Agent Teams for parallel development. The epics and stories document is at `_bmad-output/planning-artifacts/epics.md`.

### Team Structure

| Teammate         | File Ownership                                | Epics  |
| ---------------- | --------------------------------------------- | ------ |
| **Lead**         | `firestore.rules`, `CLAUDE.md`, shared config | E0, E5 |
| **Frontend Dev** | `src/**`, `package.json`, `tsconfig.json`     | E1, E3 |
| **Agent Dev**    | `agent/**`, `docker-compose.yml`              | E2, E4 |

### File Ownership Rules (CRITICAL)

- **Never modify files outside your ownership boundary.** If a story references files outside your boundary, read them for context but do not edit them.
- **Shared read-only files:** `src/types/board.ts` (Frontend Dev creates, Agent Dev reads for reference), `firestore.rules` (Lead owns).
- **If you need a change outside your boundary**, message the owning teammate with the specific change needed and why.

### Firestore Schema Contract

This is the shared interface between frontend and agent. All Firestore field names use **camelCase**.

```
boards/{boardId}                    → { name, createdAt, createdBy }
boards/{boardId}/objects/{objectId} → { type, x, y, width, height, text?, color, createdBy, createdAt, updatedAt }
boards/{boardId}/cursors/{userId}   → { x, y, name, updatedAt }
boards/{boardId}/views/{userId}     → { x, y, scale }
```

- **Frontend:** TypeScript interfaces in `src/types/board.ts`
- **Agent:** Pydantic models with `alias_generator=to_camel` (snake_case in Python, camelCase in JSON)
- **Object types:** `"sticky"` and `"rectangle"` only for MVP

### Naming Conventions

| Context                 | Convention                                | Example                         |
| ----------------------- | ----------------------------------------- | ------------------------------- |
| Firestore fields        | camelCase                                 | `createdBy`, `updatedAt`        |
| TypeScript interfaces   | PascalCase types, camelCase fields        | `BoardObject.createdBy`         |
| Python variables        | snake_case                                | `board_id`, `created_by`        |
| Python → Firestore JSON | camelCase via Pydantic alias              | `boardId` in JSON               |
| Vue components          | PascalCase files, kebab-case in templates | `BoardList.vue`, `<board-list>` |
| Vue composables         | camelCase, `use` prefix                   | `useBoardObjects`               |
| API endpoints           | kebab-case paths                          | `POST /api/command`             |

### Parallel Execution Timeline

```
E0 (Lead, solo)     ━━━ [2h]
                     ↓
E1 (Frontend Dev)   ━━━━━━━━━━━ [8h]     ← PARALLEL
E2 (Agent Dev)      ━━━━━━━━━━━ [8h]     ← PARALLEL
                         ↓
E3 (Frontend Dev)   ━━━━━━━ [4h]          ← PARALLEL
E4 (Agent Dev)      ━━━━━━━ [4h]          ← PARALLEL
                         ↓
E5 (Either/Lead)    ━━━━━━━ [4h]
```

### MUST PASS Boundary

**Epics 0-4 = passing submission. Epic 5 = polish/bonus.** Prioritize accordingly.

### Agent Commands

| Command                                                                                                                                       | Purpose                                   |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `docker-compose up --build`                                                                                                                   | Build and start agent service (port 8000) |
| `docker-compose down`                                                                                                                         | Stop agent service                        |
| `curl http://localhost:8000/health`                                                                                                           | Agent health check                        |
| `curl -X POST http://localhost:8000/api/command -H "Content-Type: application/json" -d '{"boardId":"test","command":"hello","userId":"dev"}'` | Test agent command (with SKIP_AUTH=true)  |

### Agent Environment Variables

The agent service (`agent/.env`) is pre-created with keys. It contains:

- `FIREBASE_PROJECT_ID=collabboard-mvp-dev` — Firebase project ID
- Firebase auth uses **Application Default Credentials (ADC)** — no service account JSON. ADC is mounted into Docker via `docker-compose.yml` volume from the host's gcloud credentials (`$APPDATA/gcloud/application_default_credentials.json`). Initialize with: `firebase_admin.initialize_app(options={'projectId': os.environ['FIREBASE_PROJECT_ID']})`.
- `LANGCHAIN_API_KEY` — LangSmith API key (set)
- `LANGCHAIN_TRACING_V2=true` — Enable LangSmith tracing (set)
- `LANGCHAIN_PROJECT=collabboard-agent` — LangSmith project name (set)
- `LLM_API_KEY` — OpenAI API key (set). Use `ChatOpenAI` from `langchain-openai`, NOT `ChatAnthropic`.
- `LLM_PROVIDER=openai` — LLM provider identifier
- `SKIP_AUTH=true` — Set for local dev (change to `false` for production)

### Frontend-to-Agent Auth Flow

1. Frontend gets Firebase ID token: `await auth.currentUser.getIdToken()`
2. Sends in header: `Authorization: Bearer {token}`
3. Agent verifies via Admin SDK: `firebase_admin.auth.verify_id_token(token)`
4. Agent uses verified UID from token (not request body) for Firestore writes

### Story Reference

Each story in `_bmad-output/planning-artifacts/epics.md` includes:

- User story in As a/I want/So that format
- Given/When/Then acceptance criteria
- **Agent Teams Metadata**: teammate assignment, task dependencies, files to create/modify, acceptance tests, completion messages, estimated effort, parallelism notes

**Read the full story before starting implementation.** The metadata section contains the specific files, patterns, and tests you need.
