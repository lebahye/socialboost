const { Composer } = require('telegraf');
const User = require('../models/User');
const Campaign = require('../models/Campaign');

const startHandler = async (ctx) => {
  console.log('Start command received from:', ctx.from.id);
  try {
    const user = await User.findOne({ telegramId: ctx.from.id.toString() });
    let referralCode = null;

    if (ctx.startPayload && ctx.startPayload.length > 0) {
      referralCode = ctx.startPayload;
    }

    let welcomeMessage = `👋 Welcome ${ctx.from.first_name || 'there'}!`;

    if (user?.isProjectOwner) {
      welcomeMessage += `\n\nAs a project owner, you can create campaigns, manage your projects, and track performance.`;
    } else {
      welcomeMessage += `\n\nI'll help you participate in social media campaigns and earn rewards.`;
    }

    if (referralCode && user && !user.referredBy) {
      const referrer = await User.findByReferralCode(referralCode);

      if (referrer && referrer.telegramId !== user.telegramId) {
        user.referredBy = referrer.telegramId;
        await user.save();

        referrer.referrals.push(user.telegramId);
        await referrer.save();

        welcomeMessage += `\n\nYou were invited by ${referrer.username || 'a friend'}. You'll both receive bonuses when you participate in campaigns!`;
      }
    }

    welcomeMessage += `\n\n*Available Commands:*`;
    welcomeMessage += `\n/help - Show detailed help information`;
    welcomeMessage += `\n/status - Check your account status`;
    welcomeMessage += `\n/link - Link your social media accounts`;

    if (user?.isProjectOwner) {
      welcomeMessage += `\n/newproject - Create a new project`;
      welcomeMessage += `\n/myprojects - View your projects`;
      welcomeMessage += `\n/newcampaign - Create a new campaign`;
    }

    welcomeMessage += `\n/campaigns - View available campaigns`;

    await ctx.replyWithMarkdown(welcomeMessage);
  } catch (error) {
    console.error('Error in startHandler:', error);
    await ctx.reply('An error occurred. Please try again or contact support.');
  }
};

const helpHandler = async (ctx) => {
  try {
    const user = await User.findOne({ telegramId: ctx.from.id.toString() });
    let helpMessage = `*📚 Bot Commands & Help 📚*\n\n`;

    helpMessage += `*🔹 General Commands:*\n`;
    helpMessage += `/start - Start the bot\n`;
    helpMessage += `/help - Show this help message\n`;
    helpMessage += `/status - Check your account status\n`;
    helpMessage += `/link - Link your social media accounts\n`;
    helpMessage += `/verify - Verify your linked accounts\n`;
    helpMessage += `/unlink - Unlink a social media account\n`;
    helpMessage += `/campaigns - View available campaigns\n`;
    helpMessage += `/invite - Invite friends and earn rewards\n`;

    if (user?.isProjectOwner) {
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

    await ctx.replyWithMarkdown(helpMessage);
  } catch (error) {
    console.error('Error in helpHandler:', error);
    await ctx.reply('An error occurred while displaying help. Please try again.');
  }
};

const statusHandler = async (ctx) => {
  try {
    const user = await User.findOne({ telegramId: ctx.from.id.toString() });

    if (!user) {
      return ctx.reply('Please start the bot first with /start');
    }

    let statusMessage = `*📊 Your Account Status*\n\n`;
    statusMessage += `*User:* ${user.username || ctx.from.username || 'No username'}\n`;
    statusMessage += `*Joined:* ${user.joinDate.toDateString()}\n`;

    if (user.isProjectOwner) {
      statusMessage += `*Account Type:* Project Owner`;

      if (user.isPremium) {
        statusMessage += ` (Premium)\n`;
        statusMessage += `*Premium Until:* ${user.premiumUntil.toDateString()}\n`;
      } else {
        statusMessage += ` (Standard)\n`;
      }

      statusMessage += `*Projects:* ${user.projects.length}\n`;
    } else {
      statusMessage += `*Account Type:* Participant\n`;
    }

    await ctx.replyWithMarkdown(statusMessage);
  } catch (error) {
    console.error('Error in statusHandler:', error);
    await ctx.reply('An error occurred while fetching your status. Please try again.');
  }
};

const helpTopicHandler = async (ctx) => {
  try {
    const topic = ctx.message.text.split('/help_topic ')[1]?.toLowerCase();
    const user = await User.findOne({ telegramId: ctx.from.id.toString() });

    if (!topic) {
      await ctx.reply(
        `Please specify a topic, for example:\n\n` +
        `/help_topic campaigns\n` +
        `/help_topic verification\n` +
        `/help_topic rewards` +
        (user?.isProjectOwner ? `\n/help_topic projects\n/help_topic analytics` : '')
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
          `5. Receive rewards for your participation`;
        break;
      case 'verification':
        helpText = `*✅ Account Verification ✅*\n\n` +
          `To verify your social media account:\n\n` +
          `1. Link your account using /link\n` +
          `2. Follow the verification steps\n` +
          `3. Wait for confirmation\n` +
          `4. Start participating in campaigns`;
        break;
      default:
        helpText = `Topic not found. Available topics:\n\n` +
          `/help_topic campaigns\n` +
          `/help_topic verification\n` +
          `/help_topic rewards` +
          (user?.isProjectOwner ? `\n/help_topic projects\n/help_topic analytics` : '');
    }

    await ctx.replyWithMarkdown(helpText);
  } catch (error) {
    console.error('Error in helpTopicHandler:', error);
    await ctx.reply('An error occurred while displaying help topic. Please try again.');
  }
};

module.exports = {
  startHandler,
  helpHandler,
  statusHandler,
  helpTopicHandler
};