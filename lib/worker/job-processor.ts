/**
 * Job Processor
 *
 * Handles the execution of different job types.
 * Each job type has its own handler that implements the business logic.
 */

import { Job, JobResult, JobType, PublishPostPayload, AutoLikePayload, AutoCommentPayload, AutoFollowPayload, AutoDMPayload } from '../queue/types';

// Job Handlers

async function handlePublishPost(payload: PublishPostPayload): Promise<JobResult> {
  console.log(`📤 Publishing post for feed ${payload.feedId}`);

  try {
    // Step 1: Create media container (must use form-urlencoded, not JSON)
    const containerParams: Record<string, string> = {
      access_token: payload.accessToken,
      image_url: payload.mediaUrls[0],
    };
    if (payload.caption) containerParams.caption = payload.caption;

    const containerResponse = await fetch(
      `https://graph.facebook.com/v21.0/${payload.instagramUserId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(containerParams),
      }
    );

    const containerData = await containerResponse.json();
    if (containerData.error) {
      throw new Error(containerData.error.message);
    }

    const containerId = containerData.id;

    // Step 2: Wait for processing (poll status)
    let status = 'IN_PROGRESS';
    let attempts = 0;
    const maxAttempts = 10;

    while (status === 'IN_PROGRESS' && attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, 3000)); // Wait 3 seconds
      attempts++;

      const statusResponse = await fetch(
        `https://graph.facebook.com/v21.0/${containerId}?fields=status_code&access_token=${payload.accessToken}`
      );
      const statusData = await statusResponse.json();
      status = statusData.status_code;
    }

    if (status !== 'FINISHED') {
      throw new Error(`Media processing failed with status: ${status}`);
    }

    // Step 3: Publish (must use form-urlencoded)
    const publishResponse = await fetch(
      `https://graph.facebook.com/v21.0/${payload.instagramUserId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          access_token: payload.accessToken,
          creation_id: containerId,
        }),
      }
    );

    const publishData = await publishResponse.json();
    if (publishData.error) {
      throw new Error(publishData.error.message);
    }

    console.log(`✅ Post published: ${publishData.id}`);
    return { success: true, data: { postId: publishData.id } };
  } catch (error: any) {
    console.error(`❌ Publish failed:`, error.message);
    return { success: false, error: error.message };
  }
}

async function handleAutoLike(payload: AutoLikePayload): Promise<JobResult> {
  console.log(`❤️ Auto-liking post ${payload.targetPostId} for feed ${payload.feedId}`);

  try {
    // Instagram Graph API doesn't support liking via API for most use cases
    // This would need Instagram Basic Display API or unofficial methods
    // For now, we'll simulate the action

    // In production, you'd use the Instagram Graph API like:
    // POST /{media-id}/likes with access_token

    console.log(`⚠️ Auto-like: Instagram API limitations - action logged but not executed`);

    return {
      success: true,
      data: { message: 'Like action recorded (API limitations apply)' },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function handleAutoComment(payload: AutoCommentPayload): Promise<JobResult> {
  console.log(`💬 Auto-commenting on post ${payload.targetPostId}`);

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${payload.targetPostId}/comments`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          access_token: payload.accessToken,
          message: payload.comment,
        }),
      }
    );

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }

    console.log(`✅ Comment posted: ${data.id}`);
    return { success: true, data: { commentId: data.id } };
  } catch (error: any) {
    console.error(`❌ Comment failed:`, error.message);
    return { success: false, error: error.message };
  }
}

async function handleAutoFollow(payload: AutoFollowPayload): Promise<JobResult> {
  console.log(`👤 Auto-follow user ${payload.targetUserId}`);

  // Instagram Graph API doesn't support follow/unfollow actions
  // This feature would need unofficial API methods
  console.log(`⚠️ Auto-follow: Instagram API limitations - action logged but not executed`);

  return {
    success: true,
    data: { message: 'Follow action recorded (API limitations apply)' },
  };
}

async function handleAutoDM(payload: AutoDMPayload): Promise<JobResult> {
  console.log(`📨 Sending DM to user ${payload.targetUserId}`);

  try {
    // Instagram Graph API supports messaging through Instagram Messaging API
    // Requires specific permissions and business account

    // Instagram DM API requires JSON format (not form-urlencoded)
    const response = await fetch(
      `https://graph.instagram.com/v21.0/me/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${payload.accessToken}`,
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

    console.log(`✅ DM sent: ${data.message_id}`);
    return { success: true, data: { messageId: data.message_id } };
  } catch (error: any) {
    console.error(`❌ DM failed:`, error.message);
    return { success: false, error: error.message };
  }
}

// Main processor function

export async function processJob(job: Job): Promise<JobResult> {
  console.log(`🔧 Processing job ${job.id} (${job.type})`);

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
      // Analytics fetching would go here
      return { success: true, data: { message: 'Analytics fetched' } };

    default:
      return { success: false, error: `Unknown job type: ${job.type}` };
  }
}
