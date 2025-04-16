const { Composer } = require('telegraf');
const User = require('../models/User');
const Campaign = require('../models/Campaign');

/**
 * Handler for /start command
 */
const startHandler = async (ctx) => {
  console.log('Start command received from:', ctx.from.id);
  try {
    await ctx.reply('Welcome to SocialBoost! 🚀\n\nI can help you manage your social media campaigns.\n\nUse /help to see available commands.');
  const user = ctx.state.user;

  // Check if this is a referral start
  let referralCode = null;
  if (ctx.startPayload && ctx.startPayload.length > 0) {
    referralCode = ctx.startPayload;
  }

  // Welcome message with user's name
  let welcomeMessage = `👋 Welcome ${user.firstName || 'there'}!`;

  if (user.isProjectOwner) {
    // For project owners
    welcomeMessage += `\n\nAs a project owner, you can create campaigns, manage your projects, and track performance.`;
  } else {
    // For regular users
    welcomeMessage += `\n\nI'll help you participate in social media campaigns and earn rewards.`;
  }

  // Add referral info if applicable
  if (referralCode && !user.referredBy) {
    const referrer = await User.findByReferralCode(referralCode);

    if (referrer && referrer.telegramId !== user.telegramId) {
      // Set referrer in user document
      user.referredBy = referrer.telegramId;
      await user.save();

      // Add to referrer's list
      referrer.referrals.push(user.telegramId);
      await referrer.save();

      welcomeMessage += `\n\nYou were invited by ${referrer.username || 'a friend'}. You'll both receive bonuses when you participate in campaigns!`;
    }
  }

  // List available commands
  welcomeMessage += `\n\n*Available Commands:*`;
  welcomeMessage += `\n/help - Show detailed help information`;
  welcomeMessage += `\n/status - Check your account status`;
  welcomeMessage += `\n/link - Link your social media accounts`;

  if (user.isProjectOwner) {
    welcomeMessage += `\n/newproject - Create a new project`;
    welcomeMessage += `\n/myprojects - View your projects`;
    welcomeMessage += `\n/newcampaign - Create a new campaign`;
  }

  welcomeMessage += `\n/campaigns - View available campaigns`;

  // Send message with markdown formatting
  await ctx.replyWithMarkdown(welcomeMessage);
};

/**
 * Handler for /help command
 */
const helpHandler = async (ctx) => {
  const user = ctx.state.user;

  let helpMessage = `*📚 Bot Commands & Help 📚*\n\n`;

  // General commands (for all users)
  helpMessage += `*🔹 General Commands:*\n`;
  helpMessage += `/start - Start the bot\n`;
  helpMessage += `/help - Show this help message\n`;
  helpMessage += `/status - Check your account status\n`;
  helpMessage += `/link - Link your social media accounts\n`;
  helpMessage += `/verify - Verify your linked accounts\n`;
  helpMessage += `/unlink - Unlink a social media account\n`;
  helpMessage += `/campaigns - View available campaigns\n`;
  helpMessage += `/invite - Invite friends and earn rewards\n`;

  // Project owner commands
  if (user.isProjectOwner) {
    helpMessage += `\n*🔹 Project Owner Commands:*\n`;
    helpMessage += `/newproject - Create a new project\n`;
    helpMessage += `/myprojects - View your projects\n`;
    helpMessage += `/project - Manage a specific project\n`;
    helpMessage += `/newcampaign - Create a new campaign\n`;
    helpMessage += `/check - Check campaign participation\n`;
    helpMessage += `/remind - Send reminders to participants\n`;
    helpMessage += `/analytics - View project analytics\n`;
    helpMessage += `/export - Export data\n`;
  }

  // Add help topics
  helpMessage += `\n*📌 Detailed Help Topics:*\n`;
  helpMessage += `Use /help_topic followed by the topic name for detailed information:\n`;
  helpMessage += `• campaigns - How campaigns work\n`;
  helpMessage += `• verification - Account verification process\n`;
  helpMessage += `• rewards - How rewards work\n`;

  if (user.isProjectOwner) {
    helpMessage += `• projects - Project management\n`;
    helpMessage += `• analytics - Understanding analytics\n`;
  }

  // Send help message with markdown formatting
  await ctx.replyWithMarkdown(helpMessage);
};

/**
 * Handler for /status command
 */
const statusHandler = async (ctx) => {
  const user = ctx.state.user;

  // Build status message
  let statusMessage = `*📊 Your Account Status*\n\n`;

  // User information
  statusMessage += `*User:* ${user.username || 'No username'}\n`;
  statusMessage += `*Joined:* ${user.joinDate.toDateString()}\n`;

  // Account type
  if (user.isProjectOwner) {
    statusMessage += `*Account Type:* Project Owner`;

    // Subscription info if premium
    if (user.isPremium) {
      statusMessage += ` (Premium)\n`;
      statusMessage += `*Premium Until:* ${user.premiumUntil.toDateString()}\n`;
    } else {
      statusMessage += ` (Standard)\n`;
    }

    // Projects count
    statusMessage += `*Projects:* ${user.projects.length}\n`;
  } else {
    statusMessage += `*Account Type:* Participant\n`;
  }

  // Connected accounts
  statusMessage += `\n*📱 Connected Accounts:*\n`;

  if (user.socialAccounts && user.socialAccounts.length > 0) {
    user.socialAccounts.forEach(account => {
      statusMessage += `• ${account.platform === 'x' ? 'X (Twitter)' : account.platform}: @${account.username}`;
      statusMessage += account.isVerified ? ' ✅\n' : ' ❌ (unverified)\n';
    });
  } else {
    statusMessage += `No accounts connected. Use /link to connect your social media accounts.\n`;
  }

  // Participation stats
  const participatedCampaigns = await Campaign.find({
    'participants.telegramId': user.telegramId,
    'participants.participated': true
  });

  statusMessage += `\n*🏆 Participation:*\n`;
  statusMessage += `*Campaigns Participated:* ${participatedCampaigns.length}\n`;

  if (user.stats) {
    statusMessage += `*Total Earned:* ${user.stats.totalEarned}\n`;

    if (user.stats.lastActive) {
      statusMessage += `*Last Active:* ${user.stats.lastActive.toDateString()}\n`;
    }
  }

  // Referral info
  statusMessage += `\n*👥 Referrals:*\n`;

  if (user.referralCode) {
    statusMessage += `*Your Referral Code:* \`${user.referralCode}\`\n`;
  } else {
    const code = user.generateReferralCode();
    await user.save();
    statusMessage += `*Your Referral Code:* \`${code}\`\n`;
  }

  statusMessage += `*People Referred:* ${user.referrals.length}\n`;
  statusMessage += `Use /invite to share your referral link with friends.`;

  // Send status message with markdown formatting
  await ctx.replyWithMarkdown(statusMessage);
};

/**
 * Handler for /help_topic command
 */
const helpTopicHandler = async (ctx) => {
  const topic = ctx.message.text.split('/help_topic ')[1]?.toLowerCase();

  if (!topic) {
    await ctx.reply(
      `Please specify a topic, for example:\n\n` +
      `/help_topic campaigns\n` +
      `/help_topic verification\n` +
      `/help_topic rewards\n` +
      `/help_topic projects\n` +
      `/help_topic analytics`
    );
    return;
  }

  let helpText = '';

  switch (topic) {
    case 'campaigns':
      helpText = `*📢 Campaigns Guide 📢*\n\n` +
        `Campaigns are tasks where you engage with specific social media posts.\n\n` +
        `*Participation steps:*\n` +
        `1. View available campaigns with /campaigns\n` +
        `2. Click the post link\n` +
        `3. Engage with the post (like, retweet, comment)\n` +
        `4. Your participation is automatically tracked\n` +
        `5. Receive rewards for your participation\n\n` +
        `*Campaign types:*\n` +
        `• Standard: Available to all verified users\n` +
        `• Private: Only for invited participants\n\n` +
        `You need to have a verified social account to participate in campaigns. Use /link to connect your accounts.`;
      break;

    case 'verification':
      helpText = `*✅ Account Verification ✅*\n\n` +
        `To verify your social media account:\n\n` +
        `1. Link your account using /link\n` +
        `2. For X (Twitter): Send a DM to our verification account with the code provided\n` +
        `3. For Discord: Join our verification server and follow the instructions\n` +
        `4. The system will verify your ownership\n` +
        `5. Your account will be marked as verified\n\n` +
        `Verification ensures that you genuinely own the social accounts you claim, which is necessary for participation tracking.`;
      break;

    case 'rewards':
      helpText = `*🎁 Rewards System 🎁*\n\n` +
        `Projects offer various rewards for campaign participation:\n\n` +
        `*Types of rewards:*\n` +
        `• Community roles in Discord or Telegram\n` +
        `• Exclusive access to channels or content\n` +
        `• Recognition (e.g., being featured on their social media)\n` +
        `• Merchandise (physical items)\n` +
        `• Whitelist spots for NFT mints or token sales\n` +
        `• Custom rewards defined by the project\n\n` +
        `The campaign details will specify what rewards are offered for participation. Complete the required actions to qualify for rewards.`;
      break;

    case 'projects':
      helpText = `*🚀 Project Management 🚀*\n\n` +
        `As a project owner, you can create and manage projects:\n\n` +
        `*Creating a project:*\n` +
        `• Use /newproject to start the creation process\n` +
        `• Follow the prompts to set up your project details\n` +
        `• Link your social accounts to your project\n\n` +
        `*Managing projects:*\n` +
        `• View all your projects with /myprojects\n` +
        `• Use /project followed by ID to manage a specific project\n` +
        `• Add team members as project managers\n` +
        `• Create campaigns for your project using /newcampaign\n\n` +
        `*Subscription plans:*\n` +
        `• Basic: Limited campaigns and participants\n` +
        `• Pro: More campaigns and advanced analytics\n` +
        `• Enterprise: Custom solutions for large projects`;
      break;

    case 'analytics':
      helpText = `*📊 Understanding Analytics 📊*\n\n` +
        `Projects have access to detailed analytics:\n\n` +
        `*Campaign metrics:*\n` +
        `• Participation rate: % of invited users who participated\n` +
        `• Engagement: Likes, retweets, comments, mentions\n` +
        `• Completion rate: Progress toward campaign target\n\n` +
        `*Growth metrics:*\n` +
        `• Follower growth: New followers gained during campaigns\n` +
        `• Reach and impressions: Visibility metrics\n\n` +
        `*Exporting data:*\n` +
        `• Use /export to download detailed analytics reports\n` +
        `• View trends and performance over time`;
      break;

    default:
      helpText = `Topic not found. Available topics:\n\n` +
        `/help_topic campaigns\n` +
        `/help_topic verification\n` +
        `/help_topic rewards\n` +
        `/help_topic projects\n` +
        `/help_topic analytics`;
  }

  await ctx.replyWithMarkdown(helpText);
};

module.exports = {
  startHandler,
  helpHandler,
  statusHandler,
  helpTopicHandler
};
