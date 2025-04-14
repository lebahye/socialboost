"use client";

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import type { Campaign } from '@/lib/models/campaign';

// Mock campaign data
const mockCampaigns: Campaign[] = [
  {
    id: 'campaign1',
    name: 'Crypto Exchange Promotion',
    description: 'Help promote this new crypto exchange launch',
    xPostUrl: 'https://twitter.com/cryptoexchange/status/1234567890',
    startDate: new Date('2023-10-01'),
    endDate: new Date('2024-12-15'),
    reward: 200,
    isPremium: true,
    createdBy: 987654321,
    participants: [
      { userId: '1', participated: true, participationDate: new Date(), rewarded: true, rewardAmount: 300 },
      { userId: '2', participated: false, rewarded: false },
      { userId: '3', participated: true, participationDate: new Date(), rewarded: true, rewardAmount: 300 }
    ],
    status: 'active',
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
    endDate: new Date('2024-12-20'),
    reward: 150,
    isPremium: false,
    createdBy: 987654321,
    participants: [
      { userId: '1', participated: true, participationDate: new Date(), rewarded: true, rewardAmount: 150 },
      { userId: '2', participated: true, participationDate: new Date(), rewarded: true, rewardAmount: 150 },
      { userId: '3', participated: false, rewarded: false }
    ],
    status: 'active',
    stats: {
      participationRate: 66,
      totalRewarded: 300
    }
  },
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
    status: 'completed',
    stats: {
      participationRate: 100,
      totalRewarded: 300
    }
  }
];

export default function CampaignManagement() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'active' | 'completed' | 'all'>('all');
  const [filterPremium, setFilterPremium] = useState<boolean | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // New campaign form state
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    xPostUrl: '',
    reward: 100,
    isPremium: false,
    endDays: 7 // Default to 7 days
  });

  // Filter campaigns
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch =
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPremium = filterPremium === null || campaign.isPremium === filterPremium;
    const matchesStatus = filterStatus === 'all' || campaign.status === filterStatus;

    return matchesSearch && matchesPremium && matchesStatus;
  });

  // Create new campaign
  const handleCreateCampaign = () => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + newCampaign.endDays);

    const campaign: Campaign = {
      id: `campaign${campaigns.length + 1}`,
      name: newCampaign.name,
      description: newCampaign.description,
      xPostUrl: newCampaign.xPostUrl,
      startDate,
      endDate,
      reward: newCampaign.reward,
      isPremium: newCampaign.isPremium,
      createdBy: 123456789, // Mock admin ID
      participants: [],
      status: 'active',
      stats: {
        participationRate: 0,
        totalRewarded: 0
      }
    };

    setCampaigns([...campaigns, campaign]);

    // Reset form
    setNewCampaign({
      name: '',
      description: '',
      xPostUrl: '',
      reward: 100,
      isPremium: false,
      endDays: 7
    });

    setIsCreateDialogOpen(false);
  };

  // Cancel campaign
  const cancelCampaign = (id: string) => {
    setCampaigns(campaigns.map(campaign => {
      if (campaign.id === id) {
        return {
          ...campaign,
          status: 'cancelled' as const,
          endDate: new Date() // End immediately
        };
      }
      return campaign;
    }));
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Campaign Management</CardTitle>
              <CardDescription>
                Create and manage social media campaigns
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>Create Campaign</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Campaign</DialogTitle>
                  <DialogDescription>
                    Fill out the details to create a new social media campaign
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Campaign Name
                    </label>
                    <Input
                      id="name"
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                      placeholder="Enter campaign name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium">
                      Description
                    </label>
                    <Input
                      id="description"
                      value={newCampaign.description}
                      onChange={(e) => setNewCampaign({...newCampaign, description: e.target.value})}
                      placeholder="Enter campaign description"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="url" className="text-sm font-medium">
                      X Post URL
                    </label>
                    <Input
                      id="url"
                      value={newCampaign.xPostUrl}
                      onChange={(e) => setNewCampaign({...newCampaign, xPostUrl: e.target.value})}
                      placeholder="https://twitter.com/username/status/123456789"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="reward" className="text-sm font-medium">
                        Reward (credits)
                      </label>
                      <Input
                        id="reward"
                        type="number"
                        value={newCampaign.reward}
                        onChange={(e) => setNewCampaign({...newCampaign, reward: Number.parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="days" className="text-sm font-medium">
                        Duration (days)
                      </label>
                      <Input
                        id="days"
                        type="number"
                        value={newCampaign.endDays}
                        onChange={(e) => setNewCampaign({...newCampaign, endDays: Number.parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      id="premium"
                      type="checkbox"
                      checked={newCampaign.isPremium}
                      onChange={(e) => setNewCampaign({...newCampaign, isPremium: e.target.checked})}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="premium" className="text-sm font-medium">
                      Premium Campaign (premium users only)
                    </label>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCampaign}>Create Campaign</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search campaigns by name or description"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? "default" : "outline"}
                onClick={() => setFilterStatus('all')}
                size="sm"
              >
                All Campaigns
              </Button>
              <Button
                variant={filterStatus === 'active' ? "default" : "outline"}
                onClick={() => setFilterStatus('active')}
                size="sm"
              >
                Active
              </Button>
              <Button
                variant={filterStatus === 'completed' ? "default" : "outline"}
                onClick={() => setFilterStatus('completed')}
                size="sm"
              >
                Completed
              </Button>
              <Button
                variant={filterPremium === true ? "default" : "outline"}
                onClick={() => setFilterPremium(filterPremium === true ? null : true)}
                size="sm"
              >
                Premium
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Reward</TableHead>
                  <TableHead>Participation</TableHead>
                  <TableHead>Total Rewards</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      No campaigns found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCampaigns.map(campaign => (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{campaign.name}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {campaign.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {campaign.status === 'active' ? (
                          <Badge className="bg-green-500">Active</Badge>
                        ) : campaign.status === 'completed' ? (
                          <Badge variant="outline">Completed</Badge>
                        ) : (
                          <Badge variant="outline" className="border-red-200 text-red-500">Cancelled</Badge>
                        )}
                        {campaign.isPremium && (
                          <Badge className="bg-yellow-500 ml-2">Premium</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDate(campaign.startDate)}</div>
                          <div className="text-muted-foreground">to {formatDate(campaign.endDate)}</div>
                        </div>
                      </TableCell>
                      <TableCell>{campaign.reward} credits</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{campaign.stats?.participationRate || 0}%</div>
                          <div className="text-muted-foreground">
                            {campaign.participants.filter(p => p.participated).length}/{campaign.participants.length} users
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{campaign.stats?.totalRewarded || 0} credits</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedCampaign(campaign)}
                          >
                            Details
                          </Button>
                          {campaign.status === 'active' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-200 text-red-500"
                              onClick={() => cancelCampaign(campaign.id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedCampaign && (
        <Dialog open={!!selectedCampaign} onOpenChange={(open) => !open && setSelectedCampaign(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Campaign Details: {selectedCampaign.name}</DialogTitle>
              <DialogDescription>
                {selectedCampaign.description}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="font-medium">
                    {selectedCampaign.status === 'active' ? (
                      <Badge className="bg-green-500">Active</Badge>
                    ) : selectedCampaign.status === 'completed' ? (
                      <Badge variant="outline">Completed</Badge>
                    ) : (
                      <Badge variant="outline" className="border-red-200 text-red-500">Cancelled</Badge>
                    )}
                    {selectedCampaign.isPremium && (
                      <Badge className="bg-yellow-500 ml-2">Premium</Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Duration</div>
                  <div className="font-medium">
                    {formatDate(selectedCampaign.startDate)} - {formatDate(selectedCampaign.endDate)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Reward</div>
                  <div className="font-medium">{selectedCampaign.reward} credits</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Participation Rate</div>
                  <div className="font-medium">{selectedCampaign.stats?.participationRate || 0}%</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="font-medium">X Post URL</h3>
                <div className="p-2 bg-gray-50 rounded break-all">
                  <a href={selectedCampaign.xPostUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {selectedCampaign.xPostUrl}
                  </a>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-2">Participants ({selectedCampaign.participants.length})</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Participated</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Reward Status</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCampaign.participants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">No participants yet</TableCell>
                      </TableRow>
                    ) : (
                      selectedCampaign.participants.map((participant, index) => (
                        <TableRow key={`participant-${participant.userId}`}>
                          <TableCell>{participant.userId}</TableCell>
                          <TableCell>
                            {participant.participated ? (
                              <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Yes</Badge>
                            ) : (
                              <Badge variant="outline">No</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {participant.participationDate
                              ? formatDate(participant.participationDate)
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {participant.rewarded ? (
                              <Badge className="bg-green-500">Rewarded</Badge>
                            ) : (
                              <Badge variant="outline">Pending</Badge>
                            )}
                          </TableCell>
                          <TableCell>{participant.rewardAmount || '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedCampaign(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Campaign Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-md">
              <div className="text-2xl font-bold">{campaigns.length}</div>
              <div className="text-sm text-muted-foreground">Total Campaigns</div>
            </div>
            <div className="bg-green-50 p-4 rounded-md">
              <div className="text-2xl font-bold">{campaigns.filter(c => c.status === 'active').length}</div>
              <div className="text-sm text-muted-foreground">Active Campaigns</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-md">
              <div className="text-2xl font-bold">{campaigns.filter(c => c.isPremium).length}</div>
              <div className="text-sm text-muted-foreground">Premium Campaigns</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-md">
              <div className="text-2xl font-bold">
                {campaigns.reduce((sum, campaign) => sum + (campaign.stats?.totalRewarded || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Credits Awarded</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
