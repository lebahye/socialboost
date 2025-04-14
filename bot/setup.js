#!/usr/bin/env node

/**
 * Setup script for the Social Campaign Coordinator Bot
 * This script helps users set up their bot by guiding them through
 * the configuration process and creating the necessary .env file.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper to ask questions
const askQuestion = (question) => {
  return new Promise(resolve => {
    rl.question(`\x1b[1m${question}\x1b[0m `, answer => {
      resolve(answer);
    });
  });
};

// Helper to save .env file
const saveEnvFile = (envVars) => {
  const envPath = path.join(__dirname, '.env');
  const envContent = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  fs.writeFileSync(envPath, envContent);
  console.log(`\x1b[32m✓\x1b[0m Environment file saved to ${envPath}`);
};

// Welcome message
console.log('\n\x1b[1;36m=============================================');
console.log('   Social Campaign Coordinator Bot Setup    ');
console.log('=============================================\x1b[0m\n');

console.log('This script will help you set up your bot configuration.\n');
console.log('You will need:');
console.log('  - Telegram Bot Token (from @BotFather)');
console.log('  - MongoDB Connection String');
console.log('  - (Optional) X/Twitter API credentials\n');

const setup = async () => {
  const envVars = {};

  // Telegram Bot Token
  console.log('\x1b[1;33m[Step 1/5]\x1b[0m Telegram Bot Setup');
  console.log('  If you don\'t have a bot token yet, please:');
  console.log('  1. Open Telegram and search for @BotFather');
  console.log('  2. Send /newbot command and follow the instructions');
  console.log('  3. Copy the bot token provided\n');

  const botToken = await askQuestion('Enter your Telegram Bot Token:');
  if (!botToken) {
    console.log('\x1b[31m✗\x1b[0m Bot token is required. Please restart the setup.');
    process.exit(1);
  }
  envVars.TELEGRAM_BOT_TOKEN = botToken;

  // MongoDB Connection
  console.log('\n\x1b[1;33m[Step 2/5]\x1b[0m MongoDB Setup');
  console.log('  You need a MongoDB connection string. You can use:');
  console.log('  - MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas');
  console.log('  - Local MongoDB: mongodb://localhost:27017/bot-database\n');

  const mongoUri = await askQuestion('Enter your MongoDB Connection String:');
  if (!mongoUri) {
    console.log('\x1b[31m✗\x1b[0m MongoDB URI is required. Please restart the setup.');
    process.exit(1);
  }
  envVars.MONGODB_URI = mongoUri;

  // Environment
  console.log('\n\x1b[1;33m[Step 3/5]\x1b[0m Environment Setup');

  const environment = await askQuestion('Choose environment (development/production) [default: development]:');
  envVars.NODE_ENV = environment || 'development';

  if (envVars.NODE_ENV === 'production') {
    const webhookUrl = await askQuestion('Enter your webhook URL (e.g., https://yourdomain.com):');
    if (webhookUrl) {
      envVars.WEBHOOK_URL = webhookUrl;
    }

    const port = await askQuestion('Enter port for webhook server [default: 3000]:');
    envVars.PORT = port || '3000';
  }

  // X/Twitter API (Optional)
  console.log('\n\x1b[1;33m[Step 4/5]\x1b[0m X/Twitter API Setup (Optional)');
  console.log('  These are optional but required for X account verification.');
  console.log('  You can get these from the Twitter Developer Portal.');
  console.log('  Skip by pressing Enter if you don\'t have them yet.\n');

  const twitterApiKey = await askQuestion('Enter your X/Twitter API Key (Optional):');
  if (twitterApiKey) {
    envVars.TWITTER_API_KEY = twitterApiKey;

    const twitterApiSecret = await askQuestion('Enter your X/Twitter API Secret (Optional):');
    envVars.TWITTER_API_SECRET = twitterApiSecret || '';

    const twitterAccessToken = await askQuestion('Enter your X/Twitter Access Token (Optional):');
    envVars.TWITTER_ACCESS_TOKEN = twitterAccessToken || '';

    const twitterAccessSecret = await askQuestion('Enter your X/Twitter Access Secret (Optional):');
    envVars.TWITTER_ACCESS_SECRET = twitterAccessSecret || '';
  }

  // Additional Configuration
  console.log('\n\x1b[1;33m[Step 5/5]\x1b[0m Additional Configuration');

  // Generate a random session secret
  const sessionSecret = crypto.randomBytes(32).toString('hex');
  envVars.SESSION_SECRET = sessionSecret;

  // Save the configuration
  saveEnvFile(envVars);

  console.log('\n\x1b[1;32m✓ Setup complete!\x1b[0m');
  console.log('\nYou can now start your bot with:');
  console.log('  npm run dev    # For development');
  console.log('  npm start      # For production\n');

  console.log('Happy bot building! 🤖\n');

  rl.close();
};

// Run the setup
setup().catch(err => {
  console.error('\x1b[31mError during setup:\x1b[0m', err);
  rl.close();
  process.exit(1);
});
