// Ad Creator Types

export type AdPlatform = 'instagram' | 'facebook' | 'twitter' | 'tiktok' | 'linkedin';
export type AdObjective = 'awareness' | 'traffic' | 'engagement' | 'leads' | 'sales' | 'app_installs';
export type AdFormat = 'single_image' | 'carousel' | 'video' | 'story' | 'reel' | 'collection';
export type AdStatus = 'draft' | 'pending_review' | 'active' | 'paused' | 'completed' | 'rejected';
export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';

export interface AdCreative {
  id: string;
  type: AdFormat;
  headline?: string;
  primaryText: string;
  description?: string;
  callToAction: string;
  destinationUrl?: string;
  mediaUrls: string[];
  thumbnailUrl?: string;
}

export interface AdTargeting {
  locations: string[];
  ageMin: number;
  ageMax: number;
  genders: ('male' | 'female' | 'all')[];
  interests: string[];
  behaviors: string[];
  customAudiences: string[];
  excludedAudiences: string[];
  languages: string[];
  placements: string[];
}

export interface AdBudget {
  type: 'daily' | 'lifetime';
  amount: number;
  currency: string;
  bidStrategy: 'lowest_cost' | 'cost_cap' | 'bid_cap';
  bidAmount?: number;
}

export interface AdSchedule {
  startDate: string;
  endDate?: string;
  timezone: string;
  dayParting?: {
    [day: string]: { start: string; end: string }[];
  };
}

export interface Ad {
  id: string;
  campaignId: string;
  name: string;
  platform: AdPlatform;
  objective: AdObjective;
  creative: AdCreative;
  targeting: AdTargeting;
  budget: AdBudget;
  schedule: AdSchedule;
  status: AdStatus;
  metrics?: AdMetrics;
  createdAt: string;
  updatedAt: string;
}

export interface AdMetrics {
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  spend: number;
  conversions: number;
  costPerResult: number;
  frequency: number;
  engagement: number;
}

export interface Campaign {
  id: string;
  feedId: string;
  name: string;
  objective: AdObjective;
  status: CampaignStatus;
  budget: AdBudget;
  schedule: AdSchedule;
  ads: Ad[];
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail: string;
  platforms: AdPlatform[];
  format: AdFormat;
  objective: AdObjective;
  previewUrl?: string;
  creative: Partial<AdCreative>;
}

// Template categories for browsing
export const AD_TEMPLATE_CATEGORIES = [
  { id: 'all', name: 'All Templates', icon: '📋' },
  { id: 'product', name: 'Product Showcase', icon: '🛍️' },
  { id: 'service', name: 'Service Promotion', icon: '💼' },
  { id: 'event', name: 'Event & Launch', icon: '🎉' },
  { id: 'seasonal', name: 'Seasonal & Holiday', icon: '🎄' },
  { id: 'testimonial', name: 'Social Proof', icon: '⭐' },
  { id: 'lead', name: 'Lead Generation', icon: '📧' },
];

// Ad objectives with descriptions
export const AD_OBJECTIVES: { id: AdObjective; name: string; description: string; icon: string }[] = [
  { id: 'awareness', name: 'Brand Awareness', description: 'Reach people likely to pay attention to your ads', icon: '👁️' },
  { id: 'traffic', name: 'Traffic', description: 'Send people to a destination like a website or app', icon: '🔗' },
  { id: 'engagement', name: 'Engagement', description: 'Get more likes, comments, shares, and event responses', icon: '💬' },
  { id: 'leads', name: 'Lead Generation', description: 'Collect leads for your business or brand', icon: '📋' },
  { id: 'sales', name: 'Sales', description: 'Find people likely to purchase your product or service', icon: '💰' },
  { id: 'app_installs', name: 'App Installs', description: 'Get people to install your app', icon: '📱' },
];

// Platform info
export const AD_PLATFORMS: { id: AdPlatform; name: string; icon: string; formats: AdFormat[] }[] = [
  { id: 'instagram', name: 'Instagram', icon: '📸', formats: ['single_image', 'carousel', 'video', 'story', 'reel'] },
  { id: 'facebook', name: 'Facebook', icon: '👤', formats: ['single_image', 'carousel', 'video', 'collection'] },
  { id: 'twitter', name: 'Twitter/X', icon: '🐦', formats: ['single_image', 'carousel', 'video'] },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', formats: ['video'] },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', formats: ['single_image', 'carousel', 'video'] },
];

// Call to action options
export const CTA_OPTIONS = [
  'Learn More',
  'Shop Now',
  'Sign Up',
  'Book Now',
  'Contact Us',
  'Download',
  'Get Quote',
  'Get Offer',
  'Watch More',
  'Apply Now',
  'Subscribe',
  'Get Started',
];
