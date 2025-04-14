"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import type { Project } from '@/lib/models/project';

// Mock project data
const mockProjects: Project[] = [
  {
    id: '1',
    name: 'CryptoKitties NFT',
    description: 'A revolutionary new NFT collection with unique traits',
    logo: '/projects/cryptokitties.png',
    owners: [
      { telegramId: 123456789, telegramUsername: 'johndoe', role: 'admin' },
      { telegramId: 987654321, telegramUsername: 'janedoe', role: 'manager' }
    ],
    socialAccounts: {
      telegram: {
        username: 'cryptokitties',
        channelName: 'CryptoKitties Official',
        channelUrl: 'https://t.me/cryptokitties',
        memberCount: 12500
      },
      x: {
        username: 'cryptokitties',
        followersCount: 35000,
        profileUrl: 'https://x.com/cryptokitties'
      },
      discord: {
        serverName: 'CryptoKitties',
        serverUrl: 'https://discord.gg/cryptokitties',
        memberCount: 18000
      },
      website: 'https://cryptokitties.com'
    },
    category: ['NFT', 'Art', 'Gaming'],
    subscription: {
      planId: 'pro',
      planName: 'Pro Plan',
      startDate: new Date('2023-09-01'),
      endDate: new Date('2024-09-01'),
      isActive: true,
      campaignsRemaining: 25,
      features: ['Unlimited Participants', 'Advanced Analytics', 'Priority Support']
    },
    verified: true,
    createdAt: new Date('2023-09-01'),
    updatedAt: new Date('2023-10-10'),
    stats: {
      totalCampaigns: 12,
      activeCampaigns: 3,
      participantCount: 4500,
      participationRate: 78,
      averageEngagement: 85,
      followerGrowth: {
        telegram: 1200,
        x: 2500,
        discord: 800,
        total: 4500
      }
    },
    settings: {
      defaultReminderInterval: 8,
      defaultReminderPlatforms: ['telegram', 'x'],
      defaultCampaignDuration: 7,
      autoRenewal: true,
      preferredRewardTypes: ['community_role', 'whitelist']
    }
  },
  {
    id: '2',
    name: 'DeFi Protocol',
    description: 'Next-generation decentralized finance protocol',
    logo: '/projects/defiprotocol.png',
    owners: [
      { telegramId: 234567890, telegramUsername: 'bobsmith', role: 'admin' }
    ],
    socialAccounts: {
      telegram: {
        username: 'defiprotocol',
        channelName: 'DeFi Protocol',
        channelUrl: 'https://t.me/defiprotocol',
        memberCount: 8700
      },
      x: {
        username: 'defiprotocol',
        followersCount: 22000,
        profileUrl: 'https://x.com/defiprotocol'
      },
      website: 'https://defiprotocol.io'
    },
    category: ['DeFi', 'Blockchain'],
    subscription: {
      planId: 'basic',
      planName: 'Basic Plan',
      startDate: new Date('2023-10-01'),
      endDate: new Date('2024-01-01'),
      isActive: true,
      campaignsRemaining: 5,
      features: ['Limited Participants', 'Basic Analytics']
    },
    verified: true,
    createdAt: new Date('2023-10-01'),
    updatedAt: new Date('2023-10-05'),
    stats: {
      totalCampaigns: 3,
      activeCampaigns: 1,
      participantCount: 2200,
      participationRate: 65,
      averageEngagement: 72,
      followerGrowth: {
        telegram: 500,
        x: 1200,
        total: 1700
      }
    },
    settings: {
      defaultReminderInterval: 12,
      defaultReminderPlatforms: ['telegram'],
      defaultCampaignDuration: 10,
      autoRenewal: false,
      preferredRewardTypes: ['exclusive_access']
    }
  },
  {
    id: '3',
    name: 'GameFi Project',
    description: 'Play-to-earn blockchain gaming platform',
    logo: '/projects/gamefi.png',
    owners: [
      { telegramId: 345678901, telegramUsername: 'gameboss', role: 'admin' },
      { telegramId: 456789012, telegramUsername: 'gamedev1', role: 'manager' },
      { telegramId: 567890123, telegramUsername: 'gamedev2', role: 'member' }
    ],
    socialAccounts: {
      telegram: {
        username: 'gamefiproject',
        channelName: 'GameFi Official',
        channelUrl: 'https://t.me/gamefiproject',
        memberCount: 25000
      },
      x: {
        username: 'gamefiproject',
        followersCount: 48000,
        profileUrl: 'https://x.com/gamefiproject'
      },
      discord: {
        serverName: 'GameFi Project',
        serverUrl: 'https://discord.gg/gamefiproject',
        memberCount: 32000
      },
      website: 'https://gamefiproject.io'
    },
    category: ['GameFi', 'NFT', 'Play-to-Earn'],
    subscription: {
      planId: 'enterprise',
      planName: 'Enterprise Plan',
      startDate: new Date('2023-08-15'),
      endDate: new Date('2024-08-15'),
      isActive: true,
      campaignsRemaining: 50,
      features: ['Unlimited Participants', 'Advanced Analytics', 'Priority Support', 'Custom Integrations']
    },
    verified: true,
    createdAt: new Date('2023-08-15'),
    updatedAt: new Date('2023-10-12'),
    stats: {
      totalCampaigns: 18,
      activeCampaigns: 5,
      participantCount: 12000,
      participationRate: 82,
      averageEngagement: 88,
      followerGrowth: {
        telegram: 3500,
        x: 5200,
        discord: 2800,
        total: 11500
      }
    },
    settings: {
      defaultReminderInterval: 6,
      defaultReminderPlatforms: ['telegram', 'x', 'discord'],
      defaultCampaignDuration: 5,
      autoRenewal: true,
      preferredRewardTypes: ['merchandise', 'whitelist', 'community_role']
    }
  }
];

export default function ProjectsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Filter projects based on search term and category
  const filteredProjects = mockProjects.filter(project => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      filterCategory === 'all' ||
      project.category.some(cat => cat.toLowerCase() === filterCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  // Get all unique categories
  const allCategories = Array.from(
    new Set(mockProjects.flatMap(project => project.category))
  );

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Your Projects</h1>
        <p className="text-muted-foreground">
          Manage your projects and coordinate campaigns
        </p>
      </header>

      <div className="flex justify-between items-center mb-6">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            size="sm"
            variant={filterCategory === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterCategory('all')}
          >
            All
          </Button>
          {allCategories.map(category => (
            <Button
              key={category}
              size="sm"
              variant={filterCategory === category ? 'default' : 'outline'}
              onClick={() => setFilterCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        <Button onClick={() => router.push('/projects/new')}>
          Create New Project
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium mb-2">No projects found</h3>
          <p className="text-muted-foreground mb-6">
            Try adjusting your search or create a new project
          </p>
          <Button onClick={() => router.push('/projects/new')}>
            Create New Project
          </Button>
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const router = useRouter();

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="line-clamp-1">{project.name}</CardTitle>
            <CardDescription className="line-clamp-2">
              {project.description}
            </CardDescription>
          </div>
          {project.verified && (
            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
              Verified
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1">
            {project.category.map(cat => (
              <Badge key={cat} variant="secondary" className="bg-gray-100">
                {cat}
              </Badge>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <div className="text-muted-foreground">Total Campaigns</div>
              <div className="font-medium">{project.stats.totalCampaigns}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Active Campaigns</div>
              <div className="font-medium">{project.stats.activeCampaigns}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Participants</div>
              <div className="font-medium">{project.stats.participantCount.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Participation Rate</div>
              <div className="font-medium">{project.stats.participationRate}%</div>
            </div>
          </div>

          <div className="text-sm">
            <div className="text-muted-foreground mb-1">Follower Growth</div>
            <div className="flex justify-between">
              <div className="flex gap-1 items-center">
                <span className="text-blue-600">TG:</span>
                <span className="font-medium">+{project.stats.followerGrowth.telegram.toLocaleString()}</span>
              </div>
              <div className="flex gap-1 items-center">
                <span className="text-blue-600">X:</span>
                <span className="font-medium">+{project.stats.followerGrowth.x.toLocaleString()}</span>
              </div>
              {project.stats.followerGrowth.discord && (
                <div className="flex gap-1 items-center">
                  <span className="text-blue-600">DC:</span>
                  <span className="font-medium">+{project.stats.followerGrowth.discord.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          <div className="text-sm">
            <div className="text-muted-foreground mb-1">Subscription</div>
            <div className="flex justify-between items-center">
              <Badge className={`${
                project.subscription.planId === 'enterprise' ? 'bg-purple-100 text-purple-700' :
                project.subscription.planId === 'pro' ? 'bg-blue-100 text-blue-700' :
                'bg-green-100 text-green-700'
              }`}>
                {project.subscription.planName}
              </Badge>
              <div className="font-medium">
                {project.subscription.campaignsRemaining} campaigns left
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/projects/${project.id}/campaigns`)}
        >
          View Campaigns
        </Button>
        <Button
          size="sm"
          onClick={() => router.push(`/projects/${project.id}`)}
        >
          Manage Project
        </Button>
      </CardFooter>
    </Card>
  );
}
