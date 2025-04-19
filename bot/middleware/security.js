
const rateLimit = require('telegraf-ratelimit');
const { pool } = require('../db');

// Rate limiting configuration
const rateLimitConfig = {
  window: 1000 * 60, // 1 minute
  limit: 20, // messages per window
  onLimitExceeded: (ctx) => ctx.reply('Please slow down! Try again in a minute.')
};

// Content verification middleware
const contentVerificationMiddleware = async (ctx, next) => {
  if (ctx.message?.text) {
    // Basic content filtering
    const forbiddenPatterns = [
      /script\s*?>/i,
      /(wget|curl)\s+/i,
      /rm\s+-rf/i
    ];
    
    if (forbiddenPatterns.some(pattern => pattern.test(ctx.message.text))) {
      await ctx.reply('⚠️ Potentially harmful content detected.');
      return;
    }
  }
  return next();
};

// Channel posting verification
const channelPostingMiddleware = async (ctx, next) => {
  if (ctx.message?.text?.startsWith('/postcampaign')) {
    const chatId = ctx.message.text.split(' ')[2];
    try {
      const chatMember = await ctx.telegram.getChatMember(chatId, ctx.botInfo.id);
      if (!chatMember || !['administrator', 'creator'].includes(chatMember.status)) {
        await ctx.reply('❌ Bot must be an administrator in the target channel');
        return;
      }
    } catch (error) {
      await ctx.reply('❌ Unable to verify channel permissions');
      return;
    }
  }
  return next();
};

module.exports = {
  rateLimit: rateLimit(rateLimitConfig),
  contentVerification: contentVerificationMiddleware,
  channelPosting: channelPostingMiddleware
};
