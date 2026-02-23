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
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS agents (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        parent_id INTEGER REFERENCES agents(id),
        tier VARCHAR(50) NOT NULL,
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

      CREATE TABLE IF NOT EXISTS bot_scores (
        id SERIAL PRIMARY KEY,
        bot_id VARCHAR(255),
        task_id INTEGER REFERENCES tasks(id),
        score INTEGER CHECK (score BETWEEN 0 AND 100),
        review_notes TEXT,
        rated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS bot_promotions (
        id SERIAL PRIMARY KEY,
        bot_id VARCHAR(255),
        from_tier VARCHAR(50),
        to_tier VARCHAR(50),
        promoted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reason TEXT
      );

      CREATE TABLE IF NOT EXISTS project_reviews (
        id SERIAL PRIMARY KEY,
        project_id INTEGER,
        summary TEXT,
        improvements TEXT,
        avg_bot_score DECIMAL(5,2),
        reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed default agents if table is empty (JS logic outside SQL)
    const countResult = await client.query('SELECT COUNT(*) FROM agents');
    if (parseInt(countResult.rows[0].count) === 0) {
      const genieResult = await client.query(
        `INSERT INTO agents (name, tier, openclaw_id, status) VALUES ($1, $2, $3, $4) RETURNING id`,
        ['Genie', 'Green', 'genie', 'running']
      );
      await client.query(
        `INSERT INTO agents (name, tier, openclaw_id, status, parent_id) VALUES ($1, $2, $3, $4, $5)`,
        ['Scraper Bot', 'Blue', 'scraper-bot-01', 'inactive', genieResult.rows[0].id]
      );
      console.log('Seeded agents: Genie (orchestrator) + Scraper Bot (worker)');
    }

    console.log('Database schema initialized.');
  } catch (err) {
    console.error('Error initializing database', err);
  } finally {
    client.release();
  }
}
