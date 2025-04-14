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

// Environment file path
const envFilePath = path.join(__dirname, '.env');

// Check if .env file exists, if not create it from template
if (!fs.existsSync(envFilePath)) {
  const envTemplate = `# Telegram Bot Token (Get from BotFather)
TELEGRAM_BOT_TOKEN=

# MongoDB Connection
MONGODB_URI=

# Twitter/X API Credentials (Optional - for X verification)
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_ACCESS_TOKEN=
TWITTER_ACCESS_SECRET=

# Environment and Webhook Settings
NODE_ENV=development
WEBHOOK_URL=
PORT=3000
`;

  fs.writeFileSync(envFilePath, envTemplate);
  console.log('.env file created successfully!');
} else {
  console.log('.env file already exists.');
}

// Function to update a value in the .env file
function updateEnvValue(key, value) {
  try {
    let envContent = fs.readFileSync(envFilePath, 'utf8');
    const regex = new RegExp(`${key}=.*`, 'g');

    if (envContent.match(regex)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }

    fs.writeFileSync(envFilePath, envContent);
    return true;
  } catch (error) {
    console.error(`Error updating ${key}:`, error);
    return false;
  }
}

// Helper to ask questions
const askQuestion = (question) => {
  return new Promise(resolve => {
    rl.question(`\x1b[1m${question}\x1b[0m `, answer => {
      resolve(answer);
    });
  });
};

// Function to run the setup wizard
async function runSetupWizard() {
  console.log('\n==== SocialBoost Bot Setup Wizard ====\n');

  const questions = [
    {
      key: 'TELEGRAM_BOT_TOKEN',
      question: 'Enter your Telegram Bot Token (from BotFather):',
      required: true
    },
    {
      key: 'MONGODB_URI',
      question: 'Enter your MongoDB Connection URI:',
      required: true
    },
    {
      key: 'TWITTER_API_KEY',
      question: 'Enter your Twitter/X API Key (optional, press Enter to skip):',
      required: false
    },
    {
      key: 'TWITTER_API_SECRET',
      question: 'Enter your Twitter/X API Secret (optional, press Enter to skip):',
      required: false
    },
    {
      key: 'PORT',
      question: 'Enter port number for the bot (default: 3000):',
      required: false,
      default: '3000'
    }
  ];

  for (const q of questions) {
    const answer = await new Promise(resolve => {
      rl.question(`${q.question} `, (answer) => {
        resolve(answer.trim());
      });
    });

    if ((q.required && !answer) && !q.default) {
      console.error(`Error: ${q.key} is required.`);
      process.exit(1);
    }

    const valueToSet = answer || q.default || '';
    if (valueToSet) {
      updateEnvValue(q.key, valueToSet);
    }
  }

  console.log('\nSetup completed successfully!');
  console.log('\nTo start the bot:');
  console.log('  - Development mode: npm run dev');
  console.log('  - Production mode: npm start');

  console.log('\nMake sure to install dependencies first with: npm install');
  console.log('\nFor more information, see the README.md file.');

  rl.close();
}

// Run the setup wizard
runSetupWizard();
