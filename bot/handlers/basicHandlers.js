const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const processDeepLink = async (ctx) => {
  // Implement deep link processing logic here.  This would involve extracting
  // information from ctx.startPayload and potentially updating user data or
  // directing them to a specific part of the bot's functionality.
  // This is a placeholder and needs to be implemented based on your deep link strategy.
  console.log("Deep link payload received:", ctx.startPayload);
  await ctx.reply("Deep link processed.  Further implementation required.");
  return true;
};


const startHandler = async (ctx) => {
  try {
    // Check for deep linking payload
    if (ctx.startPayload && await processDeepLink(ctx)) {
      return; // Deep link was processed
    }

    // Get user info from Telegram
    const telegramId = ctx.from.id.toString();
    const username = ctx.from.username || '';
    const firstName = ctx.from.first_name || '';
    const lastName = ctx.from.last_name || '';

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
      [telegramId, username, firstName, lastName]
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
    
    helpMessage += `🔹 *Getting Started:*\n`;
    helpMessage += `/start - Start the bot\n`;
    helpMessage += `/help - Show this help message\n`;
    helpMessage += `/tutorial - View interactive tutorial\n`;
    helpMessage += `/status - Check your account status\n\n`;
    
    helpMessage += `🔹 *Account Management:*\n`;
    helpMessage += `/link - Link social media accounts\n`;
    helpMessage += `/verify - Verify linked accounts\n`;
    helpMessage += `/unlink - Unlink social media accounts\n\n`;
    
    helpMessage += `🔹 *Campaigns & Rewards:*\n`;
    helpMessage += `/campaigns - List available campaigns\n`;
    helpMessage += `/stats - View your participation stats\n`;
    helpMessage += `/achievements - View your achievements\n`;
    helpMessage += `/referral - Get your referral link\n`;
    helpMessage += `/referralstats - Check your referrals\n\n`;
    
    helpMessage += `🔹 *Monetization:*\n`;
    helpMessage += `/premium - View premium plans\n`;
    helpMessage += `/cashout - Cash out your credits\n\n`;

    if (isProjectOwner) {
      helpMessage += `🔹 *Project Owner Commands:*\n`;
      helpMessage += `/newproject - Create a new project\n`;
      helpMessage += `/myprojects - View your projects\n`;
      helpMessage += `/project - Manage a specific project\n`;
      helpMessage += `/newcampaign - Create a new campaign\n`;
      helpMessage += `/campaign - Manage a specific campaign\n`;
      helpMessage += `/postcampaign - Post campaign to channel\n`;
      helpMessage += `/analytics - View campaign analytics\n`;
      helpMessage += `/export - Export campaign data\n`;
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

const tutorialHandler = async (ctx) => {
  try {
    const messages = [
      {
        text: "*Welcome to SocialBoost Bot Tutorial* 🚀\n\nThis quick guide will show you how to use our platform effectively.",
        parse_mode: 'Markdown'
      },
      {
        text: "*Step 1: Link Your Accounts* 🔗\n\nUse /link to connect your social media accounts (X/Twitter, Discord) to verify your participation in campaigns.",
        parse_mode: 'Markdown'
      },
      {
        text: "*Step 2: Join Campaigns* 💪\n\nUse /campaigns to see active campaigns you can join. Each campaign will have specific tasks to complete.",
        parse_mode: 'Markdown'
      },
      {
        text: "*Step 3: Complete Tasks & Earn* 💰\n\nFollow campaign instructions to complete social tasks. Once verified, you'll earn credits for your participation.",
        parse_mode: 'Markdown'
      },
      {
        text: "*Step 4: Cash Out or Upgrade* 🌟\n\nUse /cashout to convert your credits to cryptocurrency or /premium to upgrade your account for higher rewards.",
        parse_mode: 'Markdown'
      }
    ];
    
    // Send messages with a delay between each
    for (let i = 0; i < messages.length; i++) {
      setTimeout(() => {
        ctx.replyWithMarkdown(messages[i].text);
      }, i * 1500);
    }
  } catch (error) {
    console.error('Error in tutorialHandler:', error);
    await ctx.reply('An error occurred while displaying the tutorial. Please try again.');
  }
};

module.exports = {
  startHandler,
  helpHandler,
  statusHandler,
  tutorialHandler
};