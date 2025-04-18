
const { Pool } = require('pg');
require('dotenv').config();

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupDatabase() {
  console.log("Setting up database...");
  
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        telegram_id TEXT UNIQUE NOT NULL,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        language TEXT DEFAULT 'en',
        is_project_owner BOOLEAN DEFAULT false,
        is_verified BOOLEAN DEFAULT false,
        credits INTEGER DEFAULT 0,
        social_accounts JSONB DEFAULT '[]',
        verification_code TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create projects table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        owner_id TEXT NOT NULL,
        category TEXT,
        website TEXT,
        subscription JSONB DEFAULT '{"isActive": true, "campaignsRemaining": 3}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create campaigns table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        project_id INTEGER REFERENCES projects(id),
        project_name TEXT,
        x_post_url TEXT,
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        target_participants INTEGER,
        participants JSONB DEFAULT '[]',
        stats JSONB DEFAULT '{}',
        created_by TEXT,
        status TEXT DEFAULT 'draft',
        private BOOLEAN DEFAULT false,
        rewards JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Database setup completed successfully");
  } catch (error) {
    console.error("Error setting up database:", error);
    process.exit(1);
  } finally {
    // Close pool
    await pool.end();
  }
}

setupDatabase();
