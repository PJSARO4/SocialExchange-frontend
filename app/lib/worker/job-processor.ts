/**
 * Job Processor - Handles execution of queued jobs
 *
 * Each job type has its own handler that performs the actual work.
 */

import { Job, JobType } from '@/lib/queue';

interface ProcessResult {
  success: boolean;
  data?: any;
  error?: string;
}

type JobHandler = (job: Job) => Promise<ProcessResult>;

/**
 * Handler: Publish a scheduled post to Instagram
 */
async function handlePublishPost(job: Job): Promise<ProcessResult> {
  const { feedId, payload } = job;
  const { content, mediaUrl, mediaType, accessToken } = payload;

  if (!accessToken) {
    return { success: false, error: 'No access token available' };
  }

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
async function handleAutoComment(job: Job): Promise<ProcessResult> {
  const { payload } = job;
  const { mediaId, comment, accessToken } = payload;

  if (!accessToken || !mediaId || !comment) {
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
async function handleWelcomeDM(job: Job): Promise<ProcessResult> {
  const { payload } = job;
  const { recipientId, message, accessToken } = payload;

  if (!accessToken || !recipientId || !message) {
    return { success: false, error: 'Missing required fields for DM' };
  }

  // Note: Instagram DM API has restrictions and may require approved permissions
  console.log(`📨 Sending DM to ${recipientId}...`);

  // Placeholder - Instagram Messaging API requires specific permissions
  return {
    success: false,
    error: 'Instagram DM API requires Messenger Platform approval',
  };
}

/**
 * Handler: Sync metrics for a feed
 */
async function handleSyncMetrics(job: Job): Promise<ProcessResult> {
  const { feedId, payload } = job;
  const { accessToken } = payload;

  if (!accessToken) {
    return { success: false, error: 'No access token available' };
  }

  try {
    console.log(`📊 Syncing metrics for feed ${feedId}...`);

    const response = await fetch(
      `${getBaseUrl()}/api/instagram/profile?access_token=${encodeURIComponent(accessToken)}`
    );

    const data = await response.json();

    if (response.ok && !data.error) {
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
async function handleRefreshToken(job: Job): Promise<ProcessResult> {
  const { payload } = job;
  const { refreshToken } = payload;

  if (!refreshToken) {
    return { success: false, error: 'No refresh token available' };
  }

  // Instagram long-lived tokens last 60 days and can be refreshed
  // This would call Instagram's token refresh endpoint
  console.log(`🔄 Refreshing token...`);

  return {
    success: false,
    error: 'Token refresh not implemented yet',
  };
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

  try {
    const result = await handler(job);
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
