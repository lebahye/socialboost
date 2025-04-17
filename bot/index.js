// Main entry point for the Campaign Coordination Telegram Bot
const { Telegraf, Scenes, session } = require('telegraf');
const LocalSession = require('telegraf-session-local');
const { Pool } = require('pg');
const { TwitterApi } = require('twitter-api-v2');
require('dotenv').config();

// Import scene handlers
const { projectRegistrationScene } = require('./scenes/projectRegistration');
const { campaignCreationScene } = require('./scenes/campaignCreation');
const { userRegistrationScene } = require('./scenes/userRegistration');
const { xVerificationScene } = require('./scenes/xVerification');

// Import command handlers
const {
  startHandler,
  helpHandler,
  statusHandler
} = require('./handlers/basicHandlers');

const {
  newProjectHandler,
  manageProjectHandler,
  listProjectsHandler
} = require('./handlers/projectHandlers');

const {
  newCampaignHandler,
  manageCampaignHandler,
  listCampaignsHandler,
  checkParticipationHandler,
  sendRemindersHandler
} = require('./handlers/campaignHandlers');

const {
  linkSocialHandler,
  linkXAccountCallback,
  linkDiscordCallback,
  verifyAccountHandler,
  unlinkAccountHandler,
  unlinkAccountCallback,
  textHandler
} = require('./handlers/accountHandlers');

const {
  analyticsHandler,
  exportDataHandler
} = require('./handlers/analyticsHandlers');

// Import middleware
const { userMiddleware, projectOwnerMiddleware, authMiddleware } = require('./middleware/auth');

// Import services
const scheduler = require('./services/scheduler');
const verificationService = require('./services/verification');

// Initialize bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Initialize database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Test database connection
pool.connect()
  .then(() => {
    console.log('Connected to PostgreSQL database');
  })
  .catch(err => {
    console.error('Error connecting to PostgreSQL:', err);
    console.log('Running in limited mode without database persistence');
  });

// Initialize X/Twitter API client
let twitterClient = null;
if (process.env.TWITTER_API_KEY && process.env.TWITTER_API_SECRET) {
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
  }
} else {
  console.log('Twitter API credentials not found, X verification features will be limited');
}

// Session configuration
const localSession = new LocalSession({ database: 'sessions.json' });

// Configure session and scenes
bot.use(localSession.middleware());

const stage = new Scenes.Stage([
  projectRegistrationScene,
  campaignCreationScene,
  userRegistrationScene,
  xVerificationScene
]);

bot.use(stage.middleware());
bot.use(userMiddleware);
bot.use(authMiddleware);

// Register command handlers
bot.command('start', startHandler);
bot.command('help', helpHandler);
bot.command('status', statusHandler);
bot.command('link', linkSocialHandler);
bot.command('verify', verifyAccountHandler);
bot.command('unlink', unlinkAccountHandler);

// Project owner commands
bot.command('newproject', projectOwnerMiddleware, newProjectHandler);
bot.command('myprojects', projectOwnerMiddleware, listProjectsHandler);
bot.command('project', projectOwnerMiddleware, manageProjectHandler);

// Campaign commands
bot.command('newcampaign', projectOwnerMiddleware, newCampaignHandler);
bot.command('campaigns', listCampaignsHandler);
bot.command('campaign', manageCampaignHandler);
bot.command('check', projectOwnerMiddleware, checkParticipationHandler);
bot.command('remind', projectOwnerMiddleware, sendRemindersHandler);

// Analytics commands
bot.command('analytics', projectOwnerMiddleware, analyticsHandler);
bot.command('export', projectOwnerMiddleware, exportDataHandler);

// Handle callback queries
bot.action(/link_(.+)/, async (ctx) => {
  const platform = ctx.match[1];
  if (platform === 'x') {
    await linkXAccountCallback(ctx);
  } else if (platform === 'discord') {
    await linkDiscordCallback(ctx);
  }
});

bot.action(/unlink_(.+)/, unlinkAccountCallback);

// Handle text messages
bot.on('text', textHandler);

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('An error occurred. Please try again later or contact support.');
});

// Initialize services
scheduler.setBot(bot);
verificationService.setBot(bot);

// Start bot
const isDevelopment = process.env.NODE_ENV === 'development';
if (isDevelopment) {
  bot.launch().then(() => {
    console.log('Bot started in polling mode (development)');
  });
} else {
  const PORT = process.env.PORT || 3000;
  const express = require('express');
  const app = express();

  app.use(express.json());

  app.post(`/bot${process.env.TELEGRAM_BOT_TOKEN}`, (req, res) => {
    bot.handleUpdate(req.body, res);
  });

  app.get('/health', (req, res) => {
    res.status(200).send('OK');
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bot webhook server started on port ${PORT}`);
  });
}

// Enable graceful stop
process.once('SIGINT', () => {
  scheduler.stopAllTasks();
  bot.stop('SIGINT');
  pool.end();
});
process.once('SIGTERM', () => {
  scheduler.stopAllTasks(); 
  bot.stop('SIGTERM');
  pool.end();
});