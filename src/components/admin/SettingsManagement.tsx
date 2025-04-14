"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export default function SettingsManagement() {
  // API Settings
  const [telegramBotToken, setTelegramBotToken] = useState('6234567890:AABBCCDDeeffGGhhIIjjKKllMMnn');
  const [xApiKey, setXApiKey] = useState('aBcDeFgHiJkLmNoPqRsTuVwXyZ123456789');

  // Reward Settings
  const [standardReward, setStandardReward] = useState('100');
  const [premiumReward, setPremiumReward] = useState('150');
  const [referralBonus, setReferralBonus] = useState('50');
  const [referralPercentage, setReferralPercentage] = useState('10');

  // Payout Settings
  const [minCashout, setMinCashout] = useState('1000');
  const [conversionRate, setConversionRate] = useState('100'); // Credits per $1
  const [commissionPercentage, setCommissionPercentage] = useState('5');

  // Subscription Settings
  const [monthlyPrice, setMonthlyPrice] = useState('9.99');
  const [yearlyPrice, setYearlyPrice] = useState('99.99');

  // System Information
  const [isUpdating, setIsUpdating] = useState(false);
  const systemInfo = {
    version: '1.0.0',
    lastUpdated: '2023-10-15',
    environment: 'Production',
    status: 'Active',
    usersCount: 5234,
    campaignsCount: 87,
    storageUsed: '642 MB',
    adminEmails: ['admin@example.com', 'support@example.com']
  };

  // Save settings (mock)
  const saveSettings = (section: string) => {
    setIsUpdating(true);

    // Mock API call
    setTimeout(() => {
      setIsUpdating(false);
      alert(`${section} settings saved successfully!`);
    }, 800);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>
            Manage integration tokens for Telegram Bot and X (Twitter) API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="telegram-token" className="text-sm font-medium">
              Telegram Bot Token
            </label>
            <div className="flex">
              <Input
                id="telegram-token"
                type="password"
                value={telegramBotToken}
                onChange={(e) => setTelegramBotToken(e.target.value)}
                className="mr-2"
              />
              <Button
                variant="outline"
                type="button"
                onClick={() => document.getElementById('telegram-token')?.setAttribute('type', document.getElementById('telegram-token')?.getAttribute('type') === 'password' ? 'text' : 'password')}
              >
                Show/Hide
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Your Telegram Bot token from BotFather
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="x-api-key" className="text-sm font-medium">
              X (Twitter) API Key
            </label>
            <div className="flex">
              <Input
                id="x-api-key"
                type="password"
                value={xApiKey}
                onChange={(e) => setXApiKey(e.target.value)}
                className="mr-2"
              />
              <Button
                variant="outline"
                type="button"
                onClick={() => document.getElementById('x-api-key')?.setAttribute('type', document.getElementById('x-api-key')?.getAttribute('type') === 'password' ? 'text' : 'password')}
              >
                Show/Hide
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Your X API key from the Developer Portal
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => saveSettings('API')} disabled={isUpdating}>
            {isUpdating ? 'Saving...' : 'Save API Settings'}
          </Button>
        </CardFooter>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Reward Settings</CardTitle>
            <CardDescription>
              Configure reward amounts for various activities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="standard-reward" className="text-sm font-medium">
                Standard Campaign Reward (credits)
              </label>
              <Input
                id="standard-reward"
                type="number"
                value={standardReward}
                onChange={(e) => setStandardReward(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="premium-reward" className="text-sm font-medium">
                Premium Bonus Percentage (%)
              </label>
              <Input
                id="premium-reward"
                type="number"
                value={premiumReward}
                onChange={(e) => setPremiumReward(e.target.value)}
              />
              <div className="text-xs text-muted-foreground">
                Premium users will receive this percentage more credits
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="referral-bonus" className="text-sm font-medium">
                Referral Sign-up Bonus (credits)
              </label>
              <Input
                id="referral-bonus"
                type="number"
                value={referralBonus}
                onChange={(e) => setReferralBonus(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="referral-percentage" className="text-sm font-medium">
                Referral Campaign Bonus (%)
              </label>
              <Input
                id="referral-percentage"
                type="number"
                value={referralPercentage}
                onChange={(e) => setReferralPercentage(e.target.value)}
              />
              <div className="text-xs text-muted-foreground">
                % of referrals' campaign rewards given to referrer
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => saveSettings('Reward')} disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save Reward Settings'}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payout Settings</CardTitle>
            <CardDescription>
              Configure credit conversion and cashout parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="min-cashout" className="text-sm font-medium">
                Minimum Cashout (credits)
              </label>
              <Input
                id="min-cashout"
                type="number"
                value={minCashout}
                onChange={(e) => setMinCashout(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="conversion-rate" className="text-sm font-medium">
                Conversion Rate (credits per $1)
              </label>
              <Input
                id="conversion-rate"
                type="number"
                value={conversionRate}
                onChange={(e) => setConversionRate(e.target.value)}
              />
              <div className="text-xs text-muted-foreground">
                How many credits equal $1 USD
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="commission" className="text-sm font-medium">
                Cashout Commission (%)
              </label>
              <Input
                id="commission"
                type="number"
                value={commissionPercentage}
                onChange={(e) => setCommissionPercentage(e.target.value)}
              />
              <div className="text-xs text-muted-foreground">
                Percentage fee charged on cashouts
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => saveSettings('Payout')} disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save Payout Settings'}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscription Settings</CardTitle>
          <CardDescription>
            Configure premium subscription pricing
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="monthly-price" className="text-sm font-medium">
              Monthly Price (USD)
            </label>
            <Input
              id="monthly-price"
              type="number"
              value={monthlyPrice}
              onChange={(e) => setMonthlyPrice(e.target.value)}
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="yearly-price" className="text-sm font-medium">
              Yearly Price (USD)
            </label>
            <Input
              id="yearly-price"
              type="number"
              value={yearlyPrice}
              onChange={(e) => setYearlyPrice(e.target.value)}
              step="0.01"
            />
            <div className="text-xs text-muted-foreground">
              Savings: {(((Number.parseFloat(monthlyPrice) * 12) - Number.parseFloat(yearlyPrice)) / (Number.parseFloat(monthlyPrice) * 12) * 100).toFixed(0)}%
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => saveSettings('Subscription')} disabled={isUpdating}>
            {isUpdating ? 'Saving...' : 'Save Subscription Settings'}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>
            Current system status and information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Version</div>
              <div className="font-medium">{systemInfo.version}</div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Last Updated</div>
              <div className="font-medium">{systemInfo.lastUpdated}</div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Environment</div>
              <div className="font-medium">{systemInfo.environment}</div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="font-medium">
                <Badge className="bg-green-500">{systemInfo.status}</Badge>
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Total Users</div>
              <div className="font-medium">{systemInfo.usersCount.toLocaleString()}</div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Total Campaigns</div>
              <div className="font-medium">{systemInfo.campaignsCount.toLocaleString()}</div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Storage Used</div>
              <div className="font-medium">{systemInfo.storageUsed}</div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Admin Contacts</div>
              <div className="font-medium text-sm">
                {systemInfo.adminEmails.map((email, index) => (
                  <div key={email}>{email}</div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Backup System</Button>
          <Button variant="default">Check for Updates</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
