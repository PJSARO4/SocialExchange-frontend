/**
 * Chain Builder Types
 * Visual node-based automation workflow builder
 */

export type NodeType =
  | 'start'           // Trigger node - how the chain starts
  | 'pull-content'    // Pull content from sources
  | 'add-caption'     // Add/generate captions
  | 'schedule'        // Schedule for posting
  | 'filter'          // Filter/condition node
  | 'ai-enhance'      // AI enhancement
  | 'approval'        // Human approval gate
  | 'multi-platform'  // Split to multiple platforms
  | 'scrape'          // Scrape content from sources
  | 'delay'           // Add delay between actions
  | 'analytics'       // Check analytics before proceeding
  | 'end';            // End of chain

export interface NodePosition {
  x: number;
  y: number;
}

export interface NodeConnection {
  id: string;
  sourceNodeId: string;
  sourceHandle: 'output' | 'yes' | 'no'; // Output handles for conditions
  targetNodeId: string;
  targetHandle: 'input';
}

export interface BaseNodeData {
  label: string;
  description?: string;
  isConfigured: boolean;
}

// Start Node - Triggers
export interface StartNodeData extends BaseNodeData {
  triggerType: 'schedule' | 'manual' | 'new-content' | 'webhook' | 'event';
  scheduleInterval?: string; // "every 6 hours", "daily at 9am", etc.
  eventType?: string;
}

// Pull Content Node
export interface PullContentNodeData extends BaseNodeData {
  source: 'library' | 'rss' | 'scrape' | 'ai-generate' | 'upload';
  sourceUrl?: string;
  contentType?: 'image' | 'video' | 'carousel' | 'any';
  selectionMethod?: 'random' | 'newest' | 'oldest' | 'highest-engagement';
  limit?: number;
}

// Add Caption Node
export interface AddCaptionNodeData extends BaseNodeData {
  captionSource: 'template' | 'ai-generate' | 'original' | 'custom';
  template?: string;
  aiPrompt?: string;
  includeHashtags?: boolean;
  hashtagStrategy?: 'trending' | 'niche' | 'custom';
  customHashtags?: string[];
  includeCTA?: boolean;
  ctaText?: string;
}

// Schedule Node
export interface ScheduleNodeData extends BaseNodeData {
  scheduleType: 'immediate' | 'best-time' | 'custom' | 'queue';
  customTime?: string;
  timezone?: string;
  queuePosition?: 'next' | 'last';
}

// Filter Node
export interface FilterNodeData extends BaseNodeData {
  conditionType: 'content-type' | 'engagement' | 'time' | 'custom';
  operator: 'equals' | 'contains' | 'greater-than' | 'less-than';
  value: string | number;
}

// Scrape Node
export interface ScrapeNodeData extends BaseNodeData {
  scrapeSource: 'instagram' | 'tiktok' | 'twitter' | 'pinterest' | 'custom';
  targetType: 'hashtag' | 'user' | 'trending' | 'url';
  targetValue: string;
  scrapeLimit: number;
  filterNSFW: boolean;
  minEngagement?: number;
}

// Delay Node
export interface DelayNodeData extends BaseNodeData {
  delayType: 'fixed' | 'random' | 'human-like';
  duration: number; // in seconds
  randomRange?: { min: number; max: number };
}

// AI Enhance Node
export interface AIEnhanceNodeData extends BaseNodeData {
  enhanceType: 'caption' | 'image' | 'hashtags' | 'all';
  style?: 'professional' | 'casual' | 'funny' | 'informative';
  tone?: string;
}

// Approval Node
export interface ApprovalNodeData extends BaseNodeData {
  approvalType: 'manual' | 'auto-after-delay' | 'ai-review';
  autoApproveAfter?: number; // hours
  notifyVia?: 'email' | 'push' | 'both';
}

// Multi-Platform Node
export interface MultiPlatformNodeData extends BaseNodeData {
  platforms: ('instagram' | 'tiktok' | 'twitter' | 'facebook' | 'youtube')[];
  adaptContent: boolean; // Resize/reformat for each platform
}

// Analytics Node
export interface AnalyticsNodeData extends BaseNodeData {
  checkType: 'follower-count' | 'engagement-rate' | 'best-time' | 'recent-performance';
  threshold?: number;
  action: 'proceed' | 'skip' | 'delay';
}

export type NodeData =
  | StartNodeData
  | PullContentNodeData
  | AddCaptionNodeData
  | ScheduleNodeData
  | FilterNodeData
  | ScrapeNodeData
  | DelayNodeData
  | AIEnhanceNodeData
  | ApprovalNodeData
  | MultiPlatformNodeData
  | AnalyticsNodeData
  | BaseNodeData;

export interface ChainNode {
  id: string;
  type: NodeType;
  position: NodePosition;
  data: NodeData;
  selected?: boolean;
}

export interface AutomationChain {
  id: string;
  name: string;
  description?: string;
  feedId: string;
  nodes: ChainNode[];
  connections: NodeConnection[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  runCount: number;
  status: 'draft' | 'active' | 'paused' | 'error';
}

// Node catalog for the sidebar
export interface NodeCatalogItem {
  type: NodeType;
  label: string;
  description: string;
  icon: string;
  category: 'trigger' | 'content' | 'transform' | 'output' | 'control';
  color: string;
}

export const NODE_CATALOG: NodeCatalogItem[] = [
  // Triggers
  {
    type: 'start',
    label: 'Start Chain',
    description: 'How the automation begins',
    icon: '▶️',
    category: 'trigger',
    color: '#10b981',
  },
  // Content
  {
    type: 'pull-content',
    label: 'Pull Content',
    description: 'Get content from a source',
    icon: '📥',
    category: 'content',
    color: '#3b82f6',
  },
  {
    type: 'scrape',
    label: 'Scrape Content',
    description: 'Scrape from social platforms',
    icon: '🔍',
    category: 'content',
    color: '#8b5cf6',
  },
  // Transform
  {
    type: 'add-caption',
    label: 'Add Caption',
    description: 'Generate or add captions',
    icon: '✏️',
    category: 'transform',
    color: '#f59e0b',
  },
  {
    type: 'ai-enhance',
    label: 'AI Enhance',
    description: 'Enhance with AI',
    icon: '🤖',
    category: 'transform',
    color: '#ec4899',
  },
  // Control
  {
    type: 'filter',
    label: 'Filter',
    description: 'Add conditions',
    icon: '🔀',
    category: 'control',
    color: '#6366f1',
  },
  {
    type: 'delay',
    label: 'Delay',
    description: 'Wait before continuing',
    icon: '⏱️',
    category: 'control',
    color: '#94a3b8',
  },
  {
    type: 'approval',
    label: 'Approval Gate',
    description: 'Require approval',
    icon: '✅',
    category: 'control',
    color: '#14b8a6',
  },
  // Output
  {
    type: 'schedule',
    label: 'Schedule Post',
    description: 'Schedule for publishing',
    icon: '📅',
    category: 'output',
    color: '#ef4444',
  },
  {
    type: 'multi-platform',
    label: 'Multi-Platform',
    description: 'Post to multiple platforms',
    icon: '🌐',
    category: 'output',
    color: '#22c55e',
  },
  {
    type: 'end',
    label: 'End Chain',
    description: 'End of automation',
    icon: '🏁',
    category: 'output',
    color: '#64748b',
  },
];
