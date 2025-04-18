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
    // Run every day at 2:00 AM
    this.tasks.cleanup = cron.schedule('0 2 * * *', async () => {
      console.log('Running cleanup task');
      // Implement cleanup logic
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

function initializeScheduler(bot) {
  schedulerService.initialize(bot);
}

module.exports = {
  initializeScheduler,
  schedulerService
};