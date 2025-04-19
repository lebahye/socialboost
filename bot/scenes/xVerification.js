const { Scenes } = require('telegraf');
const { verifyXAccount } = require('../services/verification');

const xVerificationScene = new Scenes.WizardScene(
  'X_VERIFICATION',
  // Step 1: Initialize verification
  async (ctx) => {
    try {
      const userId = ctx.from.id.toString();
      const user = await ctx.state.user;

      if (!user) {
        await ctx.reply('Please start the bot first with /start');
        return ctx.scene.leave();
      }

      const xAccount = user.social_accounts?.find(acc => acc.platform === 'x');
      if (!xAccount) {
        await ctx.reply(
          'You need to link your X account first.\n' +
          'Use /link to connect your X account.'
        );
        return ctx.scene.leave();
      }

      ctx.scene.state.verification = {
        username: xAccount.username,
        code: require('crypto').randomBytes(3).toString('hex').toUpperCase()
      };

      await ctx.reply(
        '🔵 *X Account Verification*\n\n' +
        'To verify your X account, please:\n\n' +
        '1. Post a tweet with this verification code:\n' +
        `\`${ctx.scene.state.verification.code}\`\n\n` +
        '2. Make sure your account is public\n' +
        '3. After posting, click the "Check Verification" button below\n\n' +
        'The code will expire in 15 minutes.',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: 'Check Verification', callback_data: 'check_verification' }
            ]]
          }
        }
      );

      return ctx.wizard.next();
    } catch (error) {
      console.error('Error in verification step 1:', error);
      await ctx.reply('An error occurred. Please try again later.');
      return ctx.scene.leave();
    }
  },

  // Step 2: Handle verification check
  async (ctx) => {
    try {
      if (!ctx.callbackQuery || ctx.callbackQuery.data !== 'check_verification') {
        return;
      }

      const { username, code } = ctx.scene.state.verification;
      const isVerified = await verifyXAccount(username, code);

      if (isVerified) {
        const user = ctx.state.user;
        const xAccount = user.social_accounts.find(acc => acc.platform === 'x');

        if (xAccount) {
          xAccount.is_verified = true;
          xAccount.verified_at = new Date();
          await user.save();
        }

        await ctx.reply(
          '✅ *Verification Successful!*\n\n' +
          `Your X account @${username} has been verified.\n` +
          'You can now participate in campaigns that require X engagement.',
          { parse_mode: 'Markdown' }
        );
      } else {
        await ctx.reply(
          '❌ Verification failed. Please make sure:\n\n' +
          '1. You posted the tweet with the exact verification code\n' +
          '2. Your account is public\n' +
          '3. You\'re verifying the correct account\n\n' +
          'Try again with /verify or generate a new code with /link'
        );
      }

      return ctx.scene.leave();
    } catch (error) {
      console.error('Error in verification step 2:', error);
      await ctx.reply('An error occurred during verification. Please try again.');
      return ctx.scene.leave();
    }
  }
);

// Add middleware for timeout
xVerificationScene.use(async (ctx, next) => {
  const MAX_VERIFICATION_TIME = 15 * 60 * 1000; // 15 minutes
  const sceneStartTime = ctx.scene.state.startTime || Date.now();

  if (!ctx.scene.state.startTime) {
    ctx.scene.state.startTime = sceneStartTime;
  }

  if (Date.now() - sceneStartTime > MAX_VERIFICATION_TIME) {
    await ctx.reply('Verification timeout. Please start again with /verify');
    return ctx.scene.leave();
  }

  return next();
});

module.exports = xVerificationScene;