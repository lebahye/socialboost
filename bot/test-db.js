
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testDatabaseWrites() {
  try {
    // Test User table
    const userResult = await pool.query(`
      INSERT INTO users (telegram_id, username, first_name, last_name, language_code)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, ['123456789', 'testuser', 'Test', 'User', 'en']);
    console.log('User created:', userResult.rows[0]);

    // Test Project table
    const projectResult = await pool.query(`
      INSERT INTO projects (name, description, owner_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `, ['Test Project', 'Test project description', '123456789']);
    console.log('Project created:', projectResult.rows[0]);

    // Test Campaign table
    const campaignResult = await pool.query(`
      INSERT INTO campaigns (project_id, name, description)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [projectResult.rows[0].id, 'Test Campaign', 'Test campaign description']);
    console.log('Campaign created:', campaignResult.rows[0]);

    // Test Campaign Participants table
    const participantResult = await pool.query(`
      INSERT INTO campaign_participants (campaign_id, user_id, telegram_username)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [campaignResult.rows[0].id, '123456789', 'testuser']);
    console.log('Campaign participant created:', participantResult.rows[0]);

  } catch (error) {
    console.error('Error testing database writes:', error);
  } finally {
    await pool.end();
  }
}

testDatabaseWrites();
