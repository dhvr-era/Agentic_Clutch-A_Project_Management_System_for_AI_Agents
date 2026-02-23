# Clutch — Agent Operations Control Room
**Status**: Deployed · Running
**Born**: 2026-02-21
**Deployed**: 2026-02-23
**Port**: 4002
**Access**: Tailscale VPN only (`http://100.64.0.1:4002`)

---

## What is Clutch?

Clutch is the **agent operations control room** — the primary interface for managing everything Genie orchestrates: projects, milestones, tasks, sub-agent approvals, and bot performance scoring.

```
4Context = infrastructure monitor (VPS health, tokens, security)
Clutch   = agent operations (projects, tasks, approvals, bot scores)
```

---

## Current Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite 7 + Tailwind 4 |
| Backend | Express 4 + Node.js (TypeScript, built to dist/) |
| Database | PostgreSQL — `agents_db` (agent_user) |
| Real-time | WebSocket (ws) — broadcasts task + token events |
| Deploy | systemd service (`clutch.service`), Tailscale-only |
| Auth | Bearer token (planned — systemd EnvironmentFile) |

---

## Seeded Agents (Production)

| Name | Tier | Role | Status |
|------|------|------|--------|
| Genie | Green | Orchestrator (parent) | running |
| Scraper Bot | Blue | Web data collection (child of Genie) | inactive |

---

## Database Schema

```sql
agents          — bot pool (id, name, parent_id, tier, openclaw_id, status)
tasks           — delegated tasks (agent_id, description, status, assigned_at)
token_usage     — per-agent token burn (tokens_in, tokens_out, cost_usd, timestamp)
logs            — agent log entries (agent_id, log_level, message, timestamp)
bot_scores      — Genie performance ratings per task (bot_id, task_id, score 0-100, review_notes)
bot_promotions  — tier promotion history (bot_id, from_tier, to_tier, reason)
project_reviews — end-of-project summaries (project_id, summary, improvements, avg_bot_score)
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/agents | List all agents |
| POST | /api/tasks | Create a task |
| GET | /api/dashboard | Aggregated dashboard data |

---

## Integration Points

```
Genie (OpenClaw) ──► POST /api/tasks     — creates tasks on delegation
Genie (OpenClaw) ──► GET  /api/agents    — reads bot registry + scores
4Context         ──► GET  /api/dashboard — summary widget (pending)
User             ──► Clutch UI           — approvals, overrides, reports
```

---

## Design Principles

- **Clutch is the approval gate** — Genie cannot proceed without user approval here
- **Mobile-first** — action-oriented, no clutter
- **Real-time** — WebSocket for live task + token updates
- **Bot scores drive promotion** — avg score over N tasks = tier advancement

---

## Build History

```
2026-02-21  Designed and planned
2026-02-23  Deployed to VPS
            - Fixed 4 bugs: port conflict, JS-in-SQL seed, no Postgres, Windows node_modules
            - Added /api/dashboard endpoint
            - Added bot_scores, bot_promotions, project_reviews tables
            - Seeded Genie + Scraper Bot as first two agents
            - Frontend built (Vite) and served from same origin
            - systemd service enabled + running
            - UFW: port 4002 on tailscale0 only
```

---

## Relationship to Other Systems

| System | Role |
|--------|------|
| 4Context (:4000) | Infrastructure monitor — VPS health, tokens, security |
| Clutch (:4002) | Agent control room — tasks, approvals, bot scores |
| OpenClaw (:18789) | Agentic engine — Genie orchestrates via this |
| Genie | Orchestrator — reads/writes Clutch, spawns bots |
