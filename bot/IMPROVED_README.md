# SocialBoost Telegram Bot

This directory contains the code for the SocialBoost Telegram bot, which is used to verify user participation in social media campaigns and distribute rewards.

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with the following variables:
   ```
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   API_URL=https://your-api-url.com
   ```

3. Run the bot:
   ```bash
   npm run dev
   ```

## Testing

You can test the bot functionality using the `bot-test.js` script:

```bash
node bot-test.js
```

## Architecture

The bot uses a middleware-based architecture with the Telegraf library. It connects to the main SocialBoost API to verify user participation and manage rewards.

## Safety Considerations

- All Telegram bot links have been updated to use a safer approach with internal modals instead of direct URL parameters.
- This approach prevents JavaScript syntax errors that can occur with malformed URLs.
- The updated approach also improves security by preventing potential injection vectors.

## Commands

- `/start` - Initialize the bot
- `/help` - Display help message
- `/status` - Check bot status
- `/link` - Link social media accounts
- `/campaigns` - View available campaigns
