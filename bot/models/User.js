
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

class User {
  static async findOne(conditions) {
    const keys = Object.keys(conditions);
    const values = Object.values(conditions);
    const where = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');
    
    const query = `SELECT * FROM users WHERE ${where} LIMIT 1`;
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async save(userData) {
    const query = `
      INSERT INTO users (telegram_id, username, first_name, last_name, language, current_state)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (telegram_id) 
      DO UPDATE SET 
        username = $2,
        first_name = $3,
        last_name = $4,
        language = $5,
        current_state = $6
      RETURNING *
    `;
    
    const values = [
      userData.telegramId,
      userData.username,
      userData.firstName,
      userData.lastName,
      userData.language || 'en',
      userData.currentState
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async updateSocialAccounts(telegramId, socialAccounts) {
    const query = `
      UPDATE users 
      SET social_accounts = $1 
      WHERE telegram_id = $2
      RETURNING *
    `;
    
    const { rows } = await pool.query(query, [JSON.stringify(socialAccounts), telegramId]);
    return rows[0];
  }

  static async setState(telegramId, state) {
    const query = `
      UPDATE users 
      SET current_state = $1 
      WHERE telegram_id = $2
      RETURNING *
    `;
    
    const { rows } = await pool.query(query, [state, telegramId]);
    return rows[0];
  }

  static async setVerificationCode(telegramId, code) {
    const query = `
      UPDATE users 
      SET verification_code = $1,
          verification_expiry = NOW() + INTERVAL '30 minutes'
      WHERE telegram_id = $2
      RETURNING *
    `;
    
    const { rows } = await pool.query(query, [code, telegramId]);
    return rows[0];
  }

  static async verifyCode(telegramId, code) {
    const query = `
      SELECT * FROM users 
      WHERE telegram_id = $1 
      AND verification_code = $2 
      AND verification_expiry > NOW()
    `;
    
    const { rows } = await pool.query(query, [telegramId, code]);
    return rows.length > 0;
  }
}

module.exports = User;
