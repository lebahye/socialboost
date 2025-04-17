
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

class Campaign {
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

  static async save(campaignData) {
    const {
      name,
      description,
      projectName,
      xPostUrl,
      startDate,
      endDate,
      targetParticipants,
      createdBy,
      status,
      isPrivate
    } = campaignData;

    const query = `
      INSERT INTO campaigns (
        name, description, project_name, x_post_url, 
        start_date, end_date, target_participants, 
        created_by, status, private
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      name, description, projectName, xPostUrl,
      startDate, endDate, targetParticipants,
      createdBy, status || 'draft', isPrivate || false
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
  }
}

module.exports = Campaign;
