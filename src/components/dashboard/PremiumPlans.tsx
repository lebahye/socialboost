"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SUBSCRIPTION_PLANS, type PaymentMethod } from '@/lib/models/payment';

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: string }[] = [
  { id: 'bitcoin', label: 'Bitcoin', icon: '₿' },
  { id: 'ethereum', label: 'Ethereum', icon: 'Ξ' },
  { id: 'paypal', label: 'PayPal', icon: 'P' },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
  { id: 'credit_card', label: 'Credit Card', icon: '💳' },
  { id: 'telegram', label: 'Telegram Payments', icon: '✈️' },
];

interface PremiumPlansProps {
  currentPlan?: string;
  onSelectPlan: (planId: string, paymentMethod: PaymentMethod) => void;
  isPremium: boolean;
  premiumUntil?: Date;
}

export function PremiumPlans({
  currentPlan,
  onSelectPlan,
  isPremium,
  premiumUntil
}: PremiumPlansProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);

  return (
    <div className="space-y-6">
      {isPremium && premiumUntil && (
        <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
          <h3 className="text-blue-800 font-semibold mb-1">
            <span className="mr-2">✓</span> Active Premium Subscription
          </h3>
          <p className="text-blue-600 text-sm">
            Your premium benefits are active until {premiumUntil.toLocaleDateString()}
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {SUBSCRIPTION_PLANS.map(plan => (
          <Card
            key={plan.id}
            className={`${selectedPlan === plan.id ? 'ring-2 ring-blue-500' : ''}
                        ${currentPlan === plan.id ? 'bg-blue-50' : ''}`}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </div>
                {plan.savings && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {plan.savings}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="mt-1 mb-4">
                <span className="text-3xl font-bold">${plan.price}</span>
                <span className="text-muted-foreground">/{plan.interval}</span>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={`${plan.id}-feature-${index}`} className="flex items-start">
                    <svg
                      className="h-5 w-5 text-green-500 shrink-0 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant={selectedPlan === plan.id ? "default" : "outline"}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {currentPlan === plan.id ? 'Current Plan' : 'Select Plan'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {selectedPlan && (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Select Payment Method</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {PAYMENT_METHODS.map(method => (
              <Button
                key={method.id}
                variant={selectedPaymentMethod === method.id ? "default" : "outline"}
                className="h-16 flex flex-col justify-center"
                onClick={() => setSelectedPaymentMethod(method.id)}
              >
                <span className="text-xl mb-1">{method.icon}</span>
                <span className="text-sm">{method.label}</span>
              </Button>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <Button
              size="lg"
              disabled={!selectedPaymentMethod}
              onClick={() => {
                if (selectedPlan && selectedPaymentMethod) {
                  onSelectPlan(selectedPlan, selectedPaymentMethod);
                }
              }}
            >
              Continue to Payment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
