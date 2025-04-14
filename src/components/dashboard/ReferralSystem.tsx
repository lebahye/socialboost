"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

interface ReferralProps {
  telegramId: number;
  referralCode: string;
  referralCount: number;
  totalEarned: number;
  onGenerateNewCode: () => void;
}

export function ReferralSystem({
  telegramId,
  referralCode,
  referralCount,
  totalEarned,
  onGenerateNewCode
}: ReferralProps) {
  const [copied, setCopied] = useState(false);

  const referralLink = `https://t.me/YourBotUsername?start=${referralCode}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Referral Program</CardTitle>
        <CardDescription>
          Invite friends and earn rewards on their activities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
          <h3 className="text-blue-800 font-medium text-sm mb-2">
            How It Works
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 50 credits for each new verified user</li>
            <li>• 10% bonus on their campaign rewards</li>
            <li>• 500 bonus credits when they upgrade to premium</li>
          </ul>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Your unique referral link
          </label>
          <div className="flex">
            <Input
              value={referralLink}
              readOnly
              className="mr-2"
            />
            <Button onClick={copyToClipboard} size="sm">
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>

        <Separator />

        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-gray-50 p-3 rounded-md text-center">
            <div className="text-2xl font-bold">{referralCount}</div>
            <div className="text-xs text-gray-500">Referred Users</div>
          </div>

          <div className="bg-gray-50 p-3 rounded-md text-center">
            <div className="text-2xl font-bold">{totalEarned}</div>
            <div className="text-xs text-gray-500">Credits Earned</div>
          </div>

          <div className="bg-gray-50 p-3 rounded-md text-center">
            <div className="text-2xl font-bold">${(totalEarned / 100).toFixed(2)}</div>
            <div className="text-xs text-gray-500">Equivalent Value</div>
          </div>
        </div>

        <div className="border border-gray-100 rounded-md p-4">
          <h3 className="text-sm font-medium mb-2">Telegram Message Template</h3>
          <div className="bg-gray-50 p-3 rounded text-sm">
            <p>Join me on this amazing social media coordination bot! 🚀</p>
            <p>• Earn rewards for your social engagement</p>
            <p>• Get paid for supporting campaigns</p>
            <p>• Easy to use and completely free</p>
            <p>Start now: {referralLink}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onGenerateNewCode}>
          Generate New Code
        </Button>
        <Button
          variant="default"
          onClick={() => {
            window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join me on this amazing social media coordination bot! 🚀')}`, '_blank');
          }}
        >
          Share on Telegram
        </Button>
      </CardFooter>
    </Card>
  );
}
