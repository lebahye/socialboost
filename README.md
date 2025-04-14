# SocialBoost - Campaign Coordination Bot

A Telegram bot for coordinating social media campaigns between crypto/blockchain projects and their communities. This bot helps projects create and manage campaigns where their followers engage with social media posts, and the bot tracks participation across platforms.

## Project Structure

This repository contains two main parts:

1. **Telegram Bot** (`/bot`): The core bot logic built with Node.js and Telegraf.js
2. **Web Dashboard** (`/src`): A Next.js web interface for analytics and campaign management

## Features

- **User Registration**: New users can register and specify if they're community members or project owners
- **Account Linking**: Users can connect and verify their X (Twitter) and Discord accounts
- **Project Registration**: Project owners can register and manage their projects
- **Campaign Management**: Create, track, and analyze social media campaigns
- **Cross-platform Reminders**: Send notifications to non-participating users
- **Analytics**: Track campaign performance and engagement metrics

## Quick Start

### Setting up the Telegram Bot

1. **Configure Environment**:
   ```bash
   cd bot
   npm run setup
   ```
   Follow the prompts to configure your environment variables.

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start the Bot**:
   ```bash
   npm run dev
   ```

See the [bot README](/bot/README.md) for detailed instructions.

### Setting up the Web Dashboard

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the Development Server**:
   ```bash
   npm run dev
   ```

## Technology Stack

- **Bot**: Node.js, Telegraf.js, MongoDB, Mongoose
- **Web Dashboard**: Next.js, React, Tailwind CSS, ShadcnUI
- **Integrations**: Twitter API, Discord API

## License

MIT
