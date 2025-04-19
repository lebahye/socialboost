const { Telegraf, Scenes: { Stage }, session } = require('telegraf');
const { Pool } = require('pg');
const { TwitterApi } = require('twitter-api-v2');
require('dotenv').config();

// Initialize bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Use session middleware
const LocalSession = require('telegraf-session-local');
const { rateLimit, contentVerification, channelPosting } = require('./middleware/security');

// Apply security middleware
bot.use(rateLimit);
bot.use(contentVerification);
bot.use(channelPosting);

// Import scheduler
const { initializeScheduler } = require('./services/scheduler');

// Initialize database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Import scenes
const projectRegistrationScene = require('./scenes/projectRegistration');
const campaignCreationScene = require('./scenes/campaignCreation');
const { userRegistrationScene } = require('./scenes/userRegistration');

// Initialize stage with scenes
const stage = new Stage([
  projectRegistrationScene,
  campaignCreationScene,
  userRegistrationScene
]);

// Scene error handling
stage.on('error', (ctx, error) => {
  console.error('Scene error:', error);
  ctx.reply('An error occurred during the process. Please try again with /register.');
});

// Set up session handling and stage middleware
bot.use(session());
bot.use(stage.middleware());

// Initialize Twitter API client
let twitterClient = null;
try {
  twitterClient = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
  });
  console.log('Twitter API client initialized');
} catch (error) {
  console.error('Failed to initialize Twitter API client:', error);
  throw new Error('Twitter API client initialization failed. Please check your API credentials.');
}

// Make Twitter client available globally
global.twitterClient = twitterClient;

// User state middleware
bot.use(async (ctx, next) => {
  if (!ctx.session) ctx.session = {};
  if (!ctx.session.user) {
    ctx.session.user = {
      currentState: null,
      socialAccounts: []
    };
  }
  await next();
});

// Import all handlers
const { startHandler, helpHandler, statusHandler, tutorialHandler, welcomeHandler, registerHandler } = require('./handlers/basicHandlers');
const { linkSocialHandler, linkXAccountCallback, linkDiscordCallback, verifyAccountHandler, unlinkAccountHandler, unlinkAccountCallback, textHandler } = require('./handlers/accountHandlers');
const { newProjectHandler, listProjectsHandler, manageProjectHandler } = require('./handlers/projectHandlers');
const { newCampaignHandler, listCampaignsHandler, manageCampaignHandler, postCampaignToChannelHandler } = require('./handlers/campaignHandlers');
const { analyticsHandler, exportDataHandler, userStatsHandler } = require('./handlers/analyticsHandlers');
const { registerPaymentHandlers } = require('./handlers/paymentHandlers');
const { paymentService } = require('./services/paymentService');
const { referralHandler, referralStatsHandler, processReferral } = require('./handlers/referralHandlers');
const { achievementsHandler } = require('./handlers/achievementHandlers');

// Health check endpoint
bot.command('healthcheck', async (ctx) => {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    await ctx.reply('✅ Bot is running\n✅ Database is connected');
  } catch (error) {
    console.error('Health check failed:', error);
    await ctx.reply('❌ Error: ' + error.message);
  }
});

// Register command handlers
bot.command('start', async (ctx) => {
  // Check for referral code in deep link
  if (ctx.startPayload && ctx.startPayload.startsWith('ref_')) {
    const referralCode = ctx.startPayload.substring(4);
    await processReferral(ctx, referralCode);
  }
  await startHandler(ctx);
});
bot.command('welcome', welcomeHandler || (async (ctx) => await ctx.reply('Welcome command is not available')));
// Basic commands
bot.command('register', async (ctx) => {
  try {
    await registerHandler(ctx);
  } catch (error) {
    console.error('Error in register command:', error);
    await ctx.reply('An error occurred. Please try again.');
  }
});
bot.command('help', async (ctx) => {
  try {
    await helpHandler(ctx);
  } catch (error) {
    console.error('Error in help command:', error);
    await ctx.reply('An error occurred. Please try again.');
  }
});
bot.command('status', async (ctx) => {
  try {
    await statusHandler(ctx);
  } catch (error) {
    console.error('Error in status command:', error);
    await ctx.reply('An error occurred. Please try again.');
  }
});
bot.command('tutorial', async (ctx) => {
  try {
    await tutorialHandler(ctx);
  } catch (error) {
    console.error('Error in tutorial command:', error);
    await ctx.reply('An error occurred. Please try again.');
  }
});
bot.command('welcome', async (ctx) => {
  try {
    await welcomeHandler(ctx);
  } catch (error) {
    console.error('Error in welcome command:', error);
    await ctx.reply('An error occurred. Please try again.');
  }
});

// Account commands
bot.command('link', linkSocialHandler);
bot.command('verify', verifyAccountHandler);
bot.command('unlink', unlinkAccountHandler);

// Project commands 
bot.command('newproject', async (ctx) => {
  try {
    await ctx.scene.enter('projectRegistration');
  } catch (error) {
    console.error('Error entering project registration:', error);
    await ctx.reply('An error occurred. Please try again.');
  }
});
bot.command('myprojects', listProjectsHandler);
bot.command('project', manageProjectHandler);

// Campaign commands
bot.command('newcampaign', async (ctx) => {
  try {
    await ctx.scene.enter('campaignCreation');
  } catch (error) {
    console.error('Error entering campaign creation:', error);
    await ctx.reply('An error occurred. Please try again.');
  }
});
bot.command('campaigns', listCampaignsHandler);
bot.command('campaign', manageCampaignHandler);
bot.command('campaign', manageCampaignHandler || (async (ctx) => await ctx.reply('Campaign management is not available')));
bot.command('postcampaign', postCampaignToChannelHandler || (async (ctx) => await ctx.reply('Campaign posting is not available')));
bot.command('analytics', analyticsHandler || (async (ctx) => await ctx.reply('Analytics feature is not available')));
bot.command('stats', userStatsHandler || (async (ctx) => await ctx.reply('Stats feature is not available')));
bot.command('export', exportDataHandler || (async (ctx) => await ctx.reply('Export feature is not available')));
bot.command('referral', referralHandler || (async (ctx) => await ctx.reply('Referral feature is not available')));
bot.command('referralstats', referralStatsHandler || (async (ctx) => await ctx.reply('Referral stats feature is not available')));
bot.command('achievements', async (ctx) => {
  try {
    if (achievementsHandler) {
      await achievementsHandler(ctx);
    } else {
      await ctx.reply('Achievements feature is not available');
    }
  } catch (error) {
    console.error('Error in achievements handler:', error);
    await ctx.reply('An error occurred while fetching achievements. Please try again later.');
  }
});

// Register monetization handlers
registerPaymentHandlers(bot);

// Initialize payment service
paymentService.setBot(bot);

// Register callback query handlers
bot.action(/link_([a-z]+)/, async (ctx) => {
  console.log('Link action callback received:', ctx.match[1]);
  const platform = ctx.match[1];
  try {
    const accountHandlers = require('./handlers/accountHandlers');
    if (platform === 'x') {
      await accountHandlers.linkXAccountCallback(ctx);
    } else if (platform === 'discord') {
      await accountHandlers.linkDiscordCallback(ctx);
    }
  } catch (err) {
    console.error('Error in link callback:', err);
    await ctx.answerCbQuery('An error occurred. Please try again later.');
  }
});

// Test commands (REMOVE IN PRODUCTION)
bot.command('testverify', async (ctx) => {
  if (process.env.NODE_ENV !== 'production') {
    try {
      const telegramId = ctx.from.id.toString();
      const result = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [telegramId]);

      if (!result.rows[0]) {
        return ctx.reply('Please start the bot first with /start');
      }

      const user = result.rows[0];
      let socialAccounts = [];

      if (user.social_accounts) {
        if (typeof user.social_accounts === 'string') {
          socialAccounts = JSON.parse(user.social_accounts);
        } else {
          socialAccounts = user.social_accounts;
        }
      }

      if (!socialAccounts.length) {
        return ctx.reply('No accounts to verify. Use /link first.');
      }

      // Mark all accounts as verified
      socialAccounts.forEach(acc => {
        acc.is_verified = true;
      });

      await pool.query(
        'UPDATE users SET social_accounts = $1 WHERE telegram_id = $2',
        [JSON.stringify(socialAccounts), telegramId]
      );

      await ctx.reply('✅ All your accounts have been verified for testing purposes!');
    } catch (error) {
      console.error('Error in test verify:', error);
      await ctx.reply('An error occurred during test verification.');
    }
  } else {
    await ctx.reply('This command is only available in development mode.');
  }
});

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('An error occurred. Please try again later.');
});

// Database connection management
let isConnected = false;
async function connectDatabase() {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    console.log('Connected to PostgreSQL database');
    isConnected = true;
    client.release();
  } catch (err) {
    console.error('Error connecting to PostgreSQL:', err);
    isConnected = false;
  }
}

// Initial connection
connectDatabase();

// Import webhook server
const { startWebhookServer } = require('./api/webhookServer');

// Launch bot
bot.launch().then(() => {
  console.log('Bot started');

  // Initialize scheduled tasks
  initializeScheduler(bot);
  console.log('Scheduler initialized');

  // Start webhook server for payment processing
  if (process.env.ENABLE_WEBHOOKS === 'true') {
    startWebhookServer();
    console.log('Webhook server initialized');
  }
}).catch(err => {
  console.error('Bot error:', err);
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));