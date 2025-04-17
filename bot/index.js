
const { Telegraf, Scenes, session } = require('telegraf');
const LocalSession = require('telegraf-session-local');

const { Scenes: { Stage } } = require('telegraf');
const projectRegistrationScene = require('./scenes/projectRegistration');
const campaignCreationScene = require('./scenes/campaignCreation');

// Initialize stage with scenes
const stage = new Stage([
  projectRegistrationScene,
  campaignCreationScene
]);

// Register stage middleware
bot.use(stage.middleware());

const { Pool } = require('pg');
const { TwitterApi } = require('twitter-api-v2');
require('dotenv').config();

// Initialize bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Initialize database pool with reconnection settings
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: {
    rejectUnauthorized: false
  },
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
});

// Database connection management
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  if (!isConnected) {
    setTimeout(connectDatabase, 5000);
  }
});

async function connectDatabase() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error('Max reconnection attempts reached. Please check database configuration.');
    return;
  }

  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    console.log('Connected to PostgreSQL database');
    isConnected = true;
    reconnectAttempts = 0;
    client.release();
  } catch (err) {
    console.error('Error connecting to PostgreSQL:', err);
    isConnected = false;
    reconnectAttempts++;
    setTimeout(connectDatabase, 5000);
  }
}

// Initial connection
connectDatabase();

// Ping database to keep connection alive
setInterval(async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
  } catch (err) {
    console.error('Ping failed:', err);
  }
}, 30000);

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

// Session configuration
const localSession = new LocalSession({ database: 'sessions.json' });
bot.use(localSession.middleware());

// User state middleware
bot.use(async (ctx, next) => {
  // Initialize user state if not exists
  if (!ctx.state) {
    ctx.state = {};
  }
  if (!ctx.state.user) {
    ctx.state.user = {
      currentState: null,
      socialAccounts: []
    };
  }
  await next();
});

// Import all handlers
const { startHandler, helpHandler, statusHandler } = require('./handlers/basicHandlers');
const { linkSocialHandler, verifyAccountHandler, unlinkAccountHandler, linkXAccountCallback, linkDiscordCallback } = require('./handlers/accountHandlers');
const { newProjectHandler, listProjectsHandler, manageProjectHandler } = require('./handlers/projectHandlers');
const { newCampaignHandler, listCampaignsHandler, manageCampaignHandler } = require('./handlers/campaignHandlers');
const { analyticsHandler, exportDataHandler } = require('./handlers/analyticsHandlers');

// Register all command handlers
bot.command('start', startHandler);
bot.command('help', helpHandler);
bot.command('status', statusHandler);
bot.command('link', linkSocialHandler);
bot.command('verify', verifyAccountHandler);
bot.command('unlink', unlinkAccountHandler);

// Register callback handlers for social media linking
bot.action('link_x', linkXAccountCallback);
bot.action('link_discord', linkDiscordCallback);
bot.command('newproject', newProjectHandler);
bot.command('myprojects', listProjectsHandler);
bot.command('project', manageProjectHandler);
bot.command('newcampaign', newCampaignHandler);
bot.command('campaigns', listCampaignsHandler);
bot.command('campaign', manageCampaignHandler);

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('An error occurred. Please try again later.');
});

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
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bot webhook server started on port ${PORT}`);
  });
}

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
