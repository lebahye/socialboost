"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { Campaign } from '@/lib/models/campaign';
import { Separator } from '@/components/ui/separator';

interface CampaignAnalyticsProps {
  activeCampaigns: Campaign[];
  completedCampaigns: Campaign[];
  totalRevenue: number;
  premiumCampaignRevenue: number;
  standardCampaignRevenue: number;
  highestPerformingCampaign?: Campaign;
}

export function CampaignAnalytics({
  activeCampaigns,
  completedCampaigns,
  totalRevenue,
  premiumCampaignRevenue,
  standardCampaignRevenue,
  highestPerformingCampaign
}: CampaignAnalyticsProps) {

  // Calculate totals
  const totalCampaigns = activeCampaigns.length + completedCampaigns.length;
  const premiumCampaignCount = [...activeCampaigns, ...completedCampaigns]
    .filter(campaign => campaign.isPremium).length;

  const premiumPercentage = totalCampaigns > 0
    ? Math.round((premiumCampaignCount / totalCampaigns) * 100)
    : 0;

  const premiumRevenuePercentage = totalRevenue > 0
    ? Math.round((premiumCampaignRevenue / totalRevenue) * 100)
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Campaign Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Campaign Overview</CardTitle>
          <CardDescription>Active and historical campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm">Active campaigns:</span>
              <span className="font-medium">{activeCampaigns.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Completed campaigns:</span>
              <span className="font-medium">{completedCampaigns.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Total campaigns:</span>
              <span className="font-medium">{totalCampaigns}</span>
            </div>

            <Separator />

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Premium campaigns</span>
                <span>{premiumCampaignCount} / {totalCampaigns} ({premiumPercentage}%)</span>
              </div>
              <Progress value={premiumPercentage} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Breakdown Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Revenue Breakdown</CardTitle>
          <CardDescription>Campaign monetization statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="mb-1 text-lg font-bold">${totalRevenue.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Total Campaign Revenue</div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
                  <span className="text-sm">Standard Campaigns</span>
                </div>
                <span className="font-medium">${standardCampaignRevenue.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2" />
                  <span className="text-sm">Premium Campaigns</span>
                </div>
                <span className="font-medium">${premiumCampaignRevenue.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Premium Revenue</span>
                <span>{premiumRevenuePercentage}% of total</span>
              </div>
              <Progress value={premiumRevenuePercentage} className="h-2 bg-blue-100">
                <div
                  className="h-full bg-yellow-500"
                  style={{ width: `${premiumRevenuePercentage}%` }}
                />
              </Progress>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Campaign Card */}
      {highestPerformingCampaign && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-sm font-medium">Top Performing Campaign</CardTitle>
                <CardDescription>Highest engagement rate</CardDescription>
              </div>
              {highestPerformingCampaign.isPremium && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  Premium
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-base">{highestPerformingCampaign.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {highestPerformingCampaign.description}
                </p>
              </div>

              <div>
                <div className="text-sm font-medium mb-1">Participation Rate</div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Participants</span>
                  <span>
                    {highestPerformingCampaign.participants.filter(p => p.participated).length} / {highestPerformingCampaign.participants.length}
                  </span>
                </div>
                <Progress
                  value={highestPerformingCampaign.stats?.participationRate || 0}
                  className="h-2"
                />
              </div>

              <div className="pt-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs">Reward</div>
                    <div>{highestPerformingCampaign.reward} credits</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Total Rewarded</div>
                    <div>{highestPerformingCampaign.stats?.totalRewarded || 0} credits</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
