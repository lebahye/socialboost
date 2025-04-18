const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();

// Verify database URL exists
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Create a new pool with the connection string from the environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Check if schema file exists
if (!fs.existsSync('./models/schema.sql')) {
  console.error('Schema file not found: ./models/schema.sql');
  process.exit(1);
}

// Read the SQL script
const setupSQL = fs.readFileSync('./models/schema.sql', 'utf8');

// Execute the SQL script
async function setupDatabase() {
  console.log('Setting up database...');
  try {
    // Test connection first
    const client = await pool.connect();
    console.log('Database connection successful');
    client.release();

    // Execute schema
    await pool.query(setupSQL);
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the setup function
setupDatabase();