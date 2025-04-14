import { type NextRequest, NextResponse } from 'next/server';
import { createPaymentIntent } from '@/lib/stripe';
import { calculateUsdValueOfCredits, isEligibleForCashout } from '@/lib/monetization';
import type { PaymentMethod } from '@/lib/models/payment';

// This would come from your database in a real implementation
const mockUser = {
  id: '1',
  telegramId: 123456789,
  username: 'johndoe',
  name: 'John Doe',
  xAccount: 'johndoe',
  isVerified: true,
  joinDate: new Date('2023-01-15'),
  isPremium: true,
  premiumUntil: new Date('2024-12-31'),
  credits: 3500,
  referrals: ['user2', 'user3', 'user4'],
  paymentHistory: [
    {
      id: 'payment1',
      date: new Date('2023-06-01'),
      amount: 99.99,
      description: 'Yearly Premium Subscription',
      status: 'completed' as const,
      transactionId: 'tx123456'
    }
  ],
  notificationSettings: {
    mentions: true,
    campaigns: true,
    rewards: true
  }
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, credits, paymentMethod, address } = body;

    // Validate user ID
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // In a real app, you would fetch the user from the database
    const user = mockUser;

    // Check eligibility for cashout
    const eligibility = isEligibleForCashout(user, 1000);
    if (!eligibility.eligible) {
      return NextResponse.json(
        { error: eligibility.reason },
        { status: 400 }
      );
    }

    // Validate credits amount
    if (!credits || credits < 1000 || credits > user.credits) {
      return NextResponse.json(
        { error: 'Invalid credits amount' },
        { status: 400 }
      );
    }

    // Validate payment method
    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method is required' },
        { status: 400 }
      );
    }

    // Calculate USD value
    const usdValue = calculateUsdValueOfCredits(credits);

    // In a real app, this would create a payout rather than a payment intent
    // For demonstration purposes, we're using a payment intent
    const paymentIntent = await createPaymentIntent({
      amount: usdValue,
      userId,
      paymentMethod: paymentMethod as PaymentMethod,
      metadata: {
        credits: credits.toString(),
        address,
        type: 'cashout'
      }
    });

    // In a real app, you would then:
    // 1. Deduct credits from the user
    // 2. Create a pending payment record
    // 3. Process the payment through appropriate channels based on paymentMethod

    return NextResponse.json({
      success: true,
      amount: usdValue,
      transactionId: paymentIntent.id,
      status: 'pending'
    });
  } catch (error) {
    console.error('Error processing cashout:', error);
    return NextResponse.json(
      { error: 'Failed to process cashout' },
      { status: 500 }
    );
  }
}
