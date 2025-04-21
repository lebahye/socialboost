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
    // Check for registration deep links
    if (ctx.startPayload) {
      if (ctx.startPayload === 'register_member') {
        ctx.session.registrationType = 'member';
        return ctx.scene.enter('userRegistration');
      } else if (ctx.startPayload === 'register_project') {
        ctx.session.registrationType = 'project';
        return ctx.scene.enter('userRegistration');
      } else if (await processDeepLink(ctx)) {
        return; // Other deep link was processed
      }
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

const welcomeHandler = async (ctx) => {
  try {
    await ctx.reply(
      '👋 *Welcome to SocialBoost!*\n\n' +
      'I help coordinate social media campaigns between blockchain projects and their communities.\n\n' +
      '🔹 *For Community Members:*\n' +
      '• Participate in campaigns\n' +
      '• Earn rewards for engagement\n' +
      '• Track your achievements\n\n' +
      '🔹 *For Project Owners:*\n' +
      '• Create and manage campaigns\n' +
      '• Track engagement metrics\n' +
      '• Grow your community\n\n' +
      'Use /register to set up your account or /help to see all commands.',
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Error in welcomeHandler:', error);
    await ctx.reply('An error occurred. Please try again.');
  }
};

const registerHandler = async (ctx) => {
  try {
    const telegramId = ctx.from.id.toString();
    const result = await pool.query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [telegramId]
    );

    if (result.rows[0]) {
      const user = result.rows[0];
      return ctx.reply(
        `You are already registered!\n\n` +
        `*Account Details:*\n` +
        `• Username: ${user.username || 'Not set'}\n` +
        `• Account Type: ${user.is_project_owner ? 'Project Owner' : 'Community Member'}\n` +
        `• Joined: ${new Date(user.created_at).toDateString()}\n\n` +
        `Use /status to check your account details or /help to see available commands.`,
        { parse_mode: 'Markdown' }
      );
    }

    // Initialize registration state
    ctx.session.registrationData = {
      telegramId,
      username: ctx.from.username,
      firstName: ctx.from.first_name,
      lastName: ctx.from.last_name
    };

    // Enter registration scene
    return ctx.scene.enter('userRegistration');
  } catch (error) {
    console.error('Error in registerHandler:', error);
    await ctx.reply('An error occurred during registration. Please try again.');
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
    statusMessage += `• Account Type: ${user.is_project_owner ? 'Project Owner' : 'Participant'}\n`;
    if (user.is_admin) statusMessage += '• Admin Status: ✅\n';

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
        text: "*Welcome to SocialBoost Bot Tutorial* 🚀\n\nThis comprehensive guide will show you how to use our platform effectively.",
        parse_mode: 'Markdown'
      },
      {
        text: "*Step 1: Account Setup* 👤\n\n• Use /status to check your account details\n• View /help anytime to see all available commands\n• Use /verify to confirm your account status",
        parse_mode: 'Markdown'
      },
      {
        text: "*Step 2: Link Your Social Accounts* 🔗\n\n• Use /link to connect X/Twitter and Discord\n• Follow the verification process for each platform\n• Use /unlink if you need to remove any account\n• Check /verify to confirm your accounts are properly linked",
        parse_mode: 'Markdown'
      },
      {
        text: "*Step 3: Explore Available Campaigns* 🎯\n\n• Use /campaigns to browse active campaigns\n• Each campaign shows required tasks and rewards\n• Use /campaign <number> to view specific campaign details\n• Premium campaigns offer higher rewards (/premium to upgrade)",
        parse_mode: 'Markdown'
      },
      {
        text: "*Step 4: Participate & Earn* 💰\n\n• Join campaigns that interest you\n• Complete required social media tasks\n• Use /check to verify your participation\n• Earn credits upon successful verification",
        parse_mode: 'Markdown'
      },
      {
        text: "*Step 5: Track & Analyze* 📊\n\n• Use /analytics to view your performance\n• Check campaign statistics and earnings\n• Monitor your engagement metrics\n• Track your referral earnings (/referral)",
        parse_mode: 'Markdown'
      },
      {
        text: "*Step 6: Rewards & Benefits* 🌟\n\n• Accumulate credits through participation\n• Use /cashout to convert credits (min. 1000 required)\n• Upgrade to premium for higher rewards (/premium)\n• Earn extra through referrals (/referral)",
        parse_mode: 'Markdown'
      },
      {
        text: "*Project Owners* 🏢\n\n• Create projects with /newproject\n• Launch campaigns using /newcampaign\n• Manage projects via /myprojects\n• Post campaigns with /postcampaign\n• Track performance with /analytics",
        parse_mode: 'Markdown'
      }
    ];

    // Send messages with a delay between each
    for (let i = 0; i < messages.length; i++) {
      setTimeout(() => {
        ctx.replyWithMarkdown(messages[i].text);
      }, i * 2000);
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
  tutorialHandler,
  welcomeHandler,
  registerHandler
};