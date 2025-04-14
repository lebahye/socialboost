# Social Campaign Coordinator Bot

A Telegram bot for coordinating social media campaigns between crypto/blockchain projects and their communities. This bot helps projects create and manage campaigns where their followers engage with social media posts, and the bot tracks participation across platforms.

## Features

- **User Registration**: New users can register and specify if they're community members or project owners
- **Account Linking**: Users can connect and verify their X (Twitter) and Discord accounts
- **Project Registration**: Project owners can register and manage their projects
- **Campaign Management**: Create, track, and analyze social media campaigns
- **Cross-platform Reminders**: Send notifications to non-participating users
- **Analytics**: Track campaign performance and engagement metrics

## Requirements

- Node.js 16 or higher
- MongoDB database
- Telegram Bot token (obtained from BotFather)
- X (Twitter) API credentials (optional, for verification)

## Setup Instructions

1. **Create a Telegram Bot**:
   - Talk to [BotFather](https://t.me/botfather) on Telegram
   - Use the `/newbot` command and follow instructions
   - Note down the bot token provided

2. **Set up MongoDB**:
   - Create a MongoDB Atlas account or set up a local MongoDB server
   - Create a new database for the bot
   - Note down the MongoDB connection string

3. **Configure Environment Variables**:
   - Copy `.env.example` to `.env`
   - Update the following variables:
     ```
     TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
     MONGODB_URI=your_mongodb_connection_string_here
     NODE_ENV=development  # Change to 'production' for webhook mode
     ```
   - Optional: Add X (Twitter) API credentials if you want to enable X verification

4. **Install Dependencies**:
   ```bash
   cd bot
   npm install
   ```

5. **Start the Bot**:
   - Development mode (polling):
     ```bash
     npm run dev
     ```
   - Production mode (webhook):
     ```bash
     NODE_ENV=production npm start
     ```

## Project Structure

```
bot/
├── index.js              # Main entry point
├── models/               # MongoDB models
│   ├── User.js           # User model for both community members and project owners
│   ├── Project.js        # Project model for campaign coordination
│   └── Campaign.js       # Campaign model for tracking participation
├── scenes/               # Telegraf scenes for multi-step conversations
│   ├── projectRegistration.js   # New project registration flow
│   ├── campaignCreation.js      # Campaign creation wizard
│   ├── userRegistration.js      # New user onboarding
│   └── xVerification.js         # X (Twitter) account verification
├── handlers/             # Command handlers
│   ├── basicHandlers.js          # Basic bot commands
│   ├── accountHandlers.js        # Social account management
│   ├── projectHandlers.js        # Project management
│   ├── campaignHandlers.js       # Campaign management
│   └── analyticsHandlers.js      # Analytics and reporting
├── middleware/           # Authentication middleware
│   └── auth.js           # User authentication and project owner verification
├── services/             # Bot services
│   ├── verification.js   # Social account verification service
│   └── scheduler.js      # Scheduled tasks (reminders, verification checks)
└── package.json          # Bot dependencies
```

## Usage

Once the bot is running, users can interact with it using these commands:

### Basic Commands
- `/start` - Begin using the bot and register
- `/help` - Display available commands
- `/status` - Check user account status

### Account Commands
- `/link` - Link a social media account
- `/verify` - Verify a linked social account
- `/unlink` - Remove a linked social account

### Project Owner Commands
- `/newproject` - Register a new project
- `/myprojects` - List your projects
- `/project` - Manage a specific project

### Campaign Commands
- `/newcampaign` - Create a new campaign
- `/campaigns` - Browse available campaigns
- `/campaign` - View campaign details
- `/check` - Check campaign participation
- `/remind` - Send reminders to participants

### Analytics Commands
- `/analytics` - View campaign analytics
- `/export` - Export campaign data

## Deployment

For production deployment, set up a webhook:

1. Set `NODE_ENV=production` in your .env file
2. Set `WEBHOOK_URL=https://your-domain.com`
3. Set `PORT=3000` (or your preferred port)
4. Run `npm start`

## License

MIT
