
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
      .map(([key, value], index) => {
        const sqlKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        return `${sqlKey} = $${index + 1}`;
      })
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

  static async findByTelegramId(telegramId) {
    const query = 'SELECT * FROM projects WHERE owner_id = $1';
    const { rows } = await pool.query(query, [telegramId]);
    return rows;
  }

  static async save(projectData) {
    const { name, description, ownerId } = projectData;
    const query = `
      INSERT INTO projects (name, description, owner_id, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const values = [name, description, ownerId, 'active'];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }
}

module.exports = Project;
