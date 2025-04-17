
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

class Project {
  static async find(conditions) {
    const whereClause = Object.entries(conditions)
      .map(([key, value], index) => `${key} = $${index + 1}`)
      .join(' AND ');
    
    const query = `SELECT * FROM projects WHERE ${whereClause}`;
    const { rows } = await pool.query(query, Object.values(conditions));
    return rows;
  }

  static async findOne(conditions) {
    const whereClause = Object.entries(conditions)
      .map(([key, value], index) => `${key} = $${index + 1}`)
      .join(' AND ');
    
    const query = `SELECT * FROM projects WHERE ${whereClause} LIMIT 1`;
    const { rows } = await pool.query(query, Object.values(conditions));
    return rows[0];
  }

  static async find(conditions) {
    const whereClause = Object.entries(conditions)
      .map(([key, value], index) => {
        // Convert camelCase to snake_case for SQL
        const sqlKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        return `${sqlKey} = $${index + 1}`;
      })
      .join(' AND ');
    
    const query = `SELECT * FROM projects WHERE ${whereClause}`;
    const { rows } = await pool.query(query, Object.values(conditions));
    return rows;
  }

  static async findByTelegramId(telegramId) {
    const query = 'SELECT * FROM projects WHERE owner_id = $1';
    const { rows } = await pool.query(query, [telegramId]);
    return rows;
  }
}

module.exports = Project;
