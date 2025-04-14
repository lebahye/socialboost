# SocialBoost Telegram Bot

This folder contains the Telegram bot code that powers the SocialBoost platform for coordinating social media campaigns.

## Setup Instructions

### Prerequisites

- Node.js 16+ installed
- MongoDB database (local or cloud-based like MongoDB Atlas)
- Telegram Bot Token (from BotFather)

### Local Development

1. **Install dependencies**

```bash
npm install
```

2. **Configure environment variables**

Run the setup script to create and configure your .env file:

```bash
npm run setup
```

Or manually create a `.env` file with the following content:

```
# Telegram Bot Token (Get from BotFather)
TELEGRAM_BOT_TOKEN=your_bot_token_here

# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string

# Environment and Webhook Settings
NODE_ENV=development
PORT=3000
```

3. **Start the bot in development mode**

```bash
npm run dev
```

The bot will run in polling mode during development, which means it will continuously check for updates from Telegram.

### Production Deployment

For production deployment, you need a server with a public IP address or domain name with HTTPS. Using a webhook is recommended for production as it's more efficient than polling.

1. **Set up your server with HTTPS**

You'll need a domain name with a valid SSL certificate. You can use services like Let's Encrypt for free SSL certificates.

2. **Set environment variables for production**

Update your `.env` file with:

```
NODE_ENV=production
WEBHOOK_URL=https://your-domain-name.com
PORT=3000  # Or any port your hosting provider allows
```

3. **Start the bot**

```bash
npm start
```

The bot will start in webhook mode, where Telegram will send updates to your server when they occur.

## Webhook Setup

When running in production mode, the bot automatically sets up a webhook with Telegram. The webhook URL will be:

```
https://your-domain-name.com/bot<your_bot_token>
```

Telegram will send updates to this URL when users interact with your bot.

## Bot Features

- **User Registration**: Register users as community members or project owners
- **Project Registration**: Project owners can register their crypto projects
- **Campaign Management**: Create and manage social media campaigns
- **X (Twitter) Verification**: Verify ownership of X accounts
- **Discord Integration**: Connect and verify Discord accounts
- **Campaign Analytics**: Track engagement and participation

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

## Commands

Here are the main commands supported by the bot:

- `/start` - Begin interaction with the bot
- `/register` - Register as a community member or project owner
- `/help` - Get assistance with bot features
- `/profile` - View your profile and connected accounts
- `/campaigns` - Browse active campaigns to participate in
- `/mycampaigns` - View campaigns you've created or joined
- `/create` - Create a new campaign (project owners only)
- `/projects` - View and manage your projects (project owners only)
- `/stats` - See your participation and reward statistics
- `/connect` - Link your social media accounts
- `/settings` - Configure your bot preferences

## License

MIT
