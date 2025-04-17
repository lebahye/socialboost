
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupDatabase() {
  try {
    // Drop existing tables in correct order
    await pool.query(`
      DROP TABLE IF EXISTS campaigns CASCADE;
      DROP TABLE IF EXISTS projects CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS analytics CASCADE;
    `);

    // Read and execute schema
    const schema = fs.readFileSync(path.join(__dirname, 'models', 'schema.sql'), 'utf8');
    await pool.query(schema);

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await pool.end();
  }
}

setupDatabase();
