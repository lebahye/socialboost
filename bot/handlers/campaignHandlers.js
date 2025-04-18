const { Composer } = require('telegraf');
const mongoose = require('mongoose');
const Campaign = require('../models/Campaign');
const Project = require('../models/Project');
const User = require('../models/User');

/**
 * Handler for /newcampaign command
 * Starts the campaign creation wizard
 */
const newCampaignHandler = async (ctx) => {
  // Enter the campaign creation scene
  return ctx.scene.enter('CAMPAIGN_CREATION');
};

/**
 * Handler for /campaigns command
 * Shows available campaigns to users
 */
const listCampaignsHandler = async (ctx) => {
  try {
    // Get user info from database
    const { rows: [user] } = await pool.query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [ctx.from.id.toString()]
    );

    if (!user) {
      await ctx.reply('Please start the bot first with /start');
      return;
    }

    let campaigns;
    let messageText;

    // Different behavior for project owners vs regular users
    if (user.is_project_owner) {
      // For project owners: show their own projects' campaigns
      const projects = await Project.find({ 'owners.telegramId': user.telegramId });
      const projectIds = projects.map(p => p._id);

      campaigns = await Campaign.find({
        projectId: { $in: projectIds },
        status: { $in: ['active', 'draft'] }
      }).sort({ createdAt: -1 });

      if (campaigns.length === 0) {
        messageText = "You don't have any active campaigns. Use /newcampaign to create one.";
        await ctx.reply(messageText);
        return;
      }

      messageText = '*Your Campaigns:*\n\n';

      campaigns.forEach((campaign, index) => {
        const project = projects.find(p => p._id.toString() === campaign.projectId.toString());
        const projectName = project ? project.name : 'Unknown Project';

        messageText += `${index + 1}. *${campaign.name}*\n`;
        messageText += `   Project: ${projectName}\n`;
        messageText += `   Status: ${formatStatus(campaign.status)}\n`;
        messageText += `   Participants: ${campaign.currentParticipants}/${campaign.targetParticipants}\n`;
        messageText += `   Ends: ${formatDate(campaign.endDate)}\n\n`;
      });

      messageText += 'To view details or manage a specific campaign, use:\n/campaign [number]';

    } else {
      // For regular users: show campaigns they can participate in

      // Get campaigns that are:
      // 1. Active
      // 2. Not expired
      // 3. Either public OR the user is already a participant
      campaigns = await Campaign.find({
        status: 'active',
        endDate: { $gt: new Date() },
        $or: [
          { private: false },
          { 'participants.telegramId': user.telegramId }
        ]
      }).sort({ endDate: 1 }); // Sort by end date, soonest first

      if (campaigns.length === 0) {
        messageText = "There are no active campaigns available right now. Check back later!";
        await ctx.reply(messageText);
        return;
      }

      messageText = '*Available Campaigns:*\n\n';

      campaigns.forEach((campaign, index) => {
        // Check if user is already participating
        const isParticipant = campaign.participants.some(p => p.telegramId === user.telegramId);
        const hasParticipated = isParticipant && campaign.participants.find(
          p => p.telegramId === user.telegramId
        )?.participated;

        messageText += `${index + 1}. *${campaign.name}*\n`;
        messageText += `   Project: ${campaign.projectName}\n`;

        if (hasParticipated) {
          messageText += `   Status: ✅ You've participated\n`;
        } else if (isParticipant) {
          messageText += `   Status: 🔔 You're invited but haven't participated yet\n`;
        } else {
          messageText += `   Status: Open for participation\n`;
        }

        messageText += `   Rewards: ${campaign.rewards.length} reward type${campaign.rewards.length !== 1 ? 's' : ''}\n`;
        messageText += `   Ends: ${formatDate(campaign.endDate)}\n\n`;
      });

      messageText += 'To view details or participate in a specific campaign, use:\n/campaign [number]';
    }

    // Store campaigns in session for reference when user selects one
    ctx.session.listedCampaigns = campaigns.map(c => c._id.toString());

    await ctx.replyWithMarkdown(messageText);

  } catch (err) {
    console.error('Error listing campaigns:', err);
    await ctx.reply('An error occurred while retrieving campaigns. Please try again later.');
  }
};

/**
 * Handler for /campaign command
 * Allows viewing and managing specific campaigns
 */
const manageCampaignHandler = async (ctx) => {
  const user = ctx.state.user;

  // Extract campaign number from command
  const text = ctx.message.text.trim();
  const parts = text.split(' ');

  if (parts.length !== 2 || isNaN(parseInt(parts[1]))) {
    await ctx.reply(
      'Please specify which campaign to view or manage.\n\n' +
      'Usage: /campaign [number]\n\n' +
      'You can see the campaign numbers by using the /campaigns command.'
    );
    return;
  }

  const campaignNumber = parseInt(parts[1]);

  // Check if user has listed campaigns in session
  if (!ctx.session.listedCampaigns || ctx.session.listedCampaigns.length === 0) {
    await ctx.reply(
      'Please use /campaigns first to see the list of available campaigns.'
    );
    return;
  }

  if (campaignNumber < 1 || campaignNumber > ctx.session.listedCampaigns.length) {
    await ctx.reply(
      `Invalid campaign number. Please choose a number between 1 and ${ctx.session.listedCampaigns.length}.`
    );
    return;
  }

  const campaignId = ctx.session.listedCampaigns[campaignNumber - 1];

  try {
    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      await ctx.reply('Campaign not found. It may have been deleted.');
      return;
    }

    // Different behavior for project owners vs regular users
    if (user.isProjectOwner) {
      // Check if user is owner of the project this campaign belongs to
      const project = await Project.findOne({
        _id: campaign.projectId,
        'owners.telegramId': user.telegramId
      });

      if (!project) {
        await ctx.reply('You do not have permission to manage this campaign.');
        return;
      }

      // Show campaign details with management options
      await showCampaignDetailsForOwner(ctx, campaign, project);

    } else {
      // Show campaign details with participation options
      await showCampaignDetailsForParticipant(ctx, campaign, user);
    }

  } catch (err) {
    console.error('Error managing campaign:', err);
    await ctx.reply('An error occurred while retrieving campaign details. Please try again later.');
  }
};

/**
 * Helper function to show campaign details for project owners
 */
async function showCampaignDetailsForOwner(ctx, campaign, project) {
  // Create inline keyboard for management options
  const inlineKeyboard = [
    [{ text: 'Check Participation', callback_data: `check_participation_${campaign._id}` }],
    [{ text: 'Send Reminders', callback_data: `send_reminders_${campaign._id}` }],
  ];

  if (campaign.status === 'active') {
    inlineKeyboard.push([{ text: 'Complete Campaign', callback_data: `complete_campaign_${campaign._id}` }]);
    inlineKeyboard.push([{ text: 'Cancel Campaign', callback_data: `cancel_campaign_${campaign._id}` }]);
  }

  // Prepare campaign stats
  const participationRate = campaign.participants.length > 0
    ? Math.round((campaign.currentParticipants / campaign.participants.length) * 100)
    : 0;

  const completionRate = campaign.targetParticipants > 0
    ? Math.round((campaign.currentParticipants / campaign.targetParticipants) * 100)
    : 0;

  // Prepare message text
  let messageText = `*Campaign: ${campaign.name}*\n\n`;
  messageText += `*Project:* ${project.name}\n`;
  messageText += `*Status:* ${formatStatus(campaign.status)}\n`;
  messageText += `*Created:* ${formatDate(campaign.startDate)}\n`;
  messageText += `*Ends:* ${formatDate(campaign.endDate)}\n`;
  messageText += `*Target:* ${campaign.currentParticipants}/${campaign.targetParticipants} participants (${completionRate}%)\n\n`;

  messageText += `*Description:*\n${campaign.description}\n\n`;

  messageText += `*X Post:* [View Post](${campaign.xPostUrl})\n\n`;

  // Show rewards
  messageText += `*Rewards:*\n`;
  campaign.rewards.forEach((reward, index) => {
    messageText += `${index + 1}. *${formatRewardType(reward.type)}:* ${reward.description}\n`;
    if (reward.requirements) {
      messageText += `   Requirements: ${reward.requirements}\n`;
    }
  });

  messageText += '\n*Statistics:*\n';
  messageText += `• Invited: ${campaign.participants.length}\n`;
  messageText += `• Participated: ${campaign.currentParticipants}\n`;
  messageText += `• Participation Rate: ${participationRate}%\n`;

  if (campaign.stats && campaign.stats.engagement) {
    const engagement = campaign.stats.engagement;
    messageText += `• Likes: ${engagement.likes || 0}\n`;
    messageText += `• Retweets: ${engagement.retweets || 0}\n`;
    messageText += `• Comments: ${engagement.comments || 0}\n`;
  }

  await ctx.replyWithMarkdown(messageText, {
    reply_markup: {
      inline_keyboard: inlineKeyboard
    },
    disable_web_page_preview: true
  });
}

/**
 * Helper function to show campaign details for participants
 */
async function showCampaignDetailsForParticipant(ctx, campaign, user) {
  // Check if user is already a participant
  const participantData = campaign.participants.find(p => p.telegramId === user.telegramId);
  const isParticipant = !!participantData;
  const hasParticipated = isParticipant && participantData.participated;

  // Create inline keyboard for participant options
  const inlineKeyboard = [];

  if (!isParticipant && !campaign.private) {
    // Only show join option for public campaigns that user hasn't joined
    inlineKeyboard.push([{ text: 'Join Campaign', callback_data: `join_campaign_${campaign._id}` }]);
  } else if (isParticipant && !hasParticipated) {
    // Show participate option if joined but not participated
    inlineKeyboard.push([{ text: 'View X Post', url: campaign.xPostUrl }]);
    inlineKeyboard.push([{ text: 'Check My Participation', callback_data: `check_my_participation_${campaign._id}` }]);
  } else if (hasParticipated) {
    // If already participated, just show status
    inlineKeyboard.push([{ text: 'View X Post', url: campaign.xPostUrl }]);
  }

  // Prepare message text
  let messageText = `*Campaign: ${campaign.name}*\n\n`;
  messageText += `*Project:* ${campaign.projectName}\n`;
  messageText += `*Status:* ${formatStatus(campaign.status)}\n`;
  messageText += `*Ends:* ${formatDate(campaign.endDate)}\n\n`;

  messageText += `*Description:*\n${campaign.description}\n\n`;

  // Show participation status
  if (hasParticipated) {
    messageText += '✅ *You have participated in this campaign!*\n\n';
  } else if (isParticipant) {
    messageText += '⚠️ *You have joined but not yet participated in this campaign.*\n\n';
  }

  // Show rewards
  messageText += `*Rewards:*\n`;
  campaign.rewards.forEach((reward, index) => {
    messageText += `${index + 1}. *${formatRewardType(reward.type)}:* ${reward.description}\n`;
    if (reward.requirements) {
      messageText += `   Requirements: ${reward.requirements}\n`;
    }
  });

  messageText += '\n*How to Participate:*\n';
  messageText += '1. Click "View X Post" to open the post\n';
  messageText += '2. Like, retweet, or comment on the post\n';
  messageText += '3. Your participation will be tracked automatically\n';

  await ctx.replyWithMarkdown(messageText, {
    reply_markup: {
      inline_keyboard: inlineKeyboard
    },
    disable_web_page_preview: true
  });
}

/**
 * Handler for the join campaign callback query
 */
const joinCampaignCallback = async (ctx) => {
  const user = ctx.state.user;
  const callbackData = ctx.callbackQuery.data;
  const campaignId = callbackData.replace('join_campaign_', '');

  try {
    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      await ctx.answerCbQuery('Campaign not found.');
      return;
    }

    if (campaign.status !== 'active') {
      await ctx.answerCbQuery(`This campaign is ${campaign.status} and cannot be joined.`);
      return;
    }

    // Check if user already joined
    const isParticipant = campaign.participants.some(p => p.telegramId === user.telegramId);

    if (isParticipant) {
      await ctx.answerCbQuery('You have already joined this campaign.');
      return;
    }

    // Check if user has verified X account if campaign requires it
    if (!user.hasVerifiedAccount('x')) {
      await ctx.answerCbQuery(
        'You need a verified X account to join this campaign. Use /link to connect your account.',
        { show_alert: true }
      );
      return;
    }

    // Add user as participant
    campaign.participants.push({
      userId: user._id.toString(),
      telegramId: user.telegramId,
      telegramUsername: user.username,
      participated: false
    });

    await campaign.save();

    // Update the message to show new status
    await showCampaignDetailsForParticipant(ctx, campaign, user);

    await ctx.answerCbQuery('You have successfully joined the campaign!');

  } catch (err) {
    console.error('Error joining campaign:', err);
    await ctx.answerCbQuery('An error occurred. Please try again later.');
  }
};

/**
 * Format campaign status for display
 */
function formatStatus(status) {
  switch (status) {
    case 'draft': return '📝 Draft';
    case 'active': return '🟢 Active';
    case 'completed': return '✅ Completed';
    case 'cancelled': return '❌ Cancelled';
    default: return status;
  }
}

/**
 * Format reward type for display
 */
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

/**
 * Format date for display
 */
function formatDate(date) {
  if (!date) return 'N/A';

  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

module.exports = {
  newCampaignHandler,
  listCampaignsHandler,
  manageCampaignHandler,
  joinCampaignCallback
};
