export interface ProjectStats {
  totalCampaigns: number;
  activeCampaigns: number;
  participantCount: number;
  participationRate: number;
  averageEngagement: number;
  followerGrowth: {
    telegram: number;
    x: number;
    discord?: number;
    total: number;
  };
}

export interface SocialMediaAccounts {
  telegram: {
    username: string;
    channelName?: string;
    channelUrl?: string;
    memberCount?: number;
  };
  x: {
    username: string;
    followersCount?: number;
    profileUrl?: string;
  };
  discord?: {
    serverName: string;
    serverUrl?: string;
    memberCount?: number;
  };
  website?: string;
}

export interface BotSubscription {
  planId: string;
  planName: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  campaignsRemaining: number;
  features: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  logo?: string;
  owners: {
    telegramId: number;
    telegramUsername?: string;
    role: 'admin' | 'manager' | 'member';
  }[];
  socialAccounts: SocialMediaAccounts;
  category: string[]; // 'NFT', 'DeFi', 'GameFi', etc.
  subscription: BotSubscription;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
  stats: ProjectStats;
  settings: {
    defaultReminderInterval: number; // Hours
    defaultReminderPlatforms: string[];
    defaultCampaignDuration: number; // Days
    autoRenewal: boolean;
    preferredRewardTypes: string[];
  };
}
