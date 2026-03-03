'use client';

// ============================================
// SYN ORGANISM — TYPE DEFINITIONS
// ============================================

// --- Mood / State ---

export type OrganismMood = 'idle' | 'thinking' | 'working' | 'happy' | 'alert';

export type OrganismStatus = 'online' | 'busy' | 'sleeping';

// --- Tasks ---

export type TaskType =
  | 'compress'
  | 'tag'
  | 'organize'
  | 'scrape'
  | 'analyze'
  | 'cleanup'
  | 'format-check';

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface OrganismTask {
  id: string;
  type: TaskType;
  status: TaskStatus;
  description: string;
  targetItems?: string[]; // E-Storage item IDs
  result?: string;
  error?: string;
  progress?: number; // 0-100
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

// --- Behaviors ---

export interface OrganismBehavior {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  triggerCondition: string; // human-readable
  requiresApproval: boolean;
}

// --- Config ---

export interface CompressionDefaults {
  platform: PlatformName;
  quality: number; // 0.0 - 1.0
}

export interface OrganismConfig {
  name: string; // default: "SYN"
  behaviors: OrganismBehavior[];
  userTraining: string; // free-text user preferences
  compressionDefaults: CompressionDefaults;
  notifications: boolean;
  initialized: boolean;
}

// --- Chat ---

export interface ChatMessage {
  id: string;
  role: 'user' | 'organism' | 'system';
  content: string;
  timestamp: string;
  actions?: OrganismAction[];
}

export interface OrganismAction {
  id: string;
  label: string;
  type: 'compress' | 'organize' | 'scrape' | 'tag' | 'navigate';
  payload?: string;
}

// --- Content Scraping ---

export interface ContentSuggestion {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  sourceUrl: string;
  sourceName: string; // 'unsplash' | 'pexels' | 'rss'
  type: 'image' | 'video' | 'article';
  author?: string;
  tags?: string[];
}

// --- Compression ---

export type PlatformName =
  | 'instagram-square'
  | 'instagram-portrait'
  | 'instagram-landscape'
  | 'twitter'
  | 'facebook'
  | 'tiktok';

export interface PlatformSpec {
  name: PlatformName;
  label: string;
  width: number;
  height: number;
  maxFileSize: number; // bytes
  quality: number; // 0.0-1.0
  format: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface CompressionResult {
  itemId: string;
  originalSize: number;
  compressedSize: number;
  savings: number; // percentage
  platform: PlatformName;
  blob: Blob;
}

// --- Activity Bubble ---

export interface ActivityNotification {
  id: string;
  icon: string;
  message: string;
  timestamp: string;
  dismissed: boolean;
}

// --- Copilot Bridge ---

export interface CopilotBridgeItem {
  id: string;
  title: string;
  type: string;
  tags: string[];
  folder: string;
  clippedAt: string;
  description?: string;
}

export interface CopilotBridge {
  requestClip: (itemIds: string[]) => Promise<void>;
  sendToScheduler: (itemId: string, platform: string) => Promise<void>;
  notifyCopilot: (message: string) => void;
}
