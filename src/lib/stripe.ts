import Stripe from 'stripe';
import { type PaymentMethod, SubscriptionPlan } from './models/payment';

// Initialize Stripe with your secret key (should be in .env file in production)
// This is a test key for demonstration - in production use process.env.STRIPE_SECRET_KEY
const stripe = new Stripe('sk_test_example_key_replace_with_real_key', {
  apiVersion: '2025-03-31.basil',
});

export interface CreateCheckoutSessionParams {
  planId: string;
  userId: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
}

export interface CreatePaymentIntentParams {
  amount: number; // in USD
  userId: string;
  customerEmail?: string;
  paymentMethod: PaymentMethod;
  metadata?: Record<string, string>;
}

// Define a more specific type for webhook event data
export type StripeWebhookEventData = Stripe.Event.Data.Object;

/**
 * Create a Stripe Checkout session for subscription
 */
export async function createSubscriptionCheckoutSession({
  planId,
  userId,
  customerEmail,
  successUrl,
  cancelUrl,
  trialDays = 0,
}: CreateCheckoutSessionParams): Promise<{ url: string; sessionId: string }> {
  try {
    // Define price IDs for each plan
    // In production, these would be stored in a database or env variables
    const priceIds: Record<string, string> = {
      monthly: 'price_monthly_example', // Replace with real price ID
      yearly: 'price_yearly_example',   // Replace with real price ID
    };

    if (!priceIds[planId]) {
      throw new Error(`Invalid plan ID: ${planId}`);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceIds[planId],
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      customer_email: customerEmail,
      subscription_data: trialDays > 0 ? {
        trial_period_days: trialDays,
      } : undefined,
      metadata: {
        userId,
        planId,
      },
    });

    return {
      url: session.url as string,
      sessionId: session.id,
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Create a payment intent for one-time payments (like credit purchases)
 */
export async function createPaymentIntent({
  amount, // in USD
  userId,
  customerEmail,
  paymentMethod,
  metadata = {},
}: CreatePaymentIntentParams): Promise<{ clientSecret: string; id: string }> {
  try {
    // Convert USD to cents for Stripe
    const amountInCents = Math.round(amount * 100);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: {
        userId,
        ...metadata,
      },
      receipt_email: customerEmail,
    });

    return {
      clientSecret: paymentIntent.client_secret as string,
      id: paymentIntent.id,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

/**
 * Verify and process a webhook event from Stripe
 */
export async function handleStripeWebhook(
  rawBody: string,
  signature: string,
  webhookSecret: string
): Promise<{
  type: string;
  data: StripeWebhookEventData;
}> {
  try {
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        // Payment successful, provision the subscription
        const session = event.data.object;
        console.log('Checkout completed:', session);
        // In production, update your user database with subscription info
        break;
      }

      case 'invoice.paid': {
        // Recurring payment successful
        const invoice = event.data.object;
        console.log('Invoice paid:', invoice);
        // Handle successful recurring payment
        break;
      }

      case 'invoice.payment_failed': {
        // Payment failed or customer canceled
        const failedInvoice = event.data.object;
        console.log('Invoice payment failed:', failedInvoice);
        // Notify the customer about the failed payment
        break;
      }

      case 'customer.subscription.updated': {
        // Subscription updated
        const subscription = event.data.object;
        console.log('Subscription updated:', subscription);
        // Update subscription status in your database
        break;
      }

      case 'customer.subscription.deleted': {
        // Subscription canceled or expired
        const canceledSubscription = event.data.object;
        console.log('Subscription canceled:', canceledSubscription);
        // Update subscription status in your database
        break;
      }
    }

    // Return the event for additional processing if needed
    return {
      type: event.type,
      data: event.data.object,
    };
  } catch (error) {
    console.error('Error handling webhook:', error);
    throw error;
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
  try {
    const canceledSubscription = await stripe.subscriptions.cancel(subscriptionId);
    return canceledSubscription.status === 'canceled';
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

/**
 * Retrieve a subscription
 */
export async function getSubscription(subscriptionId: string) {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    throw error;
  }
}

/**
 * Issue a refund
 */
export async function issueRefund(paymentIntentId: string, amount?: number) {
  try {
    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
    };

    if (amount) {
      // Convert USD to cents for Stripe
      refundParams.amount = Math.round(amount * 100);
    }

    return await stripe.refunds.create(refundParams);
  } catch (error) {
    console.error('Error issuing refund:', error);
    throw error;
  }
}
