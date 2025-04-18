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
 * Functions to check for achievements
 */
const checkAchievements = async (userId) => {
  // Implementation of achievement checking logic
  try {
    // Get user data
    const { rows } = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [userId]);

    if (!rows.length) return [];

    const user = rows[0];

    // Existing achievements
    const userAchievements = user.achievements || [];
    const newAchievements = [];

    // Check for first campaign achievement
    if (user.campaigns_completed >= 1) {
      const firstCampaignAchievement = {
        id: 'first_campaign',
        name: 'First Campaign',
        description: 'Completed your first campaign',
        icon: '🎯',
        reward: 50,
        earned_at: new Date()
      };

      if (!userAchievements.some(a => a.id === 'first_campaign')) {
        newAchievements.push(firstCampaignAchievement);
      }
    }

    // If new achievements earned, update user record
    if (newAchievements.length > 0) {
      const updatedAchievements = [...userAchievements, ...newAchievements];

      // Update credits
      const totalRewards = newAchievements.reduce((sum, a) => sum + a.reward, 0);
      const newCredits = (user.credits || 0) + totalRewards;

      // Update user record
      await pool.query(
        'UPDATE users SET achievements = $1, credits = $2 WHERE telegram_id = $3',
        [JSON.stringify(updatedAchievements), newCredits, userId]
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

// Export all functions that need to be accessible from other files
module.exports = {
  achievementsHandler,
  notifyAchievements,
  checkAchievements
};