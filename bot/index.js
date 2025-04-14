// Main entry point for the Campaign Coordination Telegram Bot
const { Telegraf, Scenes, session } = require('telegraf');
const LocalSession = require('telegraf-session-local');
const mongoose = require('mongoose');
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

// Connect to database if MongoDB URI is provided
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(() => {
    console.log('Connected to MongoDB');
  }).catch(err => {
    console.error('Error connecting to MongoDB:', err);
    console.log('Running in limited mode without database persistence');
  });
} else {
  console.log('No MongoDB URI provided, running in limited mode without database persistence');
}

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

// Register session middleware
bot.use(localSession.middleware());

// Configure session and scenes
bot.use(session());

const stage = new Scenes.Stage([
  projectRegistrationScene,
  campaignCreationScene,
  userRegistrationScene,
  xVerificationScene
]);

bot.use(stage.middleware());
bot.use(userMiddleware);
bot.use(authMiddleware);

// Basic commands (available to all users)
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
bot.command('campaigns', listCampaignsHandler); // Available to both project owners and regular users
bot.command('campaign', manageCampaignHandler); // Available to both, but with different views
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

// Handle text messages for state-based conversations
bot.on('text', textHandler);

// Error handling
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}`, err);
  ctx.reply('An error occurred. Please try again later or contact support.');
});

// Initialize services with bot instance
scheduler.setBot(bot);
verificationService.setBot(bot);

// Start scheduled tasks in production mode
if (process.env.NODE_ENV === 'production') {
  scheduler.startAllTasks();
  console.log('Scheduled tasks started in production mode');
}

// Start bot
const isDevelopment = process.env.NODE_ENV === 'development';

if (isDevelopment) {
  // Use polling for development (easier for local testing)
  bot.launch().then(() => {
    console.log('Bot started in polling mode (development)');
  });
} else {
  // Use webhook for production
  const PORT = process.env.PORT || 3000;
  const WEBHOOK_URL = process.env.WEBHOOK_URL;

  if (!WEBHOOK_URL) {
    console.error('WEBHOOK_URL environment variable is required for production mode');
    process.exit(1);
  }

  // Start webhook
  bot.telegram.setWebhook(`${WEBHOOK_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}`);

  // Set up Express server for webhook
  const express = require('express');
  const app = express();

  // Parse Telegram webhook requests
  app.use(express.json());

  // Set the webhook endpoint
  app.post(`/bot${process.env.TELEGRAM_BOT_TOKEN}`, (req, res) => {
    bot.handleUpdate(req.body, res);
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).send('OK');
  });

  // Start server
  app.listen(PORT, () => {
    console.log(`Bot webhook server started on port ${PORT}`);
    console.log(`Webhook URL: ${WEBHOOK_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}`);
  });
}

// Enable graceful stop
process.once('SIGINT', () => {
  scheduler.stopAllTasks();
  bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  scheduler.stopAllTasks();
  bot.stop('SIGTERM');
});
