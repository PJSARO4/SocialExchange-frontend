'use client';

// ============================================
// PLATFORM TYPES
// ============================================

export type Platform =
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'twitter'
  | 'youtube'
  | 'linkedin';

export type ConnectionStatus = 'active' | 'expired' | 'error' | 'pending';
export type ControlMode = 'autopilot' | 'escrow' | 'manual' | 'observation';

// ============================================
// FEED METRICS
// ============================================

export interface FeedMetrics {
  followers?: number;
  following?: number;
  engagement?: number;        // engagement rate percentage
  postsPerWeek?: number;
  totalPosts?: number;
  avgLikes?: number;
  avgComments?: number;
  uptime?: number;            // percentage
  lastPostAt?: string;
}

// ============================================
// FEED (CONNECTED SOCIAL ACCOUNT)
// ============================================

export interface Feed {
  id: string;
  userId: string;
  platform: Platform;
  handle: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;

  // Connection state
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  lastSync: string | null;

  // OAuth fields
  platformUserId?: string;    // User ID from the platform (e.g., Instagram user ID)
  accessToken?: string;       // OAuth access token for API calls
  refreshToken?: string;      // OAuth refresh token (if available)
  tokenExpiresAt?: string;    // When the access token expires
  isOAuth: boolean;           // Whether connected via OAuth or manual entry

  // Automation state
  automationEnabled: boolean;
  controlMode: ControlMode;

  // Metrics
  metrics: FeedMetrics;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ============================================
// PLATFORM METADATA
// ============================================

export interface PlatformInfo {
  id: Platform;
  label: string;
  icon: string;
  color: string;
  supportsVideo: boolean;
  supportsCarousel: boolean;
  maxCaptionLength: number;
}

export const PLATFORMS: Record<Platform, PlatformInfo> = {
  instagram: {
    id: 'instagram',
    label: 'Instagram',
    icon: '📸',
    color: '#E4405F',
    supportsVideo: true,
    supportsCarousel: true,
    maxCaptionLength: 2200,
  },
  tiktok: {
    id: 'tiktok',
    label: 'TikTok',
    icon: '🎵',
    color: '#000000',
    supportsVideo: true,
    supportsCarousel: false,
    maxCaptionLength: 2200,
  },
  facebook: {
    id: 'facebook',
    label: 'Facebook',
    icon: '👤',
    color: '#1877F2',
    supportsVideo: true,
    supportsCarousel: true,
    maxCaptionLength: 63206,
  },
  twitter: {
    id: 'twitter',
    label: 'X (Twitter)',
    icon: '𝕏',
    color: '#000000',
    supportsVideo: true,
    supportsCarousel: true,
    maxCaptionLength: 280,
  },
  youtube: {
    id: 'youtube',
    label: 'YouTube',
    icon: '▶️',
    color: '#FF0000',
    supportsVideo: true,
    supportsCarousel: false,
    maxCaptionLength: 5000,
  },
  linkedin: {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: '💼',
    color: '#0A66C2',
    supportsVideo: true,
    supportsCarousel: true,
    maxCaptionLength: 3000,
  },
};

// ============================================
// CREATE FEED PAYLOAD
// ============================================

export interface CreateFeedPayload {
  platform: Platform;
  handle: string;
  displayName: string;
  avatarUrl?: string;
  // OAuth fields
  platformUserId?: string;
  accessToken?: string;
  refreshToken?: string;
  isOAuth?: boolean;
  // Initial metrics from API
  initialMetrics?: {
    followers?: number;
    following?: number;
    totalPosts?: number;
  };
}

// ============================================
// UPDATE FEED PAYLOAD
// ============================================

export interface UpdateFeedPayload {
  displayName?: string;
  avatarUrl?: string;
  automationEnabled?: boolean;
  controlMode?: ControlMode;
}
