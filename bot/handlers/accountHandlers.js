const { Composer } = require('telegraf');
const crypto = require('crypto');
const { Pool } = require('pg');
const User = require('../models/User');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

/**
 * Handler for /link command
 * Starts the process of linking a social media account
 */
const linkSocialHandler = async (ctx) => {
  try {
    const userId = ctx.from.id.toString();
    const user = await User.findOne({ telegram_id: userId });

    if (!user) {
      return ctx.reply('Please start the bot first with /start');
    }

    // Send menu of platforms to link
    await ctx.reply(
      'Which social media account would you like to link?\n\n' +
      'Choose from the options below:',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'X (Twitter)', callback_data: 'link_x' }],
            [{ text: 'Discord', callback_data: 'link_discord' }]
          ]
        }
      }
    );
  } catch (error) {
    console.error('Error in linkSocialHandler:', error);
    await ctx.reply('An error occurred while processing your request. Please try again.');
  }
};

/**
 * Callback handler for linking X (Twitter) account
 */
const linkXAccountCallback = async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const result = await pool.query(
    'SELECT * FROM users WHERE telegram_id = $1',
    [telegramId]
  );

  if (!result.rows[0]) {
    return ctx.reply('Please start the bot first with /start');
  }

  // Update user state
  const updateResult = await pool.query(
    'UPDATE users SET current_state = $1 WHERE telegram_id = $2 RETURNING *',
    ['awaiting_x_username', telegramId]
  );

  if (!result.rows[0]) {
    return ctx.reply('Please start the bot first with /start');
  }

  await ctx.editMessageText(
    '📱 *Linking your X (Twitter) account*\n\n' +
    'Please send your X username *without* the @ symbol.\n' +
    'For example, if your X handle is @username, just send `username`',
    { parse_mode: 'Markdown' }
  );
};

/**
 * Callback handler for linking Discord account
 */
const linkDiscordCallback = async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const result = await pool.query(
    'UPDATE users SET current_state = $1 WHERE telegram_id = $2 RETURNING *',
    ['awaiting_discord_username', telegramId]
  );

  if (!result.rows[0]) {
    return ctx.reply('Please start the bot first with /start');
  }

  await ctx.editMessageText(
    '📱 *Linking your Discord account*\n\n' +
    'Please send your Discord username, including any numbers.\n' +
    'For example: `username#1234`',
    { parse_mode: 'Markdown' }
  );
};

/**
 * Handler for processing X username submission
 */
const processXUsername = async (ctx) => {
  const user = ctx.state.user;
  const xUsername = ctx.message.text.trim();

  // Check if username starts with @
  if (xUsername.startsWith('@')) {
    await ctx.reply('Please send your username without the @ symbol.');
    return;
  }

  // Check if username is valid
  if (!/^[A-Za-z0-9_]{1,15}$/.test(xUsername)) {
    await ctx.reply(
      'This doesn\'t look like a valid X username. X usernames can only contain letters, numbers, and underscores, and must be 15 characters or fewer.\n\n' +
      'Please try again with a valid username.'
    );
    return;
  }

  try {
    // Check if username already exists in system for another user
    const telegramId = ctx.from.id.toString();
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE social_accounts->\'x\'->\'username\' = $1 AND telegram_id != $2',
      [xUsername, telegramId]
    );

    const userExists = existingUser.rows.length > 0;

    if (userExists) {
      await ctx.reply(
        'This X account is already linked to another user. Please use a different account or contact support if you believe this is an error.'
      );
      user.currentState = null;
      await user.save();
      return;
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();

    // Update or create the user's social accounts in the database
    // Using already defined telegramId from above

    // Check if user already has social accounts
    const userResult = await pool.query(
      'SELECT social_accounts FROM users WHERE telegram_id = $1',
      [telegramId]
    );

    let socialAccounts = [];
    if (userResult.rows[0] && userResult.rows[0].social_accounts) {
      // Parse existing accounts if they exist
      if (typeof userResult.rows[0].social_accounts === 'string') {
        socialAccounts = JSON.parse(userResult.rows[0].social_accounts);

// Handle Discord account linking
bot.command('link_discord', async (ctx) => {
  try {
    await ctx.reply(
      'To link your Discord account:\n\n' +
      '1. Send your Discord username (example: user#1234)\n' +
      '2. I will send you a verification code\n' +
      '3. Add me on Discord and send me that code'
    );
    
    // Set user state for Discord verification
    await User.setState(ctx.from.id.toString(), 'AWAITING_DISCORD_USERNAME');
  } catch (error) {
    console.error('Error in link_discord command:', error);
    await ctx.reply('An error occurred. Please try again later.');
  }
});

      } else {
        socialAccounts = userResult.rows[0].social_accounts;
      }
    }

    // Find existing account or prepare to add new one
    const existingAccountIndex = socialAccounts.findIndex(acc => acc.platform === 'x');

    if (existingAccountIndex >= 0) {
      // Update existing account
      socialAccounts[existingAccountIndex].username = xUsername;
      socialAccounts[existingAccountIndex].is_verified = false;
      socialAccounts[existingAccountIndex].verification_code = verificationCode;
      socialAccounts[existingAccountIndex].verification_expiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    } else {
      // Add new account
      socialAccounts.push({
        platform: 'x',
        username: xUsername,
        is_verified: false,
        verification_code: verificationCode,
        verification_expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });
    }

    // Update user with new social accounts
    await pool.query(
      'UPDATE users SET social_accounts = $1, current_state = NULL WHERE telegram_id = $2',
      [JSON.stringify(socialAccounts), telegramId]
    );

    // Send verification instructions
    await ctx.reply(
      `✅ Your X account @${xUsername} has been linked!\n\n` +
      `To verify this account, please follow these steps:\n\n` +
      `1. Go to X and send a direct message to @ProjectVerifierBot with the following code:\n\n` +
      `\`${verificationCode}\`\n\n` +
      `2. Once verified, you'll be able to participate in campaigns.\n\n` +
      `The verification code will expire in 24 hours. Use /verify command to check verification status.`,
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    console.error('Error linking X account:', err);
    await ctx.reply('Sorry, an error occurred. Please try again later.');

    user.currentState = null;
    await user.save();
  }
};

/**
 * Handler for processing Discord username submission
 */
const processDiscordUsername = async (ctx) => {
  const user = ctx.state.user;
  const discordUsername = ctx.message.text.trim();

  // Check if username is valid (basic check for now)
  if (!/^.+$/.test(discordUsername)) {
    await ctx.reply(
      'This doesn\'t look like a valid Discord username.\n\n' +
      'Please try again with a valid username.'
    );
    return;
  }

  try {
    // Check if username already exists in system for another user
    const User = require('../models/User');
    const existingUser = await User.findByPlatformUsername('discord', discordUsername);

    if (existingUser && existingUser.telegramId !== user.telegramId) {
      await ctx.reply(
        'This Discord account is already linked to another user. Please use a different account or contact support if you believe this is an error.'
      );
      user.currentState = null;
      await user.save();
      return;
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();

    // Find existing account or create new one
    const existingAccount = user.socialAccounts.find(acc => acc.platform === 'discord');

    if (existingAccount) {
      existingAccount.username = discordUsername;
      existingAccount.isVerified = false;
      existingAccount.verificationCode = verificationCode;
      existingAccount.verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    } else {
      user.socialAccounts.push({
        platform: 'discord',
        username: discordUsername,
        isVerified: false,
        verificationCode: verificationCode,
        verificationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });
    }

    // Reset user state
    user.currentState = null;
    await user.save();

    // Send verification instructions
    await ctx.reply(
      `✅ Your Discord account ${discordUsername} has been linked!\n\n` +
      `To verify this account, please follow these steps:\n\n` +
      `1. Join our verification server: https://discord.gg/verification-server\n` +
      `2. Send a direct message to our verification bot @VerifyBot with the following code:\n\n` +
      `\`${verificationCode}\`\n\n` +
      `3. Once verified, you'll be able to participate in campaigns.\n\n` +
      `The verification code will expire in 24 hours. Use /verify command to check verification status.`,
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    console.error('Error linking Discord account:', err);
    await ctx.reply('Sorry, an error occurred. Please try again later.');

    user.currentState = null;
    await user.save();
  }
};

/**
 * Handler for /verify command to check verification status
 */
const verifyAccountHandler = async (ctx) => {
  try {
    // Check if user exists
    const userId = ctx.from.id.toString();
    console.log(`Getting verification status for user: ${userId}`);

    const result = await pool.query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [userId]
    );

    if (!result.rows[0]) {
      return ctx.reply('Please start the bot first with /start');
    }

    const user = result.rows[0];

    // Handle various formats of social_accounts
    let socialAccounts = [];
    if (user.social_accounts) {
      if (typeof user.social_accounts === 'string') {
        try {
          socialAccounts = JSON.parse(user.social_accounts);
        } catch (e) {
          console.error('Error parsing social accounts:', e);
          socialAccounts = [];
        }
      } else if (Array.isArray(user.social_accounts)) {
        socialAccounts = user.social_accounts;
      }
    }

    console.log(`User social accounts:`, socialAccounts);

    if (!socialAccounts || !socialAccounts.length) {
      await ctx.reply(
        'You don\'t have any social accounts linked yet.\n\n' +
        'Use /link to connect your social media accounts.'
      );
      return;
    }

    // Get unverified accounts
    const unverifiedAccounts = socialAccounts.filter(acc => !acc.is_verified);

    if (unverifiedAccounts.length === 0) {
      await ctx.reply(
        '✅ All your social accounts are verified!\n\n' +
        'You can now participate in campaigns.'
      );
      return;
    }

    // For each unverified account, check if verification code is expired
    let message = '*Unverified Accounts:*\n\n';

    unverifiedAccounts.forEach(account => {
      const platformName = account.platform === 'x' ? 'X (Twitter)' : account.platform;
      message += `• *${platformName}:* @${account.username}\n`;

      // Check if verification code is expired
      const verificationExpiry = new Date(account.verification_expiry);
      if (verificationExpiry && verificationExpiry < new Date()) {
        message += '  ⚠️ Verification code expired. Use /link to generate a new one.\n';
      } else {
        message += `  📝 Verification code: \`${account.verification_code}\`\n`;

        if (account.platform === 'x') {
          message += '  📨 Send this code to @ProjectVerifierBot on X\n';
        } else if (account.platform === 'discord') {
          message += '  📨 Send this code to @VerifyBot on our Discord server\n';
        }
      }

      message += '\n';
    });

    message += 'Once verified, you\'ll be able to participate in campaigns.';

    await ctx.replyWithMarkdown(message);
  } catch (error) {
    console.error('Error in verifyAccountHandler:', error);
    await ctx.reply('An error occurred while checking verification status. Please try again.');
  }
};

/**
 * Handler for /unlink command to remove a linked account
 */
const unlinkAccountHandler = async (ctx) => {
  try {
    const userId = ctx.from.id.toString();
    const result = await pool.query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [userId]
    );

    if (!result.rows[0]) {
      return ctx.reply('Please start the bot first with /start');
    }

    const user = result.rows[0];
    const socialAccounts = user.social_accounts || [];

    if (!socialAccounts.length) {
      await ctx.reply(
        'You don\'t have any social accounts linked to unlink.\n\n' +
        'Use /link to connect social media accounts.'
      );
      return;
    }

    // Create inline keyboard with accounts to unlink
    const inlineKeyboard = socialAccounts.map(account => {
      const platformName = account.platform === 'x' ? 'X (Twitter)' : account.platform;
      const verifiedStatus = account.is_verified ? '✅' : '❌';

      return [{
        text: `${platformName}: @${account.username} ${verifiedStatus}`,
        callback_data: `unlink_${account.platform}_${account.username}`
      }];
    });

    // Add cancel button
    inlineKeyboard.push([{ text: 'Cancel', callback_data: 'unlink_cancel' }]);

    await ctx.reply(
      'Which social media account would you like to unlink?\n\n' +
      'WARNING: Unlinking a verified account will require you to verify again if you want to re-link it.',
      {
        reply_markup: {
          inline_keyboard: inlineKeyboard
        }
      }
    );
  } catch (error) {
    console.error('Error in unlinkAccountHandler:', error);
    await ctx.reply('An error occurred while preparing unlink options. Please try again.');
  }
};

/**
 * Callback handler for unlinking accounts
 */
const unlinkAccountCallback = async (ctx) => {
  try {
    const data = ctx.callbackQuery.data;

    // Check if cancel was clicked
    if (data === 'unlink_cancel') {
      await ctx.editMessageText('Operation cancelled. Your accounts remain linked.');
      return;
    }

    const parts = data.split('_');

    if (parts.length < 3) {
      await ctx.editMessageText('Invalid selection. Please try again using the /unlink command.');
      return;
    }

    const platform = parts[1];
    const username = parts.slice(2).join('_'); // In case username has underscores

    const userId = ctx.from.id.toString();
    const result = await pool.query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [userId]
    );

    if (!result.rows[0]) {
      await ctx.editMessageText('User not found. Please start the bot with /start');
      return;
    }

    const user = result.rows[0];
    const socialAccounts = user.social_accounts || [];

    // Find account to remove
    const updatedAccounts = socialAccounts.filter(acc =>
      !(acc.platform === platform && acc.username === username)
    );

    if (updatedAccounts.length === socialAccounts.length) {
      await ctx.editMessageText('Account not found. It may have already been removed.');
      return;
    }

    // Update user's social accounts
    await pool.query(
      'UPDATE users SET social_accounts = $1 WHERE telegram_id = $2',
      [JSON.stringify(updatedAccounts), userId]
    );

    const platformName = platform === 'x' ? 'X (Twitter)' : platform;

    await ctx.editMessageText(
      `✅ Your ${platformName} account @${username} has been unlinked.\n\n` +
      `You can use /link at any time to connect a social media account.`
    );
  } catch (error) {
    console.error('Error in unlinkAccountCallback:', error);
    await ctx.editMessageText('An error occurred while unlinking the account. Please try again.');
  }
};

/**
 * Text message handler for state-based conversations
 */
const textHandler = async (ctx) => {
  const user = ctx.state.user;

  if (!user || !user.currentState) {
    // If no state is set, pass to next handler
    return;
  }

  switch (user.currentState) {
    case 'awaiting_x_username':
      await processXUsername(ctx);
      break;

    case 'awaiting_discord_username':
      await processDiscordUsername(ctx);
      break;

    default:
      // Unknown state, reset it
      user.currentState = null;
      await user.save();
  }
};

/**
 * Helper function to generate a verification code
 */
function generateVerificationCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

module.exports = {
  linkSocialHandler,
  linkXAccountCallback,
  linkDiscordCallback,
  verifyAccountHandler,
  unlinkAccountHandler,
  unlinkAccountCallback,
  textHandler
};