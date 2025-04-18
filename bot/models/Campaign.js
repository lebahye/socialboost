
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

class Campaign {
  static async create(campaignData) {
    const {
      name,
      description,
      projectId,
      projectName,
      xPostUrl,
      startDate,
      endDate,
      targetParticipants,
      createdBy,
      status,
      isPrivate,
      rewards = []
    } = campaignData;

    const query = `
      INSERT INTO campaigns (
        name, description, project_id, project_name, x_post_url, 
        start_date, end_date, target_participants, 
        created_by, status, private, rewards
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    
    const values = [
      name, description, projectId, projectName, xPostUrl,
      startDate, endDate, targetParticipants,
      createdBy, status || 'draft', isPrivate || false,
      JSON.stringify(rewards)
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM campaigns WHERE id = $1';
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }

  static async find(conditions) {
    const whereClause = Object.entries(conditions)
      .map(([key, value], index) => `${key} = $${index + 1}`)
      .join(' AND ');
    
    const query = `SELECT * FROM campaigns WHERE ${whereClause}`;
    const { rows } = await pool.query(query, Object.values(conditions));
    return rows;
  }

  static async update(id, updateData) {
    const allowedFields = ['name', 'description', 'status', 'private', 'rewards', 'participants', 'stats'];
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
      UPDATE campaigns 
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING *
    `;
    
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM campaigns WHERE id = $1 RETURNING *';
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }
}

module.exports = Campaign;
