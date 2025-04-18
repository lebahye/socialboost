
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

/**
 * Generate a unique referral code for a user
 */
const generateReferralCode = (userId, username) => {
  // Create a code based on user id and username, plus a random component
  const randomPart = Math.random().toString(36).substring(2, 6);
  const userPart = username ? username.substring(0, 4) : userId.substring(0, 4);
  return `${userPart}${randomPart}`.toUpperCase();
};

/**
 * Handle the referral command - shows user's referral info and code
 */
const referralHandler = async (ctx) => {
  try {
    const telegramId = ctx.from.id.toString();
    
    // Get user's referral info
    const userResult = await pool.query(
      'SELECT referral_code, referral_count, credits FROM users WHERE telegram_id = $1',
      [telegramId]
    );
    
    if (!userResult.rows[0]) {
      return ctx.reply('Please start the bot first with /start');
    }
    
    let user = userResult.rows[0];
    
    // If user doesn't have a referral code yet, generate one
    if (!user.referral_code) {
      const code = generateReferralCode(telegramId, ctx.from.username);
      
      const updateResult = await pool.query(
        'UPDATE users SET referral_code = $1 WHERE telegram_id = $2 RETURNING *',
        [code, telegramId]
      );
      
      user = updateResult.rows[0];
    }
    
    // Calculate earnings from referrals
    const referralBonus = parseInt(process.env.REFERRAL_BONUS || '50');
    const totalEarned = user.referral_count * referralBonus;
    
    const message = `
🔗 *Your Referral Information*

Your referral code: *${user.referral_code}*

Share this link with friends:
https://t.me/${ctx.botInfo.username}?start=ref_${user.referral_code}

*Stats:*
• Total referrals: ${user.referral_count || 0}
• Credits earned from referrals: ${totalEarned}

*Rewards:*
• You earn ${referralBonus} credits for each new user who joins with your code
• They also get a bonus when they join!

Use /referralstats for detailed information about your referrals.
`;
    
    await ctx.replyWithMarkdown(message);
    
  } catch (error) {
    console.error('Error in referralHandler:', error);
    await ctx.reply('An error occurred. Please try again later.');
  }
};

/**
 * Handle detailed referral statistics
 */
const referralStatsHandler = async (ctx) => {
  try {
    const telegramId = ctx.from.id.toString();
    
    // Get user's referrals
    const result = await pool.query(
      `SELECT u.username, u.first_name, u.created_at 
       FROM users u 
       WHERE u.referred_by = (SELECT referral_code FROM users WHERE telegram_id = $1)
       ORDER BY u.created_at DESC
       LIMIT 10`,
      [telegramId]
    );
    
    if (result.rows.length === 0) {
      return ctx.reply("You don't have any referrals yet. Share your referral link with friends using /referral");
    }
    
    let message = "🔍 *Your Recent Referrals*\n\n";
    
    result.rows.forEach((referral, index) => {
      const username = referral.username ? `@${referral.username}` : referral.first_name;
      const date = new Date(referral.created_at).toLocaleDateString();
      message += `${index + 1}. ${username} - Joined on ${date}\n`;
    });
    
    message += "\nKeep sharing your referral link to earn more rewards!";
    
    await ctx.replyWithMarkdown(message);
    
  } catch (error) {
    console.error('Error in referralStatsHandler:', error);
    await ctx.reply('An error occurred while fetching your referral stats.');
  }
};

/**
 * Process a referral when a user joins through a referral link
 */
const processReferral = async (ctx, referralCode) => {
  try {
    const newUserId = ctx.from.id.toString();
    
    // Check if the referring user exists
    const referrerResult = await pool.query(
      'SELECT telegram_id FROM users WHERE referral_code = $1',
      [referralCode]
    );
    
    if (!referrerResult.rows[0]) {
      return false; // Invalid referral code
    }
    
    const referrerId = referrerResult.rows[0].telegram_id;
    
    // Prevent self-referrals
    if (referrerId === newUserId) {
      return false;
    }
    
    // Update new user with referral info
    await pool.query(
      'UPDATE users SET referred_by = $1 WHERE telegram_id = $2',
      [referralCode, newUserId]
    );
    
    // Update referrer stats and award bonus
    const referralBonus = parseInt(process.env.REFERRAL_BONUS || '50');
    await pool.query(
      `UPDATE users 
       SET referral_count = COALESCE(referral_count, 0) + 1,
           credits = COALESCE(credits, 0) + $1
       WHERE telegram_id = $2`,
      [referralBonus, referrerId]
    );
    
    // Award bonus to new user as well
    const newUserBonus = parseInt(process.env.NEW_USER_REFERRAL_BONUS || '25');
    await pool.query(
      'UPDATE users SET credits = COALESCE(credits, 0) + $1 WHERE telegram_id = $2',
      [newUserBonus, newUserId]
    );
    
    // Notify referrer
    ctx.telegram.sendMessage(
      referrerId,
      `🎉 *Referral Bonus!*\n\nSomeone just joined using your referral link. You earned ${referralBonus} credits!`,
      { parse_mode: 'Markdown' }
    );
    
    return true;
  } catch (error) {
    console.error('Error processing referral:', error);
    return false;
  }
};

module.exports = {
  referralHandler,
  referralStatsHandler,
  processReferral
};
