export type PaymentMethod = 'bitcoin' | 'ethereum' | 'bank_transfer' | 'paypal' | 'credit_card' | 'telegram';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  savings?: string; // e.g. "Save 17%"
}

export interface PaymentRequest {
  userId: string;
  amount: number;
  planId?: string;
  paymentMethod: PaymentMethod;
  isSubscription: boolean;
  metadata?: Record<string, string | number | boolean>;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  error?: string;
  redirectUrl?: string;
  status: 'pending' | 'completed' | 'failed';
}

// Mock subscription plans
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'monthly',
    name: 'Monthly Plan',
    description: 'Full access to premium features with monthly billing',
    price: 9.99,
    interval: 'monthly',
    features: [
      '50% bonus on all campaign rewards',
      'Access to exclusive premium campaigns',
      'Priority support',
      'Advanced analytics'
    ]
  },
  {
    id: 'yearly',
    name: 'Yearly Plan',
    description: 'Full access to premium features with yearly billing',
    price: 99.99,
    interval: 'yearly',
    features: [
      '50% bonus on all campaign rewards',
      'Access to exclusive premium campaigns',
      'Priority support',
      'Advanced analytics'
    ],
    savings: 'Save 17%'
  }
];
