'use client';

import { Feed } from '../types/feed';

/**
 * localStorage-based scheduler store for demo mode
 * Provides scheduling functionality when Prisma/PostgreSQL is not available
 */

export type ScheduledPostStatus = 'scheduled' | 'publishing' | 'published' | 'failed';

export interface ScheduledPost {
  id: string;
  feedId: string;
  platform: string;
  caption: string;
  mediaUrls: string[];
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL' | 'REELS';
  scheduledFor: string; // ISO string
  timezone: string;
  status: ScheduledPostStatus;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  error?: string;
  instagramPostId?: string;
}

interface StoredScheduledPost extends ScheduledPost {}

const STORAGE_KEY = 'socialexchange_scheduled_posts';
const FEEDS_STORAGE_KEY = 'socialexchange_feeds';

// Polling state
let pollingIntervalId: NodeJS.Timeout | null = null;
let isPollingActive = false;

/**
 * Get all scheduled posts, optionally filtered by feedId
 */
export function getScheduledPosts(feedId?: string): ScheduledPost[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const posts: ScheduledPost[] = stored ? JSON.parse(stored) : [];

    if (feedId) {
      return posts.filter((post) => post.feedId === feedId);
    }

    return posts;
  } catch (error) {
    console.error('Failed to get scheduled posts:', error);
    return [];
  }
}

/**
 * Add a new scheduled post
 */
export function addScheduledPost(post: Omit<ScheduledPost, 'id' | 'createdAt' | 'updatedAt'>): ScheduledPost {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const posts: ScheduledPost[] = stored ? JSON.parse(stored) : [];

    const newPost: ScheduledPost = {
      ...post,
      id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    posts.push(newPost);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));

    console.log('📅 Added scheduled post:', {
      id: newPost.id,
      scheduledFor: newPost.scheduledFor,
    });

    return newPost;
  } catch (error) {
    console.error('Failed to add scheduled post:', error);
    throw error;
  }
}

/**
 * Update an existing scheduled post
 */
export function updateScheduledPost(
  id: string,
  updates: Partial<Omit<ScheduledPost, 'id' | 'createdAt'>>
): ScheduledPost | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const posts: ScheduledPost[] = stored ? JSON.parse(stored) : [];

    const postIndex = posts.findIndex((p) => p.id === id);
    if (postIndex === -1) {
      return null;
    }

    const updatedPost: ScheduledPost = {
      ...posts[postIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    posts[postIndex] = updatedPost;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));

    console.log('✏️ Updated scheduled post:', id);

    return updatedPost;
  } catch (error) {
    console.error('Failed to update scheduled post:', error);
    throw error;
  }
}

/**
 * Remove a scheduled post
 */
export function removeScheduledPost(id: string): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const posts: ScheduledPost[] = stored ? JSON.parse(stored) : [];

    const filteredPosts = posts.filter((p) => p.id !== id);

    if (filteredPosts.length === posts.length) {
      // Post not found
      return false;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredPosts));
    console.log('🗑️ Removed scheduled post:', id);

    return true;
  } catch (error) {
    console.error('Failed to remove scheduled post:', error);
    throw error;
  }
}

/**
 * Get upcoming scheduled posts (not yet published)
 */
export function getUpcomingPosts(feedId?: string): ScheduledPost[] {
  const posts = getScheduledPosts(feedId);
  const now = new Date();

  return posts
    .filter((post) => {
      const isScheduled = post.status === 'scheduled';
      const isInFuture = new Date(post.scheduledFor) > now;
      return isScheduled && isInFuture;
    })
    .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
}

/**
 * Get the feed's access token and platform user ID from localStorage
 */
function getFeedCredentials(feedId: string): { accessToken?: string; platformUserId?: string } {
  try {
    const stored = localStorage.getItem(FEEDS_STORAGE_KEY);
    const feeds: Feed[] = stored ? JSON.parse(stored) : [];

    const feed = feeds.find((f) => f.id === feedId);
    if (!feed) {
      console.warn('Feed not found:', feedId);
      return {};
    }

    return {
      accessToken: feed.accessToken,
      platformUserId: feed.platformUserId,
    };
  } catch (error) {
    console.error('Failed to get feed credentials:', error);
    return {};
  }
}

/**
 * Publish a scheduled post to Instagram
 */
async function publishScheduledPost(post: ScheduledPost): Promise<void> {
  console.log('📤 Publishing scheduled post:', post.id);

  // Update status to publishing
  updateScheduledPost(post.id, { status: 'publishing' });

  try {
    // Get feed credentials
    const { accessToken, platformUserId } = getFeedCredentials(post.feedId);

    if (!accessToken || !platformUserId) {
      throw new Error('Missing access token or platform user ID');
    }

    // Call the Instagram publish API
    const response = await fetch('/api/instagram/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: accessToken,
        instagram_user_id: platformUserId,
        media_type: post.mediaType,
        media_url: post.mediaUrls[0],
        caption: post.caption,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to publish to Instagram');
    }

    // Update post as published
    updateScheduledPost(post.id, {
      status: 'published',
      instagramPostId: data.media_id,
      error: undefined,
    });

    console.log('✅ Post published successfully:', post.id);
  } catch (error: any) {
    console.error('Failed to publish post:', error);

    // Update post as failed
    updateScheduledPost(post.id, {
      status: 'failed',
      error: error.message || 'Unknown error',
    });
  }
}

/**
 * Check if any scheduled posts are due for publishing
 * This function should be called by the polling function
 */
async function checkAndPublishDuePosts(): Promise<void> {
  const posts = getScheduledPosts();
  const now = new Date();

  for (const post of posts) {
    // Skip if not in scheduled state
    if (post.status !== 'scheduled') {
      continue;
    }

    // Check if post is due
    const scheduledTime = new Date(post.scheduledFor);
    if (scheduledTime <= now) {
      // Post is due, publish it
      await publishScheduledPost(post);
    }
  }
}

/**
 * Start the scheduler polling
 * Checks every 30 seconds for posts that need to be published
 * Can be called multiple times - will only start one polling interval
 */
export function startSchedulerPolling(): void {
  if (isPollingActive) {
    console.log('ℹ️ Scheduler polling already active');
    return;
  }

  isPollingActive = true;
  console.log('▶️ Starting scheduler polling');

  // Check immediately on start
  checkAndPublishDuePosts().catch((error) => {
    console.error('Error during initial scheduler check:', error);
  });

  // Set up interval to check every 30 seconds
  pollingIntervalId = setInterval(() => {
    checkAndPublishDuePosts().catch((error) => {
      console.error('Error during scheduler polling:', error);
    });
  }, 30000); // 30 seconds
}

/**
 * Stop the scheduler polling
 */
export function stopSchedulerPolling(): void {
  if (pollingIntervalId) {
    clearInterval(pollingIntervalId);
    pollingIntervalId = null;
    isPollingActive = false;
    console.log('⏸️ Scheduler polling stopped');
  }
}

/**
 * Check if scheduler is currently polling
 */
export function isSchedulerPolling(): boolean {
  return isPollingActive;
}

export default {
  getScheduledPosts,
  addScheduledPost,
  updateScheduledPost,
  removeScheduledPost,
  getUpcomingPosts,
  startSchedulerPolling,
  stopSchedulerPolling,
  isSchedulerPolling,
};
