// Simple environment check
require('dotenv').config();

console.log('Environment variables check:');
console.log('--------------------------');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

// Check Telegram Bot Token
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.log('❌ TELEGRAM_BOT_TOKEN: Not set');
} else {
  console.log('✅ TELEGRAM_BOT_TOKEN:', token.substring(0, 10) + '...');
}

// Check MongoDB URI
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.log('❌ MONGODB_URI: Not set');
} else {
  console.log('✅ MONGODB_URI:', mongoUri.substring(0, 20) + '...');
}

// Twitter API credentials
const twitterApiKey = process.env.TWITTER_API_KEY;
if (!twitterApiKey) {
  console.log('❌ TWITTER_API_KEY: Not set');
} else {
  console.log('✅ TWITTER_API_KEY:', twitterApiKey);
}

console.log('--------------------------');
console.log('Telegram Bot Commands in Code:');
console.log('/start - Begin interaction with the bot');
console.log('/help - Show available commands');
console.log('/status - Check your current status');
console.log('/link - Link social media accounts');
console.log('/verify - Verify linked accounts');
console.log('/unlink - Unlink social media accounts');
console.log('/newproject - Create a new project');
console.log('/myprojects - List your projects');
console.log('/project - Manage a specific project');
console.log('/newcampaign - Create a new campaign');
console.log('/campaigns - List available campaigns');
console.log('/campaign - Manage a specific campaign');
console.log('/check - Check participation in a campaign');
console.log('/remind - Send reminders to participants');
console.log('/analytics - Show analytics for projects/campaigns');
console.log('/export - Export project or campaign data');
console.log('--------------------------');
