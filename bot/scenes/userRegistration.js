const { Scenes } = require('telegraf');
const User = require('../models/User');
const crypto = require('crypto');

/**
 * Scene for new user registration flow
 */
const userRegistrationScene = new Scenes.WizardScene(
  'USER_REGISTRATION',
  // Step 1: Welcome and collect preferred language
  async (ctx) => {
    await ctx.reply(
      '👋 *Welcome to the Social Campaign Coordinator Bot!*\n\n' +
      'This bot helps you participate in social media campaigns and earn rewards from blockchain projects.\n\n' +
      'Let\'s start with your preferred language. Currently, we support:\n' +
      '• English\n\n' +
      'More languages coming soon! Send "en" for English.',
      { parse_mode: 'Markdown' }
    );

    // Initialize wizard session data
    ctx.wizard.state.userData = {
      telegramId: ctx.from.id,
      username: ctx.from.username,
      firstName: ctx.from.first_name,
      lastName: ctx.from.last_name
    };

    return ctx.wizard.next();
  },

  // Step 2: Ask about user type (regular user or project owner)
  async (ctx) => {
    // Get preferred language
    const language = ctx.message.text.trim().toLowerCase();

    // Validate language (only English supported for now)
    if (language !== 'en') {
      await ctx.reply(
        '⚠️ Currently, only English is fully supported. Setting language to English.',
      );
      ctx.wizard.state.userData.language = 'en';
    } else {
      ctx.wizard.state.userData.language = language;
    }

    // Ask about user type
    await ctx.reply(
      '🔍 *Are you a community member or a project owner?*\n\n' +
      '• Community members can participate in campaigns and earn rewards.\n' +
      '• Project owners can create campaigns to promote their projects.\n\n' +
      'Please select:',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Community Member', callback_data: 'user_type_member' }],
            [{ text: 'Project Owner', callback_data: 'user_type_project' }]
          ]
        }
      }
    );

    return ctx.wizard.next();
  },

  // Step 3: Based on user type, ask relevant questions
  async (ctx) => {
    // Handle callback query for user type selection
    if (!ctx.callbackQuery) {
      await ctx.reply('Please select an option using the buttons above.');
      return;
    }

    const data = ctx.callbackQuery.data;
    await ctx.answerCbQuery();

    if (data === 'user_type_member') {
      // For community members
      ctx.wizard.state.userData.isProjectOwner = false;

      await ctx.editMessageText(
        '👤 *Setting up your Community Member profile*\n\n' +
        'Great! As a community member, you can:\n' +
        '• Participate in campaigns\n' +
        '• Earn rewards from projects\n' +
        '• Link your social media accounts\n\n' +
        'Do you want to set up your social media accounts now?',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Yes, set up now', callback_data: 'setup_social_yes' }],
              [{ text: 'Later', callback_data: 'setup_social_later' }]
            ]
          }
        }
      );
    } else if (data === 'user_type_project') {
      // For project owners
      ctx.wizard.state.userData.isProjectOwner = true;

      await ctx.editMessageText(
        '🏢 *Setting up your Project Owner profile*\n\n' +
        'Excellent! As a project owner, you can:\n' +
        '• Create and manage projects\n' +
        '• Launch social media campaigns\n' +
        '• Track engagement and growth\n\n' +
        'Would you like to create your first project now?',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Yes, create project now', callback_data: 'create_project_yes' }],
              [{ text: 'Later', callback_data: 'create_project_later' }]
            ]
          }
        }
      );
    } else {
      await ctx.reply('Invalid selection. Please use /start to try again.');
      return ctx.scene.leave();
    }

    return ctx.wizard.next();
  },

  // Step 4: Final step - complete registration and direct user
  async (ctx) => {
    if (!ctx.callbackQuery) {
      await ctx.reply('Please select an option using the buttons above.');
      return;
    }

    const data = ctx.callbackQuery.data;
    await ctx.answerCbQuery();

    try {
      // Generate referral code
      const referralCode = `${ctx.from.id}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

      // Save user to database
      const newUser = new User({
        ...ctx.wizard.state.userData,
        referralCode,
        joinDate: new Date(),
        isActive: true,
        // Set default notification settings
        notificationSettings: {
          mentions: true,
          campaigns: true,
          rewards: true,
          platform: {
            telegram: true,
            x: false,
            discord: false,
            email: false
          }
        }
      });

      await newUser.save();

      // Handle next steps based on user selection
      if (data === 'setup_social_yes') {
        await ctx.editMessageText(
          '✅ *Registration Complete!*\n\n' +
          'Your account has been created successfully.\n\n' +
          'Now, let\'s connect your social media accounts so you can participate in campaigns. Use the /link command to get started.',
          { parse_mode: 'Markdown' }
        );

        // Exit the scene, then trigger the link command
        await ctx.scene.leave();
        return ctx.reply('Starting social media linking process...', {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Link Social Accounts', callback_data: 'link_accounts' }]
            ]
          }
        });

      } else if (data === 'create_project_yes') {
        await ctx.editMessageText(
          '✅ *Registration Complete!*\n\n' +
          'Your account has been created successfully.\n\n' +
          'Now, let\'s create your first project. I\'ll start the project registration process.',
          { parse_mode: 'Markdown' }
        );

        // Exit this scene and enter project registration scene
        await ctx.scene.leave();
        return ctx.scene.enter('PROJECT_REGISTRATION');

      } else {
        // User chose "Later"
        await ctx.editMessageText(
          '✅ *Registration Complete!*\n\n' +
          'Your account has been created successfully.\n\n' +
          `Here are some commands to get started:\n\n` +
          `• /link - Connect your social media accounts\n` +
          `• /campaigns - Browse available campaigns\n` +
          (ctx.wizard.state.userData.isProjectOwner ? `• /newproject - Create a new project\n` : '') +
          `• /help - See all available commands\n\n` +
          `Your referral code is: \`${referralCode}\`\n` +
          `Share it with friends to earn bonuses!`,
          { parse_mode: 'Markdown' }
        );
      }

      return ctx.scene.leave();
    } catch (err) {
      console.error('Error during user registration:', err);
      await ctx.editMessageText(
        '❌ An error occurred during registration. Please try again by using the /start command.'
      );
      return ctx.scene.leave();
    }
  }
);

// Add middleware to handle exit command
userRegistrationScene.command('cancel', async (ctx) => {
  await ctx.reply('Registration cancelled. Use /start when you\'re ready to continue.');
  return ctx.scene.leave();
});

// Handle callback queries at any step
userRegistrationScene.action('link_accounts', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.deleteMessage();
  await ctx.reply('Starting the account linking process...');

  // This would be handled by the appropriate callback in the main bot
  // Here we're just simulating the behavior
  return ctx.scene.leave();
});

module.exports = {
  userRegistrationScene
};
