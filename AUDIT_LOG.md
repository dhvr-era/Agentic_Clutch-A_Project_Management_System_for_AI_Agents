# Clutch — Audit Log

> Tracks all development activities, fixes, and changes to the Clutch project.
> Format: `[DATE] [TYPE] — Description`
> Types: BUILD, FIX, FEAT, REFACTOR, SECURITY, DEPLOY, CONFIG, SCHEMA

---

## 2026-02-22

### [BUILD] Initial Project Scaffold
- Created React 19 + TypeScript + Vite 7 + Tailwind 4 frontend
- Created Express 4 + Node.js TypeScript backend
- Defined PostgreSQL schema: `agents`, `tasks`, `token_usage`, `logs`
- Initial component structure: Dashboard, Agents, Tasks, Projects, Operations, Analytics, Missions, Sources, Activity

### [FEAT] UI Consistency Pass
- Standardized component styling across all pages
- Added `BottomNav.tsx`, `MetricCard.tsx`, `Panel.tsx` shared components
- Added mock data layer: `frontend/src/data/agents.ts`
- Defined TypeScript types: `agent.ts`, `mission.ts`, `project.ts`, `activity.ts`, `task.ts`
- Commit: `7dfa992` — "Enhance UI consistency"

---

## 2026-02-23

### [SECURITY] OWASP Security Audit + UI Overhaul
- Applied OWASP Top 10 + LLM security audit recommendations across frontend
- Rebuilt `DashboardPage.tsx` — full layout overhaul (511 lines changed)
- Added `TopBar.tsx` — new top navigation bar component
- Added `PageHeader.tsx` — shared page header layout component
- Added `MissionPipeline.tsx` — new mission pipeline view (209 lines)
- Rebuilt `MissionBoard.tsx` — stripped to focused mission board
- Refactored `OperationsPanel.tsx` — UI alignment (169 lines changed)
- Refactored `ProjectsPage.tsx` — large layout restructure (448 lines changed)
- Refactored `Sidebar.tsx` — navigation overhaul (107 lines changed)
- Updated `App.tsx` — routing and layout adjustments (257 lines changed)
- Updated `index.css` — theme and base style cleanup (125 lines changed)
- Added `replaceColors.mjs` — utility: bulk color token replacement
- Added `replaceRemainingHex.mjs` — utility: replaces leftover hardcoded hex values
- Added `themeChanger.mjs` — utility: theme-wide color swap script
- Updated `AgentDetail.tsx`, `AgentFleetView.tsx`, `AgentRack.tsx`
- Updated `AnalyticsPage.tsx`, `OperationsPage.tsx`, `SourcesPage.tsx`, `TasksPage.tsx`
- Updated `CreateAgentModal.tsx`, `CreateProjectModal.tsx`, `CreateTaskModal.tsx`
- Updated `ActivityFeed.tsx`, `BottomNav.tsx`, `MetricCard.tsx`
- Recorded TypeScript errors to `errors.txt` (pre-fix state)
- Commit: `ce60257` — "Apply UI changes and OWASP security audit updates"

### [CONFIG] Repository Cleanup
- Removed 4Context directory from git tracking (separate project — wrong repo)
- Added `.gitignore` entries: `backend/node_modules`, `backend/dist`, `frontend/dist`
- Commit: `c4da106` — "Remove 4Context directory from repository tracking"

### [FIX] VPS Deployment Fixes (9 issues resolved)
- **Port conflict**: Changed backend port `4000 → 4002` (4000 was taken by 4Context Hub)
- **Tailscale bind**: Server now binds to `100.64.0.1` (Tailscale IP only — no public exposure)
- **Missing endpoint**: Added `/api/dashboard` — its absence caused the frontend splash to hang indefinitely
- **Static file serving**: Backend now serves built frontend from same origin (no separate nginx needed)
- **404 catch-all**: Fixed — unmatched `/api/*` routes now return proper `404 JSON` instead of falling through
- **JS-in-SQL seed bug**: Fixed `db.ts` — JS template literals inside raw SQL caused Postgres syntax error on init
- **Schema expansion**: Added tables `bot_scores`, `bot_promotions`, `project_reviews`
- **Initial seed**: Seeded `Genie` (Green / orchestrator) + `Scraper Bot` (Blue / worker) on first DB init
- **Windows node_modules**: Removed Windows-built binaries from repo; clean install on Linux
- Commit: `f17c824` — "fix: deploy Clutch to VPS — port, DB, dashboard API, bot seed"

### [DEPLOY] Clutch Goes Live
- Built frontend: `npm run build` → `frontend/dist/`
- Built backend: `tsc` → `backend/dist/`
- Created `clutch.service` systemd unit — enabled + running
- UFW rule: port `4002` open on `tailscale0` interface only
- Access confirmed at `http://100.64.0.1:4002` (Tailscale VPN only)
- MANIFEST.md written: stack, schema, seeded agents, API endpoints, integration points documented

---

## 2026-02-24

### [ADMIN] Audit Log Created
- Created this file (`AUDIT_LOG.md`) to track all ongoing development activities
- Reconstructed history from git log and MANIFEST

### [FEAT] Genie / OpenClaw Bridge — Backend
- Added `GET /api/openclaw/status` — queries live OpenClaw sessions via CLI, checks port 18789, returns gateway state + active model + session list
- Added `POST /api/openclaw/dispatch` — sends task messages directly to Genie; logs dispatch to DB; broadcasts `task_dispatched` over WebSocket
- Added `GET /api/usage/live` — reads real token usage from `/root/privacy-proxy/usage.jsonl` (last 100 entries); replaces all fake token data
- Added `openClawEnv()` helper — reads `/root/.openclaw/.env` at runtime so backend inherits correct API keys without systemd dependency
- All three endpoints added to `backend/src/server.ts`

### [FEAT] Genie / OpenClaw Bridge — Frontend
- Added `OpenClawStatus.tsx` component — displays live gateway state, active model, session count
- Wired `DashboardPage.tsx` to poll `/api/openclaw/status`
- Wired `App.tsx` to consume OpenClaw bridge endpoints
- `SourcesPage.tsx` updated to reference live OpenClaw + 4Context connection status

### [REFACTOR] Mock / False Data Removed
- `frontend/src/data/agents.ts`: cleared `AGENTS_INITIAL` and `AGENTS` arrays (were populated with hardcoded fake agents)
- Agents now loaded live from PostgreSQL via `GET /api/agents`
- Token usage now sourced from Privacy Proxy `usage.jsonl` via `GET /api/usage/live`
- Dashboard data now entirely DB-driven via `GET /api/dashboard`

### [CONFIG] Kimi K2.5 Set as Core Model
- `openclaw.json` → `agents.defaults.model.primary` set to `custom-localhost-8000/moonshotai/kimi-k2.5`
- Model registered in both `openclaw.json` and `agents/main/agent/models.json`
- Specs: 262,144 token context window, 16,384 max output tokens, routed through Privacy Proxy (:8000)
- Previous primary was `x-ai/grok-4.1-fast` (131k context) — Kimi K2.5 doubles the context window
- Grok 4.1 Fast retained as fallback model

### [FEAT] Clutch ↔ 4Context Integration Points Established
- Clutch backend (`/api/openclaw/status`) provides data that 4Context Agents pane summary widget will consume
- Clutch (`/api/dashboard`) is the canonical source for agent/task state across the stack
- Integration flow confirmed: `Genie (OpenClaw) → POST /api/tasks → Clutch DB → WebSocket broadcast → UI`

---

### [FIX] Ping Genie — Command Routing (3 bugs resolved)
- **Bug 1**: dispatch used `--channel telegram` — wrong; requires `--to`, `--session-id`, or `--agent`
- **Fix 1**: changed to `--agent main` — correct target for primary Genie session
- **Bug 2**: `--agent main` competed with the live gateway process which holds a persistent lock on `agent:main:main` session file; caused `FailoverError: session file locked` and exit code 1
- **Fix 2**: switched to `--session-id clutch-bridge-001` — dedicated Clutch session, never locked by gateway
- **Bug 3**: `channel` parameter was being accepted in POST body but had no effect; removed it to avoid confusion
- **Result**: `POST /api/openclaw/dispatch` returns `{"ok": true}` and Genie replies reliably via dedicated session
- Note: gateway shows "pairing required" warning on every call (device auth mismatch since gateway restart) — this is cosmetic; embedded fallback works correctly with dedicated session

### [FIX] Dropdown Styling — All Selects Across Portal
- **Problem**: all `<select>` dropdowns rendered with white/system background for `<option>` elements — Tailwind utility classes (e.g. `bg-black/5`, `bg-transparent`) do not affect browser-native option rendering
- **Fix**: added global `@layer base` CSS rules in `frontend/src/index.css` for `select`, `select option`, and `select option:checked/:hover`
- All dropdowns now: black background (`#1a1a1f`), white text (`--text-main`), slightly lighter on hover/checked (`#2a2a32`)
- Applies to all select elements across the portal: Dashboard, Operations, Agents, Tasks, Projects, Modals (CreateAgent, CreateTask, CreateProject)
- Both backend and frontend rebuilt and redeployed; `clutch.service` restarted

<!-- New entries go below this line, one section per date -->
