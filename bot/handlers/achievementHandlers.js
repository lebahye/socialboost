
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Define achievements
const achievements = [
  {
    id: 'first_campaign',
    name: 'Campaign Rookie',
    description: 'Complete your first campaign',
    reward: 50,
    icon: '🌱'
  },
  {
    id: 'verification_complete',
    name: 'Verified Identity',
    description: 'Verify all your social accounts',
    reward: 100,
    icon: '✅'
  },
  {
    id: 'five_campaigns',
    name: 'Campaign Enthusiast',
    description: 'Complete 5 campaigns',
    reward: 200,
    icon: '🌟'
  },
  {
    id: 'referral_master',
    name: 'Referral Master',
    description: 'Refer 3 friends who join the platform',
    reward: 250,
    icon: '🔗'
  },
  {
    id: 'premium_member',
    name: 'Premium Supporter',
    description: 'Become a premium member',
    reward: 300,
    icon: '👑'
  }
];

/**
 * Check and award achievements for a user
 */
const checkAchievements = async (userId, triggerType) => {
  try {
    // Get user data
    const userResult = await pool.query(
      `SELECT 
        telegram_id, 
        social_accounts, 
        is_premium, 
        referral_count,
        (SELECT COUNT(*) FROM campaigns c 
         WHERE c.participants::jsonb @> ANY(ARRAY[jsonb_build_object('telegram_id', $1)])) as campaigns_joined,
        achievements
      FROM users 
      WHERE telegram_id = $1`,
      [userId]
    );
    
    if (!userResult.rows[0]) return;
    
    const user = userResult.rows[0];
    const userAchievements = user.achievements ? 
      (typeof user.achievements === 'string' ? JSON.parse(user.achievements) : user.achievements) 
      : [];
    
    // Check each achievement
    const newAchievements = [];
    
    for (const achievement of achievements) {
      // Skip if already earned
      if (userAchievements.includes(achievement.id)) continue;
      
      // Check qualification
      let qualified = false;
      
      switch (achievement.id) {
        case 'first_campaign':
          qualified = user.campaigns_joined >= 1 && triggerType === 'campaign_complete';
          break;
        case 'verification_complete':
          const socialAccounts = typeof user.social_accounts === 'string' ? 
            JSON.parse(user.social_accounts) : user.social_accounts || [];
          qualified = socialAccounts.length >= 2 && 
                     socialAccounts.every(acc => acc.is_verified) && 
                     triggerType === 'account_verified';
          break;
        case 'five_campaigns':
          qualified = user.campaigns_joined >= 5 && triggerType === 'campaign_complete';
          break;
        case 'referral_master':
          qualified = (user.referral_count || 0) >= 3 && triggerType === 'referral_added';
          break;
        case 'premium_member':
          qualified = user.is_premium && triggerType === 'premium_activated';
          break;
      }
      
      if (qualified) {
        newAchievements.push(achievement);
        userAchievements.push(achievement.id);
      }
    }
    
    // If new achievements earned, update user
    if (newAchievements.length > 0) {
      // Update user achievements
      await pool.query(
        'UPDATE users SET achievements = $1 WHERE telegram_id = $2',
        [JSON.stringify(userAchievements), userId]
      );
      
      // Award credits
      const totalReward = newAchievements.reduce((sum, a) => sum + a.reward, 0);
      await pool.query(
        'UPDATE users SET credits = COALESCE(credits, 0) + $1 WHERE telegram_id = $2',
        [totalReward, userId]
      );
      
      return newAchievements;
    }
    
    return [];
  } catch (error) {
    console.error('Error checking achievements:', error);
    return [];
  }
};

/**
 * Notify user about new achievements
 */
const notifyAchievements = async (bot, userId, achievements) => {
  if (!achievements || achievements.length === 0) return;
  
  try {
    let message = '🏆 *Achievement Unlocked!* 🏆\n\n';
    
    achievements.forEach(achievement => {
      message += `${achievement.icon} *${achievement.name}*\n`;
      message += `${achievement.description}\n`;
      message += `Reward: ${achievement.reward} credits\n\n`;
    });
    
    const totalReward = achievements.reduce((sum, a) => sum + a.reward, 0);
    message += `Total credits earned: ${totalReward}\n`;
    message += `\nCheck /achievements to see all your earned achievements!`;
    
    await bot.telegram.sendMessage(userId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error notifying about achievements:', error);
  }
};

/**
 * Handler for achievements command
 */
const achievementsHandler = async (ctx) => {
  try {
    const telegramId = ctx.from.id.toString();
    
    // Get user achievements
    const result = await pool.query(
      'SELECT achievements, credits FROM users WHERE telegram_id = $1',
      [telegramId]
    );
    
    if (!result.rows[0]) {
      return ctx.reply('Please start the bot first with /start');
    }
    
    const user = result.rows[0];
    const userAchievements = user.achievements ? 
      (typeof user.achievements === 'string' ? JSON.parse(user.achievements) : user.achievements) 
      : [];
    
    let message = '🏆 *Your Achievements* 🏆\n\n';
    
    if (userAchievements.length === 0) {
      message += 'You haven\'t earned any achievements yet. Keep participating to unlock them!\n\n';
    } else {
      // Display earned achievements
      const earned = achievements.filter(a => userAchievements.includes(a.id));
      earned.forEach(achievement => {
        message += `${achievement.icon} *${achievement.name}*\n`;
        message += `${achievement.description}\n`;
        message += `Reward: ${achievement.reward} credits\n\n`;
      });
    }
    
    // Display available achievements
    const available = achievements.filter(a => !userAchievements.includes(a.id));
    if (available.length > 0) {
      message += '\n📋 *Available Achievements:*\n\n';
      available.forEach(achievement => {
        message += `🔒 *${achievement.name}*\n`;
        message += `${achievement.description}\n`;
        message += `Reward: ${achievement.reward} credits\n\n`;
      });
    }
    
    await ctx.replyWithMarkdown(message);
    
  } catch (error) {
    console.error('Error in achievementsHandler:', error);
    await ctx.reply('An error occurred while fetching your achievements.');
  }
};

module.exports = {
  achievements,
  checkAchievements,
  notifyAchievements,
  achievementsHandler
};
