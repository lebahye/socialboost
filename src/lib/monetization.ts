import type { User } from './models/user';
import type { Campaign } from './models/campaign';
import { type SubscriptionPlan, SUBSCRIPTION_PLANS } from './models/payment';

/**
 * Calculate the reward amount for a user's campaign participation
 */
export function calculateReward(campaign: Campaign, isPremiumUser: boolean): number {
  const baseReward = campaign.reward;

  // Premium users get 50% bonus on all campaign rewards
  return isPremiumUser ? Math.floor(baseReward * 1.5) : baseReward;
}

/**
 * Calculate the amount of credits needed to cash out a specific amount
 */
export function calculateCreditsForCashout(amountUsd: number): number {
  // 1000 credits = $10
  return amountUsd * 100;
}

/**
 * Calculate USD value of credits
 */
export function calculateUsdValueOfCredits(credits: number): number {
  // 1000 credits = $10
  return (credits / 100) * 1;
}

/**
 * Calculate commission on cash-outs
 */
export function calculateCashoutCommission(amountUsd: number, commissionPercentage = 5): number {
  return (amountUsd * commissionPercentage) / 100;
}

/**
 * Check if user is eligible for cashout
 */
export function isEligibleForCashout(user: User, minCredits = 1000): {
  eligible: boolean;
  reason?: string;
} {
  if (user.credits < minCredits) {
    return {
      eligible: false,
      reason: `You need at least ${minCredits} credits to cash out`
    };
  }

  if (!user.isVerified) {
    return {
      eligible: false,
      reason: 'Your account must be verified to cash out'
    };
  }

  return { eligible: true };
}

/**
 * Get subscription plan details
 */
export function getSubscriptionPlan(planId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
}

/**
 * Calculate subscription end date based on plan
 */
export function calculateSubscriptionEndDate(planId: string, startDate = new Date()): Date {
  const plan = getSubscriptionPlan(planId);
  const endDate = new Date(startDate);

  if (plan?.interval === 'monthly') {
    endDate.setMonth(endDate.getMonth() + 1);
  } else if (plan?.interval === 'yearly') {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }

  return endDate;
}

/**
 * Calculate referral bonus for a specific action
 */
export function calculateReferralBonus(action: 'signup' | 'campaign_participation' | 'premium_upgrade'): number {
  switch (action) {
    case 'signup':
      return 50; // 50 credits for each new member
    case 'campaign_participation':
      return 0; // Will be calculated as 10% of the campaign reward
    case 'premium_upgrade':
      return 500; // 500 bonus credits when referrals upgrade to premium
  }
}

/**
 * Get percentage bonus for referral campaign participation
 */
export function getReferralCampaignBonus(): number {
  return 10; // 10% of their referrals' campaign rewards
}
