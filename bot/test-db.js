
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testDatabase() {
  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');

    // Test users table
    await client.query(`
      INSERT INTO users (telegram_id, username, first_name)
      VALUES ($1, $2, $3)
      ON CONFLICT (telegram_id) DO NOTHING
    `, ['test_id', 'test_user', 'Test']);
    console.log('✅ Users table working');

    // Test projects table
    const projectResult = await client.query(`
      INSERT INTO projects (name, description, owner_id)
      VALUES ($1, $2, $3)
      RETURNING id
    `, ['Test Project', 'Test Description', 'test_id']);
    console.log('✅ Projects table working');

    // Test campaigns table
    await client.query(`
      INSERT INTO campaigns (name, description, project_id, project_name, created_by)
      VALUES ($1, $2, $3, $4, $5)
    `, ['Test Campaign', 'Test Description', projectResult.rows[0].id, 'Test Project', 'test_id']);
    console.log('✅ Campaigns table working');

    // Clean up test data
    await client.query('DELETE FROM campaigns WHERE project_name = $1', ['Test Project']);
    await client.query('DELETE FROM projects WHERE name = $1', ['Test Project']);
    await client.query('DELETE FROM users WHERE telegram_id = $1', ['test_id']);
    console.log('✅ Test data cleaned up');

    client.release();
    console.log('✅ All database tests passed');
  } catch (err) {
    console.error('❌ Database test failed:', err);
  } finally {
    await pool.end();
  }
}

testDatabase();
