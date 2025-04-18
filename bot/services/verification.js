
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

      const twitterClient = global.twitterClient;
      if (!twitterClient) {
        throw new Error('Twitter client not initialized');
      }

      // Validate inputs
      if (!username || !verificationCode) {
        throw new Error('Missing required verification parameters');
      }

      // Clean username (remove @ if present)
      username = username.replace('@', '');

      // Get user by username with error handling
      let user;
      try {
        user = await twitterClient.v2.userByUsername(username);
      } catch (err) {
        console.error('Error fetching X user:', err);
        throw new Error('Failed to fetch X account. Please check the username.');
      }

      if (!user?.data) {
        throw new Error('X account not found or is private');
      }

      // Get user's recent tweets with expanded parameters
      let tweets;
      try {
        tweets = await twitterClient.v2.userTimeline(user.data.id, {
          max_results: 20,
          'tweet.fields': ['text', 'created_at', 'public_metrics'],
          exclude: ['retweets', 'replies']
        });
      } catch (err) {
        console.error('Error fetching tweets:', err);
        throw new Error('Failed to fetch recent tweets. Please try again.');
      }

      if (!tweets?.data) {
        throw new Error('No recent tweets found');
      }

      // Check for verification code in tweets with timestamps
      const verificationTweet = tweets.data.find(tweet => {
        const tweetTime = new Date(tweet.created_at);
        const timeElapsed = Date.now() - tweetTime.getTime();
        return tweet.text.includes(verificationCode) && timeElapsed < 15 * 60 * 1000;
      });

      if (verificationTweet) {
        console.log(`Successfully verified X account: ${username}`);
        // Store additional metrics for later use
        return {
          verified: true,
          tweet_id: verificationTweet.id,
          metrics: verificationTweet.public_metrics
        };
      }

      console.log(`Verification failed for X account: ${username}`);
      return { verified: false };

    } catch (error) {
      console.error('X verification error:', error);
      throw error;
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
