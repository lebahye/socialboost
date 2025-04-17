const { Pool } = require('pg');
const { TwitterApi } = require('twitter-api-v2');

class VerificationService {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    // Initialize X/Twitter client if API keys are available
    if (
      process.env.TWITTER_API_KEY &&
      process.env.TWITTER_API_SECRET &&
      process.env.TWITTER_ACCESS_TOKEN &&
      process.env.TWITTER_ACCESS_SECRET
    ) {
      this.twitterClient = new TwitterApi({
        appKey: process.env.TWITTER_API_KEY,
        appSecret: process.env.TWITTER_API_SECRET,
        accessToken: process.env.TWITTER_ACCESS_TOKEN,
        accessSecret: process.env.TWITTER_ACCESS_SECRET,
      });
    }
  }

  async updateUserState(telegramId, state) {
    const query = `
      UPDATE users 
      SET current_state = $1 
      WHERE telegram_id = $2
    `;
    await this.pool.query(query, [state, telegramId.toString()]);
  }

  async verifyAccount(telegramId, platform, username) {
    try {
      const updateQuery = `
        UPDATE users 
        SET social_accounts = social_accounts || $1::jsonb,
            is_verified = true,
            current_state = NULL
        WHERE telegram_id = $2
      `;

      const account = {
        platform,
        username,
        verified_at: new Date().toISOString()
      };

      await this.pool.query(updateQuery, [JSON.stringify([account]), telegramId.toString()]);
      return true;
    } catch (error) {
      console.error('Verification error:', error);
      return false;
    }
  }

  async processPendingVerifications() {
    try {
      // Get users with unverified accounts
      const result = await this.pool.query(
        'SELECT * FROM users WHERE social_accounts IS NOT NULL'
      );

      const users = result.rows;

      for (const user of users) {
        const socialAccounts = user.social_accounts || [];

        for (const account of socialAccounts) {
          if (!account.isVerified && account.verificationCode) {
            //simplified verification using the new function
            const verified = await this.verifyAccount(user.telegram_id, account.platform, account.username);

            if (verified) {
              // Send notification via bot (if bot instance is available)
              if (this.bot) {
                try {
                  await this.bot.telegram.sendMessage(
                    user.telegram_id,
                    `✅ Your ${account.platform === 'x' ? 'X (Twitter)' : account.platform} account @${account.username} has been verified!\n\n` +
                    `You can now participate in campaigns that require a verified ${account.platform} account.`
                  );
                } catch (notifyErr) {
                  console.error('Error sending verification notification:', notifyErr);
                }
              }
            }
          }
        }
      }

      return { success: true, processed: users.length };
    } catch (err) {
      console.error('Error processing verifications:', err);
      return { success: false, error: err.message };
    }
  }


  async manuallyVerifyAccount(telegramId, platform, username) {
    try {
      // This function remains largely unchanged as it doesn't directly interact with the database for verification.
      const result = await this.pool.query('SELECT * FROM users WHERE telegram_id = $1', [telegramId]);
      const user = result.rows[0];


      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const account = user.social_accounts.find(acc =>
        acc.platform === platform && acc.username.toLowerCase() === username.toLowerCase()
      );

      if (!account) {
        return { success: false, error: 'Account not found' };
      }

      account.isVerified = true;
      await this.pool.query('UPDATE users SET social_accounts = $1 WHERE telegram_id = $2', [JSON.stringify(user.social_accounts), telegramId]);

      return { success: true };
    } catch (err) {
      console.error('Error manually verifying account:', err);
      return { success: false, error: err.message };
    }
  }

  setBot(bot) {
    this.bot = bot;
  }
}

module.exports = new VerificationService();