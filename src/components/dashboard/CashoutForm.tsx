"use client";

import type React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { PaymentMethod } from '@/lib/models/payment';
import {
  calculateUsdValueOfCredits,
  calculateCashoutCommission,
  isEligibleForCashout
} from '@/lib/monetization';
import type { User } from '@/lib/models/user';

const PAYOUT_METHODS: { id: PaymentMethod; label: string; icon: string }[] = [
  { id: 'bitcoin', label: 'Bitcoin', icon: '₿' },
  { id: 'ethereum', label: 'Ethereum', icon: 'Ξ' },
  { id: 'paypal', label: 'PayPal', icon: 'P' },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
];

interface CashoutFormProps {
  user: User;
  onRequestCashout: (credits: number, paymentMethod: PaymentMethod, address: string) => void;
  minCashoutCredits?: number;
  commissionPercentage?: number;
}

export function CashoutForm({
  user,
  onRequestCashout,
  minCashoutCredits = 1000,
  commissionPercentage = 5
}: CashoutFormProps) {
  const [creditAmount, setCreditAmount] = useState<number>(minCashoutCredits);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [paymentAddress, setPaymentAddress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Calculate USD value
  const usdValue = calculateUsdValueOfCredits(creditAmount);
  const commission = calculateCashoutCommission(usdValue, commissionPercentage);
  const finalUsdValue = usdValue - commission;

  // Check eligibility
  const eligibility = isEligibleForCashout(user, minCashoutCredits);

  // Handle form value changes
  const handleCreditAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setCreditAmount(Number(e.target.value));
  };

  const handleMethodChange = (method: PaymentMethod) => {
    setError(null);
    setSelectedMethod(method);
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setPaymentAddress(e.target.value);
  };

  const handleSubmit = () => {
    // Validate input
    if (creditAmount > user.credits) {
      setError('You don\'t have enough credits');
      return;
    }

    if (creditAmount < minCashoutCredits) {
      setError(`Minimum cashout amount is ${minCashoutCredits} credits`);
      return;
    }

    if (!selectedMethod) {
      setError('Please select a payment method');
      return;
    }

    if (!paymentAddress) {
      setError('Please enter your payment address');
      return;
    }

    // Submit cashout request
    onRequestCashout(creditAmount, selectedMethod, paymentAddress);
  };

  const getPaymentAddressLabel = () => {
    switch (selectedMethod) {
      case 'bitcoin':
      case 'ethereum':
        return 'Wallet Address';
      case 'paypal':
        return 'PayPal Email';
      case 'bank_transfer':
        return 'Account Details';
      default:
        return 'Payment Address';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Out Credits</CardTitle>
        <CardDescription>
          Convert your earned credits to real money
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!eligibility.eligible ? (
          <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
            <p className="text-yellow-800">{eligibility.reason}</p>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">
                Credits to cash out
              </label>
              <div className="flex items-center">
                <Input
                  type="number"
                  min={minCashoutCredits}
                  max={user.credits}
                  value={creditAmount}
                  onChange={handleCreditAmountChange}
                  className="mr-2"
                  disabled={!eligibility.eligible}
                />
                <span className="text-sm text-muted-foreground">
                  Available: {user.credits}
                </span>
              </div>
              <div className="mt-1">
                <span className="text-sm text-muted-foreground">
                  Worth: ${usdValue.toFixed(2)} (${finalUsdValue.toFixed(2)} after {commissionPercentage}% commission)
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Select payout method
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {PAYOUT_METHODS.map(method => (
                  <Button
                    key={method.id}
                    type="button"
                    variant={selectedMethod === method.id ? "default" : "outline"}
                    className="h-14 flex flex-col justify-center"
                    onClick={() => handleMethodChange(method.id)}
                    disabled={!eligibility.eligible}
                  >
                    <span className="text-lg mb-1">{method.icon}</span>
                    <span className="text-xs">{method.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {selectedMethod && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  {getPaymentAddressLabel()}
                </label>
                <Input
                  value={paymentAddress}
                  onChange={handleAddressChange}
                  placeholder={`Enter your ${getPaymentAddressLabel().toLowerCase()}`}
                  disabled={!eligibility.eligible}
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 p-2 rounded-md border border-red-200">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
          </>
        )}
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          disabled={!eligibility.eligible || !selectedMethod || !paymentAddress}
          onClick={handleSubmit}
        >
          Request Cashout
        </Button>
      </CardFooter>
    </Card>
  );
}
