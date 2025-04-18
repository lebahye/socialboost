# SocialBoost Campaign Coordination Bot

This Telegram bot helps project owners coordinate social media campaigns and reward participants.

## Setup Instructions

### Prerequisites

- Node.js (v16+)
- MongoDB database (optional for full functionality)
- Telegram Bot token from BotFather

### Getting a Valid Telegram Bot Token

1. Open Telegram and search for BotFather (@BotFather)
2. Start a chat and send the command `/newbot`
3. Follow the instructions to create a new bot
4. Once created, BotFather will provide a token like: `1234567890:ABCDEFghijklmnopQRSTUVwxyz`
5. Copy this token exactly as shown

### Setting Up Bot Commands in Telegram

1. In BotFather, send `/mybots`
2. Select your bot
3. Choose "Edit Bot" → "Edit Commands"
4. Paste these commands:
```
start - Begin interaction with the bot
help - Show available commands
status - Check your current status
link - Link social media accounts
verify - Verify linked accounts
unlink - Unlink social media accounts
newproject - Create a new project
myprojects - List your projects
project - Manage a specific project
newcampaign - Create a new campaign
campaigns - List available campaigns
campaign - Manage a specific campaign
analytics - Show analytics for projects/campaigns
export - Export project or campaign data
```

### Configuration

new
campaign - Manage a specific campaign
postcampaign - Post campaign to project's Telegram channel
check - Check participation in a campaign
remind - Send reminders to participants
analytics - Show analytics for projects/campaigns
export - Export project or campaign data
```

### How it Works

1. **Campaign Creation**: Project owners create campaigns using `/newcampaign`
2. **Channel Distribution**: Campaigns can be posted directly to Telegram channels using `/postcampaign`
3. **User Participation**: Users can join campaigns by clicking links in the channel post
4. **Verification**: The bot verifies participation in X (Twitter) posts
5. **Reminders**: Automated reminders are sent to participants who haven't engaged yet

### Deep Link Integration

The bot supports deep links for:
- Viewing campaign details
- Joining campaigns directly
- Subscribing to campaign notifications

Example: `https://t.me/your_bot?start=join_123` will automatically join the user to campaign ID 123.


1. Edit the `.env` file in the bot directory
2. Add your valid Telegram Bot token:
```
TELEGRAM_BOT_TOKEN=your_actual_bot_token_from_botfather
```
3. (Optional) Add MongoDB connection string:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

### Installation and Running

```bash
# Navigate to bot directory
cd socialboost/bot

# Install dependencies
npm install

# Start the bot
node index.js
```

### Troubleshooting

If you encounter a "401 Unauthorized" error:
1. Your token is invalid or has been revoked
2. Get a fresh token from BotFather using `/token`
3. Make sure to copy the entire token correctly

If you see "MongoDB connection error":
1. Check that your MongoDB URI is correctly formatted
2. Ensure your IP address is whitelisted in MongoDB Atlas
3. Verify username and password are correct

### Testing Your Setup

Run the environment check script:
```bash
node env_check.js
```

This will confirm if your environment variables are set up correctly.

## Bot Commands

Once running, the bot will support all the commands you set up in BotFather:
- `/start` - Begin interaction
- `/help` - Show available commands
- `/status` - Check your current status
- And more as listed in the BotFather commands section

## License

MIT
