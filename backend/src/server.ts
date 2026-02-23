import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { pool, initDB } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// Broadcast function
function broadcast(eventName: string, data: any) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ event: eventName, data }));
        }
    });
}

// REST endpoints
app.get('/api/agents', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM agents ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
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
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Dashboard endpoint — aggregates DB data for the frontend
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
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Periodic simulated sync
setInterval(async () => {
    try {
        const activeAgents = await pool.query("SELECT id FROM agents WHERE status = 'running'");
        if (activeAgents.rows.length > 0) {
            const agent = activeAgents.rows[Math.floor(Math.random() * activeAgents.rows.length)];
            const usage = await pool.query(
                'INSERT INTO token_usage (agent_id, tokens_in, tokens_out, cost_usd) VALUES ($1, $2, $3, $4) RETURNING *',
                [agent.id, Math.floor(Math.random() * 50), Math.floor(Math.random() * 10), Math.random() * 0.001]
            );
            broadcast('token_usage_update', usage.rows[0]);
        }
    } catch (err) {
        console.error('Error simulating sync', err);
    }
}, 5000);

// Serve frontend static files
app.use(express.static(join(__dirname, '../../frontend/dist')));
app.get('*', (req: express.Request, res: express.Response) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(join(__dirname, '../../frontend/dist/index.html'));
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

// Start
initDB().then(() => {
    server.listen(4002, '100.64.0.1', () => {
        console.log('Backend server running on http://100.64.0.1:4002');
    });
});
