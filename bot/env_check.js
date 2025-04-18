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

// Check PostgreSQL Database URL
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.log('❌ DATABASE_URL: Not set');
} else {
  console.log('✅ DATABASE_URL:', dbUrl.substring(0, 20) + '...');
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

// Display available commands
console.log("\nTelegram Bot Commands in Code:");
console.log("/start - Begin interaction with the bot");
console.log("/help - Show available commands");
console.log("/status - Check your current status");
console.log("/link - Link social media accounts");
console.log("/verify - Verify linked accounts");
console.log("/unlink - Unlink social media accounts");
console.log("/newproject - Create a new project");
console.log("/myprojects - List your projects");
console.log("/project - Manage a specific project");
console.log("/newcampaign - Create a new campaign");
console.log("/campaigns - List available campaigns");
console.log("/campaign - Manage a specific campaign");
console.log("/postcampaign - Post campaign to project's TG channel");
console.log("/check - Check participation in a campaign");
console.log("/remind - Send reminders to participants");
console.log("/analytics - Show analytics for projects/campaigns");
console.log("/export - Export project or campaign data");
console.log("--------------------------");

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
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

console.log('Environment variables check:');
console.log('--------------------------');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

// Mask tokens for security
const maskToken = (token) => {
  if (!token) return 'Not set';
  return token.substring(0, 10) + '...';
};

console.log('✅ TELEGRAM_BOT_TOKEN:', maskToken(process.env.TELEGRAM_BOT_TOKEN));
console.log('✅ MONGODB_URI:', maskToken(process.env.MONGODB_URI));
console.log('✅ TWITTER_API_KEY:', maskToken(process.env.TWITTER_API_KEY));
console.log('--------------------------');

// Read bot commands from index.js
const indexPath = path.join(__dirname, 'index.js');
if (fs.existsSync(indexPath)) {
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  const commandRegex = /\.command\(['"](.+?)['"],\s*.*?\)/g;
  const commands = [];
  let match;
  
  while ((match = commandRegex.exec(indexContent)) !== null) {
    commands.push(match[1]);
  }
  
  console.log('Telegram Bot Commands in Code:');
  commands.forEach(cmd => {
    const description = getCommandDescription(cmd, indexContent);
    console.log(`/${cmd} - ${description}`);
  });
  console.log('--------------------------');
}

// Extract command descriptions
function getCommandDescription(cmd, content) {
  const regex = new RegExp(`\\.command\\(['"]${cmd}['"].*?\/\\/\\s*(.+?)(?:\\n|$)`, 's');
  const match = regex.exec(content);
  return match ? match[1].trim() : 'No description';
}

// Check database
async function checkDatabase() {
  console.log('Setting up database...');
  
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });

    // Test connection
    await pool.query('SELECT NOW()');
    console.log('Database connection successful');

    // Check users table
    try {
      const usersResult = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users'
      `);
      
      console.log('Users table columns:');
      usersResult.rows.forEach(row => {
        console.log(`- ${row.column_name} (${row.data_type})`);
      });
    } catch (err) {
      console.error('Error checking users table:', err.message);
    }

    console.log('Database setup completed successfully');
  } catch (err) {
    console.error('Database connection error:', err.message);
  }
}

checkDatabase();
