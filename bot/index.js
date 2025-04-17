const { Telegraf, Scenes: { Stage }, session } = require('telegraf');
const { Pool } = require('pg');
const { TwitterApi } = require('twitter-api-v2');
require('dotenv').config();

// Initialize bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

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

// Initialize stage with scenes
const stage = new Stage([
  projectRegistrationScene,
  campaignCreationScene
]);

// Set up session handling (use built-in session middleware)
bot.use(session());

// Register stage middleware
bot.use(stage.middleware());

// Initialize Twitter API client if credentials exist
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
}

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
const { startHandler, helpHandler, statusHandler } = require('./handlers/basicHandlers');
const { linkSocialHandler, verifyAccountHandler, unlinkAccountHandler } = require('./handlers/accountHandlers');
const { newProjectHandler, listProjectsHandler, manageProjectHandler } = require('./handlers/projectHandlers');
const { newCampaignHandler, listCampaignsHandler, manageCampaignHandler } = require('./handlers/campaignHandlers');
const { analyticsHandler, exportDataHandler } = require('./handlers/analyticsHandlers');

// Register command handlers
bot.command('start', startHandler);
bot.command('help', helpHandler);
bot.command('status', statusHandler);
bot.command('link', linkSocialHandler);
bot.command('verify', verifyAccountHandler);
bot.command('unlink', unlinkAccountHandler);
bot.command('newproject', ctx => ctx.scene.enter('projectRegistration'));
bot.command('myprojects', listProjectsHandler);
bot.command('project', manageProjectHandler);
bot.command('newcampaign', ctx => ctx.scene.enter('CAMPAIGN_CREATION'));
bot.command('campaigns', listCampaignsHandler);
bot.command('campaign', manageCampaignHandler);
bot.command('analytics', analyticsHandler);
bot.command('export', exportDataHandler);

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

// Start bot
bot.launch()
  .then(() => {
    console.log('Bot started successfully');
  })
  .catch(err => {
    console.error('Error starting bot:', err);
  });

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));