"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { calculateUsdValueOfCredits } from '@/lib/monetization';
import type { User } from '@/lib/models/user';

interface MonetizationStatsProps {
  user: User;
  totalEarned: number;
  totalCashedOut: number;
  referralCount: number;
  referralEarnings: number;
  nextCashoutThreshold: number;
}

export function MonetizationStats({
  user,
  totalEarned,
  totalCashedOut,
  referralCount,
  referralEarnings,
  nextCashoutThreshold
}: MonetizationStatsProps) {
  const progressPercent = (user.credits / nextCashoutThreshold) * 100;
  const creditsValue = calculateUsdValueOfCredits(user.credits);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Credits Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Current Credits</CardTitle>
          {user.isPremium && (
            <Badge variant="default" className="bg-yellow-500 text-white">Premium</Badge>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{user.credits.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Worth approximately ${creditsValue.toFixed(2)}
          </p>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progress to next cashout</span>
              <span>{user.credits}/{nextCashoutThreshold}</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </CardContent>
        <CardFooter className="p-2">
          <div className="text-xs text-muted-foreground">
            {progressPercent >= 100 ?
              'Eligible for cashout!' :
              `Need ${nextCashoutThreshold - user.credits} more credits to cash out`}
          </div>
        </CardFooter>
      </Card>

      {/* Earnings Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Earnings Summary</CardTitle>
          <CardDescription>Lifetime statistics</CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Total earned:</span>
              <span className="font-medium">{totalEarned.toLocaleString()} credits</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Cashed out:</span>
              <span className="font-medium">{totalCashedOut.toLocaleString()} credits</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between">
              <span className="text-sm">Earned this month:</span>
              <span className="font-medium">
                {(totalEarned - totalCashedOut).toLocaleString()} credits
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Referral Program</CardTitle>
          <CardDescription>Earn by inviting others</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Active referrals:</span>
              <span className="font-medium">{referralCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Referral earnings:</span>
              <span className="font-medium">{referralEarnings.toLocaleString()} credits</span>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              <p>• 50 credits for each new member</p>
              <p>• 10% of referrals' campaign rewards</p>
              <p>• 500 credits for premium upgrades</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
