import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { pool, initDB } from './db.js';

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
        // Broadcast live event
        broadcast('new_task', result.rows[0]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Periodic simulated sync from OpenClaw/usage.jsonl
setInterval(async () => {
    // Normally this would parse external files or run child processes
    // Simulating token usage generation for live sync testing
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

// Start
initDB().then(() => {
    server.listen(4000, () => {
        console.log('Backend server running on http://localhost:4000');
    });
});
