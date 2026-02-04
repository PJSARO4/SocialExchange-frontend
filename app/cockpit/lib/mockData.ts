// Centralized mock data with strong typing

export interface FeedAsset {
  id: string;
  platform: 'instagram' | 'twitter' | 'tiktok' | 'youtube' | 'linkedin';
  handle: string;
  displayName: string;
  status: {
    active: boolean;
    automated: boolean;
    inEscrow: boolean;
  };
  metrics: {
    followers: number;
    engagement: number;
    automationUptime: number;
    postsPerWeek: number;
  };
  shares: {
    issued: boolean;
    totalSupply: number;
    outstanding: number;
    retainedByOwner: number;
    initialPrice: number;
    currentPrice: number;
  } | null;
  ticker?: string;
}

export interface ScheduledPost {
  id: string;
  accountId: string;
  dayOfWeek: number;
  hour: number;
  minute: number;
  caption: string;
  mediaType: 'image' | 'video' | 'carousel';
  status: 'scheduled' | 'automated';
  platform: 'instagram';
}

export interface DraftPost {
  id: string;
  accountId: string;
  caption: string;
  mediaType: 'image' | 'video' | 'carousel';
  lastEdited: string;
}

export interface AutomationChainNode {
  id: string;
  type: 'trigger' | 'content_source' | 'caption' | 'scheduler' | 'dispatch';
  title: string;
  status: string;
  config: Record<string, any>;
}

export interface AutomationChain {
  id: string;
  accountId: string;
  status: 'draft' | 'armed' | 'paused';
  nodes: AutomationChainNode[];
}

// Mock data
export const mockFeedAssets: FeedAsset[] = [
  {
    id: 'feed_1',
    platform: 'instagram',
    handle: '@urban_signal',
    displayName: 'Urban Signal',
    status: {
      active: true,
      automated: true,
      inEscrow: false
    },
    metrics: {
      followers: 12400,
      engagement: 4.2,
      automationUptime: 98.5,
      postsPerWeek: 7
    },
    shares: {
      issued: true,
      totalSupply: 1000,
      outstanding: 650,
      retainedByOwner: 350,
      initialPrice: 10.00,
      currentPrice: 12.45
    },
    ticker: '$URBAN'
  },
  {
    id: 'feed_2',
    platform: 'instagram',
    handle: '@tech_insights',
    displayName: 'Tech Insights',
    status: {
      active: true,
      automated: true,
      inEscrow: true
    },
    metrics: {
      followers: 8900,
      engagement: 3.8,
      automationUptime: 99.2,
      postsPerWeek: 5
    },
    shares: {
      issued: true,
      totalSupply: 800,
      outstanding: 720,
      retainedByOwner: 80,
      initialPrice: 8.50,
      currentPrice: 11.20
    },
    ticker: '$TECH'
  },
  {
    id: 'feed_3',
    platform: 'instagram',
    handle: '@lifestyle_studio',
    displayName: 'Lifestyle Studio',
    status: {
      active: true,
      automated: false,
      inEscrow: false
    },
    metrics: {
      followers: 5600,
      engagement: 3.1,
      automationUptime: 0,
      postsPerWeek: 3
    },
    shares: null,
    ticker: undefined
  }
];

export const mockScheduledPosts: ScheduledPost[] = [
  {
    id: 'post_1',
    accountId: 'feed_1',
    dayOfWeek: 1,
    hour: 9,
    minute: 0,
    caption: 'New collection dropping tomorrow. Stay tuned for exclusive previews.',
    mediaType: 'image',
    status: 'scheduled',
    platform: 'instagram'
  },
  {
    id: 'post_2',
    accountId: 'feed_1',
    dayOfWeek: 1,
    hour: 14,
    minute: 30,
    caption: 'Behind the scenes of our latest photoshoot. Swipe to see more!',
    mediaType: 'carousel',
    status: 'automated',
    platform: 'instagram'
  },
  {
    id: 'post_3',
    accountId: 'feed_1',
    dayOfWeek: 2,
    hour: 11,
    minute: 0,
    caption: 'Weekend vibes. Here are 5 ways to maximize your productivity.',
    mediaType: 'video',
    status: 'scheduled',
    platform: 'instagram'
  }
];

export const mockDraftPosts: DraftPost[] = [
  {
    id: 'draft_1',
    accountId: 'feed_1',
    caption: 'Thinking about launching a new series focused on...',
    mediaType: 'image',
    lastEdited: '2 hours ago'
  },
  {
    id: 'draft_2',
    accountId: 'feed_1',
    caption: 'Quick tip: The best time to post is...',
    mediaType: 'video',
    lastEdited: '1 day ago'
  }
];

export const mockAutomationChain: AutomationChain = {
  id: 'chain_1',
  accountId: 'feed_1',
  status: 'armed',
  nodes: [
    {
      id: 'node_1',
      type: 'trigger',
      title: 'Scheduled Trigger',
      status: 'Every day at 9:00 AM',
      config: {
        schedule: '0 9 * * *',
        timezone: 'America/New_York'
      }
    },
    {
      id: 'node_2',
      type: 'content_source',
      title: 'Content Library',
      status: 'Ready • 24 items',
      config: {
        source: 'library',
        libraryId: 'lib_1',
        selectionMode: 'sequential'
      }
    },
    {
      id: 'node_3',
      type: 'caption',
      title: 'Caption Generator',
      status: 'Template configured',
      config: {
        mode: 'template',
        template: 'Check out our latest {product}! #brand #newrelease'
      }
    },
    {
      id: 'node_4',
      type: 'scheduler',
      title: 'Scheduler',
      status: 'Configured',
      config: {
        postTime: '09:00',
        daysOfWeek: [1, 2, 3, 4, 5]
      }
    },
    {
      id: 'node_5',
      type: 'dispatch',
      title: 'Instagram Dispatch',
      status: 'Ready to publish',
      config: {
        platform: 'instagram',
        accountId: 'feed_1'
      }
    }
  ]
};