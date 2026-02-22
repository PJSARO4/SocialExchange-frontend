'use client';

import { AutomationChain, ChainNode, NodeConnection } from '../components/automation/chain-builder/types';
import { addScheduledPost } from './scheduler-store';

/**
 * Automation Chain Executor
 * Handles running automation chains with support for schedule-based and manual triggers
 */

// Types
interface ScheduledPost {
  id: string;
  feedId: string;
  platform: string;
  mediaUrl: string;
  caption: string;
  scheduledFor: string;
  status: 'scheduled' | 'posted' | 'failed';
  createdAt: string;
}

interface ContentItem {
  id: string;
  title?: string;
  description?: string;
  mediaUrl?: string;
  type?: 'image' | 'video' | 'carousel';
  createdAt: string;
}

interface ChainRun {
  id: string;
  chainId: string;
  feedId: string;
  startedAt: string;
  completedAt?: string;
  status: 'running' | 'completed' | 'failed';
  nodesExecuted: string[];
  result?: Record<string, any>;
  error?: string;
}

interface RateLimitData {
  likes: number;
  comments: number;
  follows: number;
  dms: number;
}

interface RateLimitStatus {
  daily: RateLimitData;
  usage: RateLimitData;
  lastReset: string;
}

// Storage keys
const STORAGE_KEYS = {
  CHAINS: 'se-automation-chains',
  RUNS: 'se-automation-runs',
  SCHEDULED_POSTS: 'socialexchange_scheduled_posts',
  CONTENT: 'socialexchange_content',
  FEEDS: 'socialexchange_feeds',
  RATE_LIMITS: 'se-automation-rate-limits',
};

// Rate limits per day per feed
const DAILY_LIMITS: RateLimitData = {
  likes: 150,
  comments: 30,
  follows: 50,
  dms: 20,
};

// Global state
let engineRunning = false;
let activeIntervals: Map<string, NodeJS.Timeout> = new Map();

/**
 * Load chains from localStorage
 */
function loadChains(): AutomationChain[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CHAINS);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Load scheduled posts from localStorage
 */
function loadScheduledPosts(): ScheduledPost[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SCHEDULED_POSTS);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save scheduled posts to localStorage
 */
function saveScheduledPosts(posts: ScheduledPost[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.SCHEDULED_POSTS, JSON.stringify(posts));
}

/**
 * Load content from localStorage
 */
function loadContent(): ContentItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CONTENT);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Load feeds from localStorage
 */
function loadFeeds(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.FEEDS);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Load run history from localStorage
 */
function loadRunHistory(): ChainRun[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.RUNS);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save run history to localStorage
 */
function saveRunHistory(runs: ChainRun[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.RUNS, JSON.stringify(runs));
}

/**
 * Get or initialize rate limit status for a feed
 */
function getRateLimitStatus(feedId: string): RateLimitStatus {
  if (typeof window === 'undefined') {
    return {
      daily: { ...DAILY_LIMITS },
      usage: { likes: 0, comments: 0, follows: 0, dms: 0 },
      lastReset: new Date().toISOString(),
    };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.RATE_LIMITS);
    const allLimits: Record<string, RateLimitStatus> = stored ? JSON.parse(stored) : {};

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (!allLimits[feedId]) {
      allLimits[feedId] = {
        daily: { ...DAILY_LIMITS },
        usage: { likes: 0, comments: 0, follows: 0, dms: 0 },
        lastReset: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEYS.RATE_LIMITS, JSON.stringify(allLimits));
      return allLimits[feedId];
    }

    // Reset if it's a new day
    const lastResetDate = new Date(allLimits[feedId].lastReset).toISOString().split('T')[0];
    if (lastResetDate !== today) {
      allLimits[feedId].usage = { likes: 0, comments: 0, follows: 0, dms: 0 };
      allLimits[feedId].lastReset = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.RATE_LIMITS, JSON.stringify(allLimits));
    }

    return allLimits[feedId];
  } catch {
    return {
      daily: { ...DAILY_LIMITS },
      usage: { likes: 0, comments: 0, follows: 0, dms: 0 },
      lastReset: new Date().toISOString(),
    };
  }
}

/**
 * Update rate limit usage
 */
function updateRateLimit(feedId: string, action: keyof RateLimitData, count: number = 1): boolean {
  if (typeof window === 'undefined') return false;

  const status = getRateLimitStatus(feedId);

  if (status.usage[action] + count > status.daily[action]) {
    console.warn(`Rate limit exceeded for ${action}`);
    return false;
  }

  status.usage[action] += count;

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.RATE_LIMITS);
    const allLimits: Record<string, RateLimitStatus> = stored ? JSON.parse(stored) : {};
    allLimits[feedId] = status;
    localStorage.setItem(STORAGE_KEYS.RATE_LIMITS, JSON.stringify(allLimits));
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the next node(s) in the chain
 */
function getNextNodes(currentNodeId: string, connections: NodeConnection[], sourceHandle: string = 'output'): string[] {
  return connections
    .filter(c => c.sourceNodeId === currentNodeId && c.sourceHandle === sourceHandle)
    .map(c => c.targetNodeId);
}

/**
 * Find node by ID
 */
function findNode(nodes: ChainNode[], nodeId: string): ChainNode | undefined {
  return nodes.find(n => n.id === nodeId);
}

/**
 * Execute a start node (trigger)
 */
async function executeStartNode(node: ChainNode): Promise<Record<string, any>> {
  const data = node.data as any;
  return {
    triggerType: data.triggerType,
    triggeredAt: new Date().toISOString(),
  };
}

/**
 * Execute a pull-content node
 */
async function executePullContentNode(node: ChainNode): Promise<ContentItem | null> {
  const data = node.data as any;
  const content = loadContent();

  if (content.length === 0) {
    console.warn('No content available to pull');
    return null;
  }

  let selected: ContentItem | null = null;

  if (data.selectionMethod === 'random') {
    selected = content[Math.floor(Math.random() * content.length)];
  } else if (data.selectionMethod === 'newest') {
    selected = content.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  } else if (data.selectionMethod === 'oldest') {
    selected = content.sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )[0];
  } else {
    // Default to newest
    selected = content.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  }

  if (data.limit && selected) {
    // Limit could apply to batch operations
  }

  return selected || null;
}

/**
 * Execute an ai-enhance node
 */
async function executeAIEnhanceNode(
  node: ChainNode,
  contextData: Record<string, any>
): Promise<Record<string, any>> {
  const data = node.data as any;
  let caption = contextData.caption || '';

  if (data.enhanceType === 'caption' || data.enhanceType === 'all') {
    // Simple local enhancement (no API call needed)
    if (!caption) {
      caption = 'Check out this amazing content! 📸';
    }

    // Add emojis based on tone
    if (data.tone === 'professional') {
      caption = `${caption} 💼`;
    } else if (data.tone === 'casual') {
      caption = `${caption} 😊`;
    } else if (data.tone === 'funny') {
      caption = `${caption} 😂`;
    }
  }

  if (data.enhanceType === 'hashtags' || data.enhanceType === 'all') {
    // Add default hashtags if not present
    if (!caption.includes('#')) {
      const defaultHashtags = ['#SocialExchange', '#Automation', '#ContentCreator'];
      caption = `${caption}\n\n${defaultHashtags.join(' ')}`;
    }
  }

  return {
    ...contextData,
    caption,
    enhanced: true,
  };
}

/**
 * Execute a filter node
 */
async function executeFilterNode(
  node: ChainNode,
  contextData: Record<string, any>
): Promise<{ pass: boolean; reason?: string }> {
  const data = node.data as any;

  // Simple filter logic
  if (data.conditionType === 'content-type') {
    const contentType = contextData.type || 'unknown';
    const passes = !data.value || contentType === data.value;
    return { pass: passes };
  }

  if (data.conditionType === 'engagement') {
    const engagement = contextData.engagement || 0;
    const threshold = data.value || 0;
    const passes = engagement >= threshold;
    return { pass: passes };
  }

  if (data.conditionType === 'time') {
    const now = new Date();
    const hour = now.getHours();
    const passes = hour >= (data.value?.start || 0) && hour <= (data.value?.end || 23);
    return { pass: passes };
  }

  // Default pass
  return { pass: true };
}

/**
 * Execute a delay node
 */
async function executeDelayNode(node: ChainNode): Promise<void> {
  const data = node.data as any;
  let delayMs = 1000;

  if (data.delayType === 'fixed') {
    delayMs = (data.duration || 5) * 1000;
  } else if (data.delayType === 'random') {
    const min = (data.randomRange?.min || 1) * 1000;
    const max = (data.randomRange?.max || 5) * 1000;
    delayMs = Math.random() * (max - min) + min;
  } else if (data.delayType === 'human-like') {
    // Random delay between 1-3 seconds
    delayMs = Math.random() * 2000 + 1000;
  }

  return new Promise(resolve => setTimeout(resolve, delayMs));
}

/**
 * Execute a schedule node (post scheduling)
 */
async function executeScheduleNode(
  node: ChainNode,
  feedId: string,
  contextData: Record<string, any>
): Promise<any | null> {
  const data = node.data as any;

  if (!contextData.mediaUrl) {
    console.warn('No media URL available for scheduling');
    return null;
  }

  let scheduledFor = new Date().toISOString();

  if (data.scheduleType === 'best-time') {
    // For demo, schedule 1 hour from now
    const future = new Date();
    future.setHours(future.getHours() + 1);
    scheduledFor = future.toISOString();
  } else if (data.scheduleType === 'custom' && data.customTime) {
    scheduledFor = new Date(data.customTime).toISOString();
  } else if (data.scheduleType === 'immediate') {
    scheduledFor = new Date().toISOString();
  }

  try {
    // Use the scheduler-store to create a scheduled post
    const post = addScheduledPost({
      feedId,
      platform: 'instagram',
      caption: contextData.caption || '',
      mediaUrls: [contextData.mediaUrl],
      mediaType: contextData.type === 'video' ? 'VIDEO' : contextData.type === 'carousel' ? 'CAROUSEL' : 'IMAGE',
      scheduledFor,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      status: 'scheduled',
    });

    return post;
  } catch (error) {
    console.error('Error scheduling post:', error);
    return null;
  }
}

/**
 * Execute a multi-platform node
 */
async function executeMultiPlatformNode(
  node: ChainNode,
  contextData: Record<string, any>
): Promise<Record<string, any>> {
  const data = node.data as any;

  return {
    ...contextData,
    targetPlatforms: data.platforms || ['instagram'],
    adaptContent: data.adaptContent !== false,
  };
}

/**
 * Execute an approval node
 */
async function executeApprovalNode(
  node: ChainNode,
  contextData: Record<string, any>
): Promise<{ approved: boolean; reason?: string }> {
  const data = node.data as any;

  if (data.approvalType === 'auto-after-delay') {
    // For demo, auto-approve after delay
    const delayHours = data.autoApproveAfter || 1;
    return { approved: true };
  }

  if (data.approvalType === 'manual') {
    // For demo, auto-approve
    return { approved: true };
  }

  return { approved: true };
}

/**
 * Execute an analytics node
 */
async function executeAnalyticsNode(
  node: ChainNode,
  contextData: Record<string, any>
): Promise<{ proceed: boolean; action: 'proceed' | 'skip' | 'delay' }> {
  const data = node.data as any;

  // Simple analytics check
  if (data.checkType === 'recent-performance') {
    // For demo, always proceed
    return { proceed: true, action: 'proceed' };
  }

  return { proceed: true, action: 'proceed' };
}

/**
 * Execute an end node
 */
async function executeEndNode(node: ChainNode, contextData: Record<string, any>): Promise<Record<string, any>> {
  return {
    ...contextData,
    completedAt: new Date().toISOString(),
  };
}

/**
 * Execute the chain
 */
async function executeChain(
  chain: AutomationChain,
  startNodeId?: string
): Promise<ChainRun> {
  const runId = `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const run: ChainRun = {
    id: runId,
    chainId: chain.id,
    feedId: chain.feedId,
    startedAt: new Date().toISOString(),
    status: 'running',
    nodesExecuted: [],
    result: {},
  };

  try {
    // Find start node
    const currentStartNodeId = startNodeId || chain.nodes.find(n => n.type === 'start')?.id;
    if (!currentStartNodeId) {
      throw new Error('No start node found');
    }

    let contextData: Record<string, any> = {};
    let currentNodeIds = [currentStartNodeId];
    const visited = new Set<string>();

    while (currentNodeIds.length > 0) {
      const nodeId = currentNodeIds[0];

      if (visited.has(nodeId)) {
        currentNodeIds.shift();
        continue;
      }

      visited.add(nodeId);
      const node = findNode(chain.nodes, nodeId);

      if (!node) {
        currentNodeIds.shift();
        continue;
      }

      run.nodesExecuted.push(nodeId);

      try {
        // Execute node based on type
        if (node.type === 'start') {
          contextData = await executeStartNode(node);
        } else if (node.type === 'pull-content') {
          const content = await executePullContentNode(node);
          if (content) {
            contextData = { ...contextData, ...content };
          }
        } else if (node.type === 'ai-enhance') {
          contextData = await executeAIEnhanceNode(node, contextData);
        } else if (node.type === 'filter') {
          const result = await executeFilterNode(node, contextData);
          // Route to pass or fail handle
          const nextHandle = result.pass ? 'pass' : 'fail';
          const nextNodeIds = chain.connections
            .filter(c => c.sourceNodeId === nodeId && (c.sourceHandle === nextHandle || c.sourceHandle === 'output'))
            .map(c => c.targetNodeId);
          currentNodeIds = [...nextNodeIds, ...currentNodeIds.slice(1)];
          continue;
        } else if (node.type === 'delay') {
          await executeDelayNode(node);
        } else if (node.type === 'schedule') {
          const post = await executeScheduleNode(node, chain.feedId, contextData);
          if (post) {
            contextData = { ...contextData, scheduledPostId: post.id };
          }
        } else if (node.type === 'multi-platform') {
          contextData = await executeMultiPlatformNode(node, contextData);
        } else if (node.type === 'approval') {
          const result = await executeApprovalNode(node, contextData);
          if (!result.approved) {
            run.status = 'completed';
            run.completedAt = new Date().toISOString();
            run.result = { ...contextData, rejected: true };
            return run;
          }
        } else if (node.type === 'analytics') {
          const result = await executeAnalyticsNode(node, contextData);
          if (result.action === 'skip') {
            run.status = 'completed';
            run.completedAt = new Date().toISOString();
            run.result = { ...contextData, skipped: true };
            return run;
          }
        } else if (node.type === 'end') {
          contextData = await executeEndNode(node, contextData);
          break;
        }

        // Get next nodes
        const nextNodeIds = getNextNodes(nodeId, chain.connections, 'output');
        currentNodeIds = [...nextNodeIds, ...currentNodeIds.slice(1)];
      } catch (error) {
        console.error(`Error executing node ${nodeId}:`, error);
        run.status = 'failed';
        run.error = `Failed at node ${node.type}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        run.completedAt = new Date().toISOString();
        return run;
      }
    }

    run.status = 'completed';
    run.completedAt = new Date().toISOString();
    run.result = contextData;
  } catch (error) {
    run.status = 'failed';
    run.error = error instanceof Error ? error.message : 'Unknown error';
    run.completedAt = new Date().toISOString();
  }

  return run;
}

/**
 * Parse schedule interval string to milliseconds
 */
function parseScheduleInterval(interval: string): number {
  // Simple parser for intervals like "every 6 hours", "daily", etc.
  const lowerInterval = interval.toLowerCase();

  if (lowerInterval.includes('hour')) {
    const hours = parseInt(lowerInterval.match(/\d+/)?.[0] || '1');
    return hours * 60 * 60 * 1000;
  }

  if (lowerInterval.includes('daily') || lowerInterval.includes('day')) {
    return 24 * 60 * 60 * 1000;
  }

  if (lowerInterval.includes('minute')) {
    const minutes = parseInt(lowerInterval.match(/\d+/)?.[0] || '5');
    return minutes * 60 * 1000;
  }

  if (lowerInterval.includes('week')) {
    return 7 * 24 * 60 * 60 * 1000;
  }

  // Default to 1 hour
  return 60 * 60 * 1000;
}

/**
 * Start the automation engine
 */
export function startAutomationEngine(feedId?: string): void {
  if (typeof window === 'undefined') return;

  if (engineRunning && !feedId) {
    console.log('Automation engine already running');
    return;
  }

  engineRunning = true;
  const chains = loadChains();

  // Filter chains by feedId if provided
  const chainsToRun = feedId
    ? chains.filter(c => c.enabled && c.feedId === feedId)
    : chains.filter(c => c.enabled);

  chainsToRun.forEach(chain => {
    const startNode = chain.nodes.find(n => n.type === 'start');
    if (!startNode) return;

    const data = startNode.data as any;

    if (data.triggerType === 'schedule' && data.scheduleInterval) {
      // Set up interval for scheduled chains
      const interval = parseScheduleInterval(data.scheduleInterval);

      // Clear any existing interval
      if (activeIntervals.has(chain.id)) {
        clearInterval(activeIntervals.get(chain.id)!);
      }

      // Run immediately
      executeChain(chain).then(run => {
        saveRunHistory([...loadRunHistory(), run]);
      });

      // Set up recurring interval
      const intervalId = setInterval(() => {
        if (chain.enabled) {
          executeChain(chain).then(run => {
            saveRunHistory([...loadRunHistory(), run]);
          });
        }
      }, interval);

      activeIntervals.set(chain.id, intervalId);
      console.log(`Started scheduled chain: ${chain.name} (interval: ${interval}ms)`);
    }
  });

  console.log('Automation engine started');
}

/**
 * Stop the automation engine
 */
export function stopAutomationEngine(): void {
  engineRunning = false;

  activeIntervals.forEach(intervalId => {
    clearInterval(intervalId);
  });

  activeIntervals.clear();
  console.log('Automation engine stopped');
}

/**
 * Manually run a chain
 */
export async function runChainManually(chainId: string): Promise<ChainRun | null> {
  const chains = loadChains();
  const chain = chains.find(c => c.id === chainId);

  if (!chain) {
    console.error(`Chain not found: ${chainId}`);
    return null;
  }

  const run = await executeChain(chain);
  const runs = loadRunHistory();
  runs.push(run);
  saveRunHistory(runs);

  // Update chain run count and last run time
  const updatedChains = chains.map(c =>
    c.id === chainId
      ? {
          ...c,
          runCount: (c.runCount || 0) + 1,
          lastRunAt: new Date().toISOString(),
        }
      : c
  );
  localStorage.setItem(STORAGE_KEYS.CHAINS, JSON.stringify(updatedChains));

  return run;
}

/**
 * Get run history for a chain or all chains
 */
export function getChainRunHistory(chainId?: string): ChainRun[] {
  const runs = loadRunHistory();

  if (chainId) {
    return runs.filter(r => r.chainId === chainId);
  }

  return runs;
}

/**
 * Get rate limit status for a feed
 */
export function getRateLimitInfo(feedId: string): {
  daily: RateLimitData;
  usage: RateLimitData;
  remaining: RateLimitData;
} {
  const status = getRateLimitStatus(feedId);

  return {
    daily: status.daily,
    usage: status.usage,
    remaining: {
      likes: status.daily.likes - status.usage.likes,
      comments: status.daily.comments - status.usage.comments,
      follows: status.daily.follows - status.usage.follows,
      dms: status.daily.dms - status.usage.dms,
    },
  };
}

/**
 * Check if action can be performed based on rate limits
 */
export function canPerformAction(feedId: string, action: keyof RateLimitData, count: number = 1): boolean {
  const status = getRateLimitStatus(feedId);
  return status.usage[action] + count <= status.daily[action];
}

/**
 * Track an action for rate limiting
 */
export function trackAction(feedId: string, action: keyof RateLimitData, count: number = 1): boolean {
  return updateRateLimit(feedId, action, count);
}

/**
 * Get chain statistics
 */
export function getChainStats(chainId?: string): {
  totalChains: number;
  enabledChains: number;
  totalRuns: number;
  avgRunDuration: number;
  lastRunTime?: string;
} {
  const chains = loadChains();
  const runs = loadRunHistory();

  const filteredChains = chainId ? chains.filter(c => c.id === chainId) : chains;
  const filteredRuns = chainId
    ? runs.filter(r => r.chainId === chainId)
    : runs;

  let avgDuration = 0;
  if (filteredRuns.length > 0) {
    const durations = filteredRuns
      .filter(r => r.completedAt)
      .map(r => new Date(r.completedAt!).getTime() - new Date(r.startedAt).getTime());
    avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  }

  return {
    totalChains: filteredChains.length,
    enabledChains: filteredChains.filter(c => c.enabled).length,
    totalRuns: filteredRuns.length,
    avgRunDuration: avgDuration,
    lastRunTime: filteredRuns.length > 0 ? filteredRuns[filteredRuns.length - 1].completedAt : undefined,
  };
}

export default {
  startAutomationEngine,
  stopAutomationEngine,
  runChainManually,
  getChainRunHistory,
  getRateLimitInfo,
  canPerformAction,
  trackAction,
  getChainStats,
};
