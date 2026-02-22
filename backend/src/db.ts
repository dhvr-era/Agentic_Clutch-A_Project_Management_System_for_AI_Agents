import { Pool } from 'pg';

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'agent_user',
  password: process.env.DB_PASSWORD || 'secret',
  database: process.env.DB_NAME || 'agents_db',
});

// Initialize Schema
export async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS agents (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        parent_id INTEGER REFERENCES agents(id),
        tier VARCHAR(50) NOT NULL, -- 'Green', 'Cyan', 'Blue'
        openclaw_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'inactive'
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        agent_id INTEGER REFERENCES agents(id),
        description TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS token_usage (
        id SERIAL PRIMARY KEY,
        agent_id INTEGER REFERENCES agents(id),
        tokens_in INTEGER DEFAULT 0,
        tokens_out INTEGER DEFAULT 0,
        cost_usd DECIMAL(10, 6) DEFAULT 0.0,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS logs (
        id SERIAL PRIMARY KEY,
        agent_id INTEGER REFERENCES agents(id),
        log_level VARCHAR(50) DEFAULT 'info',
        message TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Optional: Insert dummy agents for UI testing if empty
      const { rowCount } = await client.query('SELECT COUNT(*) FROM agents');
      if (rowCount === 0 || parseInt(rowCount.count) === 0) {
        await client.query(\`
          INSERT INTO agents (name, tier, openclaw_id, status) VALUES 
          ('Alpha Prime', 'Green', 'alpha_1', 'running'),
          ('Mid Coordinator', 'Cyan', 'coord_1', 'running'),
          ('Task Worker 1', 'Blue', 'worker_1', 'running');
          
          -- Set hierarchy
          UPDATE agents SET parent_id = 1 WHERE name = 'Mid Coordinator';
          UPDATE agents SET parent_id = 2 WHERE name = 'Task Worker 1';
        \`);
      }
    `);
    console.log('Database schema initialized.');
  } catch (err) {
    console.error('Error initializing database', err);
  } finally {
    client.release();
  }
}
