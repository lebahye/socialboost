
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
    
    // Create users table first
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        telegram_id TEXT UNIQUE NOT NULL,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        language TEXT DEFAULT 'en',
        is_project_owner BOOLEAN DEFAULT false,
        is_verified BOOLEAN DEFAULT false,
        current_state TEXT,
        social_accounts JSONB DEFAULT '[]',
        credits INTEGER DEFAULT 0,
        verification_code TEXT,
        verification_expiry TIMESTAMP,
        referral_code TEXT UNIQUE,
        referred_by TEXT,
        is_premium BOOLEAN DEFAULT false,
        achievements JSONB DEFAULT '[]',
        referral_count INTEGER DEFAULT 0,
        campaigns_completed INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
    `);

    // Create verification_codes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS verification_codes (
        id SERIAL PRIMARY KEY,
        telegram_id TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + interval '30 minutes',
        platform TEXT NOT NULL,
        username TEXT NOT NULL,
        verified_at TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_verification_codes_telegram_id ON verification_codes(telegram_id);
      CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON verification_codes(code);
      CREATE INDEX IF NOT EXISTS idx_verification_codes_status ON verification_codes(status);
      CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON verification_codes(expires_at);
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

      CREATE INDEX IF NOT EXISTS idx_verification_attempts_telegram_id ON verification_attempts(telegram_id);
      CREATE INDEX IF NOT EXISTS idx_verification_attempts_code ON verification_attempts(verification_code);
      CREATE INDEX IF NOT EXISTS idx_verification_attempts_status ON verification_attempts(status);
    `);

    console.log('Database tables created successfully');
    client.release();
  } catch (err) {
    console.error('Error setting up database:', err);
    process.exit(1);
  }
}

setupDatabase();
