
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

class Project {
  static async create(projectData) {
    const { name, description, ownerId, category } = projectData;
    const query = `
      INSERT INTO projects (name, description, owner_id, category, subscription)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const subscription = {
      isActive: true,
      campaignsRemaining: 3 // Default 3 campaigns for new projects
    };
    const values = [name, description, ownerId, category, JSON.stringify(subscription)];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM projects WHERE id = $1';
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }

  static async findByTelegramId(telegramId) {
    const query = 'SELECT * FROM projects WHERE owner_id = $1';
    const { rows } = await pool.query(query, [telegramId]);
    return rows;
  }

  static async update(id, updateData) {
    const allowedFields = ['name', 'description', 'category', 'social_accounts', 'subscription'];
    const updates = [];
    const values = [id];
    let valueCount = 1;

    Object.entries(updateData).forEach(([key, value]) => {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = $${++valueCount}`);
        values.push(typeof value === 'object' ? JSON.stringify(value) : value);
      }
    });

    if (updates.length === 0) return null;

    const query = `
      UPDATE projects 
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING *
    `;
    
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM projects WHERE id = $1 RETURNING *';
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }

  static async decrementCampaigns(id) {
    const query = `
      UPDATE projects
      SET subscription = jsonb_set(
        subscription,
        '{campaignsRemaining}',
        (COALESCE((subscription->>'campaignsRemaining')::int, 0) - 1)::text::jsonb
      )
      WHERE id = $1 AND (subscription->>'campaignsRemaining')::int > 0
      RETURNING *
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }
}

module.exports = Project;
