const cron = require('node-cron');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

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
  }

  /**
   * Start all scheduled tasks
   */
  startAllTasks() {
    this.startCampaignCheckTask();
    this.startReminderTask();
    this.startVerificationTask();
    this.startCleanupTask();
    this.startPremiumReminderTask();

    console.log('All scheduled tasks started');
  }

  /**
   * Send payment reminders to project owners with expiring premium
   */
  async sendPaymentReminders() {
    try {
      // Find projects with premium expiring in 3 days
      const result = await pool.query(`
        SELECT u.telegram_id, u.premium_until 
        FROM users u 
        WHERE u.is_project_owner = true 
        AND u.premium_until IS NOT NULL
        AND u.premium_until BETWEEN NOW() AND NOW() + INTERVAL '3 days'
      `);

      for (const user of result.rows) {
        const daysLeft = Math.ceil((new Date(user.premium_until) - new Date()) / (1000 * 60 * 60 * 24));

        if (this.bot) {
          await this.bot.telegram.sendMessage(
            user.telegram_id,
            `⚠️ *Premium Expiring Soon*\n\nYour premium subscription will expire in ${daysLeft} days. Renew now to continue enjoying premium benefits and avoid interruption to your campaigns.\n\nUse /premium to renew.`,
            { parse_mode: 'Markdown' }
          );
        }
      }
    } catch (error) {
      console.error('Error sending payment reminders:', error);
    }
  }

  /**
   * Start premium reminder task (daily)
   */
  startPremiumReminderTask() {
    this.tasks.premiumReminders = cron.schedule('0 9 * * *', async () => {
      console.log('Running premium reminder task');
      await this.sendPaymentReminders();
    });
  }

  /**
   * Start task to check campaign participation (every hour)
   */
  startCampaignCheckTask() {
    // Run every hour at minute 0
    this.tasks.campaignCheck = cron.schedule('0 * * * *', async () => {
      console.log('Running campaign participation check task');
      // Implement campaign check logic
    });
  }

  /**
   * Start task to send reminders (every 3 hours)
   */
  startReminderTask() {
    // Run every 3 hours
    this.tasks.reminders = cron.schedule('0 */3 * * *', async () => {
      console.log('Running campaign reminder task');
      // Implement reminder logic
    });
  }

  /**
   * Start task to process verification (every hour)
   */
  startVerificationTask() {
    // Run every hour at minute 30
    this.tasks.verification = cron.schedule('30 * * * *', async () => {
      console.log('Running verification processing task');
      // Implement verification processing logic
    });
  }

  /**
   * Start task to clean up expired campaigns and verification codes (every day)
   */
  startCleanupTask() {
    // Run every hour to clean up expired verifications
    this.tasks.cleanup = cron.schedule('0 * * * *', async () => {
      console.log('Running verification cleanup task');
      try {
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false }
        });

        // Start transaction
        await pool.query('BEGIN');

        // Clean up expired verification codes
        await pool.query(`
          DELETE FROM verification_codes 
          WHERE expires_at < NOW() 
          AND status = 'pending'
        `);

        // Clean up expired verification attempts
        await pool.query(`
          DELETE FROM verification_attempts 
          WHERE code_expires_at < NOW() 
          AND status = 'pending'
        `);

        // Update user states for expired verifications
        await pool.query(`
          UPDATE users 
          SET current_state = NULL,
              verification_code = NULL,
              verification_expiry = NULL
          WHERE verification_expiry < NOW()
        `);

        await pool.query('COMMIT');
        console.log('Verification cleanup completed successfully');
      } catch (error) {
        console.error('Error in cleanup task:', error);
        await pool.query('ROLLBACK');
      }
      try {
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false }
        });

        // Clean up expired verification codes
        await pool.query(`
          DELETE FROM verification_codes 
          WHERE expires_at < NOW() 
          AND status = 'pending'
        `);

        // Clean up expired verification attempts
        await pool.query(`
          DELETE FROM verification_attempts 
          WHERE code_expires_at < NOW() 
          AND status = 'pending'
        `);

        // Update user states for expired verifications
        await pool.query(`
          UPDATE users 
          SET current_state = NULL 
          WHERE verification_expiry < NOW() 
          AND current_state IN ('awaiting_x_username', 'awaiting_discord_username')
        `);

        console.log('Cleanup completed successfully');
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    });
  }

  /**
   * Initialize scheduler with the bot instance
   */
  initialize(bot) {
    this.setBot(bot);
    this.startAllTasks();
    console.log('Scheduler initialized');
  }
}

// Export singleton instance
const schedulerService = new SchedulerService();

async function initializeScheduler(bot) {
  // Check for pending verifications every hour
  setInterval(async () => {
    //await verificationService.processPendingVerifications();  //Commented out as verificationService is not defined in this snippet.
  }, 60 * 60 * 1000);

  // Send reminders every 12 hours
  setInterval(async () => {
    const Campaign = require('../models/Campaign');
    const activeCampaigns = await Campaign.find({ status: 'active' });

    for (const campaign of activeCampaigns) {
      const participants = campaign.participants || [];
      for (const participant of participants) {
        if (!participant.participated) {
          try {
            await bot.telegram.sendMessage(
              participant.telegramId,
              `🔔 Reminder: Don't forget to engage with the campaign post!\n` +
              `Campaign: ${campaign.name}\n` +
              `X Post: ${campaign.xPostUrl}\n\n` +
              `Participate now to earn rewards!`
            );
          } catch (err) {
            console.error('Error sending reminder:', err);
          }
        }
      }
    }
  }, 12 * 60 * 60 * 1000);
}

module.exports = {
  initializeScheduler,
  schedulerService
};