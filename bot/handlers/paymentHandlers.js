
const { Pool } = require('pg');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_your_fallback_key');
const paypal = require('@paypal/checkout-server-sdk');
const { Markup } = require('telegraf');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// PayPal configuration
let paypalClient;
if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
  const environment = process.env.NODE_ENV === 'production'
    ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
    : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);
  paypalClient = new paypal.core.PayPalHttpClient(environment);
}

// Subscription plans
const SUBSCRIPTION_PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 19.99,
    features: [
      'Up to 3 projects',
      'Basic analytics',
      'Standard support'
    ],
    stripeId: process.env.STRIPE_BASIC_PLAN_ID
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 49.99,
    features: [
      'Unlimited projects',
      'Advanced analytics',
      'Priority support',
      '50% more rewards'
    ],
    stripeId: process.env.STRIPE_PRO_PLAN_ID
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99.99,
    features: [
      'Dedicated support manager',
      'Custom campaign types',
      'White-label option',
      'API access'
    ],
    stripeId: process.env.STRIPE_ENTERPRISE_PLAN_ID
  }
];

// Credit packages
const CREDIT_PACKAGES = [
  { id: 'small', name: 'Small', credits: 1000, price: 9.99 },
  { id: 'medium', name: 'Medium', credits: 3000, price: 24.99, bonus: 300 },
  { id: 'large', name: 'Large', credits: 10000, price: 74.99, bonus: 1500 }
];

/**
 * Premium subscription handler
 */
const premiumHandler = async (ctx) => {
  try {
    const userId = ctx.from.id.toString();
    
    // Get user info
    const userResult = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return ctx.reply('Please use /start first to register with the bot.');
    }
    
    const user = userResult.rows[0];
    const isPremium = user.is_premium === true;
    
    let message = `🌟 *SocialBoost Premium* 🌟\n\n`;
    
    if (isPremium) {
      const premiumUntil = new Date(user.premium_until);
      message += `You are currently on the Premium plan. Your subscription is active until ${premiumUntil.toDateString()}.\n\n`;
      message += `*Benefits you're enjoying:*\n`;
      message += `• Unlimited projects\n`;
      message += `• 50% bonus on all campaign rewards\n`;
      message += `• Priority verification\n`;
      message += `• Advanced analytics\n\n`;
      message += `Would you like to extend your subscription or upgrade your plan?`;
    } else {
      message += `Upgrade to Premium to unlock powerful features and maximize your earnings!\n\n`;
      message += `*Premium Benefits:*\n`;
      message += `• Unlimited projects\n`;
      message += `• 50% bonus on all campaign rewards\n`;
      message += `• Priority verification\n`;
      message += `• Advanced analytics\n\n`;
      message += `Plans starting at $19.99/month.`;
    }
    
    // Create payment button
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('View Premium Plans', 'premium_plans')],
      [Markup.button.callback('Buy Credits', 'buy_credits')],
      isPremium ? 
        Markup.button.callback('Manage Subscription', 'manage_premium') : 
        Markup.button.callback('Back to Menu', 'back_to_menu')
    ]);
    
    await ctx.reply(message, { 
      parse_mode: 'Markdown',
      ...keyboard
    });
  } catch (error) {
    console.error('Error in premium handler:', error);
    await ctx.reply('Sorry, there was an error processing your request. Please try again later.');
  }
};

/**
 * Show premium plans
 */
const premiumPlansHandler = async (ctx) => {
  try {
    const userId = ctx.from.id.toString();
    
    // Generate message with plan details
    let message = `🌟 *Premium Subscription Plans* 🌟\n\n`;
    
    const buttons = [];
    
    SUBSCRIPTION_PLANS.forEach(plan => {
      message += `*${plan.name} Plan - $${plan.price}/month*\n`;
      plan.features.forEach(feature => {
        message += `• ${feature}\n`;
      });
      message += `\n`;
      
      // Add button for each plan
      buttons.push([Markup.button.callback(`Subscribe to ${plan.name} - $${plan.price}`, `subscribe_${plan.id}`)]);
    });
    
    buttons.push([Markup.button.callback('Back', 'back_to_premium')]);
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.editMessageText(message, { 
      parse_mode: 'Markdown',
      ...keyboard
    });
  } catch (error) {
    console.error('Error in premium plans handler:', error);
    await ctx.reply('Sorry, there was an error processing your request. Please try again later.');
  }
};

/**
 * Display credit packages
 */
const buyCreditsHandler = async (ctx) => {
  try {
    let message = `💎 *Buy Credits* 💎\n\n`;
    message += `Credits can be used to create campaigns, verify projects, and more.\n\n`;
    
    const buttons = [];
    
    CREDIT_PACKAGES.forEach(pkg => {
      message += `*${pkg.name} Package - $${pkg.price}*\n`;
      message += `• ${pkg.credits.toLocaleString()} credits\n`;
      if (pkg.bonus) {
        message += `• ${pkg.bonus.toLocaleString()} bonus credits\n`;
      }
      message += `\n`;
      
      // Add button for each package
      buttons.push([
        Markup.button.callback(
          `Buy ${pkg.name} - $${pkg.price}`, 
          `credits_${pkg.id}`
        )
      ]);
    });
    
    buttons.push([Markup.button.callback('Back', 'back_to_premium')]);
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.editMessageText(message, { 
      parse_mode: 'Markdown',
      ...keyboard
    });
  } catch (error) {
    console.error('Error in buy credits handler:', error);
    
    // If this is a fresh request (not editing previous message)
    if (error.description && error.description.includes("message to edit not found")) {
      const message = `💎 *Buy Credits* 💎\n\nSorry, there was an error. Please use /premium to start over.`;
      await ctx.reply(message, { parse_mode: 'Markdown' });
      return;
    }
    
    await ctx.reply('Sorry, there was an error processing your request. Please try again later.');
  }
};

/**
 * Process subscription
 */
const subscribeHandler = async (ctx) => {
  try {
    const planId = ctx.match[1]; // From callback data: subscribe_basic, subscribe_pro, etc.
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    
    if (!plan) {
      return ctx.answerCbQuery('Invalid plan selected.');
    }
    
    const userId = ctx.from.id.toString();
    
    // Generate payment link (this would be your payment gateway integration)
    // Here we're just creating a placeholder
    
    const paymentMessage = `🔗 *Complete Your Payment*\n\n`;
    const paymentUrl = `https://example.com/payment?plan=${plan.id}&user=${userId}`;
    
    await ctx.editMessageText(
      `${paymentMessage}You've selected the *${plan.name} Plan* at $${plan.price}/month.\n\n` +
      `To complete your subscription, please click the link below to make your payment:\n\n` +
      `[Complete Payment](${paymentUrl})\n\n` +
      `After payment, your premium status will be activated instantly.`,
      { 
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        ...Markup.inlineKeyboard([
          [Markup.button.url('Pay Now', paymentUrl)],
          [Markup.button.callback('Back to Plans', 'premium_plans')]
        ])
      }
    );
  } catch (error) {
    console.error('Error in subscribe handler:', error);
    await ctx.reply('Sorry, there was an error processing your subscription. Please try again later.');
  }
};

/**
 * Process credit purchase
 */
const buyCreditsPackageHandler = async (ctx) => {
  try {
    const packageId = ctx.match[1]; // From callback data: credits_small, credits_medium, etc.
    const creditPackage = CREDIT_PACKAGES.find(p => p.id === packageId);
    
    if (!creditPackage) {
      return ctx.answerCbQuery('Invalid package selected.');
    }
    
    const userId = ctx.from.id.toString();
    
    // Generate payment link (this would be your payment gateway integration)
    // Here we're just creating a placeholder
    
    const paymentMessage = `🔗 *Complete Your Payment*\n\n`;
    const paymentUrl = `https://example.com/payment?package=${creditPackage.id}&user=${userId}`;
    
    await ctx.editMessageText(
      `${paymentMessage}You've selected the *${creditPackage.name} Package* at $${creditPackage.price}.\n\n` +
      `This includes ${creditPackage.credits.toLocaleString()} credits` + 
      (creditPackage.bonus ? ` plus ${creditPackage.bonus.toLocaleString()} bonus credits!` : '.') + `\n\n` +
      `To complete your purchase, please click the link below to make your payment:\n\n` +
      `[Complete Payment](${paymentUrl})\n\n` +
      `After payment, your credits will be added to your account instantly.`,
      { 
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        ...Markup.inlineKeyboard([
          [Markup.button.url('Pay Now', paymentUrl)],
          [Markup.button.callback('Back to Credit Packages', 'buy_credits')]
        ])
      }
    );
  } catch (error) {
    console.error('Error in buy credits package handler:', error);
    await ctx.reply('Sorry, there was an error processing your credit purchase. Please try again later.');
  }
};

/**
 * Cash out handler
 */
const cashoutHandler = async (ctx) => {
  try {
    const userId = ctx.from.id.toString();
    
    // Get user info
    const userResult = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return ctx.reply('Please use /start first to register with the bot.');
    }
    
    const user = userResult.rows[0];
    const credits = user.credits || 0;
    
    // Check if user is eligible for cashout (minimum 1000 credits)
    const minCashoutCredits = 1000;
    
    if (credits < minCashoutCredits) {
      return ctx.reply(
        `❌ *Insufficient Credits*\n\n` +
        `You need at least ${minCashoutCredits} credits to cash out. You currently have ${credits} credits.\n\n` +
        `Keep participating in campaigns to earn more credits!`,
        { parse_mode: 'Markdown' }
      );
    }
    
    // Calculate USD value (100 credits = $1)
    const usdValue = (credits / 100);
    
    // Calculate fees (5% fee)
    const feePercentage = 5;
    const fee = (usdValue * feePercentage) / 100;
    const finalAmount = usdValue - fee;
    
    await ctx.reply(
      `💰 *Cash Out Credits*\n\n` +
      `You have ${credits} credits available to cash out.\n\n` +
      `*Conversion:*\n` +
      `• Credits: ${credits}\n` +
      `• USD Value: $${usdValue.toFixed(2)}\n` +
      `• Fee (${feePercentage}%): $${fee.toFixed(2)}\n` +
      `• Final Amount: $${finalAmount.toFixed(2)}\n\n` +
      `To cash out, please use the /cashout_confirm command.\n\n` +
      `*Note:* You'll need to provide payment information for the transfer.`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Error in cashout handler:', error);
    await ctx.reply('Sorry, there was an error processing your cashout request. Please try again later.');
  }
};

// Register handlers
const registerPaymentHandlers = (bot) => {
  // Command handlers
  bot.command('premium', premiumHandler);
  bot.command('cashout', cashoutHandler);
  
  // Callback handlers
  bot.action('premium_plans', premiumPlansHandler);
  bot.action('buy_credits', buyCreditsHandler);
  bot.action('back_to_premium', premiumHandler);
  bot.action(/subscribe_(.+)/, subscribeHandler);
  bot.action(/credits_(.+)/, buyCreditsPackageHandler);
};

module.exports = {
  registerPaymentHandlers
};
