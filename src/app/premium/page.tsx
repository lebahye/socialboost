"use client";

import React from 'react';
import { PremiumPlans } from '@/components/dashboard/PremiumPlans';
import type { PaymentMethod } from '@/lib/models/payment';

export default function PremiumPage() {
  // Mock user data
  const isPremium = false;
  const premiumUntil = undefined;
  const currentPlan = undefined;

  const handleSelectPlan = (planId: string, paymentMethod: PaymentMethod) => {
    console.log('Plan selected:', { planId, paymentMethod });
    alert(`Selected ${planId} plan with ${paymentMethod} payment method`);
    // In a real implementation, this would redirect to payment processing
  };

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <header className="text-center mb-10">
        <h1 className="text-4xl font-extrabold mb-2">Upgrade to Premium</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Boost your earnings and unlock exclusive benefits with a premium membership
        </p>
      </header>

      <div className="mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4 text-xl">
              50%
            </div>
            <h3 className="text-lg font-semibold mb-2">Reward Boost</h3>
            <p className="text-sm text-muted-foreground">
              Earn 50% more credits on every campaign participation
            </p>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4 text-xl">
              🌟
            </div>
            <h3 className="text-lg font-semibold mb-2">Exclusive Campaigns</h3>
            <p className="text-sm text-muted-foreground">
              Access premium campaigns with higher rewards and better engagement
            </p>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4 text-xl">
              📊
            </div>
            <h3 className="text-lg font-semibold mb-2">Advanced Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Get detailed insights on your earnings and campaign performance
            </p>
          </div>
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-center">Choose Your Plan</h2>
        <PremiumPlans
          currentPlan={currentPlan}
          onSelectPlan={handleSelectPlan}
          isPremium={isPremium}
          premiumUntil={premiumUntil}
        />
      </div>

      <div className="mt-12 bg-gray-50 p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Frequently Asked Questions</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium">Can I cancel my subscription?</h4>
            <p className="text-sm text-muted-foreground">
              Yes, you can cancel anytime. Your premium benefits will remain active until the end of your billing period.
            </p>
          </div>
          <div>
            <h4 className="font-medium">How much more can I earn with premium?</h4>
            <p className="text-sm text-muted-foreground">
              Premium members earn 50% more on all campaigns, plus get access to exclusive premium campaigns that typically offer 2-3x higher rewards.
            </p>
          </div>
          <div>
            <h4 className="font-medium">Can I pay with credits?</h4>
            <p className="text-sm text-muted-foreground">
              Yes, you can use your earned credits to purchase a premium subscription. Contact an admin to process this.
            </p>
          </div>
          <div>
            <h4 className="font-medium">How do I get priority support?</h4>
            <p className="text-sm text-muted-foreground">
              Premium members have access to a dedicated support channel in Telegram. You'll receive the link after upgrading.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
