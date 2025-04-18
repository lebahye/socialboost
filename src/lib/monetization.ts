"use client";

import type { User } from './models/user';
import type { Campaign } from './models/campaign';
import { type SubscriptionPlan, SUBSCRIPTION_PLANS } from './models/payment';

/**
 * Calculate the reward amount for a user's campaign participation
 */
export function calculateReward(campaign: Campaign, isPremiumUser: boolean): number {
  const baseReward = campaign.reward;
  return isPremiumUser ? Math.floor(baseReward * 1.5) : baseReward;
}

/**
 * Calculate the amount of credits needed to cash out a specific amount
 */
export function calculateCreditsForCashout(amountUsd: number): number {
  return amountUsd * 100;
}

/**
 * Calculate USD value of credits
 */
export function calculateUsdValueOfCredits(credits: number): number {
  const conversionRate = 0.01; // 1 credit = $0.01 USD
  return credits * conversionRate;
}

/**
 * Calculate cashout commission based on amount
 */
export function calculateCashoutCommission(amount: number): number {
  const baseCommission = 0.05; // 5% base commission
  const minCommission = 1; // Minimum $1 commission

  const commission = amount * baseCommission;
  return Math.max(commission, minCommission);
}

/**
 * Check if user is eligible for cashout
 */
export function isEligibleForCashout(credits: number): boolean {
  const minCashoutCredits = 1000; // Minimum 1000 credits required
  return credits >= minCashoutCredits;
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

  const dailyFees = {
    basic: 2, // $2 per day
    featured: 5, // $5 per day
    viral: 10 // $10 per day
  };

  return baseFees[campaignType] + (dailyFees[campaignType] * duration);
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