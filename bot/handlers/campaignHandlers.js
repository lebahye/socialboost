const { Composer } = require('telegraf');
const { Pool } = require('pg');
const Campaign = require('../models/Campaign');
const Project = require('../models/Project');
const User = require('../models/User');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

/**
 * Handler for /newcampaign command
 * Starts the campaign creation wizard
 */
const newCampaignHandler = async (ctx) => {
  try {
    if (!ctx.session) {
      ctx.session = {};
    }
    
    // Check if user exists
    const { rows: [user] } = await pool.query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [ctx.from.id.toString()]
    );
    
    if (!user) {
      await ctx.reply('Please start the bot first with /start command');
      return;
    }

    if (!user.is_project_owner) {
      await ctx.reply('Only project owners can create campaigns. Use /register first to register as a project owner.');
      return;
    }

    await ctx.reply('🚀 Starting campaign creation process...');
    return ctx.scene.enter('campaignCreation');
  } catch (error) {
    console.error('Error in newCampaignHandler:', error);
    await ctx.reply('An error occurred while creating campaign. Please try again.');
  }
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

    await ctx.reply(
      '📢 *Campaign Selection Guide*\n\n' +
      '1️⃣ Find the campaign number (1, 2, 3, etc.)\n' +
      '2️⃣ Use `/campaign [number]` to view details\n' +
      '3️⃣ Example: `/campaign 1`\n\n' +
      'Available campaigns are listed below:\n',
      { parse_mode: 'Markdown' }
    );

    // Get all campaigns from database
    const { rows: allCampaigns } = await pool.query(`
      SELECT * FROM campaigns 
      WHERE created_by = $1 OR private = false
    `, [user.telegramId]);

    if (!allCampaigns || allCampaigns.length === 0) {
      await ctx.reply('No campaigns found. You can create a new campaign with /newcampaign');
      return;
    }

    let userCampaigns = [];
    let otherCampaigns = [];

    // Separate user's own campaigns from others
    allCampaigns.forEach(campaign => {
      //Added safety check to prevent crashes if created_by is null or undefined
      const createdBy = campaign.created_by || '';
      const userTelegramId = user.telegramId || '';
      if (createdBy.toString() === userTelegramId.toString()) {
        userCampaigns.push(campaign);
      } else {
        otherCampaigns.push(campaign);
      }
    });

    // First show user's own campaigns
    if (userCampaigns.length > 0) {
      let message = '🚀 *Your Campaigns*\n\n';

      userCampaigns.forEach((campaign, index) => {
        const status = campaign.status ? campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1) : 'Unknown Status';
        message += `${index + 1}. *${campaign.name || 'Unnamed Campaign'}* (${status})\n`;
        message += `   Project: ${campaign.project_name || 'Unknown Project'}\n`;
        message += `   ID: \`${campaign.id || 'Unknown ID'}\`\n\n`;
      });

      await ctx.replyWithMarkdown(message);
    }

    // Then show other campaigns
    if (otherCampaigns.length > 0) {
      let message = '📢 *Available Campaigns*\n\n';

      otherCampaigns.forEach((campaign, index) => {
        const status = campaign.status ? campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1) : 'Unknown Status';
        message += `${index + 1}. *${campaign.name || 'Unnamed Campaign'}* (${status})\n`;
        message += `   Project: ${campaign.project_name || 'Unknown Project'}\n`;
        message += `   ID: \`${campaign.id || 'Unknown ID'}\`\n\n`;
      });

      await ctx.replyWithMarkdown(message);
    }
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
  try {
    // Input validation
    if (!ctx?.from?.id) {
      throw new Error('INVALID_CONTEXT');
    }

    // Validate campaign number format
    const messageText = ctx.message.text.trim();
    const parts = messageText.split(' ');
    const campaignNumber = parseInt(parts[1]);

    if (parts.length !== 2 || isNaN(campaignNumber)) {
      await ctx.reply(
        '❌ Invalid command format\n\n' +
        'Usage: /campaign [number]\n' +
        'Example: /campaign 1\n\n' +
        'Use /campaigns to see available campaigns first.'
      );
      return;
    }

    const userId = ctx.from.id.toString();

    // Get user from database with error handling
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [userId]
    ).catch(err => {
      console.error('Database error in manageCampaignHandler:', err);
      throw new Error('Failed to fetch user data');
    });

    const user = rows[0];

    if (!user) {
      await ctx.reply('Please start the bot first with /start command.');
      return;
    }

    if (!campaignNumber || isNaN(campaignNumber)) {
      await ctx.reply(
        '❌ Invalid command format.\n\n' +
        '📝 How to use:\n' +
        '1. First use /campaigns to see available campaigns\n' +
        '2. Note the number (1, 2, 3, etc.) next to the campaign you want to view\n' +
        '3. Then use: /campaign [number]\n\n' +
        'Example: /campaign 1 to view the first campaign'
      );
      return;
    }

    // Initialize session if not exists
    if (!ctx.session) ctx.session = {};

    // Check if user has listed campaigns in session
    if (!ctx.session.listedCampaigns || ctx.session.listedCampaigns.length === 0) {
      // Get campaigns directly if not in session
      try {
        const { rows: campaigns } = await pool.query(`
          SELECT c.*, p.name as project_name 
          FROM campaigns c
          LEFT JOIN projects p ON c.project_id = p.id
          WHERE c.created_by = $1 OR c.private = false
        `, [user.telegramId]);

        if (!campaigns || campaigns.length === 0) {
          await ctx.reply(
            'No campaigns found. You can create a new campaign with /newcampaign'
          );
          return;
        }

        ctx.session.listedCampaigns = campaigns;

        // Show available campaigns
        let message = '📢 *Available Campaigns*\n\n';
        campaigns.forEach((campaign, index) => {
          message += `${index + 1}. *${campaign.name}*\n`;
          message += `   Status: ${campaign.status}\n`;
          message += `   Project: ${campaign.project_name}\n\n`;
        });

        await ctx.replyWithMarkdown(message);
        return;
      } catch (err) {
        console.error('Error fetching campaigns:', err);
        await ctx.reply(
          'An error occurred while fetching campaigns. Please try again.'
        );
        return;
      }
    }

    if (!ctx.session?.listedCampaigns || !Array.isArray(ctx.session.listedCampaigns)) {
      // Get campaigns directly if not in session
      const { rows: campaigns } = await pool.query(`
        SELECT c.*, p.name as project_name 
        FROM campaigns c
        LEFT JOIN projects p ON c.project_id = p.id
        WHERE c.created_by = $1 OR c.private = false
      `, [userId]);

      if (!campaigns || campaigns.length === 0) {
        await ctx.reply('No campaigns found. You can create a new campaign with /newcampaign');
        return;
      }

      ctx.session.listedCampaigns = campaigns;
    }

    if (campaignNumber < 1 || campaignNumber > ctx.session.listedCampaigns.length) {
      await ctx.reply(
        `Invalid campaign number. Please choose a number between 1 and ${ctx.session.listedCampaigns.length}.`
      );
      return;
    }

    const campaignId = ctx.session.listedCampaigns[campaignNumber - 1].id;
    if (!campaignId) {
      await ctx.reply('Campaign not found. Please try listing campaigns again.');
      return;
    }

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
  } catch (error) {
    console.error("Error in manageCampaignHandler", error);
    await ctx.reply("An unexpected error occurred. Please try again later.");
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
const { verifyXPostEngagement } = require('../services/verification');

async function showCampaignDetailsForParticipant(ctx, campaign, user) {
  // Check if user is already a participant
  const participantData = campaign.participants.find(p => p.telegramId === user.telegramId);
  const isParticipant = !!participantData;
  const hasParticipated = isParticipant && participantData.participated;

  // Verify X post engagement if user has connected account
  if (isParticipant && !hasParticipated && user.social_accounts) {
    const xAccount = user.social_accounts.find(acc => acc.platform === 'x' && acc.verified);
    if (xAccount) {
      const postId = campaign.xPostUrl.split('/').pop();
      const verification = await verifyXPostEngagement(postId, xAccount.username);

      if (verification.verified) {
        // Update participation status
        await Campaign.update(campaign.id, {
          participants: campaign.participants.map(p => 
            p.telegramId === user.telegramId 
              ? {...p, participated: true, participationDate: new Date()}
              : p
          ),
          stats: {
            ...campaign.stats,
            participationRate: ((campaign.stats.participationRate || 0) + 1),
            engagement: verification.metrics
          }
        });

        // Refresh campaign data
        campaign = await Campaign.findById(campaign.id);
        hasParticipated = true;
      }
    }
  }

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

  messageText += '\n🎯 *Raid Reached:*\n';
  messageText += `❤️ Likes: ${campaign.stats?.engagement?.likes || 0}\n`;
  messageText += `💬 Comments: ${campaign.stats?.engagement?.comments || 0}\n`;
  messageText += `🔄 Retweets: ${campaign.stats?.engagement?.retweets || 0}\n`;
  messageText += `🔖 Bookmarks: ${campaign.stats?.engagement?.bookmarks || 0}\n\n`;

  messageText += '🏆 *Rewards:*\n';
  messageText += `⚡️ Raid Earned: +${campaign.reward || 0}\n`;
  messageText += `📊 Total Points: ${campaign.stats?.totalPoints || 0}\n`;
  messageText += `📈 Leaderboard Entry: ${campaign.stats?.leaderboardPosition || 'N/A'}\n\n`;

  messageText += '🔗 *Actions:*\n';
  messageText += `📊 [Leaderboard](https://t.me/${ctx.botInfo.username}?start=leaderboard)\n`;
  messageText += `⚡️ [Boost Points](https://t.me/${ctx.botInfo.username}?start=boost_${campaign.id})\n`;


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
  try {
    // Get user directly from database since ctx.state.user might be empty
    const { rows: [user] } = await pool.query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [ctx.from.id.toString()]
    );

    if (!user) {
      await ctx.answerCbQuery('Please start the bot first with /start command', { show_alert: true });
      return;
    }

    // Check if user has verified social accounts
    if (!user.social_accounts || !Array.isArray(user.social_accounts)) {
      await ctx.answerCbQuery(
        'You need to link your X and Discord accounts first. Use /link command.',
        { show_alert: true }
      );
      return;
    }

    const hasX = user.social_accounts.some(acc => acc.platform === 'x' && acc.verified);
    const hasDiscord = user.social_accounts.some(acc => acc.platform === 'discord' && acc.verified);

    if (!hasX || !hasDiscord) {
      await ctx.answerCbQuery(
        `Please link your ${!hasX ? 'X' : ''} ${!hasX && !hasDiscord ? 'and' : ''} ${!hasDiscord ? 'Discord' : ''} accounts first using /link command`,
        { show_alert: true }
      );
      return;
    }

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

      // Parse participants if they're stored as JSON string
      let participants = [];
      if (typeof campaign.participants === 'string') {
        try {
          participants = JSON.parse(campaign.participants);
        } catch (e) {
          participants = [];
        }
      } else if (Array.isArray(campaign.participants)) {
        participants = campaign.participants;
      }

      // Check if user already joined
      const isParticipant = participants.some(p => p.telegramId === user.telegramId);

      if (isParticipant) {
        await ctx.answerCbQuery('You have already joined this campaign.');
        return;
      }

      // Check if user has verified X account if campaign requires it
      const hasVerifiedAccount = user.social_accounts && 
                                user.social_accounts.some(acc => acc.platform === 'x' && acc.verified);

      if (!hasVerifiedAccount) {
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
      console.error('Error in join campaign:', err);
      await ctx.answerCbQuery('An error occurred while joining the campaign. Please try again later.');
    }
  } catch (err) {
    console.error('Error in joinCampaignCallback:', err);
    await ctx.answerCbQuery('An error occurred while joining the campaign. Please try again later.');
  }
};

/**
 * Function to post a campaign to a project's Telegram channel
 * This allows project owners to share campaigns directly with their followers
 */
const postCampaignToChannelHandler = async (ctx) => {
  try {
    // Verify user is project owner
    const telegramId = ctx.from.id.toString();
    const userResult = await pool.query(
      'SELECT * FROM users WHERE telegram_id = $1 AND is_project_owner = true',
      [telegramId]
    );

    if (!userResult.rows[0]) {
      await ctx.reply('❌ Only project owners can post campaigns.');
      return;
    }

    // Rate limiting check
    const rateLimit = await pool.query(
      'SELECT COUNT(*) FROM campaign_posts WHERE owner_id = $1 AND created_at > NOW() - INTERVAL \'1 hour\'',
      [telegramId]
    );

    if (rateLimit.rows[0].count >= 5) {
      await ctx.reply('⚠️ Rate limit reached. Please wait before posting more campaigns.');
      return;
    }

    const parts = ctx.message.text.split(' ');

    if (parts.length !== 3) {
      await ctx.reply(
        'Please specify which campaign to post and to which channel.\n\n' +
        'Usage: /postcampaign [campaign_id] [channel_username]\n\n' +
        'Example: /postcampaign 123 @myprojectchannel'
      );
      return;
    }

    const campaignId = parts[1];
    const channelUsername = parts[2];

    // Verify the user has permission to manage this campaign
    const user = ctx.state.user || await User.findOne({ telegramId: ctx.from.id.toString() });
    if (!user) {
      await ctx.reply('Please start the bot first with /start');
      return;
    }

    // Get campaign
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      await ctx.reply('Campaign not found.');
      return;
    }

    // Check if user is the owner of the campaign
    const project = await Project.findOne({
      _id: campaign.projectId,
      'owners.telegramId': user.telegramId
    });

    if (!project) {
      await ctx.reply('You do not have permission to post this campaign.');
      return;
    }

    // Prepare campaign message for the channel
    let messageText = `🚀 *New Campaign: ${campaign.name}*\n\n`;
    messageText += `*Project:* ${campaign.projectName}\n`;
    messageText += `*Status:* ${formatStatus(campaign.status)}\n`;
    messageText += `*Ends:* ${formatDate(campaign.endDate)}\n\n`;
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

    // Create inline keyboard for channel post
    const inlineKeyboard = [
      [{ text: 'View Campaign Details', url: `https://t.me/${ctx.botInfo.username}?start=campaign_${campaign._id}` }],
      [{ text: 'Join Campaign', url: `https://t.me/${ctx.botInfo.username}?start=join_${campaign._id}` }],
      [{ text: 'Get Campaign Notifications', url: `https://t.me/${ctx.botInfo.username}?start=notify_${campaign._id}` }]
    ];

    // Format engagement stats if available
    let engagementText = '';
    if (campaign.stats && campaign.stats.engagement) {
      engagementText = '\n\n📊 *Engagement Stats:*\n' +
        `❤️ Likes: ${campaign.stats.engagement.likes || 0}\n` +
        `💬 Comments: ${campaign.stats.engagement.comments || 0}\n` +
        `🔄 Retweets: ${campaign.stats.engagement.retweets || 0}\n` +
        `🔖 Bookmarks: ${campaign.stats.engagement.bookmarks || 0}`;
    }

    // Add points info if available  
    if (campaign.reward) {
      engagementText += '\n\n🎯 *Rewards:*\n' +
        `🏆 Points: +${campaign.reward}\n` +
        `📈 Leaderboard Position: ${campaign.leaderboardPosition || 'N/A'}`;
    }

    messageText += engagementText;

    // Post message to the channel
    try {
      await ctx.telegram.sendMessage(channelUsername, messageText, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: inlineKeyboard
        }
      });

      // Update campaign with channel information
      campaign.postedToChannels = campaign.postedToChannels || [];
      campaign.postedToChannels.push({
        channelUsername: channelUsername,
        postedAt: new Date()
      });

      await campaign.save();

      await ctx.reply(`Campaign has been successfully posted to ${channelUsername}!`);
    } catch (error) {
      console.error('Error posting to channel:', error);
      await ctx.reply(`Error posting to channel: ${error.message}. Make sure the bot is an admin in the channel with posting permissions.`);
    }
  } catch (err) {
    console.error('Error in postCampaignToChannel handler:', err);
    await ctx.reply('An error occurred while posting the campaign. Please try again later.');
  }
};

module.exports = {
  newCampaignHandler,
  listCampaignsHandler,
  manageCampaignHandler,
  joinCampaignCallback,
  postCampaignToChannelHandler
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