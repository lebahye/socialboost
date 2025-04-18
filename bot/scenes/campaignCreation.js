const { Scenes } = require('telegraf');
const mongoose = require('mongoose');
const Campaign = require('../models/Campaign');
const Project = require('../models/Project');
const User = require('../models/User');

const campaignCreationScene = new Scenes.WizardScene(
  'CAMPAIGN_CREATION',
  // Step 1: Select project or start over if no projects
  async (ctx) => {
    const user = { telegramId: ctx.from.id.toString() };

    // Check if user has any projects
    const projects = await Project.findByTelegramId(user.telegramId);

    if (!projects || projects.length === 0) {
      await ctx.reply(
        '❌ You don\'t have any projects yet.\n\n' +
        'Please create a project first using the /newproject command.'
      );
      return ctx.scene.leave();
    }

    // Check if user has subscription with remaining campaigns
    const hasAvailableProjects = projects.some(
      project => project.subscription.isActive &&
      project.subscription.campaignsRemaining > 0
    );

    if (!hasAvailableProjects) {
      await ctx.reply(
        '❌ None of your projects have remaining campaigns in their subscription.\n\n' +
        'Please upgrade your subscription using the /upgrade command.'
      );
      return ctx.scene.leave();
    }

    // Initialize wizard state
    ctx.wizard.state.campaignData = {};
    ctx.wizard.state.availableProjects = projects.filter(
      p => p.subscription.isActive && p.subscription.campaignsRemaining > 0
    );

    // Generate project selection keyboard
    const projectButtons = ctx.wizard.state.availableProjects.map((project, index) => {
      const remaining = project.subscription.campaignsRemaining;
      return [{
        text: `${project.name} (${remaining} campaign${remaining === 1 ? '' : 's'} left)`,
        callback_data: `project_${index}`
      }];
    });

    projectButtons.push([{ text: 'Cancel', callback_data: 'cancel' }]);

    await ctx.reply(
      '🚀 *Campaign Creation - Step 1/6*\n\n' +
      'First, let\'s select which project this campaign is for.\n\n' +
      'Choose from your projects below:',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: projectButtons
        }
      }
    );

    return ctx.wizard.next();
  },

  // Step 2: Handle project selection and ask for campaign name
  async (ctx) => {
    // Handle callback queries for project selection
    if (ctx.callbackQuery) {
      const data = ctx.callbackQuery.data;

      // Check if user wants to cancel
      if (data === 'cancel') {
        await ctx.editMessageText('Campaign creation cancelled.');
        return ctx.scene.leave();
      }

      // Extract project index
      const projectIndex = parseInt(data.split('_')[1]);

      if (isNaN(projectIndex) || projectIndex < 0 || projectIndex >= ctx.wizard.state.availableProjects.length) {
        await ctx.editMessageText('Invalid selection. Please use /newcampaign to start again.');
        return ctx.scene.leave();
      }

      // Store selected project
      ctx.wizard.state.selectedProject = ctx.wizard.state.availableProjects[projectIndex];

      // Ask for campaign name
      await ctx.editMessageText(
        '🚀 *Campaign Creation - Step 2/6*\n\n' +
        `Selected Project: *${ctx.wizard.state.selectedProject.name}*\n\n` +
        'What would you like to name this campaign?\n\n' +
        'Please enter a clear, descriptive name (max 50 characters).',
        { parse_mode: 'Markdown' }
      );

      return ctx.wizard.next();
    }

    // If not a callback query, prompt to use the buttons
    await ctx.reply('Please select a project using the buttons above.');
    return;
  },

  // Step 3: Get campaign name and ask for description
  async (ctx) => {
    // Get campaign name
    const campaignName = ctx.message.text.trim();

    // Validate campaign name
    if (campaignName.length < 3 || campaignName.length > 50) {
      await ctx.reply(
        '⚠️ Campaign name must be between 3 and 50 characters.\n\n' +
        'Please enter a valid campaign name:'
      );
      return; // Stay on same step
    }

    // Store campaign name
    ctx.wizard.state.campaignData.name = campaignName;

    // Ask for campaign description
    await ctx.reply(
      '🚀 *Campaign Creation - Step 3/6*\n\n' +
      'Please provide a description for your campaign.\n\n' +
      'This will be shown to participants. Be clear about what you want them to do.',
      { parse_mode: 'Markdown' }
    );

    return ctx.wizard.next();
  },

  // Step 4: Get description and ask for X post URL
  async (ctx) => {
    // Get campaign description
    const campaignDescription = ctx.message.text.trim();

    // Validate campaign description
    if (campaignDescription.length < 10 || campaignDescription.length > 500) {
      await ctx.reply(
        '⚠️ Campaign description must be between 10 and 500 characters.\n\n' +
        'Please enter a valid description:'
      );
      return; // Stay on same step
    }

    // Store campaign description
    ctx.wizard.state.campaignData.description = campaignDescription;

    // Ask for X post URL
    await ctx.reply(
      '🚀 *Campaign Creation - Step 4/6*\n\n' +
      'Please provide the URL of the X (Twitter) post that participants should engage with.\n\n' +
      'For example: `https://x.com/username/status/1234567890`\n\n' +
      'This must be a direct link to a specific post.',
      { parse_mode: 'Markdown' }
    );

    return ctx.wizard.next();
  },

  // Step 5: Get X post URL and ask for campaign duration
  async (ctx) => {
    // Get X post URL
    const xPostUrl = ctx.message.text.trim();

    // Validate X post URL (basic validation)
    const urlPattern = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/\d+/i;

    if (!urlPattern.test(xPostUrl)) {
      await ctx.reply(
        '⚠️ Invalid X post URL. Please provide a direct link to a post.\n\n' +
        'Example: https://x.com/username/status/1234567890\n\n' +
        'Please enter a valid X post URL:'
      );
      return; // Stay on same step
    }

    // Store X post URL
    ctx.wizard.state.campaignData.xPostUrl = xPostUrl;

    // Extract X post ID from URL for later use
    const postIdMatch = xPostUrl.match(/\/status\/(\d+)/i);
    if (postIdMatch && postIdMatch[1]) {
      ctx.wizard.state.campaignData.xPostId = postIdMatch[1];
    }

    // Ask for campaign duration
    const defaultDuration = ctx.wizard.state.selectedProject.settings.defaultCampaignDuration || 7;

    await ctx.reply(
      '🚀 *Campaign Creation - Step 5/6*\n\n' +
      'How long should this campaign run for (in days)?\n\n' +
      `The default duration is ${defaultDuration} days. You can enter a number between 1 and 30.`,
      { parse_mode: 'Markdown' }
    );

    return ctx.wizard.next();
  },

  // Step 6: Get duration and ask for rewards
  async (ctx) => {
    // Get campaign duration
    const durationInput = ctx.message.text.trim();
    const duration = parseInt(durationInput);

    // Validate duration
    if (isNaN(duration) || duration < 1 || duration > 30) {
      await ctx.reply(
        '⚠️ Invalid duration. Please enter a number between 1 and 30.'
      );
      return; // Stay on same step
    }

    // Calculate end date
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + duration);

    // Store campaign dates
    ctx.wizard.state.campaignData.startDate = now;
    ctx.wizard.state.campaignData.endDate = endDate;

    // Get default reward types from project settings
    const defaultRewardTypes = ctx.wizard.state.selectedProject.settings.preferredRewardTypes || ['community_role', 'recognition'];

    // Start collecting rewards
    ctx.wizard.state.campaignData.rewards = [];

    // Ask for rewards
    const rewardOptions = [
      [{ text: 'Community Role', callback_data: 'reward_community_role' }],
      [{ text: 'Exclusive Access', callback_data: 'reward_exclusive_access' }],
      [{ text: 'Recognition', callback_data: 'reward_recognition' }],
      [{ text: 'Merchandise', callback_data: 'reward_merchandise' }],
      [{ text: 'Whitelist Spot', callback_data: 'reward_whitelist' }],
      [{ text: 'Custom Reward', callback_data: 'reward_custom' }],
      [{ text: 'Done Adding Rewards', callback_data: 'rewards_done' }]
    ];

    await ctx.reply(
      '🚀 *Campaign Creation - Step 6/6*\n\n' +
      'What rewards will participants receive for engaging with your post?\n\n' +
      'Select reward types one by one. After selecting a type, you\'ll be asked to provide details.\n\n' +
      'When you\'re done adding rewards, click "Done Adding Rewards".',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: rewardOptions
        }
      }
    );

    // Store the last message ID for updating the rewards list
    ctx.wizard.state.rewardsMessageId = ctx.message.message_id + 1; // Approximate the next message ID

    return ctx.wizard.next();
  },

  // Step 7: Handle reward selection and collect details
  async (ctx) => {
    // If this is a callback query, handle reward selection
    if (ctx.callbackQuery) {
      const data = ctx.callbackQuery.data;

      // Check if user is done adding rewards
      if (data === 'rewards_done') {
        // Verify there's at least one reward
        if (ctx.wizard.state.campaignData.rewards.length === 0) {
          await ctx.answerCbQuery('Please add at least one reward.');
          return; // Stay on same step
        }

        // Move to final step
        await ctx.editMessageText(
          '✅ Rewards added:\n\n' +
          ctx.wizard.state.campaignData.rewards.map((reward, index) =>
            `${index + 1}. *${formatRewardType(reward.type)}*: ${reward.description}`
          ).join('\n\n') +
          '\n\n🎯 Now, let\'s set a target for how many participants you want to engage.',
          { parse_mode: 'Markdown' }
        );

        // Ask for participant target
        await ctx.reply(
          'How many participants are you aiming for?\n\n' +
          'Enter a number (min: 10, max: 1000):'
        );

        ctx.wizard.state.awaitingTarget = true; // Flag to indicate we're waiting for target
        return;
      }

      // Extract reward type
      if (data.startsWith('reward_')) {
        const rewardType = data.substring(7); // Remove 'reward_' prefix

        // Store temporarily
        ctx.wizard.state.currentReward = {
          type: rewardType
        };

        await ctx.editMessageText(
          `*Adding ${formatRewardType(rewardType)} Reward*\n\n` +
          'Please provide a description of this reward.\n\n' +
          'Example: "Access to exclusive Discord channel" or "Featured on our Twitter page"',
          { parse_mode: 'Markdown' }
        );

        ctx.wizard.state.collectingRewardDescription = true;
        return;
      }

      await ctx.answerCbQuery('Invalid selection');
      return;
    }

    // If collecting reward description
    if (ctx.wizard.state.collectingRewardDescription) {
      const description = ctx.message.text.trim();

      // Validate description
      if (description.length < 5 || description.length > 200) {
        await ctx.reply(
          '⚠️ Description must be between 5 and 200 characters.\n\n' +
          'Please try again:'
        );
        return;
      }

      // Store description
      ctx.wizard.state.currentReward.description = description;

      // Ask if there are any requirements
      await ctx.reply(
        'Are there any specific requirements for this reward? (optional)\n\n' +
        'For example: "Must engage with at least 3 posts" or "Must be among first 100 participants"\n\n' +
        'Send "skip" if there are no specific requirements.'
      );

      ctx.wizard.state.collectingRewardDescription = false;
      ctx.wizard.state.collectingRewardRequirements = true;
      return;
    }

    // If collecting reward requirements
    if (ctx.wizard.state.collectingRewardRequirements) {
      const requirements = ctx.message.text.trim();

      if (requirements.toLowerCase() !== 'skip') {
        ctx.wizard.state.currentReward.requirements = requirements;
      }

      // Add reward to campaign
      ctx.wizard.state.campaignData.rewards.push(ctx.wizard.state.currentReward);

      // Clear temporary storage
      ctx.wizard.state.currentReward = null;
      ctx.wizard.state.collectingRewardRequirements = false;

      // Show updated rewards list
      const rewardsList = ctx.wizard.state.campaignData.rewards.map((reward, index) =>
        `${index + 1}. *${formatRewardType(reward.type)}*: ${reward.description}` +
        (reward.requirements ? `\n   Requirements: ${reward.requirements}` : '')
      ).join('\n\n');

      // Show rewards and prompt for more
      const rewardOptions = [
        [{ text: 'Community Role', callback_data: 'reward_community_role' }],
        [{ text: 'Exclusive Access', callback_data: 'reward_exclusive_access' }],
        [{ text: 'Recognition', callback_data: 'reward_recognition' }],
        [{ text: 'Merchandise', callback_data: 'reward_merchandise' }],
        [{ text: 'Whitelist Spot', callback_data: 'reward_whitelist' }],
        [{ text: 'Custom Reward', callback_data: 'reward_custom' }],
        [{ text: 'Done Adding Rewards', callback_data: 'rewards_done' }]
      ];

      await ctx.reply(
        '✅ Reward added!\n\n' +
        'Current rewards:\n\n' +
        rewardsList + '\n\n' +
        'Select another reward type or click "Done Adding Rewards" when finished.',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: rewardOptions
          }
        }
      );

      return;
    }

    // If awaiting target participants
    if (ctx.wizard.state.awaitingTarget) {
      const targetInput = ctx.message.text.trim();
      const target = parseInt(targetInput);

      // Validate target
      if (isNaN(target) || target < 10 || target > 1000) {
        await ctx.reply(
          '⚠️ Invalid target. Please enter a number between 10 and 1000.'
        );
        return;
      }

      // Store target
      ctx.wizard.state.campaignData.targetParticipants = target;
      ctx.wizard.state.campaignData.currentParticipants = 0;

      // Set default reminders using project settings
      const defaultPlatforms = ctx.wizard.state.selectedProject.settings.defaultReminderPlatforms || ['telegram'];
      const defaultInterval = ctx.wizard.state.selectedProject.settings.defaultReminderInterval || 12;

      ctx.wizard.state.campaignData.reminders = {
        sendAutomatically: true,
        platforms: {
          telegram: defaultPlatforms.includes('telegram'),
          x: defaultPlatforms.includes('x'),
          discord: defaultPlatforms.includes('discord')
        },
        interval: defaultInterval
      };

      // Ask if campaign should be private
      await ctx.reply(
        'Should this campaign be private?\n\n' +
        'Private campaigns are only visible to invited participants.\n' +
        'Public campaigns are visible to all users.\n\n' +
        'Reply with "yes" or "no".'
      );

      ctx.wizard.state.awaitingTarget = false;
      ctx.wizard.state.awaitingPrivate = true;
      return;
    }

    // If awaiting private setting
    if (ctx.wizard.state.awaitingPrivate) {
      const privateInput = ctx.message.text.trim().toLowerCase();

      if (privateInput !== 'yes' && privateInput !== 'no') {
        await ctx.reply('Please reply with "yes" or "no".');
        return;
      }

      // Store private setting
      ctx.wizard.state.campaignData.private = privateInput === 'yes';

      // Finalize and create campaign
      try {
        // Get project details
        const project = ctx.wizard.state.selectedProject;

        // Create campaign
        const savedCampaign = await Campaign.save({
          name: ctx.wizard.state.campaignData.name,
          description: ctx.wizard.state.campaignData.description,
          projectName: project.name,
          xPostUrl: ctx.wizard.state.campaignData.xPostUrl,
          startDate: ctx.wizard.state.campaignData.startDate,
          endDate: ctx.wizard.state.campaignData.endDate,
          targetParticipants: ctx.wizard.state.campaignData.targetParticipants,
          createdBy: ctx.from.id.toString(),
          status: 'active',
          isPrivate: ctx.wizard.state.campaignData.private,
          rewards: ctx.wizard.state.campaignData.rewards
        });

        // Update subscription only
        await pool.query(
          'UPDATE projects SET campaigns_remaining = campaigns_remaining - 1 WHERE id = $1',
          [project.id]
        );

        // Update stats
        project.stats.totalCampaigns += 1;
        project.stats.activeCampaigns += 1;

        await project.save();

        // Success message
        await ctx.reply(
          '🎉 *Campaign Created Successfully!*\n\n' +
          `*Campaign Name:* ${savedCampaign.name}\n` +
          `*Project:* ${project.name}\n` +
          `*Duration:* ${Math.ceil((savedCampaign.endDate - savedCampaign.startDate) / (1000 * 60 * 60 * 24))} days\n` +
          `*Status:* ${savedCampaign.private ? 'Private' : 'Public'}\n` +
          `*Target:* ${savedCampaign.targetParticipants} participants\n\n` +
          `*X Post:* ${savedCampaign.xPostUrl}\n\n` +
          `*Rewards:*\n${savedCampaign.rewards.map((reward, index) =>
            `${index + 1}. ${formatRewardType(reward.type)}: ${reward.description}`
          ).join('\n')}\n\n` +
          'Your campaign is now active! Use /campaigns to view all your campaigns.',
          { parse_mode: 'Markdown' }
        );

      } catch (err) {
        console.error('Error creating campaign:', err);
        await ctx.reply(
          '❌ An error occurred while creating your campaign. Please try again later or contact support.'
        );
      }

      return ctx.scene.leave();
    }

    // If reached here, something unexpected happened
    await ctx.reply('Something went wrong. Please use /newcampaign to start again.');
    return ctx.scene.leave();
  }
);

// Add middleware to handle exit command
campaignCreationScene.command('cancel', async (ctx) => {
  await ctx.reply('Campaign creation cancelled.');
  return ctx.scene.leave();
});

// Helper function to format reward type for display
function formatRewardType(type) {
  switch (type) {
    case 'community_role': return 'Community Role';
    case 'exclusive_access': return 'Exclusive Access';
    case 'recognition': return 'Recognition';
    case 'merchandise': return 'Merchandise';
    case 'whitelist': return 'Whitelist Spot';
    case 'custom': return 'Custom Reward';
    default: return type;
  }
}

module.exports = campaignCreationScene;
