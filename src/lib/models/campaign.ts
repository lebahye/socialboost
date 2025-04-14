export interface CampaignParticipant {
  userId: string;
  telegramUsername?: string;
  participated: boolean;
  participationDate?: Date;
  rewarded: boolean;
  rewardType?: string;
}

export type RewardType = 'community_role' | 'exclusive_access' | 'recognition' | 'merchandise' | 'whitelist' | 'custom';

export interface Reward {
  type: RewardType;
  description: string;
  requirements?: string;
  value?: string; // This is for description only, not monetary value
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  projectName: string;
  xPostUrl: string;
  discordUrl?: string;
  telegramChannelUrl?: string;
  startDate: Date;
  endDate: Date;
  targetParticipants: number;
  currentParticipants: number;
  rewards: Reward[];
  createdBy: number; // Telegram ID of project owner
  participants: CampaignParticipant[];
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  reminders: {
    sendAutomatically: boolean;
    platforms: {
      telegram: boolean;
      x: boolean;
      discord?: boolean;
    };
    interval: number; // In hours
    lastSent?: Date;
  };
  private: boolean; // If true, only visible to invited participants
  tags: string[]; // E.g., "NFT", "DeFi", "GameFi", etc.
  requirements?: string; // Any specific requirements for participation
  stats?: {
    participationRate: number;
    completionRate: number;
    engagement: {
      likes: number;
      retweets: number;
      comments: number;
      mentions: number;
    };
    growth: {
      newFollowers: number;
      impressions: number;
      reach: number;
    };
  };
}
