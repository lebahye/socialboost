const { Telegraf, Scenes, session } = require('telegraf');
const LocalSession = require('telegraf-session-local');
const { Pool } = require('pg');
const { TwitterApi } = require('twitter-api-v2');
require('dotenv').config();

// Import handlers
const { startHandler, helpHandler, statusHandler } = require('./handlers/basicHandlers');

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

let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  if (!isConnected) {
    setTimeout(connectDatabase, 5000);
  }
});

// Test and maintain database connection
async function connectDatabase() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error('Max reconnection attempts reached. Please check database configuration.');
    return;
  }

  try {
    const client = await pool.connect();
    await client.query('SELECT 1'); // Test query
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

// Ping database every 30 seconds to keep connection alive
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