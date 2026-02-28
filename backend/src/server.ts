import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join, resolve, basename } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { createHmac, timingSafeEqual } from 'crypto';
import { pool, initDB } from './db.js';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
// Capture raw body for HMAC verification before JSON parsing
app.use(express.json({
    verify: (req: any, _res, buf) => { req.rawBody = buf; }
}));

// ── HMAC Webhook Auth ──────────────────────────────────────────────────────────
// Bots sign POST payloads with HMAC-SHA256(WEBHOOK_SECRET, rawBody).
// Pass the hex digest in the X-Webhook-Signature header.
// If WEBHOOK_SECRET is not set in environment, verification is skipped (dev mode).
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';
if (!WEBHOOK_SECRET) {
    console.warn('[SECURITY] WEBHOOK_SECRET not set — bot webhook signatures are NOT verified (dev mode only)');
}

function verifyWebhookSig(rawBody: Buffer | string, signature: string): boolean {
    if (!WEBHOOK_SECRET) return true; // dev mode: skip
    const expected = createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');
    try {
        // timingSafeEqual prevents timing-based attacks
        return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
    } catch { return false; }
}

function webhookAuth(req: any, res: any, next: any) {
    if (!WEBHOOK_SECRET) return next();
    const sig = (req.headers['x-webhook-signature'] as string) || '';
    if (!sig) return res.status(401).json({ error: 'Missing X-Webhook-Signature header' });
    if (!verifyWebhookSig(req.rawBody || '', sig)) {
        console.warn('[SECURITY] Invalid webhook signature from', req.ip);
        return res.status(401).json({ error: 'Invalid webhook signature' });
    }
    next();
}

// ── OpenClaw env loader (mirrors what systemd loads for openclaw-gateway) ──────
function openClawEnv(): Record<string, string> {
    try {
        const raw = readFileSync('/root/.openclaw/.env', 'utf-8');
        const env: Record<string, string> = {};
        for (const line of raw.split('\n')) {
            const clean = line.trim();
            if (!clean || clean.startsWith('#')) continue;
            const idx = clean.indexOf('=');
            if (idx > 0) env[clean.slice(0, idx).trim()] = clean.slice(idx + 1).trim();
        }
        return env;
    } catch { return {}; }
}

// ── Broadcast helper ───────────────────────────────────────────────────────────
function broadcast(eventName: string, data: any) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ event: eventName, data }));
        }
    });
}

// ── Projects ───────────────────────────────────────────────────────────────────
app.get('/api/projects', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
        res.json(result.rows);
    } catch { res.status(500).json({ error: 'Database error' }); }
});

app.post('/api/projects', async (req, res) => {
    const { title, description, lead_agent_id, status } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    try {
        const result = await pool.query(
            'INSERT INTO projects (title, description, lead_agent_id, status) VALUES ($1, $2, $3, $4) RETURNING *',
            [title, description || null, lead_agent_id || 1, status || 'active']
        );
        broadcast('project_created', result.rows[0]);
        res.json(result.rows[0]);
    } catch { res.status(500).json({ error: 'Database error' }); }
});

app.patch('/api/projects/:id', async (req, res) => {
    const { title, description, status } = req.body;
    try {
        const result = await pool.query(
            `UPDATE projects SET
               title = COALESCE($1, title),
               description = COALESCE($2, description),
               status = COALESCE($3, status),
               updated_at = NOW()
             WHERE id = $4 RETURNING *`,
            [title || null, description || null, status || null, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    } catch { res.status(500).json({ error: 'Database error' }); }
});

// ── Agents ─────────────────────────────────────────────────────────────────────
app.get('/api/agents', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM agents ORDER BY id ASC');
        res.json(result.rows);
    } catch {
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/api/agents', async (req, res) => {
    const { name, parent_id, tier, openclaw_id, status } = req.body;
    if (!name || !tier) return res.status(400).json({ error: 'name and tier required' });
    const validTiers = ['Green', 'Blue', 'Red'];
    if (!validTiers.includes(tier)) return res.status(400).json({ error: 'tier must be Green, Blue, or Red' });
    try {
        const result = await pool.query(
            'INSERT INTO agents (name, parent_id, tier, openclaw_id, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, parent_id || null, tier, openclaw_id || null, status || 'inactive']
        );
        broadcast('agent_registered', result.rows[0]);
        res.json(result.rows[0]);
    } catch {
        res.status(500).json({ error: 'Database error' });
    }
});

app.patch('/api/agents/:id/status', async (req, res) => {
    const { status } = req.body;
    const allowed = ['active', 'inactive', 'running', 'error'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    try {
        const result = await pool.query(
            'UPDATE agents SET status = $1 WHERE id = $2 RETURNING *',
            [status, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Agent not found' });
        broadcast('agent_updated', result.rows[0]);
        res.json(result.rows[0]);
    } catch {
        res.status(500).json({ error: 'Database error' });
    }
});

// ── Tasks ──────────────────────────────────────────────────────────────────────
app.get('/api/tasks', async (req, res) => {
    const { project_id } = req.query;
    try {
        const q = project_id
            ? `SELECT t.*, a.name as agent_name FROM tasks t LEFT JOIN agents a ON t.agent_id = a.id WHERE t.project_id = $1 ORDER BY t.assigned_at DESC LIMIT 50`
            : `SELECT t.*, a.name as agent_name FROM tasks t LEFT JOIN agents a ON t.agent_id = a.id ORDER BY t.assigned_at DESC LIMIT 50`;
        const result = await pool.query(q, project_id ? [project_id] : []);
        res.json(result.rows);
    } catch {
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/api/tasks', async (req, res) => {
    const { agent_id, description, project_id } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO tasks (agent_id, description, project_id) VALUES ($1, $2, $3) RETURNING *',
            [agent_id, description, project_id || null]
        );
        broadcast('new_task', result.rows[0]);
        res.json(result.rows[0]);
    } catch {
        res.status(500).json({ error: 'Database error' });
    }
});

app.patch('/api/tasks/:id/status', async (req, res) => {
    const { status } = req.body;
    const allowed = ['pending', 'in_progress', 'done', 'failed'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    try {
        const result = await pool.query(
            'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
            [status, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
        broadcast('task_updated', result.rows[0]);
        res.json(result.rows[0]);
    } catch {
        res.status(500).json({ error: 'Database error' });
    }
});

app.patch('/api/tasks/:id/progress', async (req, res) => {
    const { progress, status_message, status } = req.body;
    if (progress === undefined) return res.status(400).json({ error: 'progress required' });
    if (progress < 0 || progress > 100) return res.status(400).json({ error: 'progress must be 0–100' });
    try {
        const result = await pool.query(
            `UPDATE tasks SET
                progress = $1,
                status_message = COALESCE($2, status_message),
                status = COALESCE($3, status)
             WHERE id = $4 RETURNING *`,
            [progress, status_message || null, status || null, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
        broadcast('task_progress', result.rows[0]);
        res.json(result.rows[0]);
    } catch {
        res.status(500).json({ error: 'Database error' });
    }
});

// ── Missions (pipeline status, activity, deliverables, notes) ─────────────────
const MISSION_STATUSES = ['planning', 'inbox', 'assigned', 'in_progress', 'testing', 'review', 'done'];

app.patch('/api/missions/:id/status', async (req, res) => {
    const { status, actor } = req.body;
    if (!MISSION_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    try {
        const result = await pool.query(
            'UPDATE tasks SET mission_status = $1 WHERE id = $2 RETURNING *',
            [status, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
        await pool.query(
            'INSERT INTO task_activity (task_id, action, actor) VALUES ($1, $2, $3)',
            [req.params.id, `Status → ${status}`, actor || 'user']
        ).catch(() => {});
        broadcast('mission_status_changed', { id: req.params.id, status, task: result.rows[0] });
        res.json(result.rows[0]);
    } catch { res.status(500).json({ error: 'Database error' }); }
});

app.get('/api/missions/:id/activity', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM task_activity WHERE task_id = $1 ORDER BY created_at DESC LIMIT 50',
            [req.params.id]
        );
        res.json(result.rows);
    } catch { res.status(500).json({ error: 'Database error' }); }
});

app.post('/api/missions/:id/activity', webhookAuth, async (req, res) => {
    const { action, actor, metadata } = req.body;
    if (!action) return res.status(400).json({ error: 'action required' });
    try {
        const result = await pool.query(
            'INSERT INTO task_activity (task_id, action, actor, metadata) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.params.id, action, actor || 'system', JSON.stringify(metadata || {})]
        );
        broadcast('mission_activity', { task_id: req.params.id, entry: result.rows[0] });
        res.json(result.rows[0]);
    } catch { res.status(500).json({ error: 'Database error' }); }
});

app.get('/api/missions/:id/deliverables', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM task_deliverables WHERE task_id = $1 ORDER BY created_at DESC',
            [req.params.id]
        );
        res.json(result.rows);
    } catch { res.status(500).json({ error: 'Database error' }); }
});

app.post('/api/missions/:id/deliverables', async (req, res) => {
    const { type, label, url } = req.body;
    if (!label) return res.status(400).json({ error: 'label required' });
    try {
        const result = await pool.query(
            'INSERT INTO task_deliverables (task_id, type, label, url) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.params.id, type || 'url', label, url || null]
        );
        broadcast('mission_deliverable_added', { task_id: req.params.id, deliverable: result.rows[0] });
        res.json(result.rows[0]);
    } catch { res.status(500).json({ error: 'Database error' }); }
});

app.delete('/api/missions/deliverables/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM task_deliverables WHERE id = $1', [req.params.id]);
        res.json({ ok: true });
    } catch { res.status(500).json({ error: 'Database error' }); }
});

app.get('/api/missions/:id/notes', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM task_notes WHERE task_id = $1',
            [req.params.id]
        );
        res.json(result.rows[0] || null);
    } catch { res.status(500).json({ error: 'Database error' }); }
});

app.put('/api/missions/:id/notes', async (req, res) => {
    const { content } = req.body;
    if (content === undefined) return res.status(400).json({ error: 'content required' });
    try {
        const result = await pool.query(
            `INSERT INTO task_notes (task_id, content)
             VALUES ($1, $2)
             ON CONFLICT (task_id) DO UPDATE SET content = $2, updated_at = NOW()
             RETURNING *`,
            [req.params.id, content]
        );
        res.json(result.rows[0]);
    } catch { res.status(500).json({ error: 'Database error' }); }
});

// ── Agent Completion Webhook ───────────────────────────────────────────────────
// Bots call this when a task is done. Moves mission to 'testing', logs activity,
// broadcasts WS event. Payload: { task_id, summary } OR { session_id, message }
// where message contains "TASK_COMPLETE: <summary>".
// Requires X-Webhook-Signature when WEBHOOK_SECRET is set.

app.get('/api/webhooks/agent-completion', async (_req, res) => {
    try {
        const result = await pool.query(
            `SELECT ta.*, t.description as task_title
             FROM task_activity ta
             JOIN tasks t ON ta.task_id = t.id
             WHERE ta.action LIKE 'COMPLETE:%'
             ORDER BY ta.created_at DESC LIMIT 20`
        );
        res.json({ status: 'active', recent_completions: result.rows, endpoint: '/api/webhooks/agent-completion' });
    } catch { res.status(500).json({ error: 'Database error' }); }
});

app.post('/api/webhooks/agent-completion', webhookAuth, async (req, res) => {
    const { task_id, summary, session_id, message } = req.body;

    // Resolve summary from session-style "TASK_COMPLETE: <text>" message
    let resolvedTaskId = task_id;
    let resolvedSummary = summary || 'Task completed';

    if (!resolvedTaskId && session_id && message) {
        const match = (message as string).match(/TASK_COMPLETE:\s*(.+)/i);
        if (!match) return res.status(400).json({ error: 'message must contain TASK_COMPLETE: <summary>' });
        resolvedSummary = match[1].trim();
        // Look up task by active agent session key
        try {
            const result = await pool.query(
                `SELECT t.id FROM tasks t
                 JOIN agents a ON t.agent_id = a.id
                 WHERE a.openclaw_id = $1
                   AND t.mission_status NOT IN ('testing','review','done')
                 ORDER BY t.assigned_at DESC LIMIT 1`,
                [session_id]
            );
            if (result.rows.length === 0) return res.status(404).json({ error: 'No active task for that session' });
            resolvedTaskId = result.rows[0].id;
        } catch { return res.status(500).json({ error: 'Database error' }); }
    }

    if (!resolvedTaskId) return res.status(400).json({ error: 'task_id required (or session_id + TASK_COMPLETE message)' });

    try {
        // Only advance if not already in testing/review/done
        const check = await pool.query('SELECT mission_status FROM tasks WHERE id = $1', [resolvedTaskId]);
        if (check.rows.length === 0) return res.status(404).json({ error: 'Task not found' });

        const current = check.rows[0].mission_status;
        const alreadyAdvanced = ['testing', 'review', 'done'].includes(current);

        if (!alreadyAdvanced) {
            await pool.query('UPDATE tasks SET mission_status = $1 WHERE id = $2', ['testing', resolvedTaskId]);
        }

        // Log activity
        await pool.query(
            'INSERT INTO task_activity (task_id, action, actor) VALUES ($1, $2, $3)',
            [resolvedTaskId, `COMPLETE: ${resolvedSummary}`, session_id || 'agent']
        );

        broadcast('mission_status_changed', { id: String(resolvedTaskId), status: 'testing' });
        broadcast('mission_activity', { task_id: String(resolvedTaskId), action: `COMPLETE: ${resolvedSummary}` });

        res.json({
            ok: true,
            task_id: resolvedTaskId,
            new_status: alreadyAdvanced ? current : 'testing',
            summary: resolvedSummary,
        });
    } catch { res.status(500).json({ error: 'Database error' }); }
});

// ── OpenClaw bridge ────────────────────────────────────────────────────────────

// GET /api/openclaw/status — live state from OpenClaw CLI
app.get('/api/openclaw/status', async (req, res) => {
    const env = { ...process.env, ...openClawEnv() };
    try {
        const { stdout } = await execAsync('openclaw sessions --json', { env, timeout: 10000 });
        const sessions = JSON.parse(stdout.trim());

        // Gateway health: check if port 18789 is listening
        const portCheck = await execAsync("ss -tlnp | grep 18789", { env, timeout: 3000 }).catch(() => ({ stdout: '' }));
        const gatewayUp = portCheck.stdout.includes('18789');

        const sessionList = sessions?.sessions ?? [];
        const primarySession = sessionList.find((s: any) => s.key === 'agent:main:main') ?? sessionList[0];

        res.json({
            ok: true,
            gateway: gatewayUp ? 'up' : 'down',
            model: primarySession?.model ?? 'unknown',
            session_count: sessions?.count ?? sessionList.length,
            sessions: sessionList,
            timestamp: new Date().toISOString(),
        });
    } catch (err: any) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// POST /api/openclaw/dispatch — send a task message to an agent (default: main/Genie)
app.post('/api/openclaw/dispatch', async (req, res) => {
    const { message, agent } = req.body;
    if (!message) return res.status(400).json({ error: 'message required' });

    // [DEV-BOT: 2026-02-28] unique session ID per run (timestamp suffix) prevents concurrent
    // session collisions. --no-fallback stops embedded gateway spawn attempts when gateway
    // is already running. Fire-and-forget: respond immediately, bot runs async.
    const agentFlag = agent ? `--agent ${agent}` : '';
    const sessionId = `clutch-${agent || 'main'}-${Date.now()}`;

    const env = { ...process.env, ...openClawEnv() };

    // Log dispatch immediately
    await pool.query(
        "INSERT INTO logs (agent_id, log_level, message) VALUES (1, 'info', $1)",
        [`Dispatching ${agent || 'main'}: ${message.slice(0, 200)}`]
    ).catch(() => {});

    // Reset agent session before dispatch so it starts with fresh context.
    // OpenClaw maps agent:developer:main → clutch-bridge-001.jsonl permanently,
    // ignoring --session-id. Without this reset, the session grows unboundedly
    // and the bot runs out of token budget before completing tasks.
    if (agent) {
        const sessionsDir = `/root/.openclaw/agents/${agent}/sessions`;
        const sessionsJson = `${sessionsDir}/sessions.json`;
        try {
            if (existsSync(sessionsJson)) {
                const sess = JSON.parse(readFileSync(sessionsJson, 'utf-8'));
                const key = `agent:${agent}:main`;
                const currentSessionId = sess[key]?.sessionId;
                if (currentSessionId) {
                    const sessionFile = `${sessionsDir}/${currentSessionId}.jsonl`;
                    if (existsSync(sessionFile)) {
                        writeFileSync(sessionFile, '', 'utf-8'); // truncate — fresh context
                    }
                }
            }
        } catch (e: any) {
            // non-fatal — proceed with dispatch even if reset fails
        }
    }

    // Fire and forget — bot runs async, responds to Clutch via progress/approvals APIs
    const cmd = `openclaw agent ${agentFlag} --session-id ${sessionId} --timeout 540 --message ${JSON.stringify(message)} --json`;
    execAsync(cmd, { env, timeout: 660000 })
        .then(({ stdout }) => {
            let result: any = {};
            try { result = JSON.parse(stdout.trim()); } catch { result = { raw: stdout.trim() }; }
            broadcast('task_dispatched', { agent, result });
        })
        .catch((err) => {
            broadcast('dispatch_error', { agent, error: err.message.slice(0, 200) });
        });

    res.json({ ok: true, sessionId, queued: true });
});

// GET /api/usage/live — real token data from privacy proxy
app.get('/api/usage/live', async (req, res) => {
    const usagePath = '/root/privacy-proxy/usage.jsonl';
    if (!existsSync(usagePath)) return res.json([]);
    try {
        const lines = readFileSync(usagePath, 'utf-8').trim().split('\n').filter(Boolean);
        const entries = lines.slice(-100).map(l => {
            try { return JSON.parse(l); } catch { return null; }
        }).filter(Boolean);
        res.json(entries);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ── Approvals ──────────────────────────────────────────────────────────────────
app.get('/api/approvals', async (req, res) => {
    const { status } = req.query;
    try {
        const q = status
            ? 'SELECT * FROM approvals WHERE status = $1 ORDER BY requested_at DESC'
            : 'SELECT * FROM approvals ORDER BY requested_at DESC LIMIT 50';
        const result = await pool.query(q, status ? [status] : []);
        res.json(result.rows);
    } catch { res.status(500).json({ error: 'Database error' }); }
});

app.post('/api/approvals', webhookAuth, async (req, res) => {
    const { task_id, milestone, plan_summary } = req.body;
    if (!plan_summary) return res.status(400).json({ error: 'plan_summary required' });
    try {
        const result = await pool.query(
            'INSERT INTO approvals (task_id, milestone, plan_summary) VALUES ($1, $2, $3) RETURNING *',
            [task_id || null, milestone || null, plan_summary]
        );
        broadcast('approval_requested', result.rows[0]);
        res.json(result.rows[0]);
    } catch { res.status(500).json({ error: 'Database error' }); }
});

app.patch('/api/approvals/:id', async (req, res) => {
    const { status, decided_by } = req.body;
    const allowed = ['approved', 'rejected'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'status must be approved or rejected' });
    try {
        const result = await pool.query(
            `UPDATE approvals SET status = $1, decided_at = NOW(), decided_by = $2 WHERE id = $3 RETURNING *`,
            [status, decided_by || 'user', req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        broadcast('approval_decided', result.rows[0]);
        res.json(result.rows[0]);
    } catch { res.status(500).json({ error: 'Database error' }); }
});

// ── Scrape Results ─────────────────────────────────────────────────────────────
app.get('/api/scrape-results', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM scrape_results ORDER BY scraped_at DESC LIMIT 50'
        );
        res.json(result.rows);
    } catch { res.status(500).json({ error: 'Database error' }); }
});

app.get('/api/scrape-results/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM scrape_results WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    } catch { res.status(500).json({ error: 'Database error' }); }
});

app.post('/api/scrape-results', webhookAuth, async (req, res) => {
    const { task_id, source, query, result_count, data } = req.body;
    if (!source) return res.status(400).json({ error: 'source required' });
    try {
        const result = await pool.query(
            'INSERT INTO scrape_results (task_id, source, query, result_count, data) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [task_id || null, source, query || null, result_count || 0, JSON.stringify(data || [])]
        );
        broadcast('scrape_complete', result.rows[0]);
        res.json(result.rows[0]);
    } catch { res.status(500).json({ error: 'Database error' }); }
});

// ── Analysis Results ───────────────────────────────────────────────────────────
app.get('/api/analysis-results', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM analysis_results ORDER BY analysed_at DESC LIMIT 50'
        );
        res.json(result.rows);
    } catch { res.status(500).json({ error: 'Database error' }); }
});

app.post('/api/analysis-results', webhookAuth, async (req, res) => {
    const { task_id, scrape_id, analysis_type, confidence, result: analysisResult } = req.body;
    if (!analysis_type) return res.status(400).json({ error: 'analysis_type required' });
    try {
        const result = await pool.query(
            'INSERT INTO analysis_results (task_id, scrape_id, analysis_type, confidence, result) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [task_id || null, scrape_id || null, analysis_type, confidence ?? null, JSON.stringify(analysisResult || {})]
        );
        broadcast('analysis_complete', result.rows[0]);
        res.json(result.rows[0]);
    } catch { res.status(500).json({ error: 'Database error' }); }
});

// ── Security Logs ──────────────────────────────────────────────────────────────
app.get('/api/security-logs', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM security_logs ORDER BY run_at DESC LIMIT 50'
        );
        res.json(result.rows);
    } catch { res.status(500).json({ error: 'Database error' }); }
});

app.post('/api/security-logs', webhookAuth, async (req, res) => {
    const { task_id, task_type, overall, checks, escalate, escalation_reason } = req.body;
    if (!overall) return res.status(400).json({ error: 'overall required' });
    try {
        const result = await pool.query(
            'INSERT INTO security_logs (task_id, task_type, overall, checks, escalate, escalation_reason) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [task_id || null, task_type || 'on_demand', overall, JSON.stringify(checks || {}), escalate || false, escalation_reason || null]
        );
        if (escalate) broadcast('security_escalation', result.rows[0]);
        broadcast('security_log', result.rows[0]);
        res.json(result.rows[0]);
    } catch { res.status(500).json({ error: 'Database error' }); }
});

// ── Bot Scores ─────────────────────────────────────────────────────────────────
app.post('/api/bot-scores', async (req, res) => {
    const { bot_id, task_id, score, review_notes } = req.body;
    if (!bot_id || score === undefined) return res.status(400).json({ error: 'bot_id and score required' });
    if (score < 0 || score > 100) return res.status(400).json({ error: 'score must be 0–100' });
    try {
        const result = await pool.query(
            'INSERT INTO bot_scores (bot_id, task_id, score, review_notes) VALUES ($1, $2, $3, $4) RETURNING *',
            [bot_id, task_id || null, score, review_notes || null]
        );
        broadcast('bot_scored', result.rows[0]);
        res.json(result.rows[0]);
    } catch { res.status(500).json({ error: 'Database error' }); }
});

app.get('/api/bot-scores/:bot_id', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT *, AVG(score) OVER (PARTITION BY bot_id) as avg_score
             FROM bot_scores WHERE bot_id = $1 ORDER BY rated_at DESC LIMIT 30`,
            [req.params.bot_id]
        );
        res.json(result.rows);
    } catch { res.status(500).json({ error: 'Database error' }); }
});

// ── Dashboard ──────────────────────────────────────────────────────────────────
// Aggregates token usage from privacy proxy JSONL log (source of truth) since
// the token_usage PostgreSQL table is reserved for future direct-write integration.
function aggregateUsageFromJSONL(windowHours = 24): { total_tokens: number; tokens_in: number; tokens_out: number; daily_cost: number } {
    const usagePath = '/root/privacy-proxy/usage.jsonl';
    const cutoff = Date.now() - windowHours * 60 * 60 * 1000;
    let total_tokens = 0, tokens_in = 0, tokens_out = 0, daily_cost = 0;
    try {
        const lines = readFileSync(usagePath, 'utf-8').trim().split('\n').filter(Boolean);
        for (const line of lines) {
            try {
                const e = JSON.parse(line);
                const ts = new Date(e.timestamp).getTime();
                if (ts < cutoff) continue;
                tokens_in   += e.tokens_in  || 0;
                tokens_out  += e.tokens_out || 0;
                daily_cost  += parseFloat(e.cost_usd) || 0;
            } catch { /* skip malformed lines */ }
        }
        total_tokens = tokens_in + tokens_out;
    } catch { /* file missing or unreadable — return zeros */ }
    return { total_tokens, tokens_in, tokens_out, daily_cost };
}

app.get('/api/dashboard', async (req, res) => {
    try {
        const [agents, tasks, logs] = await Promise.all([
            pool.query('SELECT * FROM agents ORDER BY id ASC'),
            pool.query('SELECT t.*, a.name as agent_name FROM tasks t LEFT JOIN agents a ON t.agent_id = a.id ORDER BY t.assigned_at DESC LIMIT 20'),
            pool.query('SELECT * FROM logs ORDER BY timestamp DESC LIMIT 20'),
        ]);
        // Read real token stats from privacy proxy log
        const usage = aggregateUsageFromJSONL(24);
        res.json({
            usage_summary: {
                daily_cost:   parseFloat(usage.daily_cost.toFixed(6)),
                total_tokens: usage.total_tokens,
                tokens_in:    usage.tokens_in,
                tokens_out:   usage.tokens_out,
                monthly_cost: parseFloat((usage.daily_cost * 30).toFixed(4)),
            },
            agents: agents.rows,
            active_tasks: tasks.rows,
            recent_logs: logs.rows,
            sources: [],
        });
    } catch {
        res.status(500).json({ error: 'Database error' });
    }
});

// ── System Control (Kill / Pause / Resume) ─────────────────────────────────────
const STATE_FILE = '/root/clutch/bridge/.state';
const TELEGRAM_BOT_TOKEN = openClawEnv().TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID   = '7715560944';

function readState(): { mode: string } {
    try { return JSON.parse(readFileSync(STATE_FILE, 'utf-8')); } catch { return { mode: 'run' }; }
}
function writeState(mode: string) {
    writeFileSync(STATE_FILE, JSON.stringify({ mode }));
}
async function telegramSend(text: string) {
    if (!TELEGRAM_BOT_TOKEN) return;
    try {
        await execAsync(`curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" -H "Content-Type: application/json" -d '${JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text })}'`);
    } catch { /* non-fatal */ }
}

app.get('/api/system/state', (_req, res) => {
    res.json(readState());
});

app.post('/api/system/state', async (req, res) => {
    const { mode } = req.body;
    if (!['run', 'paused', 'killed'].includes(mode)) {
        return res.status(400).json({ error: 'mode must be run | paused | killed' });
    }
    writeState(mode);
    if (mode === 'killed') {
        await telegramSend('[OPERATOR KILL] All agent activity halted immediately. Stop current task. Do not proceed until resumed.');
    } else if (mode === 'paused') {
        await telegramSend('[OPERATOR PAUSE] Hold — do not start new tasks. Finish current step then wait.');
    } else if (mode === 'run') {
        await telegramSend('[OPERATOR RESUME] System resumed. Continue normal operations.');
    }
    broadcast('system_state', { mode });
    res.json({ ok: true, mode });
});

// ── Outbox File Serving ────────────────────────────────────────────────────────
// [DEV-BOT: 2026-02-27] Added file list + download endpoints for bot output files

// [DEV-BOT: 2026-02-27] Base directory for bot output files — all downloads restricted to this path
const OUTBOX_DIR = '/root/.openclaw/workspace/agents/outbox/';

// GET /api/outbox — List available bot output files
// [DEV-BOT: 2026-02-27] Returns array of .json files with metadata, sorted by modified time desc
app.get('/api/outbox', (req, res) => {
  try {
    // [SECURITY: only return metadata, never file contents]
    const entries = readdirSync(OUTBOX_DIR, { withFileTypes: true });
    
    const files = entries
      .filter((entry: any) => entry.isFile())
      .filter((entry: any) => entry.name.endsWith('.json')) // [SECURITY: whitelist .json only]
      .map((entry: any) => {
        const stat = statSync(join(OUTBOX_DIR, entry.name));
        return {
          filename: entry.name,
          size_bytes: stat.size,
          modified_at: stat.mtime.toISOString(),
        };
      })
      .sort((a: any, b: any) => new Date(b.modified_at).getTime() - new Date(a.modified_at).getTime());
    
    res.json(files);
  } catch {
    // Return empty array if directory doesn't exist or can't be read — no error leak
    res.json([]);
  }
});

// GET /api/outbox/download — Download a specific bot output file
// [DEV-BOT: 2026-02-27] Downloads a single .json file with strict path traversal protection
// Query: filename (required, must be valid .json filename)
// Response: application/json attachment or 400/403/404 error
app.get('/api/outbox/download', (req, res) => {
  const { filename } = req.query;
  
  // [DEV-BOT: 2026-02-27] Validate filename presence
  if (!filename || typeof filename !== 'string') {
    return res.status(400).json({ error: 'filename required' });
  }
  
  // [SECURITY: prevent path traversal — reject path separators before resolution]
  if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  
  // [SECURITY: whitelist .json extension only — reject all other types]
  if (!filename.endsWith('.json')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  
  try {
    // [SECURITY: resolve to absolute path and verify it stays within OUTBOX_DIR]
    const filePath = resolve(OUTBOX_DIR, filename);
    const resolvedBase = resolve(OUTBOX_DIR);
    
    // [SECURITY: final path traversal check — resolved path must start with base directory]
    if (!filePath.startsWith(resolvedBase + '/') && filePath !== resolvedBase) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // [DEV-BOT: 2026-02-27] Check file exists before attempting to send
    if (!existsSync(filePath)) {
      return res.status(404).json({ error: 'Not found' });
    }
    
    // [DEV-BOT: 2026-02-27] Set headers to force download as JSON attachment
    // [AUDIT: Claude | 2026-02-27 | DEV-001-F001] Raw filename used in Content-Disposition header.
    // Low severity — prior validation (separator + extension checks) makes exploitation near-impossible.
    // Fixed: wrapped with basename() as defence-in-depth. [VALIDATED: Claude | 2026-02-27]
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${basename(filename)}"`);
    
    // [DEV-BOT: 2026-02-27] Read and serve file content
    const content = readFileSync(filePath, 'utf-8');
    res.send(content);
  } catch {
    // 500: filesystem error — generic message only, no internal details leaked
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Outbox Export (Excel / PDF) ────────────────────────────────────────────────
import XLSX from 'xlsx';
import PDFDocument from 'pdfkit';

function safeOutboxPath(filename: string): string | null {
    if (!filename || filename.includes('/') || filename.includes('\\') || filename.includes('..') || !filename.endsWith('.json')) return null;
    const filePath = resolve(OUTBOX_DIR, filename);
    if (!filePath.startsWith(resolve(OUTBOX_DIR) + '/')) return null;
    if (!existsSync(filePath)) return null;
    return filePath;
}

// GET /api/outbox/export?filename=xxx.json&format=xlsx|pdf
app.get('/api/outbox/export', (req, res) => {
    const { filename, format } = req.query;
    if (!filename || typeof filename !== 'string') return res.status(400).json({ error: 'filename required' });
    if (!format || !['xlsx', 'pdf'].includes(format as string)) return res.status(400).json({ error: 'format must be xlsx or pdf' });

    const filePath = safeOutboxPath(filename);
    if (!filePath) return res.status(404).json({ error: 'Not found' });

    let raw: any;
    try { raw = JSON.parse(readFileSync(filePath, 'utf-8')); } catch { return res.status(500).json({ error: 'Could not parse file' }); }

    const stem = basename(filename, '.json');

    if (format === 'xlsx') {
        // Flatten to rows
        let rows: any[] = [];
        const data = raw?.data ?? raw;
        if (Array.isArray(data)) {
            rows = data;
        } else if (raw?.checks && typeof raw.checks === 'object') {
            rows = Object.entries(raw.checks).map(([k, v]: [string, any]) => ({ check: k, ...v }));
        } else {
            rows = [raw];
        }
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data');
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${stem}.xlsx"`);
        return res.send(buf);
    }

    if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${stem}.pdf"`);
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        doc.pipe(res);

        // Title
        doc.fontSize(18).font('Helvetica-Bold').text(stem.toUpperCase(), { align: 'left' });
        doc.fontSize(9).font('Helvetica').fillColor('#888888').text(`Generated ${new Date().toLocaleString()}`, { align: 'left' });
        doc.moveDown();

        // Overall status if security file
        if (raw?.overall) {
            doc.fontSize(12).font('Helvetica-Bold').fillColor(raw.overall === 'pass' ? '#16a34a' : raw.overall === 'warn' ? '#d97706' : '#dc2626')
               .text(`Overall: ${raw.overall.toUpperCase()}`);
            doc.moveDown(0.5);
        }

        // Checks (security) or data rows
        if (raw?.checks && typeof raw.checks === 'object') {
            const checks = Object.entries(raw.checks);
            checks.forEach(([name, val]: [string, any]) => {
                const status = val?.result || val?.status || '';
                const color = status === 'pass' ? '#16a34a' : status === 'warn' ? '#d97706' : '#dc2626';
                doc.fontSize(10).font('Helvetica-Bold').fillColor(color).text(`[${status.toUpperCase()}] ${name}`);
                doc.fontSize(9).font('Helvetica').fillColor('#333333').text(val?.detail || val?.message || '', { indent: 16 });
                doc.moveDown(0.3);
            });
        } else {
            const items: any[] = Array.isArray(raw?.data ?? raw) ? (raw?.data ?? raw) : [raw];
            items.slice(0, 100).forEach((item: any, i: number) => {
                doc.fontSize(9).font('Helvetica-Bold').fillColor('#111111').text(`${i + 1}. ${item?.title || item?.url || item?.id || JSON.stringify(item).slice(0, 80)}`);
                if (item?.url && item?.title) doc.fontSize(8).font('Helvetica').fillColor('#555555').text(item.url, { indent: 12 });
                if (item?.score !== undefined) doc.font('Helvetica').fillColor('#777777').text(`Score: ${item.score}  Comments: ${item.descendants ?? 0}`, { indent: 12 });
                doc.moveDown(0.3);
            });
        }

        if (raw?.notes) {
            doc.moveDown().fontSize(9).font('Helvetica-Oblique').fillColor('#444444').text(`Notes: ${raw.notes}`);
        }

        doc.end();
    }
});

// ── Health ──────────────────────────────────────────────────────────────────────
// ── Budget controls ────────────────────────────────────────────────────────────
const PROXY_PY = '/root/privacy-proxy/privacy_proxy.py';

function readBudget(): { daily_usd: number; monthly_usd: number } {
    const src = readFileSync(PROXY_PY, 'utf-8');
    const m = src.match(/BUDGET\s*=\s*\{"daily_usd":\s*([\d.]+),\s*"monthly_usd":\s*([\d.]+)\}/);
    if (!m) return { daily_usd: 10, monthly_usd: 60 };
    return { daily_usd: parseFloat(m[1]), monthly_usd: parseFloat(m[2]) };
}

function readSpend(): { daily: number; monthly: number } {
    const usagePath = '/root/privacy-proxy/usage.jsonl';
    if (!existsSync(usagePath)) return { daily: 0, monthly: 0 };
    const today = new Date().toISOString().slice(0, 10);
    const month = today.slice(0, 7);
    let daily = 0, monthly = 0;
    for (const line of readFileSync(usagePath, 'utf-8').split('\n').filter(Boolean)) {
        try {
            const e = JSON.parse(line);
            const ts: string = e.timestamp || '';
            const cost: number = e.cost_usd || 0;
            if (ts.startsWith(today)) daily += cost;
            if (ts.startsWith(month)) monthly += cost;
        } catch { /* skip */ }
    }
    return { daily: parseFloat(daily.toFixed(4)), monthly: parseFloat(monthly.toFixed(4)) };
}

app.get('/api/budget', (_req, res) => {
    const limits = readBudget();
    const spend  = readSpend();
    res.json({ limits, spend });
});

app.post('/api/budget', (req, res) => {
    const { daily_usd, monthly_usd } = req.body;
    if (typeof daily_usd !== 'number' || typeof monthly_usd !== 'number')
        return res.status(400).json({ error: 'daily_usd and monthly_usd required (numbers)' });
    if (daily_usd <= 0 || monthly_usd <= 0)
        return res.status(400).json({ error: 'values must be positive' });
    const src = readFileSync(PROXY_PY, 'utf-8');
    const updated = src.replace(
        /BUDGET\s*=\s*\{.*?\}/,
        `BUDGET = {"daily_usd": ${daily_usd.toFixed(2)}, "monthly_usd": ${monthly_usd.toFixed(2)}}`
    );
    writeFileSync(PROXY_PY, updated, 'utf-8');
    // reload proxy via SIGHUP
    exec("pkill -HUP -f privacy_proxy.py", () => {});
    res.json({ ok: true, limits: { daily_usd, monthly_usd } });
});

// [DEV-BOT: 2026-02-28] Pipeline test — zero-DB health check for validate-build.py
app.get('/api/ping', (_req, res) => {
    res.json({ ok: true, ts: new Date().toISOString() });
});

// ── Static / SPA ───────────────────────────────────────────────────────────────
app.use(express.static(join(__dirname, '../../frontend/dist')));
app.get('/{*splat}', (req: express.Request, res: express.Response) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile('index.html', { root: join(__dirname, '../../frontend/dist') });
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

// ── Start ──────────────────────────────────────────────────────────────────────
initDB().then(() => {
    server.listen(4002, '100.64.0.1', () => {
        console.log('Clutch backend running on http://100.64.0.1:4002');
    });
});
