import { NextRequest, NextResponse } from 'next/server';

/**
 * Instagram Content Publishing API
 *
 * IMPORTANT: This requires the following:
 * 1. Instagram Business or Creator account connected to a Facebook Page
 * 2. App Review approval for instagram_content_publish permission
 * 3. The following permissions: instagram_basic, instagram_content_publish, pages_read_engagement
 *
 * The flow for publishing is:
 * 1. Create a media container with the image/video URL
 * 2. Wait for the container to be ready
 * 3. Publish the container
 *
 * For carousel posts, you create multiple item containers first, then a carousel container.
 */

interface PublishRequest {
  access_token: string;
  instagram_user_id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL' | 'REELS';
  media_url?: string; // For IMAGE/VIDEO - must be publicly accessible URL
  video_url?: string; // For REELS
  caption?: string;
  children?: string[]; // For CAROUSEL - array of media container IDs
  cover_url?: string; // For REELS - thumbnail
  share_to_feed?: boolean; // For REELS
  location_id?: string;
}

// Step 1: Create media container
async function createMediaContainer(params: PublishRequest): Promise<string> {
  const { access_token, instagram_user_id, media_type, media_url, video_url, caption, children, cover_url, share_to_feed } = params;

  const containerParams: Record<string, string> = {
    access_token,
  };

  if (media_type === 'IMAGE') {
    containerParams.image_url = media_url!;
    if (caption) containerParams.caption = caption;
  } else if (media_type === 'VIDEO') {
    containerParams.video_url = media_url!;
    containerParams.media_type = 'VIDEO';
    if (caption) containerParams.caption = caption;
  } else if (media_type === 'REELS') {
    containerParams.video_url = video_url!;
    containerParams.media_type = 'REELS';
    if (caption) containerParams.caption = caption;
    if (cover_url) containerParams.cover_url = cover_url;
    if (share_to_feed !== undefined) containerParams.share_to_feed = share_to_feed.toString();
  } else if (media_type === 'CAROUSEL') {
    containerParams.media_type = 'CAROUSEL';
    containerParams.children = children!.join(',');
    if (caption) containerParams.caption = caption;
  }

  const url = `https://graph.facebook.com/v18.0/${instagram_user_id}/media`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(containerParams),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || 'Failed to create media container');
  }

  return data.id;
}

// Step 2: Check container status (for videos, this is important)
async function checkContainerStatus(containerId: string, accessToken: string): Promise<string> {
  const url = `https://graph.facebook.com/v18.0/${containerId}?fields=status_code&access_token=${accessToken}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || 'Failed to check container status');
  }

  return data.status_code;
}

// Step 3: Publish the container
async function publishMedia(containerId: string, instagramUserId: string, accessToken: string): Promise<string> {
  const url = `https://graph.facebook.com/v18.0/${instagramUserId}/media_publish`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      creation_id: containerId,
      access_token: accessToken,
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || 'Failed to publish media');
  }

  return data.id;
}

// Wait for container to be ready (polling)
async function waitForContainer(containerId: string, accessToken: string, maxAttempts = 30): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await checkContainerStatus(containerId, accessToken);

    if (status === 'FINISHED') {
      return;
    } else if (status === 'ERROR') {
      throw new Error('Media container processing failed');
    }

    // Wait 2 seconds before next check
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error('Timeout waiting for media container to be ready');
}

export async function POST(request: NextRequest) {
  try {
    const body: PublishRequest = await request.json();

    const { access_token, instagram_user_id, media_type, media_url, video_url, caption } = body;

    // Validate required fields
    if (!access_token) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 400 });
    }

    if (!instagram_user_id) {
      return NextResponse.json({ error: 'Instagram user ID is required' }, { status: 400 });
    }

    if (media_type === 'IMAGE' && !media_url) {
      return NextResponse.json({ error: 'Media URL is required for image posts' }, { status: 400 });
    }

    if ((media_type === 'VIDEO' || media_type === 'REELS') && !media_url && !video_url) {
      return NextResponse.json({ error: 'Video URL is required for video/reels posts' }, { status: 400 });
    }

    console.log('📤 Creating Instagram post:', { media_type, caption: caption?.substring(0, 50) });

    // Step 1: Create media container
    const containerId = await createMediaContainer(body);
    console.log('📦 Media container created:', containerId);

    // Step 2: Wait for container to be ready (especially important for videos)
    if (media_type === 'VIDEO' || media_type === 'REELS') {
      console.log('⏳ Waiting for video processing...');
      await waitForContainer(containerId, access_token);
    }

    // Step 3: Publish
    const mediaId = await publishMedia(containerId, instagram_user_id, access_token);
    console.log('✅ Media published:', mediaId);

    return NextResponse.json({
      success: true,
      media_id: mediaId,
      container_id: containerId,
    });

  } catch (error: any) {
    console.error('Instagram publish error:', error);

    // Check for specific error types
    if (error.message?.includes('permission')) {
      return NextResponse.json({
        error: 'Missing required permissions. Please ensure your app has instagram_content_publish permission approved.',
        details: error.message,
      }, { status: 403 });
    }

    if (error.message?.includes('Invalid')) {
      return NextResponse.json({
        error: 'Invalid request. Please check your media URL and parameters.',
        details: error.message,
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Failed to publish to Instagram',
      details: error.message,
    }, { status: 500 });
  }
}

// GET endpoint to check publishing quota
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const accessToken = searchParams.get('access_token');
  const instagramUserId = searchParams.get('instagram_user_id');

  if (!accessToken || !instagramUserId) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  try {
    // Get content publishing limit
    const url = `https://graph.facebook.com/v18.0/${instagramUserId}/content_publishing_limit?fields=quota_usage,config&access_token=${accessToken}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    return NextResponse.json({
      quota_usage: data.data?.[0]?.quota_usage || 0,
      config: data.data?.[0]?.config || {},
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
