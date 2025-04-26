
const { Pool } = require('pg');

// Create connection pool with proper error handling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Add error listener
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Export pool and query helper
module.exports = {
  pool,
  query: async (text, params) => {
    const client = await pool.connect();
    try {
      return await client.query(text, params);
    } finally {
      client.release();
    }
  }
};
