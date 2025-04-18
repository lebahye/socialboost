
/**
 * Utility functions for monetization features
 */

/**
 * Calculate project verification fee
 * @returns {number} The fee amount in USD
 */
function calculateProjectVerificationFee() {
  return 50; // $50 one-time fee for project verification
}

/**
 * Calculate campaign creation fee
 * @param {string} campaignType - The type of campaign (basic, featured, viral)
 * @param {number} duration - Campaign duration in days
 * @returns {number} The fee amount in USD
 */
function calculateCampaignFee(campaignType, duration) {
  const baseFees = {
    basic: 10, // $10 base fee
    featured: 25, // $25 base fee
    viral: 50 // $50 base fee
  };
  
  // Longer campaigns cost more (additional $2 per day after 7 days)
  const extraDaysFee = Math.max(0, duration - 7) * 2;
  
  return baseFees[campaignType] + extraDaysFee;
}

/**
 * Calculate USD value of credits
 * @param {number} credits - Number of credits
 * @returns {number} USD value
 */
function calculateUsdValueOfCredits(credits) {
  // 1000 credits = $10
  return (credits / 100);
}

/**
 * Calculate commission on cash-outs
 * @param {number} amountUsd - Amount in USD
 * @param {number} commissionPercentage - Commission percentage (default: 5%)
 * @returns {number} Commission amount
 */
function calculateCashoutCommission(amountUsd, commissionPercentage = 5) {
  return (amountUsd * commissionPercentage) / 100;
}

module.exports = {
  calculateProjectVerificationFee,
  calculateCampaignFee,
  calculateUsdValueOfCredits,
  calculateCashoutCommission
};
