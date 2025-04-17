
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

class User {
  static async findOne(conditions) {
    const whereClause = Object.entries(conditions)
      .map(([key, value], index) => `${key} = $${index + 1}`)
      .join(' AND ');
    
    const query = `SELECT * FROM users WHERE ${whereClause} LIMIT 1`;
    const { rows } = await pool.query(query, Object.values(conditions));
    return rows[0];
  }

  static async save(userData) {
    const { telegramId, username, firstName, lastName, language } = userData;
    const query = `
      INSERT INTO users (telegram_id, username, first_name, last_name, language_code, join_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (telegram_id) 
      DO UPDATE SET 
        username = $2,
        first_name = $3,
        last_name = $4,
        language_code = $5
      RETURNING *
    `;
    const values = [telegramId, username, firstName, lastName, language, new Date()];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }
}

module.exports = User;
