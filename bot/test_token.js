// This script tests if your Telegram bot token is valid
const https = require('https');
require('dotenv').config();

// Get the token from environment variables or from command line
const token = process.argv[2] || process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('❌ Error: No token provided!');
  console.log('Usage: node test_token.js [YOUR_BOT_TOKEN]');
  console.log('  or set TELEGRAM_BOT_TOKEN in .env file');
  process.exit(1);
}

console.log(`🔍 Testing token: ${token.substring(0, 8)}...${token.substring(token.length - 5)}`);

// Create the URL for the getMe endpoint
const url = `https://api.telegram.org/bot${token}/getMe`;

// Make a request to the Telegram API
https.get(url, (res) => {
  let data = '';

  // A chunk of data has been received
  res.on('data', (chunk) => {
    data += chunk;
  });

  // The whole response has been received
  res.on('end', () => {
    try {
      const result = JSON.parse(data);

      if (result.ok) {
        console.log('✅ SUCCESS! Token is valid.');
        console.log('Bot information:');
        console.log(`  Username: @${result.result.username}`);
        console.log(`  Name: ${result.result.first_name}`);
        console.log(`  Bot ID: ${result.result.id}`);
        console.log('\nYou can now use this token in your .env file and start the bot.');
      } else {
        console.error('❌ ERROR: Invalid token');
        console.error(`Error code: ${result.error_code}`);
        console.error(`Description: ${result.description}`);
        console.log('\nPlease check with BotFather for the correct token.');
      }
    } catch (error) {
      console.error('❌ ERROR: Failed to parse response');
      console.error(error.message);
    }
  });
}).on('error', (error) => {
  console.error('❌ ERROR: Request failed');
  console.error(error.message);
});

// Instructions for using BotFather
console.log('\n📋 How to get a valid token:');
console.log('1. Open Telegram and search for @BotFather');
console.log('2. Send /start to initiate the conversation');
console.log('3. Send /newbot to create a new bot OR /token to get an existing bot\'s token');
console.log('4. Follow the instructions provided by BotFather');
console.log('5. Copy the token and use it here');
