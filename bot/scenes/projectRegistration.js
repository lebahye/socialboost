const { Scenes } = require('telegraf');
const Project = require('../models/Project');
const User = require('../models/User');

const projectRegistrationScene = new Scenes.WizardScene(
  'PROJECT_REGISTRATION',
  // Step 1: Collect project name
  async (ctx) => {
    await ctx.reply(
      '🚀 *Project Registration - Step 1/5*\n\n' +
      'What is the name of your project?\n\n' +
      'Please enter a name (max 50 characters).',
      { parse_mode: 'Markdown' }
    );

    // Initialize wizard session data
    ctx.wizard.state.projectData = {};

    return ctx.wizard.next();
  },

  // Step 2: Collect project description
  async (ctx) => {
    // Get project name from the message
    const projectName = ctx.message.text.trim();

    // Validate project name
    if (projectName.length < 3 || projectName.length > 50) {
      await ctx.reply(
        '⚠️ Project name must be between 3 and 50 characters.\n\n' +
        'Please enter a valid project name:'
      );
      return; // Stay on the same step
    }

    // Store project name
    ctx.wizard.state.projectData.name = projectName;

    await ctx.reply(
      '🚀 *Project Registration - Step 2/5*\n\n' +
      'Please provide a description of your project.\n\n' +
      'This will be shown to potential participants. Be concise but informative.',
      { parse_mode: 'Markdown' }
    );

    return ctx.wizard.next();
  },

  // Step 3: Collect project category
  async (ctx) => {
    // Get project description from the message
    const projectDescription = ctx.message.text.trim();

    // Validate project description
    if (projectDescription.length < 10 || projectDescription.length > 500) {
      await ctx.reply(
        '⚠️ Project description must be between 10 and 500 characters.\n\n' +
        'Please enter a valid description:'
      );
      return; // Stay on the same step
    }

    // Store project description
    ctx.wizard.state.projectData.description = projectDescription;

    // Send category selection
    await ctx.reply(
      '🚀 *Project Registration - Step 3/5*\n\n' +
      'What category best describes your project? You can select multiple by sending a comma-separated list.\n\n' +
      'For example: `NFT, GameFi`\n\n' +
      'Available categories: DeFi, NFT, GameFi, DAO, CEX, DEX, L1/L2, SocialFi, AI, Metaverse, Other',
      { parse_mode: 'Markdown' }
    );

    return ctx.wizard.next();
  },

  // Step 4: Collect Telegram channel
  async (ctx) => {
    // Get categories from the message
    const categoriesInput = ctx.message.text.trim();

    // Validate and process categories
    const availableCategories = [
      'DeFi', 'NFT', 'GameFi', 'DAO', 'CEX', 'DEX',
      'L1/L2', 'SocialFi', 'AI', 'Metaverse', 'Other'
    ];

    const categories = categoriesInput
      .split(',')
      .map(cat => cat.trim())
      .filter(cat => cat.length > 0);

    // Check if at least one valid category is provided
    const validCategories = categories.filter(
      cat => availableCategories.some(c => c.toLowerCase() === cat.toLowerCase())
    );

    if (validCategories.length === 0) {
      await ctx.reply(
        '⚠️ Please provide at least one valid category.\n\n' +
        'Available categories: DeFi, NFT, GameFi, DAO, CEX, DEX, L1/L2, SocialFi, AI, Metaverse, Other\n\n' +
        'Please try again with a valid category or categories:'
      );
      return; // Stay on the same step
    }

    // Store normalized categories (proper casing)
    ctx.wizard.state.projectData.category = validCategories.map(cat => {
      const index = availableCategories.findIndex(c => c.toLowerCase() === cat.toLowerCase());
      return index >= 0 ? availableCategories[index] : cat;
    });

    await ctx.reply(
      '🚀 *Project Registration - Step 4/5*\n\n' +
      'Please provide your Telegram channel or group username for this project.\n\n' +
      'For example: `mychannel` or `mygroup` (without the @ symbol)\n\n' +
      'This will be used for campaign notifications. Skip this step by sending "skip" if you don\'t have one yet.',
      { parse_mode: 'Markdown' }
    );

    return ctx.wizard.next();
  },

  // Step 5: Collect X (Twitter) account
  async (ctx) => {
    // Get Telegram channel from the message
    const telegramChannel = ctx.message.text.trim();

    // Initialize social accounts object if needed
    if (!ctx.wizard.state.projectData.socialAccounts) {
      ctx.wizard.state.projectData.socialAccounts = {
        telegram: {}
      };
    }

    // Handle skip
    if (telegramChannel.toLowerCase() === 'skip') {
      ctx.wizard.state.projectData.socialAccounts.telegram = {
        username: '',
        channelName: '',
        channelUrl: ''
      };
    } else {
      // Store Telegram channel info
      const channelUsername = telegramChannel.startsWith('@') ?
        telegramChannel.substring(1) : telegramChannel;

      ctx.wizard.state.projectData.socialAccounts.telegram = {
        username: channelUsername,
        channelName: channelUsername,
        channelUrl: `https://t.me/${channelUsername}`
      };
    }

    await ctx.reply(
      '🚀 *Project Registration - Step 5/5*\n\n' +
      'Please provide your project\'s X (Twitter) username.\n\n' +
      'For example: `myproject` (without the @ symbol)\n\n' +
      'Skip this step by sending "skip" if you don\'t have one.',
      { parse_mode: 'Markdown' }
    );

    return ctx.wizard.next();
  },

  // Step 6: Finish and save project
  async (ctx) => {
    // Get X (Twitter) account from the message
    const xAccount = ctx.message.text.trim();

    // Initialize X account if needed
    if (!ctx.wizard.state.projectData.socialAccounts.x) {
      ctx.wizard.state.projectData.socialAccounts.x = {};
    }

    // Handle skip
    if (xAccount.toLowerCase() === 'skip') {
      ctx.wizard.state.projectData.socialAccounts.x = {
        username: '',
        followersCount: 0,
        profileUrl: ''
      };
    } else {
      // Store X account info
      const xUsername = xAccount.startsWith('@') ? xAccount.substring(1) : xAccount;

      ctx.wizard.state.projectData.socialAccounts.x = {
        username: xUsername,
        followersCount: 0,
        profileUrl: `https://x.com/${xUsername}`
      };
    }

    try {
      // Get user from context
      const user = ctx.state.user;

      // Create project with default subscription (Basic plan)
      const now = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

      const project = new Project({
        name: ctx.wizard.state.projectData.name,
        description: ctx.wizard.state.projectData.description,
        category: ctx.wizard.state.projectData.category,
        socialAccounts: ctx.wizard.state.projectData.socialAccounts,
        owners: [{
          telegramId: user.telegramId,
          telegramUsername: user.username,
          role: 'admin',
          addedDate: now,
          lastActive: now
        }],
        subscription: {
          planId: 'basic',
          planName: 'Basic Plan',
          startDate: now,
          endDate: endDate,
          isActive: true,
          autoRenew: false,
          campaignsRemaining: 5, // Basic plan includes 5 campaigns
          features: ['Limited Participants', 'Basic Analytics']
        },
        verified: false,
        createdAt: now,
        updatedAt: now,
        stats: {
          totalCampaigns: 0,
          activeCampaigns: 0,
          participantCount: 0,
          participationRate: 0,
          averageEngagement: 0,
          followerGrowth: [{
            date: now,
            telegram: 0,
            x: 0,
            total: 0
          }]
        },
        settings: {
          defaultReminderInterval: 12,
          defaultReminderPlatforms: ['telegram'],
          defaultCampaignDuration: 7,
          autoRenewal: false,
          preferredRewardTypes: ['community_role', 'recognition']
        }
      });

      // Save project
      const savedProject = await project.save();

      // Update user
      user.isProjectOwner = true;
      user.projects.push(savedProject._id);
      await user.save();

      // Send confirmation message
      await ctx.reply(
        '🎉 *Congratulations!* Your project has been registered successfully.\n\n' +
        `*Project Name:* ${savedProject.name}\n` +
        `*Project ID:* \`${savedProject._id}\`\n` +
        `*Subscription:* ${savedProject.subscription.planName}\n` +
        `*Campaigns Included:* ${savedProject.subscription.campaignsRemaining}\n\n` +
        'You can now create campaigns using the /newcampaign command.\n\n' +
        'Need to upgrade your subscription? Use /upgrade to see available plans.',
        { parse_mode: 'Markdown' }
      );
    } catch (err) {
      console.error('Error saving project:', err);
      await ctx.reply(
        '❌ An error occurred while saving your project. Please try again later or contact support.'
      );
    }

    // Exit wizard
    return ctx.scene.leave();
  }
);

// Add middleware to handle exit command
projectRegistrationScene.command('cancel', async (ctx) => {
  await ctx.reply('Project registration cancelled.');
  return ctx.scene.leave();
});

// Add text processing for each step
projectRegistrationScene.on('text', (ctx) => {
  // This will be called if none of the wizard steps handle the message
  return ctx.wizard.steps[ctx.wizard.cursor](ctx);
});

module.exports = projectRegistrationScene;
