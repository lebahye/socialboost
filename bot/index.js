// Main entry point for the Campaign Coordination Telegram Bot
const { Telegraf, Scenes, session } = require('telegraf');
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
const { userMiddleware, projectOwnerMiddleware } = require('./middleware/auth');

// Import services
const scheduler = require('./services/scheduler');
const verificationService = require('./services/verification');

// Initialize bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Connect to database
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Error connecting to MongoDB:', err);
});

// Initialize X/Twitter API client
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

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
if (process.env.NODE_ENV === 'production') {
  // Webhook setup for production
  bot.telegram.setWebhook(`${process.env.WEBHOOK_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}`);
  bot.startWebhook(`/bot${process.env.TELEGRAM_BOT_TOKEN}`, null, process.env.PORT || 3000);
  console.log('Bot started with webhook mode');
} else {
  // Polling for development
  bot.launch();
  console.log('Bot started with polling mode');
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
