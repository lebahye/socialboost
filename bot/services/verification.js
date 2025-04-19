
const { Pool } = require('pg');
const { TwitterApi } = require('twitter-api-v2');
const { Client, Intents } = require('discord.js');

class VerificationService {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });

    // Initialize Twitter client
    if (process.env.TWITTER_API_KEY) {
      this.twitterClient = new TwitterApi({
        appKey: process.env.TWITTER_API_KEY,
        appSecret: process.env.TWITTER_API_SECRET,
        accessToken: process.env.TWITTER_ACCESS_TOKEN,
        accessSecret: process.env.TWITTER_ACCESS_SECRET,
      });
    }

    // Initialize Discord client
    if (process.env.DISCORD_BOT_TOKEN) {
      this.discordClient = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES] });
      this.discordClient.login(process.env.DISCORD_BOT_TOKEN);
    }
  }

  async verifyXAccount(username, verificationCode) {
    try {
      console.log(`Attempting to verify X account: ${username} with code: ${verificationCode}`);

      if (!this.twitterClient) {
        console.error('Twitter client not initialized');
        return false;
      }

      // For testing/development purposes (REMOVE IN PRODUCTION):
      // Auto-verify during development to make testing easier
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Auto-verifying X account');
        return true;
      }

      const tweets = await this.twitterClient.v2.userTimeline(username, {tweet_fields: ['text']});
      return tweets.data.some(tweet => tweet.text.includes(verificationCode));
    } catch (error) {
      console.error('Twitter verification error:', error);
      return false;
    }
  }

  async verifyDiscordAccount(discordId, verificationCode) {
    try {
      const user = await this.discordClient.users.fetch(discordId);
      const dm = await user.createDM();
      await dm.send(`Please reply with verification code: ${verificationCode}`);
      //This needs further implementation to actually verify the code.  This is a placeholder.
      return true; 
    } catch (error) {
      console.error('Discord verification error:', error);
      return false;
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

  async verifyAccount(telegramId, platform, username, verificationCode) {
    try {
      let verified = false;
      if (platform === 'twitter' || platform === 'x') {
        verified = await this.verifyXAccount(username, verificationCode);
      } else if (platform === 'discord') {
        verified = await this.verifyDiscordAccount(username, verificationCode);
      }

      if (verified) {
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
      } else {
        return false;
      }
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
            const verified = await this.verifyAccount(user.telegram_id, account.platform, account.username, account.verificationCode);

            if (verified) {
              // Send notification via bot (if bot instance is available)
              if (this.bot) {
                try {
                  await this.bot.telegram.sendMessage(
                    user.telegram_id,
                    `✅ Your ${account.platform === 'x' || account.platform === 'twitter'? 'X (Twitter)' : account.platform} account @${account.username} has been verified!\n\n` +
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

// Export instance
const verificationService = new VerificationService();

async function verifyXPostEngagement(postId, userXHandle, campaignId) {
  try {
    const client = verificationService.twitterClient;
    if (!client) {
      throw new Error('Twitter client not initialized');
    }

    const Campaign = require('../models/Campaign');
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }
    
    // Get post details
    const tweet = await client.v2.singleTweet(postId, {
      expansions: ['author_id'],
      'tweet.fields': ['public_metrics']
    });

    // Get user interactions
    const userLiked = await client.v2.tweetLikedBy(postId).data.some(
      user => user.username === userXHandle
    );
    
    const userRetweeted = await client.v2.tweetRetweetedBy(postId).data.some(
      user => user.username === userXHandle
    );

    return {
      verified: userLiked || userRetweeted,
      metrics: tweet.data.public_metrics,
      interactions: {
        liked: userLiked,
        retweeted: userRetweeted
      }
    };
  } catch (err) {
    console.error('Error verifying X post engagement:', err);
    return { verified: false, error: err.message };
  }
}

module.exports = {
  verificationService,
  verifyXPostEngagement
};
