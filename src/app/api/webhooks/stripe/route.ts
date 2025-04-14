import { type NextRequest, NextResponse } from 'next/server';
import { handleStripeWebhook } from '@/lib/stripe';

// In production, this should be set in environment variables
const STRIPE_WEBHOOK_SECRET = 'whsec_test_example_key_replace_with_real_key';

export async function POST(req: NextRequest) {
  try {
    // Get the stripe signature from headers
    const signature = req.headers.get('stripe-signature') as string;

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Get raw body as text
    const rawBody = await req.text();

    // Process the webhook
    const event = await handleStripeWebhook(
      rawBody,
      signature,
      STRIPE_WEBHOOK_SECRET
    );

    return NextResponse.json({ received: true, type: event.type });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}

// Disable NextJS body parsing since we need the raw body for Stripe signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};
