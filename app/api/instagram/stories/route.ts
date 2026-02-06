import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - prevent build-time pre-rendering
export const dynamic = 'force-dynamic';

/**
 * Instagram Stories API
 *
 * GET  - List recent stories
 * POST - Publish a new story (image or video)
 *
 * Requires: instagram_business_content_publish, instagram_business_basic
 */

// GET: List recent stories
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const accessToken = searchParams.get('access_token');
  const instagramUserId = searchParams.get('instagram_user_id');

  if (!accessToken || !instagramUserId) {
    return NextResponse.json(
      { error: 'access_token and instagram_user_id are required' },
      { status: 400 }
    );
  }

  try {
    // Fetch stories using the stories edge
    const url = `https://graph.facebook.com/v21.0/${instagramUserId}/stories?fields=id,media_type,media_url,thumbnail_url,timestamp,caption&access_token=${accessToken}`;

    console.log('📸 Fetching Instagram stories...');

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'Failed to fetch stories');
    }

    return NextResponse.json({
      stories: data.data || [],
      paging: data.paging || null,
    });
  } catch (error: any) {
    console.error('❌ Stories fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stories', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Publish a new story
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { access_token, instagram_user_id, media_type, media_url, video_url } = body;

    if (!access_token) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 400 });
    }

    if (!instagram_user_id) {
      return NextResponse.json({ error: 'Instagram user ID is required' }, { status: 400 });
    }

    if (!media_url && !video_url) {
      return NextResponse.json({ error: 'Media URL is required' }, { status: 400 });
    }

    const storyType = media_type || (video_url ? 'VIDEO' : 'IMAGE');

    // Step 1: Create story container
    const containerParams: Record<string, string> = {
      access_token,
      media_type: 'STORIES',
    };

    if (storyType === 'VIDEO') {
      containerParams.video_url = video_url || media_url;
    } else {
      containerParams.image_url = media_url;
    }

    console.log('📤 Creating story container...');

    const containerResponse = await fetch(
      `https://graph.facebook.com/v21.0/${instagram_user_id}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(containerParams),
      }
    );

    const containerData = await containerResponse.json();

    if (containerData.error) {
      throw new Error(containerData.error.message || 'Failed to create story container');
    }

    const containerId = containerData.id;
    console.log('📦 Story container created:', containerId);

    // Step 2: Wait for video processing if needed
    if (storyType === 'VIDEO') {
      console.log('⏳ Waiting for video processing...');
      let attempts = 0;
      const maxAttempts = 30;

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;

        const statusResponse = await fetch(
          `https://graph.facebook.com/v21.0/${containerId}?fields=status_code&access_token=${access_token}`
        );
        const statusData = await statusResponse.json();

        if (statusData.status_code === 'FINISHED') break;
        if (statusData.status_code === 'ERROR') {
          throw new Error('Story video processing failed');
        }
      }

      if (attempts >= maxAttempts) {
        throw new Error('Timeout waiting for story video processing');
      }
    }

    // Step 3: Publish the story
    const publishResponse = await fetch(
      `https://graph.facebook.com/v21.0/${instagram_user_id}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          creation_id: containerId,
          access_token,
        }),
      }
    );

    const publishData = await publishResponse.json();

    if (publishData.error) {
      throw new Error(publishData.error.message || 'Failed to publish story');
    }

    console.log('✅ Story published:', publishData.id);

    return NextResponse.json({
      success: true,
      story_id: publishData.id,
      container_id: containerId,
    });
  } catch (error: any) {
    console.error('❌ Story publish error:', error);

    if (error.message?.includes('permission')) {
      return NextResponse.json({
        error: 'Missing required permissions for story publishing.',
        details: error.message,
      }, { status: 403 });
    }

    return NextResponse.json({
      error: 'Failed to publish story',
      details: error.message,
    }, { status: 500 });
  }
}
