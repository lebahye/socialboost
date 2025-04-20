
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupDatabase() {
  try {
    const client = await pool.connect();
    
    // Create verification_codes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS verification_codes (
        id SERIAL PRIMARY KEY,
        telegram_id TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        platform TEXT NOT NULL,
        username TEXT NOT NULL,
        CONSTRAINT code_unique UNIQUE (code)
      );
    `);

    // Create verification_attempts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS verification_attempts (
        id SERIAL PRIMARY KEY,
        telegram_id TEXT NOT NULL,
        x_username TEXT NOT NULL,
        verification_code TEXT NOT NULL,
        attempted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        code_issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        code_expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + interval '30 minutes',
        status TEXT DEFAULT 'pending',
        verification_method TEXT,
        client_info JSONB,
        dm_received BOOLEAN DEFAULT false
      );
    `);

    // Create users table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        telegram_id TEXT UNIQUE NOT NULL,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        current_state TEXT,
        social_accounts JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Database setup completed successfully');
    client.release();
    await pool.end();
  } catch (err) {
    console.error('Error setting up database:', err);
    process.exit(1);
  }
}

setupDatabase();
