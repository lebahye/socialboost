const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Database connection successful');
    await client.query(
      'CREATE TABLE IF NOT EXISTS users (' +
      'id SERIAL PRIMARY KEY, ' +
      'telegram_id TEXT UNIQUE NOT NULL, ' +
      'username TEXT, ' +
      'first_name TEXT, ' +
      'last_name TEXT, ' +
      'language TEXT DEFAULT \'en\', ' +
      'is_project_owner BOOLEAN DEFAULT false, ' +
      'current_state TEXT, ' +
      'social_accounts JSONB DEFAULT \'[]\', ' +
      'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP' +
      ')'
    );
    client.release();
  } catch (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
}

testConnection();