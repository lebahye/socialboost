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

async function checkVerificationCodes() {
  try {
    const result = await pool.query('SELECT * FROM verification_attempts ORDER BY attempted_at DESC LIMIT 5');
    console.log('\nRecent verification attempts:');
    console.log('------------------------');
    for (const row of result.rows) {
      console.log(`\nVerification Code: ${row.verification_code}`);
      console.log(`X Username: ${row.x_username}`);
      console.log(`Status: ${row.status}`);
      console.log(`Attempted at: ${row.attempted_at}`);
      console.log(`DM received: ${row.dm_received}`);
    }
  } catch (err) {
    console.error('Error checking verification codes:', err);
  }
}

async function checkUserAccounts() {
  try {
    const result = await pool.query('SELECT telegram_id, username, social_accounts FROM users WHERE social_accounts IS NOT NULL');
    console.log('\nUsers with linked accounts:');
    console.log('------------------------');
    for (const row of result.rows) {
      console.log(`\nTelegram ID: ${row.telegram_id}`);
      console.log(`Username: ${row.username}`);
      console.log('Social accounts:', row.social_accounts);
    }
  } catch (err) {
    console.error('Error checking accounts:', err);
  } finally {
    await pool.end();
  }
}

testConnection();
checkVerificationCodes();
checkUserAccounts();