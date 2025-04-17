const { Telegraf, Scenes, session } = require('telegraf');
const LocalSession = require('telegraf-session-local');
const { Pool } = require('pg');
const { TwitterApi } = require('twitter-api-v2');
require('dotenv').config();

// Import handlers
const { startHandler, helpHandler, statusHandler } = require('./handlers/basicHandlers');

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
  });

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

// Register basic command handlers
bot.command('start', startHandler);
bot.command('help', helpHandler);
bot.command('status', statusHandler);

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