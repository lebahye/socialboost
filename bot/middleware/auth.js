const User = require('../models/User');
const Project = require('../models/Project');

/**
 * Middleware to load user data for all requests
 */
const userMiddleware = async (ctx, next) => {
  if (!ctx.from) {
    // If no user is associated with this update, skip
    return next();
  }

  try {
    // Find or create user
    let user = await User.findOne({ telegramId: ctx.from.id });

    if (!user) {
      user = new User({
        telegramId: ctx.from.id,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name,
        language: ctx.from.language_code,
        joinDate: new Date()
      });
      await user.save();
    } else {
      // Update user information if needed
      let needsUpdate = false;

      if (user.username !== ctx.from.username) {
        user.username = ctx.from.username;
        needsUpdate = true;
      }

      if (user.firstName !== ctx.from.first_name) {
        user.firstName = ctx.from.first_name;
        needsUpdate = true;
      }

      if (user.lastName !== ctx.from.last_name) {
        user.lastName = ctx.from.last_name;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await user.save();
      }
    }

    // Add user to context state
    ctx.state.user = user;

    return next();
  } catch (err) {
    console.error('Error in user middleware:', err);
    return next();
  }
};

/**
 * Middleware to check if user is a project owner
 */
const projectOwnerMiddleware = async (ctx, next) => {
  try {
    // Check if user middleware has run and user exists
    if (!ctx.state.user) {
      await userMiddleware(ctx, () => {});

      if (!ctx.state.user) {
        await ctx.reply('Please start a conversation with /start first.');
        return;
      }
    }

  // Check if user is a project owner
  if (!ctx.state.user.isProjectOwner) {
    const projects = await Project.findByTelegramId(ctx.from.id);

    if (projects && projects.length > 0) {
      // User has projects, but isProjectOwner flag is not set
      ctx.state.user.isProjectOwner = true;
      await ctx.state.user.save();
    } else {
      // User is not a project owner
      await ctx.reply('This command is only available to project owners. Please create a project first using /newproject command.');
      return;
    }
  }

  return next();
};

/**
 * Middleware to check if user has verified their social accounts
 */
const verifiedAccountMiddleware = async (ctx, next) => {
  // Check if user middleware has run and user exists
  if (!ctx.state.user) {
    await userMiddleware(ctx, () => {});

    if (!ctx.state.user) {
      await ctx.reply('You need to start a conversation with the bot first. Please use /start command.');
      return;
    }
  }

  // Get platform from context
  const platform = ctx.state.platform || 'x'; // Default to X

  // Check if user has verified their account on the required platform
  if (!ctx.state.user.hasVerifiedAccount(platform)) {
    await ctx.reply(
      `You need to verify your ${platform === 'x' ? 'X (Twitter)' : platform} account first. ` +
      `Please use /link command to connect your ${platform === 'x' ? 'X (Twitter)' : platform} account.`
    );
    return;
  }

  return next();
};

/**
 * Middleware to check if user can participate in a specific campaign
 */
const campaignParticipantMiddleware = async (ctx, next) => {
  // Check if user middleware has run and user exists
  if (!ctx.state.user) {
    await userMiddleware(ctx, () => {});

    if (!ctx.state.user) {
      await ctx.reply('You need to start a conversation with the bot first. Please use /start command.');
      return;
    }
  }

  // Get campaign ID from context
  const campaignId = ctx.state.campaignId;

  if (!campaignId) {
    await ctx.reply('Campaign ID is required. Please try again with a valid campaign.');
    return;
  }

  const Campaign = require('../models/Campaign');
  const campaign = await Campaign.findById(campaignId);

  if (!campaign) {
    await ctx.reply('Campaign not found. Please try again with a valid campaign.');
    return;
  }

  // Check if campaign is active
  if (campaign.status !== 'active') {
    await ctx.reply(`This campaign is not active (current status: ${campaign.status}).`);
    return;
  }

  // Check if campaign is private and user is not a participant
  if (campaign.private && !campaign.participants.some(p => p.telegramId === ctx.from.id)) {
    await ctx.reply('This is a private campaign that you have not been invited to participate in.');
    return;
  }

  // Check if user has the required social accounts for this campaign
  if (campaign.xPostUrl && !ctx.state.user.hasVerifiedAccount('x')) {
    await ctx.reply(
      'This campaign requires a verified X (Twitter) account. ' +
      'Please use /link command to connect your X account.'
    );
    return;
  }

  // Add campaign to context
  ctx.state.campaign = campaign;

  return next();
};

module.exports = {
  userMiddleware,
  projectOwnerMiddleware,
  verifiedAccountMiddleware,
  campaignParticipantMiddleware
};
