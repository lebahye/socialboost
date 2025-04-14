const User = require('../models/User');
const { TwitterApi } = require('twitter-api-v2');

/**
 * Service for verifying social media accounts
 */
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

    // Discord client setup would go here if needed
  }

  /**
   * Check for pending verifications and process them
   * This should be run on a schedule (e.g., every hour)
   */
  async processPendingVerifications() {
    try {
      // Find users with unverified social accounts that have unexpired verification codes
      const users = await User.find({
        'socialAccounts': {
          $elemMatch: {
            'isVerified': false,
            'verificationCode': { $exists: true },
            'verificationExpiry': { $gt: new Date() }
          }
        }
      });

      console.log(`Processing verifications for ${users.length} users`);

      for (const user of users) {
        for (const account of user.socialAccounts) {
          if (!account.isVerified && account.verificationCode) {
            // Skip if verification code is expired
            if (account.verificationExpiry < new Date()) {
              continue;
            }

            let verified = false;

            // Check based on platform
            if (account.platform === 'x') {
              verified = await this.verifyXAccount(account.username, account.verificationCode);
            } else if (account.platform === 'discord') {
              verified = await this.verifyDiscordAccount(account.username, account.verificationCode);
            }

            if (verified) {
              account.isVerified = true;

              // Send notification via bot (if bot instance is available)
              if (this.bot) {
                try {
                  await this.bot.telegram.sendMessage(
                    user.telegramId,
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

        // Save user with updated verification statuses
        await user.save();
      }

      return { success: true, processed: users.length };
    } catch (err) {
      console.error('Error processing verifications:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Verify an X (Twitter) account by checking direct messages
   */
  async verifyXAccount(username, verificationCode) {
    if (!this.twitterClient) {
      console.warn('Twitter client not initialized, skipping X verification');
      return false;
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

  /**
   * Verify a Discord account by checking direct messages
   */
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

  /**
   * Manually verify an account for testing or customer support
   */
  async manuallyVerifyAccount(telegramId, platform, username) {
    try {
      const user = await User.findOne({ telegramId });

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const account = user.socialAccounts.find(acc =>
        acc.platform === platform && acc.username.toLowerCase() === username.toLowerCase()
      );

      if (!account) {
        return { success: false, error: 'Account not found' };
      }

      account.isVerified = true;
      await user.save();

      return { success: true };
    } catch (err) {
      console.error('Error manually verifying account:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Set the bot instance for sending notifications
   */
  setBot(bot) {
    this.bot = bot;
  }
}

module.exports = new VerificationService();
