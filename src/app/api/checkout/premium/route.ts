import { type NextRequest, NextResponse } from 'next/server';
import { createSubscriptionCheckoutSession } from '@/lib/stripe';
import { SUBSCRIPTION_PLANS } from '@/lib/models/payment';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planId, userId, email } = body;

    // Validate plan ID
    if (!planId || !SUBSCRIPTION_PLANS.some(plan => plan.id === planId)) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      );
    }

    // Validate user ID
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Create checkout session
    const session = await createSubscriptionCheckoutSession({
      planId,
      userId,
      customerEmail: email,
      successUrl: `${req.nextUrl.origin}/premium/success`,
      cancelUrl: `${req.nextUrl.origin}/premium`,
      trialDays: 0, // No trial by default
    });

    return NextResponse.json({ url: session.url, sessionId: session.sessionId });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
