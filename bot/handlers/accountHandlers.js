
const { verificationService } = require('../services/verification');

async function handleAccountLink(ctx) {
  try {
    const userId = ctx.from.id.toString();
    const platform = ctx.match[1]; // 'x' or 'discord'
    const username = ctx.match[2];
    
    // Generate verification code
    const verificationCode = require('crypto').randomBytes(3).toString('hex').toUpperCase();
    
    // Store verification attempt in database
    await ctx.reply(
      `🔵 *${platform.toUpperCase()} Account Verification*\n\n` +
      'To verify your account, please:\n\n' +
      `1. Send this verification code as a DM to @SCampaign49365:\n` +
      `\`${verificationCode}\`\n\n` +
      '2. Wait for confirmation\n\n' +
      'The code will expire in 30 minutes.',
      { parse_mode: 'Markdown' }
    );

    // Start verification process
    const result = await verificationService.verifyAccount(userId, platform, username, verificationCode);
    
    if (result.verified) {
      await ctx.reply('✅ Account verified successfully!');
    }
  } catch (error) {
    console.error('Error in handleAccountLink:', error);
    await ctx.reply('❌ An error occurred while linking your account. Please try again.');
  }
}

async function handleVerify(ctx) {
  try {
    const userId = ctx.from.id.toString();
    const user = await ctx.state.user;

    if (!user) {
      return ctx.reply('Please start the bot first with /start');
    }

    const verificationStatus = await verificationService.checkVerificationStatus(userId);
    await ctx.reply(verificationStatus);
  } catch (error) {
    console.error('Error in handleVerify:', error);
    await ctx.reply('❌ An error occurred while checking verification status.');
  }
}

module.exports = {
  handleAccountLink,
  handleVerify
};
