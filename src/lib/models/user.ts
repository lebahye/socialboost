export interface PaymentRecord {
  id: string;
  date: Date;
  amount: number; // Positive for payments, negative for withdrawals
  description: string;
  status: 'pending' | 'completed' | 'failed';
  transactionId?: string;
}

export interface User {
  id: string;
  telegramId: number;
  username?: string;
  name?: string;
  xAccount?: string;
  isVerified: boolean;
  joinDate: Date;
  isPremium: boolean;
  premiumUntil?: Date;
  credits: number;
  referredBy?: string;
  referrals: string[]; // Array of user IDs
  paymentHistory: PaymentRecord[];
  notificationSettings: {
    mentions: boolean;
    campaigns: boolean;
    rewards: boolean;
  };
}
