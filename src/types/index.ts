
export interface Campaign {
  id: string;
  projectId: string;
  title: string;
  status: 'active' | 'completed' | 'draft';
  participants: string[];
  stats: {
    engagement: {
      likes: number;
      retweets: number;
      comments: number;
    };
  };
}

export interface Project {
  id: string;
  ownerId: string;
  name: string;
  campaigns: Campaign[];
}
