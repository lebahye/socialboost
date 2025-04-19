
const rateLimit = require('telegraf-ratelimit');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Rate limiting configuration - more restrictive for campaign posts
const rateLimitConfig = {
  window: 1000 * 60 * 5, // 5 minutes
  limit: 5, // posts per window
  onLimitExceeded: (ctx) => ctx.reply('⚠️ Campaign posting rate limit reached. Please wait before posting more campaigns.')
};

// Campaign posting attempt tracking
const postAttempts = new Map();

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

// Enhanced channel posting verification
const channelPostingMiddleware = async (ctx, next) => {
  if (ctx.message?.text?.startsWith('/postcampaign')) {
    const parts = ctx.message.text.split(' ');
    const campaignId = parts[1];
    const channelUsername = parts[2];

    // Verify user is project owner
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE telegram_id = $1 AND is_project_owner = true',
      [ctx.from.id.toString()]
    );

    if (!rows[0]) {
      await ctx.reply('❌ Only verified project owners can post campaigns');
      return;
    }

    // Check campaign ownership
    const { rows: campaigns } = await pool.query(
      'SELECT * FROM campaigns WHERE id = $1 AND created_by = $2',
      [campaignId, ctx.from.id.toString()]
    );

    if (!campaigns[0]) {
      await ctx.reply('❌ You can only post campaigns you own');
      return;
    }

    // Verify bot permissions in channel
    try {
      const chatMember = await ctx.telegram.getChatMember(channelUsername, ctx.botInfo.id);
      if (!chatMember || !['administrator', 'creator'].includes(chatMember.status)) {
        await ctx.reply('❌ Bot must be an administrator in the target channel');
        return;
      }

      // Track posting attempts
      const userId = ctx.from.id.toString();
      const attempts = postAttempts.get(userId) || 0;
      if (attempts >= 3) {
        await ctx.reply('⚠️ Too many posting attempts. Please try again later.');
        return;
      }
      postAttempts.set(userId, attempts + 1);
      setTimeout(() => postAttempts.delete(userId), 1000 * 60 * 15); // Reset after 15 minutes

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
