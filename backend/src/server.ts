import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, existsSync } from 'fs';
import { pool, initDB } from './db.js';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

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

// ── Agents ─────────────────────────────────────────────────────────────────────
app.get('/api/agents', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM agents ORDER BY id ASC');
        res.json(result.rows);
    } catch {
        res.status(500).json({ error: 'Database error' });
    }
});

// ── Tasks ──────────────────────────────────────────────────────────────────────
app.get('/api/tasks', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT t.*, a.name as agent_name FROM tasks t
             LEFT JOIN agents a ON t.agent_id = a.id
             ORDER BY t.assigned_at DESC LIMIT 50`
        );
        res.json(result.rows);
    } catch {
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/api/tasks', async (req, res) => {
    const { agent_id, description } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO tasks (agent_id, description) VALUES ($1, $2) RETURNING *',
            [agent_id, description]
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

// POST /api/openclaw/dispatch — send a task message to Genie
app.post('/api/openclaw/dispatch', async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'message required' });

    const env = { ...process.env, ...openClawEnv() };
    try {
        const { stdout } = await execAsync(
            `openclaw agent --session-id clutch-bridge-001 --message ${JSON.stringify(message)} --json`,
            { env, timeout: 60000 }
        );
        let result: any = {};
        try { result = JSON.parse(stdout.trim()); } catch { result = { raw: stdout.trim() }; }

        // Log the dispatch in DB
        await pool.query(
            "INSERT INTO logs (agent_id, log_level, message) VALUES (1, 'info', $1)",
            [`Dispatched via Clutch: ${message.slice(0, 200)}`]
        ).catch(() => {});

        broadcast('task_dispatched', { message, result });
        res.json({ ok: true, result });
    } catch (err: any) {
        res.status(500).json({ ok: false, error: err.message });
    }
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

// ── Dashboard ──────────────────────────────────────────────────────────────────
app.get('/api/dashboard', async (req, res) => {
    try {
        const [agents, tasks, tokenUsage, logs] = await Promise.all([
            pool.query('SELECT * FROM agents ORDER BY id ASC'),
            pool.query('SELECT * FROM tasks ORDER BY assigned_at DESC LIMIT 20'),
            pool.query("SELECT COALESCE(SUM(tokens_in),0) as total_tokens, COALESCE(SUM(cost_usd),0) as daily_cost FROM token_usage WHERE timestamp > NOW() - INTERVAL '24 hours'"),
            pool.query('SELECT * FROM logs ORDER BY timestamp DESC LIMIT 20'),
        ]);
        res.json({
            usage_summary: {
                daily_cost: parseFloat(tokenUsage.rows[0].daily_cost) || 0,
                total_tokens: parseInt(tokenUsage.rows[0].total_tokens) || 0,
                monthly_cost: (parseFloat(tokenUsage.rows[0].daily_cost) || 0) * 30,
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
