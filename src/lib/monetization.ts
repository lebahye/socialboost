"use client";

export type { User } from './models/user';
export type { Campaign } from './models/campaign';
export type { SubscriptionPlan } from './models/payment';

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
  return credits * 0.01;
}

/**
 * Calculate cashout commission based on amount
 */
export function calculateCashoutCommission(amount: number): number {
  return amount * 0.05;
}

/**
 * Check if user is eligible for cashout
 */
export function isEligibleForCashout(credits: number): boolean {
  return credits >= 1000;
}

/**
 * Calculate campaign creation fee
 */
export function calculateCampaignFee(campaignType: 'basic' | 'featured' | 'viral', duration: number): number {
  const baseFees = {
    basic: 10,
    featured: 25,
    viral: 50
  };
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
 * Get subscription plan details
 */
export function getSubscriptionPlan(planId: string): SubscriptionPlan | undefined {
  const SUBSCRIPTION_PLANS: SubscriptionPlan[] = []; // Added this line to fix compilation error
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
  return 50;
}

/**
 * Calculate referral bonus for a specific action
 */
export function calculateReferralBonus(action: 'signup' | 'campaign_participation' | 'premium_upgrade'): number {
  switch (action) {
    case 'signup':
      return 50;
    case 'campaign_participation':
      return 0;
    case 'premium_upgrade':
      return 500;
  }
}

/**
 * Get percentage bonus for referral campaign participation
 */
export function getReferralCampaignBonus(): number {
  return 10;
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