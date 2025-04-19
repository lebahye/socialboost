
const { Scenes } = require('telegraf');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const userRegistrationScene = new Scenes.WizardScene(
  'USER_REGISTRATION',
  // Step 1: Ask about user type
  async (ctx) => {
    await ctx.reply(
      '🔍 *Welcome to Registration!*\n\n' +
      'Please select your account type:\n\n' +
      '👥 *Community Member*\n' +
      '• Participate in campaigns\n' +
      '• Earn rewards\n' +
      '• Track your earnings\n\n' +
      '👑 *Project Owner*\n' +
      '• Create and manage projects\n' +
      '• Launch campaigns\n' +
      '• Access analytics\n',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '👥 Community Member', callback_data: 'type_member' }],
            [{ text: '👑 Project Owner', callback_data: 'type_owner' }]
          ]
        }
      }
    );
    return ctx.wizard.next();
  },
  // Step 2: Process user type and complete registration
  async (ctx) => {
    try {
      if (!ctx.callbackQuery) {
        await ctx.reply('Please select an option using the buttons above.');
        return;
      }

      const isProjectOwner = ctx.callbackQuery.data === 'type_owner';
      await ctx.answerCbQuery();

      const { id, username, first_name, last_name } = ctx.from;

      // Insert user into database
      const result = await pool.query(
        `INSERT INTO users (
          telegram_id, 
          username, 
          first_name, 
          last_name,
          is_project_owner,
          is_verified,
          credits,
          social_accounts,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, false, 0, '[]', NOW())
        RETURNING *`,
        [id.toString(), username, first_name, last_name, isProjectOwner]
      );

      if (result.rows[0]) {
        const welcomeMsg = isProjectOwner
          ? '✅ *Registration Complete!*\n\n' +
            'As a Project Owner, you can:\n' +
            '• Create projects with /newproject\n' +
            '• Launch campaigns with /newcampaign\n' +
            '• View analytics with /analytics\n\n' +
            'Start by creating your first project with /newproject'
          : '✅ *Registration Complete!*\n\n' +
            'As a Community Member, you can:\n' +
            '• Browse campaigns with /campaigns\n' +
            '• Link social accounts with /link\n' +
            '• Track earnings with /status\n\n' +
            'Start by browsing available campaigns with /campaigns';

        await ctx.editMessageText(welcomeMsg, { parse_mode: 'Markdown' });
      } else {
        throw new Error('Failed to create user');
      }

      return ctx.scene.leave();
    } catch (error) {
      console.error('Error in registration:', error);
      await ctx.reply('An error occurred during registration. Please try again with /register');
      return ctx.scene.leave();
    }
  }
);

// Handle scene errors
userRegistrationScene.on('error', async (ctx) => {
  console.error('Error in registration scene:', ctx.scene.state.error);
  await ctx.reply('An error occurred during registration. Please try again with /register');
  return ctx.scene.leave();
});

module.exports = { userRegistrationScene };
