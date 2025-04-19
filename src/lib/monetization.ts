"use client";

import type { User } from './models/user';
import type { Campaign } from './models/campaign';
import { type SubscriptionPlan, SUBSCRIPTION_PLANS } from './models/payment';
import type { PaymentMethod } from './models/payment';

/**
 * Calculate the reward amount for a user's campaign participation
 */
export function calculateReward(campaign: Campaign, isPremiumUser: boolean): number {
  const baseReward = campaign.reward;
  return isPremiumUser ? Math.floor(baseReward * 1.5) : baseReward;
}

/**
 * Calculate USD value of credits
 */
export function calculateUsdValueOfCredits(credits: number): number {
  // 1 credit = $0.01 USD
  return credits * 0.01;
}

/**
 * Calculate cashout commission based on amount
 */
export function calculateCashoutCommission(amount: number): number {
  // 5% commission on cashouts
  return amount * 0.05;
}

/**
 * Check if user is eligible for cashout
 */
export function isEligibleForCashout(credits: number): boolean {
  // Minimum 1000 credits ($10) for cashout
  return credits >= 1000;
}

/**
 * Calculate campaign creation fee
 */
export function calculateCampaignFee(campaignType: 'basic' | 'featured' | 'viral', duration: number): number {
  const baseFees = {
    basic: 10, // $10 base fee
    featured: 25, // $25 base fee
    viral: 50 // $50 base fee
  };

  // Add $5 per day after first day
  const extraDays = Math.max(0, duration - 1);
  return baseFees[campaignType] + (extraDays * 5);
}

export function calculateRewardPoints(engagement: {
  likes?: number;
  retweets?: number;
  comments?: number;
}): number {
  return (
    (engagement.likes || 0) * 1 +
    (engagement.retweets || 0) * 2 +
    (engagement.comments || 0) * 3
  );
}

/**
 * Check if user is eligible for cashout
 */
export function isEligibleForCashoutOld(user: User, minCredits = 1000): {
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
 * Calculate project verification fee
 */
export function calculateProjectVerificationFee(): number {
  return 50; // $50 one-time fee for project verification
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

/**
 * Calculate premium subscription cost
 */
export function calculatePremiumCost(plan: 'monthly' | 'yearly'): number {
  const prices = {
    monthly: 9.99,
    yearly: 99.99
  };

  return prices[plan];
}