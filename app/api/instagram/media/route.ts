import { NextRequest, NextResponse } from 'next/server';

import {
  getTenantUser,
  notFound,
  resolveConnectedOwnedFeed,
  unauthorized,
} from '@/lib/security/tenant';

// Force dynamic rendering - prevent build-time pre-rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/instagram/media?feedId=<optional>&limit=12
 *
 * Returns the authenticated user's own Instagram media.
 *
 * SEC-1: previously unauthenticated with `access_token` in the query string.
 * The token is now resolved server-side from an owned SocialFeed. Response
 * shape is unchanged.
 */
export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.has('access_token')) {
    return NextResponse.json(
      {
        error:
          'access_token is no longer accepted in the query string. Pass feedId; the server resolves the token.',
      },
      { status: 400 }
    );
  }

  const user = await getTenantUser();
  if (!user) return unauthorized();

  const feedId = request.nextUrl.searchParams.get('feedId');
  const feed = await resolveConnectedOwnedFeed(user.id, feedId);
  if (!feed) return notFound('Feed');

  const accessToken = feed.accessToken;
  const rawLimit = parseInt(request.nextUrl.searchParams.get('limit') || '12', 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 50) : 12;

  try {
    // Fetch user's media with engagement metrics
    const fields = [
      'id',
      'caption',
      'media_type',
      'media_url',
      'thumbnail_url',
      'permalink',
      'timestamp',
      'like_count',
      'comments_count',
      'username',
    ].join(',');

    const url = `https://graph.instagram.com/me/media?fields=${fields}&limit=${limit}&access_token=${encodeURIComponent(
      accessToken
    )}`;

    console.log('📸 Fetching Instagram media...');

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error('❌ Instagram Media API Error:', data.error?.message || 'unknown');
      return NextResponse.json(
        { error: data.error.message || 'Failed to fetch Instagram media' },
        { status: 400 }
      );
    }

    console.log(`✅ Fetched ${data.data?.length || 0} Instagram posts`);

    // Transform the data to a cleaner format
    const posts = (data.data || []).map((post: any) => ({
      id: post.id,
      caption: post.caption || '',
      mediaType: post.media_type, // IMAGE, VIDEO, CAROUSEL_ALBUM
      mediaUrl: post.media_url,
      thumbnailUrl: post.thumbnail_url || post.media_url,
      permalink: post.permalink,
      timestamp: post.timestamp,
      likeCount: post.like_count || 0,
      commentsCount: post.comments_count || 0,
      username: post.username,
    }));

    return NextResponse.json({
      posts,
      paging: data.paging,
      totalCount: posts.length,
    });
  } catch (error) {
    console.error('❌ Error fetching Instagram media');
    return NextResponse.json(
      { error: 'Failed to fetch Instagram media' },
      { status: 500 }
    );
  }
}
