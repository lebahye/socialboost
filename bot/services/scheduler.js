const cron = require('node-cron');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const verificationService = require('./verification');

/**
 * Service for scheduling and managing periodic tasks
 */
class SchedulerService {
  constructor() {
    this.bot = null;
    this.tasks = {};
  }

  /**
   * Set the bot instance for sending notifications
   */
  setBot(bot) {
    this.bot = bot;
    verificationService.setBot(bot);
  }

  /**
   * Start all scheduled tasks
   */
  startAllTasks() {
    this.startCampaignCheckTask();
    this.startReminderTask();
    this.startVerificationTask();
    this.startCleanupTask();

    console.log('All scheduled tasks started');
  }

  /**
   * Stop all scheduled tasks
   */
  stopAllTasks() {
    Object.values(this.tasks).forEach(task => {
      if (task) {
        task.stop();
      }
    });

    console.log('All scheduled tasks stopped');
  }

  /**
   * Start task to check campaign participation (every hour)
   */
  startCampaignCheckTask() {
    // Run every hour at minute 0
    this.tasks.campaignCheck = cron.schedule('0 * * * *', async () => {
      console.log('Running campaign participation check task');
      await this.checkCampaignParticipation();
    });
  }

  /**
   * Start task to send reminders (every 3 hours)
   */
  startReminderTask() {
    // Run every 3 hours
    this.tasks.reminders = cron.schedule('0 */3 * * *', async () => {
      console.log('Running campaign reminder task');
      await this.sendCampaignReminders();
    });
  }

  /**
   * Start task to process verification (every hour)
   */
  startVerificationTask() {
    // Run every hour at minute 30
    this.tasks.verification = cron.schedule('30 * * * *', async () => {
      console.log('Running verification processing task');
      await verificationService.processPendingVerifications();
    });
  }

  /**
   * Start task to clean up expired campaigns and verification codes (every day)
   */
  startCleanupTask() {
    // Run every day at 2:00 AM
    this.tasks.cleanup = cron.schedule('0 2 * * *', async () => {
      console.log('Running cleanup task');
      await this.cleanupExpiredItems();
    });
  }

  /**
   * Check participation for all active campaigns
   */
  async checkCampaignParticipation() {
    try {
      // Find all active campaigns that need to be checked
      const now = new Date();
      const campaignsToCheck = await Campaign.find({
        status: 'active',
        endDate: { $gt: now },
        $or: [
          { lastChecked: { $lt: new Date(now - 1000 * 60 * 60 * 3) } }, // Not checked in last 3 hours
          { lastChecked: { $exists: false } }
        ]
      });

      console.log(`Found ${campaignsToCheck.length} campaigns to check participation`);

      for (const campaign of campaignsToCheck) {
        await this.checkSingleCampaign(campaign);
      }

      return { success: true, checkedCount: campaignsToCheck.length };
    } catch (err) {
      console.error('Error checking campaign participation:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Check participation for a single campaign
   */
  async checkSingleCampaign(campaign) {
    try {
      // Update lastChecked timestamp
      campaign.lastChecked = new Date();

      // In a real implementation, we would:
      // 1. Use the Twitter API to check for interactions with the campaign's post
      // 2. Update participation status for each participant

      // For demo purposes, we'll simulate random participation
      const nonParticipants = campaign.participants.filter(p => !p.participated);

      for (const participant of nonParticipants) {
        // 20% chance of participation per check
        if (Math.random() < 0.2) {
          participant.participated = true;
          participant.participationDate = new Date();

          // Randomly set engagement metrics
          participant.engagementMetrics = {
            likes: Math.random() > 0.3,
            retweets: Math.random() > 0.6,
            comments: Math.random() > 0.7,
            mentions: Math.random() > 0.8
          };

          // Notify user if bot is available
          if (this.bot) {
            try {
              await this.bot.telegram.sendMessage(
                participant.telegramId,
                `✅ We've detected your participation in the campaign "*${campaign.name}*"!\n\n` +
                `Thanks for engaging with ${campaign.projectName}'s post. You're now eligible for the campaign rewards.`,
                { parse_mode: 'Markdown' }
              );
            } catch (notifyErr) {
              console.error('Error sending participation notification:', notifyErr);
            }
          }
        }
      }

      // Update campaign stats
      campaign.updateParticipationStats();
      campaign.calculateEngagement();

      // Check if target reached
      if (campaign.currentParticipants >= campaign.targetParticipants) {
        campaign.status = 'completed';

        // Notify project owner
        if (this.bot) {
          try {
            await this.bot.telegram.sendMessage(
              campaign.createdBy,
              `🎉 Congratulations! Your campaign "*${campaign.name}*" has reached its participation target!\n\n` +
              `Target: ${campaign.targetParticipants} participants\n` +
              `Current: ${campaign.currentParticipants} participants\n\n` +
              `The campaign has been marked as completed. You can view the results using the /campaign command.`,
              { parse_mode: 'Markdown' }
            );
          } catch (notifyErr) {
            console.error('Error sending campaign completion notification:', notifyErr);
          }
        }
      }

      // Save updated campaign
      await campaign.save();

      return { success: true };
    } catch (err) {
      console.error(`Error checking campaign ${campaign._id}:`, err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Send reminders for campaigns
   */
  async sendCampaignReminders() {
    try {
      const now = new Date();

      // Find all active campaigns with reminders enabled
      const campaignsWithReminders = await Campaign.find({
        status: 'active',
        endDate: { $gt: now },
        'reminders.sendAutomatically': true
      });

      console.log(`Found ${campaignsWithReminders.length} campaigns that need reminders`);

      let remindersSent = 0;

      for (const campaign of campaignsWithReminders) {
        // Calculate when reminders should be sent based on interval
        const reminderInterval = campaign.reminders.interval || 12; // Default 12 hours
        const intervalMs = reminderInterval * 60 * 60 * 1000;

        // Skip if last reminder was sent too recently
        if (
          campaign.reminders.lastSent &&
          (now - new Date(campaign.reminders.lastSent)) < intervalMs
        ) {
          continue;
        }

        // Find participants who haven't participated yet and haven't received too many reminders
        const eligibleForReminder = campaign.participants.filter(p =>
          !p.participated &&
          (!p.lastReminderSent || (now - new Date(p.lastReminderSent)) > intervalMs) &&
          (p.remindersSent || 0) < 3 // Max 3 reminders per campaign
        );

        // Skip if no eligible participants
        if (eligibleForReminder.length === 0) {
          continue;
        }

        // Update campaign's last reminder timestamp
        campaign.reminders.lastSent = now;
        let campaignRemindersSent = 0;

        // Send reminders to eligible participants
        for (const participant of eligibleForReminder) {
          if (this.bot) {
            try {
              // Get user to check notification preferences
              const user = await User.findOne({ telegramId: participant.telegramId });

              if (!user || !user.notificationSettings || !user.notificationSettings.campaigns) {
                continue; // Skip users who have disabled campaign notifications
              }

              // Default reminder message
              let reminderMessage = campaign.reminders.message ||
                `🔔 *Reminder:* Don't forget to participate in the "*${campaign.name}*" campaign by ${campaign.projectName}!\n\n` +
                `Engage with this post before the campaign ends to earn rewards:\n${campaign.xPostUrl}\n\n` +
                `Campaign ends: ${campaign.endDate.toDateString()}`;

              await this.bot.telegram.sendMessage(
                participant.telegramId,
                reminderMessage,
                { parse_mode: 'Markdown' }
              );

              // Update participant's reminder count
              participant.remindersSent = (participant.remindersSent || 0) + 1;
              participant.lastReminderSent = now;

              campaignRemindersSent++;
              remindersSent++;
            } catch (notifyErr) {
              console.error('Error sending reminder notification:', notifyErr);
            }
          }
        }

        console.log(`Sent ${campaignRemindersSent} reminders for campaign ${campaign.name}`);

        // Save updated campaign
        await campaign.save();
      }

      return { success: true, remindersSent };
    } catch (err) {
      console.error('Error sending campaign reminders:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Clean up expired items (campaigns, verification codes)
   */
  async cleanupExpiredItems() {
    try {
      const now = new Date();

      // Mark expired campaigns as completed
      const expiredCampaigns = await Campaign.find({
        status: 'active',
        endDate: { $lt: now }
      });

      for (const campaign of expiredCampaigns) {
        campaign.status = 'completed';

        // Update stats one last time
        campaign.updateParticipationStats();
        campaign.calculateEngagement();

        await campaign.save();

        // Notify project owner
        if (this.bot) {
          try {
            await this.bot.telegram.sendMessage(
              campaign.createdBy,
              `⏰ Your campaign "*${campaign.name}*" has ended!\n\n` +
              `Final participation: ${campaign.currentParticipants}/${campaign.targetParticipants} participants (${campaign.stats.participationRate}%)\n\n` +
              `You can view the full results using the /campaign command followed by the campaign ID.`,
              { parse_mode: 'Markdown' }
            );
          } catch (notifyErr) {
            console.error('Error sending campaign end notification:', notifyErr);
          }
        }
      }

      console.log(`Marked ${expiredCampaigns.length} expired campaigns as completed`);

      return { success: true };
    } catch (err) {
      console.error('Error during cleanup task:', err);
      return { success: false, error: err.message };
    }
  }
}

// Export singleton instance
module.exports = new SchedulerService();
