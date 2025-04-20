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

      // Get user's recent DMs
      let messages;
      try {
        // First ensure we have DM permissions
        const appPermissions = await twitterClient.v2.me();
        console.log('Bot permissions:', appPermissions);

        // Get DMs with expanded user info and detailed logging
        console.log(`Starting verification check for user: ${username}`);
        console.log(`Looking for verification code: ${verificationCode}`);
        
        if (!user?.data) {
          console.log(`Could not find Twitter user: ${username}`);
          return false;
        }
        
        messages = await twitterClient.v2.listDirectMessages({
          max_results: 50,
          'dm.fields': ['text', 'sender_id', 'created_at', 'event_type'],
          'user.fields': ['username'],
          expansions: ['sender_id', 'referenced_tweets']
        });

        // Log message count
        console.log(`Retrieved ${messages?.data?.length || 0} recent DMs`);

        // Log DM details for debugging
        console.log('Starting DM verification check for:', {
          username: username,
          expected_code: verificationCode,
          total_messages: messages?.data?.length || 0
        });

        // Enhanced DM logging
        if (messages?.data) {
          console.log('Found DMs:', messages.data.length);
          messages.data.forEach(dm => {
            // Get sender info
            const sender = messages.includes?.users?.find(u => u.id === dm.sender_id);
            const messageTime = new Date(dm.created_at);
            const timeElapsed = Date.now() - messageTime.getTime();
            
            console.log('DM Details:', {
              sender_username: sender?.username,
              message_text: dm.text,
              time_sent: messageTime.toISOString(),
              minutes_ago: Math.floor(timeElapsed / (60 * 1000)),
              contains_code: dm.text?.includes(verificationCode),
              matches_sender: sender?.username?.toLowerCase() === username.toLowerCase()
            });
          });
        } else {
          console.warn('No DMs found - Check bot permissions and rate limits');
        }

        // Log all received DMs for debugging
        if (messages?.data) {
          console.log(`Total DMs received: ${messages.data.length}`);
          messages.data.forEach(dm => {
            console.log('DM Content:', {
              sender: dm.sender_id,
              username: messages.includes?.users?.find(u => u.id === dm.sender_id)?.username,
              text: dm.text,
              time: new Date(dm.created_at).toISOString(),
              matches_code: dm.text?.includes(verificationCode)
            });
          });
        }

        console.log('Retrieved DMs for verification check');
        console.log(`Looking for verification code ${verificationCode} from user ${username}`);

        // Get user ID from username
        const userLookup = await twitterClient.v2.userByUsername(username);
        if (!userLookup?.data) {
          console.log('Could not find user:', username);
          return { verified: false };
        }
        const expectedUserId = userLookup.data.id;
        console.log('Expected user ID:', expectedUserId);

        // Log all DMs for debugging
        if (messages?.data) {
          console.log(`Found ${messages.data.length} DMs`);
          console.log(`Looking for DM from ${username} (ID: ${expectedUserId}) with code: ${verificationCode}`);
          for (const dm of messages.data) {
            console.log('DM Details:', {
              sender_id: dm.sender_id,
              sender_username: messages.includes?.users?.find(u => u.id === dm.sender_id)?.username,
              text: dm.text,
              matches_code: dm.text?.includes(verificationCode),
              matches_sender: dm.sender_id === expectedUserId,
              time: new Date(dm.created_at).toISOString()
            });
          }
        } else {
          console.log('No DMs found in response');
        }
      } catch (err) {
        console.error('Error fetching DMs:', err);
        if (err.code === 349) {
          throw new Error('Bot lacks DM permissions. Please check API tokens.');
        }
        throw new Error('Failed to fetch direct messages. Please try again.');
      }

      if (!messages?.data) {
        console.error('No DMs found - check bot permissions');
        throw new Error('Could not retrieve DMs - check app permissions');
      }

      // Check for verification code in DMs with timestamps
      const verificationMessage = messages.data.find(msg => {
        const messageTime = new Date(msg.created_at);
        const timeElapsed = Date.now() - messageTime.getTime();
        const matchesCode = msg.text?.includes(verificationCode);
        const matchesSender = msg.sender_id === expectedUserId;
        const isRecent = timeElapsed < 15 * 60 * 1000;

        // Log detailed verification attempt
        console.log('Checking DM:', {
          from_username: messages.includes?.users?.find(u => u.id === msg.sender_id)?.username,
          expected_username: username,
          message_text: msg.text,
          contains_code: msg.text?.includes(verificationCode),
          sender_matches: matchesSender,
          is_recent: isRecent,
          time_sent: new Date(msg.created_at).toISOString(),
          minutes_ago: Math.floor(timeElapsed / (60 * 1000))
        });

        return matchesCode && matchesSender && isRecent;
      });

      if (verificationMessage) {
        console.log(`Successfully verified X account: ${username} with code: ${verificationCode}`);
        return {
          verified: true,
          message_id: verificationMessage.id,
          message: `✅ Successfully verified X account @${username}! You can now participate in campaigns.`
        };
      } else {
        console.log(`Verification failed for ${username}. Code not found: ${verificationCode}`);
        return {
          verified: false,
          message: `⚠️ Verification failed. Please make sure:\n1. You sent the exact code: ${verificationCode}\n2. You sent it as a DM to @SCampaign49365\n3. You're verifying the correct account`
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