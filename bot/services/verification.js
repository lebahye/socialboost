const { Pool } = require('pg');
const { TwitterApi } = require('twitter-api-v2');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

class VerificationService {
  constructor() {
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

  async processPendingVerifications() {
    try {
      // Get users with unverified accounts
      const result = await pool.query(
        'SELECT * FROM users WHERE social_accounts IS NOT NULL'
      );

      const users = result.rows;

      for (const user of users) {
        const socialAccounts = user.social_accounts || [];

        for (const account of socialAccounts) {
          if (!account.isVerified && account.verificationCode) {
            let verified = false;

            // Check based on platform
            if (account.platform === 'x') {
              verified = await this.verifyXAccount(account.username, account.verificationCode);
            } else if (account.platform === 'discord') {
              verified = await this.verifyDiscordAccount(account.username, account.verificationCode);
            }

            if (verified) {
              // Update account verification status
              await pool.query(
                'UPDATE users SET social_accounts = $1 WHERE telegram_id = $2',
                [JSON.stringify(socialAccounts), user.telegram_id]
              );

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

  // Platform-specific verification methods
  async verifyXAccount(username, verificationCode) {
    if (!this.twitterClient) {
      console.warn('Twitter client not initialized, using simulated X verification');
      // In demo mode without API keys, automatically verify
      console.log(`Auto-verified X account: @${username} with code ${verificationCode} (demo mode)`);
      return true;
    }

    try {
      // Get direct messages - in real implementation, this would need proper
      // authentication and permissions to read DMs from the verification account
      /*
      In a real implementation, you would:
      1. Use the Twitter API to fetch DMs to your verification bot account
      2. Check if there's a DM from the user with matching username
      3. Check if the DM contains the verification code

      Example (pseudo-code):
      const messages = await this.twitterClient.v2.listDirectMessages();
      const verificationMessage = messages.find(msg =>
        msg.senderUsername.toLowerCase() === username.toLowerCase() &&
        msg.text.includes(verificationCode)
      );
      return !!verificationMessage;

      For demo purposes, we'll simulate a random verification outcome
      */

      // Simulated verification (70% chance of success)
      const isVerified = Math.random() > 0.3;

      if (isVerified) {
        console.log(`Verified X account: @${username} with code ${verificationCode}`);
      } else {
        console.log(`Could not verify X account: @${username} with code ${verificationCode}`);
      }

      return isVerified;
    } catch (err) {
      console.error('Error verifying X account:', err);
      return false;
    }
  }

  async verifyDiscordAccount(username, verificationCode) {
    // Similar to X verification, but using Discord API
    // For demo purposes, we'll simulate a verification outcome

    try {
      // Simulated verification (70% chance of success)
      const isVerified = Math.random() > 0.3;

      if (isVerified) {
        console.log(`Verified Discord account: ${username} with code ${verificationCode}`);
      } else {
        console.log(`Could not verify Discord account: ${username} with code ${verificationCode}`);
      }

      return isVerified;
    } catch (err) {
      console.error('Error verifying Discord account:', err);
      return false;
    }
  }

  async manuallyVerifyAccount(telegramId, platform, username) {
    try {
      // This function remains largely unchanged as it doesn't directly interact with the database for verification.
      const result = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [telegramId]);
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
      await pool.query('UPDATE users SET social_accounts = $1 WHERE telegram_id = $2', [JSON.stringify(user.social_accounts), telegramId]);

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