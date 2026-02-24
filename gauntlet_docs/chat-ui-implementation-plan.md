# Plan: AI Agent Chat Page

## Context

The AgentForge final submission requires a "Publicly accessible agent interface." The backend agent endpoint (`POST /api/v1/agent/chat`) is fully implemented with 3 tools, conversation history, verification, and error handling — but there is no frontend UI. This plan adds a chat page to the Angular client that follows all existing Ghostfolio patterns and will serve as the demo interface for the video and final submission.

## Files Overview

**New files (5):**
1. `apps/client/src/app/pages/ai-agent/ai-agent-page.component.ts`
2. `apps/client/src/app/pages/ai-agent/ai-agent-page.html`
3. `apps/client/src/app/pages/ai-agent/ai-agent-page.scss`
4. `apps/client/src/app/pages/ai-agent/ai-agent-page.routes.ts`
5. `libs/common/src/lib/interfaces/responses/agent-chat-response.interface.ts`

**Modified files (5):**
6. `libs/common/src/lib/interfaces/index.ts` — export new interfaces
7. `libs/common/src/lib/routes/routes.ts` — add `aiAgent` route entry
8. `libs/ui/src/lib/services/data.service.ts` — add `chatWithAgent()` method
9. `apps/client/src/app/app.routes.ts` — register lazy-loaded route
10. `apps/client/src/app/components/header/header.component.ts` + `.html` — add nav link

## Steps

### Step 1: Shared interfaces (`libs/common`)

Create `libs/common/src/lib/interfaces/responses/agent-chat-response.interface.ts` with:
- `AgentChatResponse` — response, toolCalls[], conversationId, verification[], metadata
- `AgentToolCallRecord` — name, input, output
- `AgentVerificationResult` — type, passed, details, severity
- `AgentChatMetadata` — model, tokensUsed, latencyMs

Export all from `libs/common/src/lib/interfaces/index.ts` (alphabetical, following existing pattern).

### Step 2: Route definition

Add `aiAgent` entry to `internalRoutes` in `libs/common/src/lib/routes/routes.ts`:
- Path: `ai-agent`
- RouterLink: `['/ai-agent']`
- Title: `AI Agent`

Place alphabetically after `adminControl`.

### Step 3: DataService method

Add `chatWithAgent()` to `libs/ui/src/lib/services/data.service.ts`:
- `POST /api/v1/agent/chat` with `{ message, conversationId }`
- Returns `Observable<AgentChatResponse>`
- JWT handled automatically by existing interceptor

### Step 4: Page component (core deliverable)

**Route file** (`ai-agent-page.routes.ts`):
- Single route with `AuthGuard`, component reference, title from `internalRoutes.aiAgent`

**Component** (`ai-agent-page.component.ts`):
- Standalone component with `host: { class: 'page' }`
- Selector: `gf-ai-agent-page`
- Local `ChatMessage` interface: role (user/agent), content, toolCalls?, verification?, metadata?, error?, timestamp
- State: `messages: ChatMessage[]`, `conversationId`, `isLoading`, `messageInput`
- Inject `DataService`, `UserService`, `ChangeDetectorRef`
- Permission check: `hasPermission(user.permissions, permissions.accessAgentChat)`
- `onSendMessage()`: push user message, call `chatWithAgent()`, push agent response
- `onNewConversation()`: reset messages and conversationId
- `onKeyDown()`: Enter (without Shift) sends message
- Auto-scroll to bottom after each message
- Error handling: 503 → "AI service unavailable", 400 → show message, other → generic

**Imports:**
- `MatFormFieldModule`, `MatInputModule` — textarea
- `MatButtonModule` — send/reset buttons
- `MatProgressSpinnerModule` — loading state
- `MatExpansionModule` — collapsible tool calls panel
- `MarkdownModule` from `ngx-markdown` (already globally provided)
- `TextFieldModule` from `@angular/cdk/text-field` — auto-resize textarea
- `IonIcon` from `@ionic/angular/standalone` — send/refresh icons
- `FormsModule` — ngModel for textarea
- `CommonModule` — ngClass

**Template** (`ai-agent-page.html`):
- Bootstrap `container` with `row`/`col` grid (consistent with all pages)
- Header: "AI Agent" title + "New Conversation" button
- Messages area: scrollable container with `@for` over messages
- Empty state when no messages: "Ask me about your portfolio"
- User messages: right-aligned bubble
- Agent messages: left-aligned bubble with markdown rendering
- Verification warnings: colored inline alerts below agent messages (only shown when `!passed`)
- Tool calls: collapsible `mat-expansion-panel` showing tool name + input JSON
- Metadata: subtle text line (model, latency, tokens)
- Loading: spinner with "Thinking..." text
- Input area: auto-resizing textarea + FAB send button, Enter to send

**Styles** (`ai-agent-page.scss`):
- Chat bubbles with border-radius (user right, agent left)
- Color via CSS custom properties (`--mat-sys-primary-container`, `--mat-sys-surface-variant`)
- Error messages with left red border
- Markdown content styles (tables, code blocks, pre)
- Responsive: wider bubbles on mobile
- Input area with top border separator

### Step 5: Register route in app routes

Add to `apps/client/src/app/app.routes.ts` after `adminControl` entry:
```typescript
{
  path: internalRoutes.aiAgent.path,
  loadChildren: () =>
    import('./pages/ai-agent/ai-agent-page.routes').then((m) => m.routes)
}
```

### Step 6: Header navigation link

In `apps/client/src/app/components/header/header.component.ts`:
- Add `hasPermissionToAccessAgentChat` boolean
- Add `routerLinkAiAgent = internalRoutes.aiAgent.routerLink`
- Set permission in the existing `ngOnChanges` method

In header template:
- Desktop: add nav link after Accounts, before Admin Control, guarded by `@if (hasPermissionToAccessAgentChat)`
- Mobile menu: add menu item in same location

## Verification

1. Start the client: `npm run start:client`
2. Log in, navigate to `/ai-agent`
3. Send a message like "What's in my portfolio?" — verify response renders with markdown
4. Check tool calls panel is collapsible and shows tool names
5. Send a follow-up message — verify conversationId is maintained
6. Click "New Conversation" — verify messages are cleared
7. Check mobile viewport — verify responsive layout
8. Run `npm run lint` and `npm run format:check` to verify code quality
