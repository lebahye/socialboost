const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const startHandler = async (ctx) => {
  try {
    const userId = ctx.from.id.toString();
    const result = await pool.query(
      `INSERT INTO users (
        telegram_id, 
        username, 
        first_name, 
        last_name, 
        is_project_owner,
        is_verified,
        credits,
        social_accounts
      ) VALUES ($1, $2, $3, $4, false, false, 0, '[]')
      ON CONFLICT (telegram_id) 
      DO UPDATE SET 
        username = $2,
        first_name = $3,
        last_name = $4
      RETURNING *`,
      [userId, ctx.from.username, ctx.from.first_name, ctx.from.last_name]
    );
    
    if (result.rows[0]) {
      await ctx.reply('Welcome! Use /help to see available commands.');
    } else {
      throw new Error('User registration failed');
    }
  } catch (error) {
    console.error('Error in startHandler:', error);
    await ctx.reply('An error occurred. Please try again.');
  }
};

const helpHandler = async (ctx) => {
  try {
    const userId = ctx.from.id.toString();
    const result = await pool.query('SELECT is_project_owner FROM users WHERE telegram_id = $1', [userId]);
    const isProjectOwner = result.rows[0]?.is_project_owner || false;

    let helpMessage = `📚 *Bot Commands & Help* 📚\n\n`;
    helpMessage += `🔹 *General Commands:*\n`;
    helpMessage += `/start - Start the bot\n`;
    helpMessage += `/help - Show this help message\n`;
    helpMessage += `/status - Check your account status\n`;
    helpMessage += `/link - Link social media accounts\n`;
    helpMessage += `/verify - Verify linked accounts\n`;
    helpMessage += `/unlink - Unlink social media accounts\n\n`;

    if (isProjectOwner) {
      helpMessage += `🔹 *Project Owner Commands:*\n`;
      helpMessage += `/newproject - Create a new project\n`;
      helpMessage += `/myprojects - View your projects\n`;
      helpMessage += `/project - Manage a specific project\n`;
      helpMessage += `/newcampaign - Create a new campaign\n`;
      helpMessage += `/campaigns - List available campaigns\n`;
      helpMessage += `/campaign - Manage a specific campaign\n`;
      helpMessage += `/check - Check participation status\n`;
      helpMessage += `/remind - Send reminders to participants\n`;
      helpMessage += `/analytics - View campaign analytics\n`;
    }

    await ctx.replyWithMarkdown(helpMessage);
  } catch (error) {
    console.error('Error in helpHandler:', error);
    await ctx.reply('An error occurred while displaying help. Please try again.');
  }
};

const statusHandler = async (ctx) => {
  try {
    const userId = ctx.from.id.toString();
    const result = await pool.query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [userId]
    );

    if (!result.rows[0]) {
      return ctx.reply('Please start the bot first with /start');
    }

    const user = result.rows[0];
    let statusMessage = `*📊 Your Account Status*\n\n`;
    statusMessage += `*User:* ${user.username || ctx.from.username || 'No username'}\n`;
    statusMessage += `*Joined:* ${new Date(user.created_at).toDateString()}\n`;
    statusMessage += `*Account Type:* ${user.is_project_owner ? 'Project Owner' : 'Participant'}\n`;

    await ctx.replyWithMarkdown(statusMessage);
  } catch (error) {
    console.error('Error in statusHandler:', error);
    await ctx.reply('An error occurred while fetching your status. Please try again.');
  }
};

module.exports = {
  startHandler,
  helpHandler,
  statusHandler
};

