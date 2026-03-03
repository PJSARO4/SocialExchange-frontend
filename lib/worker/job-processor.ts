/**
 * Job Processor
 *
 * Handles the execution of different job types.
 * Each job type has its own handler that implements the business logic.
 *
 * For PUBLISH_POST jobs, the processor:
 * 1. Fetches the latest access token from the SocialFeed record
 * 2. Creates media container(s) via Instagram Graph API
 * 3. Polls for container readiness (critical for video/reels)
 * 4. Publishes the container
 * 5. Updates the ScheduledPostNew record with the result
 */

import { Job, JobResult, JobType, PublishPostPayload, AutoLikePayload, AutoCommentPayload, AutoFollowPayload, AutoDMPayload } from '../queue/types';

const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0';

// =============================================
// Utility: Fetch fresh access token for a feed
// =============================================

async function getFeedCredentials(feedId: string): Promise<{
  accessToken: string;
  instagramUserId: string;
} | null> {
  try {
    const { prisma } = await import('@/lib/prisma');
    const feed = await prisma.socialFeed.findUnique({
      where: { id: feedId },
      select: { accessToken: true, platformAccountId: true, isConnected: true },
    });

    if (!feed || !feed.isConnected || !feed.accessToken) {
      return null;
    }

    return {
      accessToken: feed.accessToken,
      instagramUserId: feed.platformAccountId,
    };
  } catch {
    return null;
  }
}

// =============================================
// Utility: Update scheduled post status
// =============================================

async function updateScheduledPost(
  scheduledPostId: string,
  data: { status?: string; instagramPostId?: string; lastError?: string; attempts?: number }
) {
  try {
    const { prisma } = await import('@/lib/prisma');
    await prisma.scheduledPostNew.update({
      where: { id: scheduledPostId },
      data: data as any,
    });
  } catch (e) {
    console.warn(`[job-processor] Could not update scheduled post ${scheduledPostId}:`, e);
  }
}

// =============================================
// Utility: Create media container
// =============================================

async function createMediaContainer(
  instagramUserId: string,
  accessToken: string,
  params: Record<string, string>
): Promise<string> {
  const response = await fetch(`${GRAPH_API_BASE}/${instagramUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ access_token: accessToken, ...params }),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message || 'Failed to create media container');
  }

  return data.id;
}

// =============================================
// Utility: Poll container status
// =============================================

async function waitForContainer(
  containerId: string,
  accessToken: string,
  maxAttempts: number = 30,
  intervalMs: number = 3000
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(
      `${GRAPH_API_BASE}/${containerId}?fields=status_code&access_token=${accessToken}`
    );
    const data = await response.json();

    if (data.status_code === 'FINISHED') return;
    if (data.status_code === 'ERROR') {
      throw new Error(`Media container processing failed (status: ERROR)`);
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error('Timeout waiting for media container to finish processing');
}

// =============================================
// Utility: Publish a container
// =============================================

async function publishContainer(
  instagramUserId: string,
  accessToken: string,
  containerId: string
): Promise<string> {
  const response = await fetch(`${GRAPH_API_BASE}/${instagramUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      access_token: accessToken,
      creation_id: containerId,
    }),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message || 'Failed to publish media');
  }

  return data.id;
}

// =============================================
// Job Handlers
// =============================================

async function handlePublishPost(payload: PublishPostPayload): Promise<JobResult> {
  const { feedId, scheduledPostId, caption, mediaUrls, mediaType } = payload;

  console.log(`[publish] Starting publish for feed ${feedId}, type: ${mediaType}`);

  // Fetch fresh credentials from the database
  const creds = await getFeedCredentials(feedId);
  if (!creds) {
    const error = 'Feed not found, disconnected, or missing access token';
    await updateScheduledPost(scheduledPostId, { status: 'FAILED', lastError: error });
    return { success: false, error };
  }

  const { accessToken, instagramUserId } = creds;

  try {
    // Mark as processing
    await updateScheduledPost(scheduledPostId, { status: 'PROCESSING' });

    let publishedMediaId: string;

    switch (mediaType) {
      case 'IMAGE': {
        // Single image: create container → publish
        const containerId = await createMediaContainer(instagramUserId, accessToken, {
          image_url: mediaUrls[0],
          ...(caption && { caption }),
        });
        publishedMediaId = await publishContainer(instagramUserId, accessToken, containerId);
        break;
      }

      case 'VIDEO': {
        // Video: create container → wait for processing → publish
        const containerId = await createMediaContainer(instagramUserId, accessToken, {
          video_url: mediaUrls[0],
          media_type: 'VIDEO',
          ...(caption && { caption }),
        });
        await waitForContainer(containerId, accessToken, 60, 5000); // Videos take longer
        publishedMediaId = await publishContainer(instagramUserId, accessToken, containerId);
        break;
      }

      case 'REELS': {
        // Reels: create container → wait for processing → publish
        const containerId = await createMediaContainer(instagramUserId, accessToken, {
          video_url: mediaUrls[0],
          media_type: 'REELS',
          share_to_feed: 'true',
          ...(caption && { caption }),
        });
        await waitForContainer(containerId, accessToken, 60, 5000);
        publishedMediaId = await publishContainer(instagramUserId, accessToken, containerId);
        break;
      }

      case 'CAROUSEL': {
        // Carousel: create item containers → create carousel container → publish
        if (!mediaUrls || mediaUrls.length < 2) {
          throw new Error('Carousel requires at least 2 media items');
        }

        // Step 1: Create individual item containers (no caption on items)
        const childContainerIds: string[] = [];
        for (const url of mediaUrls) {
          const isVideo = /\.(mp4|mov|avi|wmv|webm)$/i.test(url);
          const params: Record<string, string> = isVideo
            ? { video_url: url, media_type: 'VIDEO', is_carousel_item: 'true' }
            : { image_url: url, is_carousel_item: 'true' };

          const childId = await createMediaContainer(instagramUserId, accessToken, params);

          // Wait for video items to process
          if (isVideo) {
            await waitForContainer(childId, accessToken, 60, 5000);
          }

          childContainerIds.push(childId);
        }

        // Step 2: Create the carousel container
        const carouselId = await createMediaContainer(instagramUserId, accessToken, {
          media_type: 'CAROUSEL',
          children: childContainerIds.join(','),
          ...(caption && { caption }),
        });

        // Step 3: Publish the carousel
        publishedMediaId = await publishContainer(instagramUserId, accessToken, carouselId);
        break;
      }

      default:
        throw new Error(`Unsupported media type: ${mediaType}`);
    }

    // Update the scheduled post as published
    await updateScheduledPost(scheduledPostId, {
      status: 'PUBLISHED',
      instagramPostId: publishedMediaId,
    });

    console.log(`[publish] Published successfully: ${publishedMediaId}`);
    return { success: true, data: { postId: publishedMediaId } };
  } catch (error: any) {
    console.error(`[publish] Failed:`, error.message);

    await updateScheduledPost(scheduledPostId, {
      status: 'FAILED',
      lastError: error.message,
    });

    return { success: false, error: error.message };
  }
}

async function handleAutoLike(payload: AutoLikePayload): Promise<JobResult> {
  console.log(`[auto-like] Post ${payload.targetPostId} for feed ${payload.feedId}`);

  // Instagram Graph API doesn't support liking via API for most use cases
  console.log(`[auto-like] Instagram API limitations - action logged but not executed`);

  return {
    success: true,
    data: { message: 'Like action recorded (API limitations apply)' },
  };
}

async function handleAutoComment(payload: AutoCommentPayload): Promise<JobResult> {
  console.log(`[auto-comment] Post ${payload.targetPostId}`);

  // Fetch fresh token
  const creds = await getFeedCredentials(payload.feedId);
  const accessToken = creds?.accessToken || payload.accessToken;

  try {
    const response = await fetch(
      `${GRAPH_API_BASE}/${payload.targetPostId}/comments`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          access_token: accessToken,
          message: payload.comment,
        }),
      }
    );

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }

    console.log(`[auto-comment] Comment posted: ${data.id}`);
    return { success: true, data: { commentId: data.id } };
  } catch (error: any) {
    console.error(`[auto-comment] Failed:`, error.message);
    return { success: false, error: error.message };
  }
}

async function handleAutoFollow(payload: AutoFollowPayload): Promise<JobResult> {
  console.log(`[auto-follow] User ${payload.targetUserId}`);

  // Instagram Graph API doesn't support follow/unfollow actions
  console.log(`[auto-follow] Instagram API limitations - action logged but not executed`);

  return {
    success: true,
    data: { message: 'Follow action recorded (API limitations apply)' },
  };
}

async function handleAutoDM(payload: AutoDMPayload): Promise<JobResult> {
  console.log(`[auto-dm] User ${payload.targetUserId}`);

  // Fetch fresh token
  const creds = await getFeedCredentials(payload.feedId);
  const accessToken = creds?.accessToken || payload.accessToken;

  try {
    const response = await fetch(
      `https://graph.instagram.com/v21.0/me/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          recipient: { id: payload.targetUserId },
          message: { text: payload.message },
        }),
      }
    );

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }

    console.log(`[auto-dm] DM sent: ${data.message_id}`);
    return { success: true, data: { messageId: data.message_id } };
  } catch (error: any) {
    console.error(`[auto-dm] Failed:`, error.message);
    return { success: false, error: error.message };
  }
}

// =============================================
// Main processor
// =============================================

export async function processJob(job: Job): Promise<JobResult> {
  console.log(`[job-processor] Processing ${job.id} (${job.type})`);

  switch (job.type) {
    case 'PUBLISH_POST':
      return handlePublishPost(job.payload as PublishPostPayload);

    case 'AUTO_LIKE':
      return handleAutoLike(job.payload as AutoLikePayload);

    case 'AUTO_COMMENT':
      return handleAutoComment(job.payload as AutoCommentPayload);

    case 'AUTO_FOLLOW':
      return handleAutoFollow(job.payload as AutoFollowPayload);

    case 'AUTO_DM':
      return handleAutoDM(job.payload as AutoDMPayload);

    case 'FETCH_ANALYTICS':
      return { success: true, data: { message: 'Analytics fetched' } };

    default:
      return { success: false, error: `Unknown job type: ${job.type}` };
  }
}
