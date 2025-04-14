"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MonetizationStats } from '@/components/dashboard/MonetizationStats';
import { CashoutForm } from '@/components/dashboard/CashoutForm';
import { CampaignAnalytics } from '@/components/dashboard/CampaignAnalytics';
import { ReferralSystem } from '@/components/dashboard/ReferralSystem';
import type { PaymentMethod } from '@/lib/models/payment';

// Mock user data
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
    },
    {
      id: 'payment2',
      date: new Date('2023-08-15'),
      amount: -20,
      description: 'Credit Redemption',
      status: 'completed' as const,
      transactionId: 'tx789012'
    }
  ],
  notificationSettings: {
    mentions: true,
    campaigns: true,
    rewards: true
  }
};

// Mock campaign data
const mockActiveCampaigns = [
  {
    id: 'campaign1',
    name: 'Crypto Exchange Promotion',
    description: 'Help promote this new crypto exchange launch',
    xPostUrl: 'https://twitter.com/cryptoexchange/status/1234567890',
    startDate: new Date('2023-10-01'),
    endDate: new Date('2023-10-15'),
    reward: 200,
    isPremium: true,
    createdBy: 987654321,
    participants: [
      { userId: '1', participated: true, participationDate: new Date(), rewarded: true, rewardAmount: 300 },
      { userId: '2', participated: false, rewarded: false },
      { userId: '3', participated: true, participationDate: new Date(), rewarded: true, rewardAmount: 300 }
    ],
    status: 'active' as const,
    stats: {
      participationRate: 66,
      totalRewarded: 600
    }
  },
  {
    id: 'campaign2',
    name: 'NFT Collection Launch',
    description: 'Support the launch of our new NFT collection',
    xPostUrl: 'https://twitter.com/nftcreator/status/9876543210',
    startDate: new Date('2023-10-05'),
    endDate: new Date('2023-10-20'),
    reward: 150,
    isPremium: false,
    createdBy: 987654321,
    participants: [
      { userId: '1', participated: true, participationDate: new Date(), rewarded: true, rewardAmount: 150 },
      { userId: '2', participated: true, participationDate: new Date(), rewarded: true, rewardAmount: 150 },
      { userId: '3', participated: false, rewarded: false }
    ],
    status: 'active' as const,
    stats: {
      participationRate: 66,
      totalRewarded: 300
    }
  }
];

const mockCompletedCampaigns = [
  {
    id: 'campaign3',
    name: 'DeFi Platform Announcement',
    description: 'Share our new DeFi platform features',
    xPostUrl: 'https://twitter.com/defiplatform/status/1357924680',
    startDate: new Date('2023-09-01'),
    endDate: new Date('2023-09-15'),
    reward: 100,
    isPremium: false,
    createdBy: 987654321,
    participants: [
      { userId: '1', participated: true, participationDate: new Date(), rewarded: true, rewardAmount: 100 },
      { userId: '2', participated: true, participationDate: new Date(), rewarded: true, rewardAmount: 100 },
      { userId: '3', participated: true, participationDate: new Date(), rewarded: true, rewardAmount: 100 }
    ],
    status: 'completed' as const,
    stats: {
      participationRate: 100,
      totalRewarded: 300
    }
  }
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('monetization');

  // Mock function handlers
  const handleCashoutRequest = (credits: number, paymentMethod: PaymentMethod, address: string) => {
    console.log('Cashout requested:', { credits, paymentMethod, address });
    alert(`Cashout request submitted for ${credits} credits (${paymentMethod})`);
  };

  const handleSelectPlan = (planId: string, paymentMethod: PaymentMethod) => {
    console.log('Plan selected:', { planId, paymentMethod });
    alert(`Selected ${planId} plan with ${paymentMethod} payment method`);
  };

  const handleGenerateNewReferralCode = () => {
    console.log('New referral code requested');
    alert('New referral code generated!');
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your earnings, campaigns, and referrals
        </p>
      </header>

      <Tabs defaultValue="monetization" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="monetization">Monetization</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="cashout">Cash Out</TabsTrigger>
        </TabsList>

        <TabsContent value="monetization" className="space-y-6">
          <MonetizationStats
            user={mockUser}
            totalEarned={5000}
            totalCashedOut={2000}
            referralCount={mockUser.referrals.length}
            referralEarnings={500}
            nextCashoutThreshold={1000}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <CampaignAnalytics
            activeCampaigns={mockActiveCampaigns}
            completedCampaigns={mockCompletedCampaigns}
            totalRevenue={1200}
            premiumCampaignRevenue={700}
            standardCampaignRevenue={500}
            highestPerformingCampaign={mockCompletedCampaigns[0]}
          />
        </TabsContent>

        <TabsContent value="referrals" className="space-y-6">
          <ReferralSystem
            telegramId={mockUser.telegramId}
            referralCode="REF-123456-ABCDE"
            referralCount={mockUser.referrals.length}
            totalEarned={500}
            onGenerateNewCode={handleGenerateNewReferralCode}
          />
        </TabsContent>

        <TabsContent value="cashout" className="space-y-6">
          <CashoutForm
            user={mockUser}
            onRequestCashout={handleCashoutRequest}
            minCashoutCredits={1000}
            commissionPercentage={5}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
