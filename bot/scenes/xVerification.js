const { Scenes } = require('telegraf');
const verificationService = require('../services/verification');
const User = require('../models/User');

/**
 * Scene for verifying X (Twitter) accounts
 */
const xVerificationScene = new Scenes.WizardScene(
  'X_VERIFICATION',
  // Step 1: Explain verification process
  async (ctx) => {
    await ctx.reply(
      '🔵 *X (Twitter) Account Verification*\n\n' +
      'Verifying your X account allows you to participate in campaigns that require X engagement.\n\n' +
      'Here\'s how verification works:\n\n' +
      '1. You send a specific code in a direct message to our verification bot on X\n' +
      '2. Our system checks that the message was sent from your account\n' +
      '3. Your account gets verified and linked to your Telegram profile\n\n' +
      '➡️ Do you already have your verification code? Send \"yes\" if you have it, or \"no\" if you need a new one.',
      { parse_mode: 'Markdown' }
    );

    // Initialize scene state
    ctx.wizard.state.verificationData = {};

    return ctx.wizard.next();
  },

  // Step 2: Check if user has code or needs to generate one
  async (ctx) => {
    const response = ctx.message.text.trim().toLowerCase();

    if (response === 'yes') {
      // User has a code, ask for it
      await ctx.reply(
        'Great! Please enter your verification code:',
      );
      ctx.wizard.state.hasCode = true;
      return ctx.wizard.next();
    } else if (response === 'no') {
      // User needs a code, check if they have a linked account
      const user = ctx.state.user;
      const xAccount = user.socialAccounts.find(acc => acc.platform === 'x');

      if (!xAccount) {
        await ctx.reply(
          'You need to link your X account first before verifying it.\n\n' +
          'Please use the /link command to link your X account.'
        );
        return ctx.scene.leave();
      }

      // Check if code is expired or doesn't exist
      if (!xAccount.verificationCode ||
          !xAccount.verificationExpiry ||
          xAccount.verificationExpiry < new Date()) {
        // Generate new verification code
        const crypto = require('crypto');
        const verificationCode = crypto.randomBytes(3).toString('hex').toUpperCase();

        // Update account with new code
        xAccount.verificationCode = verificationCode;
        xAccount.verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        await user.save();
      }

      // Display the verification code instructions
      await ctx.reply(
        `📱 *X Verification Instructions*\n\n` +
        `1. Log in to your X account: @${xAccount.username}\n` +
        `2. Send a direct message to @ProjectVerifierBot with this code:\n\n` +
        `\`${xAccount.verificationCode}\`\n\n` +
        `3. After sending the DM, come back here and type "check" to verify your account.\n\n` +
        `The code will expire in 24 hours.`,
        { parse_mode: 'Markdown' }
      );

      ctx.wizard.state.hasCode = false;
      ctx.wizard.state.verificationData.username = xAccount.username;
      ctx.wizard.state.verificationData.code = xAccount.verificationCode;

      return ctx.wizard.next();
    } else {
      // Invalid response
      await ctx.reply('Please reply with "yes" or "no".');
      return; // Stay on the same step
    }
  },

  // Step 3: Process verification code or check status
  async (ctx) => {
    const user = ctx.state.user;
    const input = ctx.message.text.trim();

    if (ctx.wizard.state.hasCode) {
      // User entered their verification code, try to find if it matches any account
      const verificationCode = input.toUpperCase();

      // Find the account with this verification code
      const accountToVerify = user.socialAccounts.find(
        acc => acc.platform === 'x' && acc.verificationCode === verificationCode
      );

      if (!accountToVerify) {
        await ctx.reply(
          '❌ Invalid verification code. Please make sure you entered the correct code.\n\n' +
          'If you need a new code, please use the /link command again.'
        );
        return ctx.scene.leave();
      }

      // Check if code is expired
      if (accountToVerify.verificationExpiry < new Date()) {
        await ctx.reply(
          '⚠️ This verification code has expired.\n\n' +
          'Please use the /link command to generate a new verification code.'
        );
        return ctx.scene.leave();
      }

      // Code is valid, proceed with verification process
      ctx.wizard.state.verificationData.username = accountToVerify.username;
      ctx.wizard.state.verificationData.code = verificationCode;

      await ctx.reply(
        `📱 *X Verification Instructions*\n\n` +
        `1. Log in to your X account: @${accountToVerify.username}\n` +
        `2. Send a direct message to @ProjectVerifierBot with this code:\n\n` +
        `\`${verificationCode}\`\n\n` +
        `3. After sending the DM, come back here and type "check" to verify your account.`,
        { parse_mode: 'Markdown' }
      );

      return ctx.wizard.next();
    } else {
      // User should type "check" to verify
      if (input.toLowerCase() === 'check') {
        // Try to verify the account
        const isVerified = await verificationService.verifyXAccount(
          ctx.wizard.state.verificationData.username,
          ctx.wizard.state.verificationData.code
        );

        if (isVerified) {
          // Update user account as verified
          const xAccount = user.socialAccounts.find(
            acc => acc.platform === 'x' &&
            acc.username === ctx.wizard.state.verificationData.username
          );

          if (xAccount) {
            xAccount.isVerified = true;
            await user.save();

            await ctx.reply(
              '✅ *Verification Successful!*\n\n' +
              `Your X account @${xAccount.username} has been verified and linked to your Telegram account.\n\n` +
              'You can now participate in campaigns that require X engagement.',
              { parse_mode: 'Markdown' }
            );
          } else {
            await ctx.reply('❌ Error finding your account. Please contact support.');
          }
        } else {
          await ctx.reply(
            '❌ Verification failed. We couldn\'t find a direct message with your verification code.\n\n' +
            'Please make sure you:\n' +
            '1. Sent the exact code to @ProjectVerifierBot\n' +
            '2. Sent it from the correct account\n\n' +
            'You can try again by typing "check" or use /link to generate a new code.'
          );
          return; // Stay on the same step
        }
      } else {
        await ctx.reply('Please type "check" when you\'ve sent the verification code via DM.');
        return; // Stay on the same step
      }
    }

    return ctx.scene.leave();
  },

  // Step 4: Handle verification check
  async (ctx) => {
    const input = ctx.message.text.trim().toLowerCase();

    if (input === 'check') {
      // Try to verify the account
      const isVerified = await verificationService.verifyXAccount(
        ctx.wizard.state.verificationData.username,
        ctx.wizard.state.verificationData.code
      );

      const user = ctx.state.user;

      if (isVerified) {
        // Update user account as verified
        const xAccount = user.socialAccounts.find(
          acc => acc.platform === 'x' &&
          acc.username === ctx.wizard.state.verificationData.username
        );

        if (xAccount) {
          xAccount.isVerified = true;
          await user.save();

          await ctx.reply(
            '✅ *Verification Successful!*\n\n' +
            `Your X account @${xAccount.username} has been verified and linked to your Telegram account.\n\n` +
            'You can now participate in campaigns that require X engagement.',
            { parse_mode: 'Markdown' }
          );
        } else {
          await ctx.reply('❌ Error finding your account. Please contact support.');
        }
      } else {
        await ctx.reply(
          '❌ Verification failed. We couldn\'t find a direct message with your verification code.\n\n' +
          'Please make sure you:\n' +
          '1. Sent the exact code to @ProjectVerifierBot\n' +
          '2. Sent it from the correct account\n\n' +
          'You can try again by typing "check" or use /link to generate a new code.'
        );
        return; // Stay on the same step
      }
    } else {
      await ctx.reply('Please type "check" when you\'ve sent the verification code via DM.');
      return; // Stay on the same step
    }

    return ctx.scene.leave();
  }
);

// Add middleware to handle exit command
xVerificationScene.command('cancel', async (ctx) => {
  await ctx.reply('X verification process cancelled. You can restart it at any time with the /verify command.');
  return ctx.scene.leave();
});

module.exports = {
  xVerificationScene
};
