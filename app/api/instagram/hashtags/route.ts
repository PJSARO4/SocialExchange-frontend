import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - prevent build-time pre-rendering
export const dynamic = 'force-dynamic';

/**
 * Instagram Hashtag Research API
 *
 * GET - Search hashtags and get top/recent media
 *
 * Requires: instagram_business_basic
 * Rate limit: 30 unique hashtags per 7 days per user
 */

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const accessToken = searchParams.get('access_token');
  const instagramUserId = searchParams.get('instagram_user_id');
  const hashtagName = searchParams.get('q'); // hashtag to search
  const hashtagId = searchParams.get('hashtag_id'); // if already known
  const edge = searchParams.get('edge') || 'top_media'; // 'top_media' | 'recent_media'

  if (!accessToken || !instagramUserId) {
    return NextResponse.json(
      { error: 'access_token and instagram_user_id are required' },
      { status: 400 }
    );
  }

  try {
    // If we have a hashtag name but not an ID, search for it first
    let resolvedHashtagId = hashtagId;

    if (!resolvedHashtagId && hashtagName) {
      const searchUrl = `https://graph.facebook.com/v21.0/ig_hashtag_search?q=${encodeURIComponent(hashtagName)}&user_id=${instagramUserId}&access_token=${accessToken}`;

      console.log(`🔍 Searching for hashtag: #${hashtagName}`);

      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();

      if (searchData.error) {
        throw new Error(searchData.error.message || 'Failed to search hashtag');
      }

      if (!searchData.data || searchData.data.length === 0) {
        return NextResponse.json({
          error: `Hashtag #${hashtagName} not found`,
        }, { status: 404 });
      }

      resolvedHashtagId = searchData.data[0].id;
    }

    if (!resolvedHashtagId) {
      return NextResponse.json(
        { error: 'Either q (hashtag name) or hashtag_id is required' },
        { status: 400 }
      );
    }

    // Fetch top or recent media for the hashtag
    const fields = 'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count';
    const mediaUrl = `https://graph.facebook.com/v21.0/${resolvedHashtagId}/${edge}?user_id=${instagramUserId}&fields=${fields}&access_token=${accessToken}`;

    console.log(`📊 Fetching ${edge} for hashtag ID ${resolvedHashtagId}...`);

    const mediaResponse = await fetch(mediaUrl);
    const mediaData = await mediaResponse.json();

    if (mediaData.error) {
      throw new Error(mediaData.error.message || `Failed to fetch ${edge}`);
    }

    return NextResponse.json({
      hashtag_id: resolvedHashtagId,
      hashtag_name: hashtagName || null,
      edge,
      media: mediaData.data || [],
      paging: mediaData.paging || null,
    });
  } catch (error: any) {
    console.error('❌ Hashtag search error:', error);

    if (error.message?.includes('limit')) {
      return NextResponse.json({
        error: 'Hashtag search rate limit reached. You can search 30 unique hashtags per 7 days.',
        details: error.message,
      }, { status: 429 });
    }

    return NextResponse.json(
      { error: 'Failed to search hashtags', details: error.message },
      { status: 500 }
    );
  }
}
