
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
    
    // Create verification_codes table with correct columns
    await client.query(`
      CREATE TABLE IF NOT EXISTS verification_codes (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        code TEXT NOT NULL,
        platform TEXT NOT NULL NULL,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT verification_codes_pkey PRIMARY KEY (id),
        CONSTRAINT verification_codes_code_unique UNIQUE (code)
      );

      CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON verification_codes(code);
    `);

    // Create verification_attempts table with correct columns
    await client.query(`
      CREATE TABLE IF NOT EXISTS verification_attempts (
        id SERIAL PRIMARY KEY,
        telegram_id TEXT NOT NULL,
        x_username TEXT NOT NULL NULL,
        verification_code TEXT UNIQUE NOT NULL,
        attempted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        code_issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        code_expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + interval '30 minutes',
        verified_at TIMESTAMP,
        status TEXT DEFAULT 'pending',
        attempts_count INTEGER DEFAULT 0,
        last_attempt_at TIMESTAMP,
        ip_address TEXT,
        client_info JSONB,
        verification_method TEXT,
        error_message TEXT,
        dm_received BOOLEAN DEFAULT false,
        dm_received_at TIMESTAMP,
        dm_sender_id TEXT,
        dm_message_text TEXT,
        CONSTRAINT verification_code_unique UNIQUE (verification_code)
      );

      CREATE INDEX IF NOT EXISTS idx_telegram_id ON verification_attempts(telegram_id);
      CREATE INDEX IF NOT EXISTS idx_verification_status_code ON verification_attempts(status, verification_code);
      CREATE INDEX IF NOT EXISTS idx_verification_expiry ON verification_attempts(code_expires_at);
    `);

    console.log('Database tables created successfully');
    client.release();
  } catch (err) {
    console.error('Error setting up database:', err);
    process.exit(1);
  }
}

setupDatabase();
