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
      '🔍 *Are you a community member or a project owner?*\n\n' +
      '• Community members can participate in campaigns and earn rewards.\n' +
      '• Project owners can create campaigns to promote their projects.\n\n' +
      'Please select:',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Community Member', callback_data: 'type_member' }],
            [{ text: 'Project Owner', callback_data: 'type_project' }]
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

      const isProjectOwner = ctx.callbackQuery.data === 'type_project';
      await ctx.answerCbQuery();

      const { telegramId, username, firstName, lastName } = ctx.session.registrationData;

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
        [telegramId, username, firstName, lastName, isProjectOwner]
      );

      if (result.rows[0]) {
        const welcomeMsg = isProjectOwner
          ? '✅ Registration complete! You can now:\n\n' +
            '• Create projects with /newproject\n' +
            '• Launch campaigns with /newcampaign\n' +
            '• View analytics with /analytics\n\n' +
            'Start by creating your first project with /newproject'
          : '✅ Registration complete! You can now:\n\n' +
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