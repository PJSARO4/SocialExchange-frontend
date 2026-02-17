/**
 * Job Processor - Handles execution of queued jobs
 *
 * Each job type has its own handler that performs the actual work.
 *
 * CRITICAL FIXES (Sprint 3):
 * - Fetches access tokens from Feed DB record (not payload)
 * - Checks rate limits before executing actions
 * - Records actions after successful execution
 */

import { Job, JobType } from '@/lib/queue';
import { prisma } from '@/lib/prisma';
import { rateLimiter as dbRateLimiter } from '@/lib/rate-limit/rate-limiter';

interface ProcessResult {
  success: boolean;
  data?: any;
  error?: string;
}

type JobHandler = (job: Job, accessToken: string) => Promise<ProcessResult>;

/**
 * Fetch access token from database for a feed
 */
async function getAccessTokenForFeed(feedId: string): Promise<string | null> {
  try {
    const feed = await prisma.socialFeed.findUnique({
      where: { id: feedId },
      select: {
        accessToken: true,
        isConnected: true,
        accessTokenExpires: true,
        handle: true
      },
    });

    if (!feed) {
      console.error(`❌ Feed not found: ${feedId}`);
      return null;
    }

    if (!feed.isConnected) {
      console.error(`❌ Feed ${feed.handle} is disconnected`);
      return null;
    }

    // Check if token is expired
    if (feed.accessTokenExpires && new Date() > feed.accessTokenExpires) {
      console.error(`❌ Access token expired for feed ${feed.handle}`);
      // TODO: Queue a REFRESH_TOKEN job here
      return null;
    }

    return feed.accessToken;
  } catch (error) {
    console.error('Error fetching access token:', error);
    return null;
  }
}

/**
 * Map job types to rate limit action types
 */
function getActionTypeForJob(jobType: JobType): 'LIKE' | 'COMMENT' | 'FOLLOW' | 'DM' | 'PUBLISH' | null {
  switch (jobType) {
    case 'PUBLISH_POST':
      return 'PUBLISH';
    case 'AUTO_COMMENT':
      return 'COMMENT';
    case 'WELCOME_DM':
      return 'DM';
    default:
      return null; // SYNC_METRICS and REFRESH_TOKEN don't have rate limits
  }
}

/**
 * Handler: Publish a scheduled post to Instagram
 */
async function handlePublishPost(job: Job, accessToken: string): Promise<ProcessResult> {
  const { feedId, payload } = job;
  const { content, mediaUrl, mediaType } = payload;

  if (!mediaUrl) {
    return { success: false, error: 'Media URL is required for Instagram posts' };
  }

  try {
    console.log(`📤 Publishing post for feed ${feedId}...`);

    // Call the Instagram publish API
    const response = await fetch(`${getBaseUrl()}/api/instagram/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: accessToken,
        image_url: mediaUrl,
        caption: content,
        media_type: mediaType || 'IMAGE',
      }),
    });

    const data = await response.json();

    if (response.ok && data.id) {
      console.log(`✅ Post published successfully: ${data.id}`);
      return {
        success: true,
        data: {
          mediaId: data.id,
          publishedAt: new Date().toISOString(),
        },
      };
    } else {
      console.error(`❌ Publish failed:`, data);
      return {
        success: false,
        error: data.error || 'Failed to publish post',
      };
    }
  } catch (error: any) {
    console.error(`❌ Publish error:`, error);
    return {
      success: false,
      error: error.message || 'Network error during publish',
    };
  }
}

/**
 * Handler: Auto-comment on a post
 */
async function handleAutoComment(job: Job, accessToken: string): Promise<ProcessResult> {
  const { payload } = job;
  const { mediaId, comment } = payload;

  if (!mediaId || !comment) {
    return { success: false, error: 'Missing required fields for auto-comment' };
  }

  try {
    console.log(`💬 Posting comment on ${mediaId}...`);

    // Instagram Graph API comment endpoint
    const response = await fetch(
      `https://graph.instagram.com/${mediaId}/comments?message=${encodeURIComponent(comment)}&access_token=${accessToken}`,
      { method: 'POST' }
    );

    const data = await response.json();

    if (response.ok && data.id) {
      return {
        success: true,
        data: { commentId: data.id },
      };
    } else {
      return {
        success: false,
        error: data.error?.message || 'Failed to post comment',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Network error during comment',
    };
  }
}

/**
 * Handler: Send welcome DM
 */
async function handleWelcomeDM(job: Job, accessToken: string): Promise<ProcessResult> {
  const { payload } = job;
  const { recipientId, message } = payload;

  if (!recipientId || !message) {
    return { success: false, error: 'Missing required fields for DM' };
  }

  // Note: Instagram DM API has restrictions and may require approved permissions
  console.log(`📨 Sending DM to ${recipientId}...`);

  // Placeholder - Instagram Messaging API requires specific permissions
  return {
    success: false,
    error: 'Instagram DM API requires Messenger Platform approval. Add instagram_manage_messages scope to OAuth.',
  };
}

/**
 * Handler: Sync metrics for a feed
 */
async function handleSyncMetrics(job: Job, accessToken: string): Promise<ProcessResult> {
  const { feedId } = job;

  try {
    console.log(`📊 Syncing metrics for feed ${feedId}...`);

    const response = await fetch(
      `${getBaseUrl()}/api/instagram/profile?access_token=${encodeURIComponent(accessToken)}`
    );

    const data = await response.json();

    if (response.ok && !data.error) {
      // Update the feed with fresh metrics
      await prisma.socialFeed.update({
        where: { id: feedId },
        data: {
          followers: data.followersCount || 0,
          following: data.followsCount || 0,
          postsCount: data.mediaCount || 0,
          lastSyncAt: new Date(),
          lastSyncError: null,
        },
      });

      // Also record in metrics history
      await prisma.feedMetricsHistory.create({
        data: {
          feedId,
          followers: data.followersCount || 0,
          following: data.followsCount || 0,
          postsCount: data.mediaCount || 0,
          engagementRate: 0, // Would need to calculate from recent posts
        },
      });

      return {
        success: true,
        data: {
          followers: data.followersCount,
          following: data.followsCount,
          posts: data.mediaCount,
          syncedAt: new Date().toISOString(),
        },
      };
    } else {
      // Update feed with error
      await prisma.socialFeed.update({
        where: { id: feedId },
        data: {
          lastSyncError: data.error || 'Failed to fetch metrics',
        },
      });

      return {
        success: false,
        error: data.error || 'Failed to fetch metrics',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Network error during sync',
    };
  }
}

/**
 * Handler: Refresh access token
 */
async function handleRefreshToken(job: Job, accessToken: string): Promise<ProcessResult> {
  const { feedId } = job;

  // Instagram long-lived tokens last 60 days and can be refreshed
  try {
    console.log(`🔄 Refreshing token for feed ${feedId}...`);

    // Instagram token refresh endpoint
    const response = await fetch(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${accessToken}`
    );

    const data = await response.json();

    if (response.ok && data.access_token) {
      // Update the feed with new token
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + (data.expires_in || 5184000)); // Default 60 days

      await prisma.socialFeed.update({
        where: { id: feedId },
        data: {
          accessToken: data.access_token,
          accessTokenExpires: expiresAt,
        },
      });

      console.log(`✅ Token refreshed successfully for feed ${feedId}`);
      return {
        success: true,
        data: {
          expiresAt: expiresAt.toISOString(),
        },
      };
    } else {
      console.error(`❌ Token refresh failed:`, data);
      return {
        success: false,
        error: data.error?.message || 'Failed to refresh token',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Network error during token refresh',
    };
  }
}

// Map of job types to handlers
const handlers: Record<JobType, JobHandler> = {
  PUBLISH_POST: handlePublishPost,
  AUTO_COMMENT: handleAutoComment,
  WELCOME_DM: handleWelcomeDM,
  SYNC_METRICS: handleSyncMetrics,
  REFRESH_TOKEN: handleRefreshToken,
};

/**
 * Main job processor
 *
 * 1. Fetches access token from database
 * 2. Checks rate limits for rate-limited actions
 * 3. Executes the job handler
 * 4. Records action for rate limiting
 */
export async function processJob(job: Job): Promise<ProcessResult> {
  const handler = handlers[job.type];

  if (!handler) {
    return {
      success: false,
      error: `Unknown job type: ${job.type}`,
    };
  }

  console.log(`🔧 Processing job ${job.id} (${job.type}) - attempt ${job.attempts}`);

  // 1. Fetch access token from database
  const accessToken = await getAccessTokenForFeed(job.feedId);

  if (!accessToken) {
    return {
      success: false,
      error: `No valid access token for feed ${job.feedId}. User may need to reconnect their Instagram account.`,
    };
  }

  // 2. Check rate limits for rate-limited actions
  const actionType = getActionTypeForJob(job.type);

  if (actionType) {
    try {
      const rateStatus = await dbRateLimiter.checkLimit(job.feedId, actionType);

      if (!rateStatus.allowed) {
        const waitTime = rateStatus.blockedUntil
          ? Math.ceil((rateStatus.blockedUntil.getTime() - Date.now()) / 60000)
          : 'unknown';

        console.log(`⏳ Rate limited: ${actionType} for feed ${job.feedId}. Wait ${waitTime} minutes.`);

        return {
          success: false,
          error: `Rate limited: ${rateStatus.blockReason || 'Daily/hourly limit reached'}. Remaining: daily=${rateStatus.remaining.daily}, hourly=${rateStatus.remaining.hourly}`,
        };
      }

      console.log(`✓ Rate limit check passed: ${actionType} (daily: ${rateStatus.remaining.daily}, hourly: ${rateStatus.remaining.hourly})`);
    } catch (error) {
      console.error('Rate limit check error (proceeding anyway):', error);
      // Don't fail the job if rate limiter has issues - just log and continue
    }
  }

  // 3. Execute the job handler
  try {
    const result = await handler(job, accessToken);

    // 4. Record action for rate limiting (only on success)
    if (result.success && actionType) {
      try {
        await dbRateLimiter.recordAction(job.feedId, actionType);
        console.log(`📝 Recorded action: ${actionType} for feed ${job.feedId}`);
      } catch (error) {
        console.error('Failed to record action for rate limiting:', error);
        // Don't fail the job if recording fails
      }
    }

    return result;
  } catch (error: any) {
    console.error(`Job ${job.id} threw an error:`, error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Get the base URL for API calls
 */
function getBaseUrl(): string {
  // In production, use the actual domain
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  return 'http://localhost:3000';
}
