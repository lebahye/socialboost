
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

/**
 * Service for handling payments and monetization
 */
class PaymentService {
  constructor() {
    this.bot = null;
  }

  /**
   * Set the bot instance for sending notifications
   */
  setBot(bot) {
    this.bot = bot;
  }

  /**
   * Process a successful payment from Stripe
   */
  async processStripePayment(event) {
    try {
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        // Get customer and metadata
        const customerId = session.customer;
        const metadata = session.metadata || {};
        const userId = metadata.telegramId;
        const paymentType = metadata.type; // 'subscription' or 'credits'
        const planId = metadata.planId;
        const packageId = metadata.packageId;
        
        if (!userId) {
          console.error('No userId found in payment metadata');
          return { success: false, error: 'No user ID in metadata' };
        }
        
        if (paymentType === 'subscription') {
          await this.processSubscriptionPayment(userId, planId);
        } else if (paymentType === 'credits') {
          await this.processCreditsPurchase(userId, packageId);
        }
        
        return { success: true };
      }
      
      return { success: true, message: 'Event type not handled' };
    } catch (error) {
      console.error('Error processing Stripe payment:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Process a subscription payment
   */
  async processSubscriptionPayment(userId, planId) {
    try {
      // Get plan details
      const plans = {
        'basic': { name: 'Basic', durationMonths: 1 },
        'pro': { name: 'Professional', durationMonths: 1 },
        'enterprise': { name: 'Enterprise', durationMonths: 1 }
      };
      
      const plan = plans[planId];
      if (!plan) {
        throw new Error(`Invalid plan ID: ${planId}`);
      }
      
      // Update user's premium status
      const now = new Date();
      const premiumUntil = new Date();
      premiumUntil.setMonth(now.getMonth() + plan.durationMonths);
      
      // Query user's current premium status
      const userResult = await pool.query(
        'SELECT premium_until FROM users WHERE telegram_id = $1',
        [userId]
      );
      
      // If user already has premium, extend it from the current end date
      if (userResult.rows.length > 0 && userResult.rows[0].premium_until) {
        const currentPremiumUntil = new Date(userResult.rows[0].premium_until);
        if (currentPremiumUntil > now) {
          premiumUntil.setMonth(currentPremiumUntil.getMonth() + plan.durationMonths);
        }
      }
      
      // Update the database
      await pool.query(
        'UPDATE users SET is_premium = true, premium_until = $1, plan_id = $2 WHERE telegram_id = $3',
        [premiumUntil, planId, userId]
      );
      
      // Send confirmation notification to user
      if (this.bot) {
        await this.bot.telegram.sendMessage(
          userId,
          `🌟 *Premium Subscription Activated!* 🌟\n\n` +
          `Thank you for subscribing to our ${plan.name} plan. Your premium benefits are now active until ${premiumUntil.toDateString()}.\n\n` +
          `Enjoy all the premium features:\n` +
          `• Unlimited projects\n` +
          `• 50% bonus on all campaign rewards\n` +
          `• Priority verification\n` +
          `• Advanced analytics\n\n` +
          `If you have any questions, use /help to see available commands.`,
          { parse_mode: 'Markdown' }
        );
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error processing subscription payment:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Process a credits purchase
   */
  async processCreditsPurchase(userId, packageId) {
    try {
      // Define credit packages
      const packages = {
        'small': { credits: 1000, bonus: 0 },
        'medium': { credits: 3000, bonus: 300 },
        'large': { credits: 10000, bonus: 1500 }
      };
      
      const pkg = packages[packageId];
      if (!pkg) {
        throw new Error(`Invalid package ID: ${packageId}`);
      }
      
      const totalCredits = pkg.credits + pkg.bonus;
      
      // Update user's credits
      await pool.query(
        'UPDATE users SET credits = credits + $1 WHERE telegram_id = $2',
        [totalCredits, userId]
      );
      
      // Get updated user info
      const userResult = await pool.query(
        'SELECT credits FROM users WHERE telegram_id = $1',
        [userId]
      );
      
      const currentCredits = userResult.rows[0]?.credits || totalCredits;
      
      // Send confirmation notification to user
      if (this.bot) {
        await this.bot.telegram.sendMessage(
          userId,
          `💎 *Credits Added to Your Account!* 💎\n\n` +
          `Thank you for your purchase. We've added ${totalCredits.toLocaleString()} credits to your account:\n\n` +
          `• Base credits: ${pkg.credits.toLocaleString()}\n` +
          (pkg.bonus > 0 ? `• Bonus credits: ${pkg.bonus.toLocaleString()}\n` : '') +
          `• Total credits added: ${totalCredits.toLocaleString()}\n\n` +
          `Your current balance is ${currentCredits.toLocaleString()} credits.\n\n` +
          `You can use these credits to create campaigns, verify projects, and more.`,
          { parse_mode: 'Markdown' }
        );
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error processing credits purchase:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Process a cash-out request
   */
  async processCashoutRequest(userId, amount) {
    try {
      // Get user info
      const userResult = await pool.query(
        'SELECT credits, is_verified FROM users WHERE telegram_id = $1',
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        return { success: false, error: 'User not found' };
      }
      
      const user = userResult.rows[0];
      const credits = user.credits || 0;
      const isVerified = user.is_verified || false;
      
      // Check minimum cashout amount (1000 credits = $10)
      const minCashoutCredits = 1000;
      
      if (credits < minCashoutCredits) {
        return { 
          success: false, 
          error: `Insufficient credits. Minimum ${minCashoutCredits} credits required for cashout.` 
        };
      }
      
      // Check if user is verified
      if (!isVerified) {
        return { 
          success: false, 
          error: 'Account not verified. Please verify your account before cashing out.' 
        };
      }
      
      // If amount is not specified, use all available credits
      const cashoutCredits = amount || credits;
      
      // Check if requested amount is valid
      if (cashoutCredits > credits) {
        return { 
          success: false, 
          error: `Insufficient credits. You requested ${cashoutCredits} but have only ${credits} available.` 
        };
      }
      
      // Calculate USD value (100 credits = $1)
      const usdValue = (cashoutCredits / 100);
      
      // Calculate fees (5% fee)
      const feePercentage = 5;
      const fee = (usdValue * feePercentage) / 100;
      const finalAmount = usdValue - fee;
      
      // Create cashout record
      await pool.query(
        `INSERT INTO cashouts (
          user_id, amount_credits, amount_usd, fee_percentage, fee_amount, final_amount, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, cashoutCredits, usdValue, feePercentage, fee, finalAmount, 'pending']
      );
      
      // Deduct credits from user
      await pool.query(
        'UPDATE users SET credits = credits - $1 WHERE telegram_id = $2',
        [cashoutCredits, userId]
      );
      
      // In a real implementation, you would initiate the payout to the user's payment method
      // This might involve calling Stripe, PayPal, or another payment gateway API
      
      // Send confirmation notification to user
      if (this.bot) {
        await this.bot.telegram.sendMessage(
          userId,
          `💸 *Cash-Out Request Received* 💸\n\n` +
          `We've received your cash-out request for ${cashoutCredits.toLocaleString()} credits.\n\n` +
          `*Details:*\n` +
          `• Credits: ${cashoutCredits.toLocaleString()}\n` +
          `• USD Value: $${usdValue.toFixed(2)}\n` +
          `• Fee (${feePercentage}%): $${fee.toFixed(2)}\n` +
          `• Final Amount: $${finalAmount.toFixed(2)}\n\n` +
          `Your request is being processed and payment will be sent to your registered payment method soon.\n\n` +
          `You'll receive another notification when the payment is complete.`,
          { parse_mode: 'Markdown' }
        );
      }
      
      return { 
        success: true, 
        credits: cashoutCredits,
        usdValue: usdValue,
        fee: fee,
        finalAmount: finalAmount
      };
    } catch (error) {
      console.error('Error processing cashout request:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
const paymentService = new PaymentService();

module.exports = {
  paymentService
};
