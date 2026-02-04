import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Instagram Graph API endpoint to fetch user's media/posts
export async function GET(request: NextRequest) {
  const accessToken = request.nextUrl.searchParams.get('access_token');
  const limit = request.nextUrl.searchParams.get('limit') || '12';

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Access token is required' },
      { status: 400 }
    );
  }

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

    const url = `https://graph.instagram.com/me/media?fields=${fields}&limit=${limit}&access_token=${accessToken}`;

    console.log('📸 Fetching Instagram media...');

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error('❌ Instagram Media API Error:', data.error);
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
    console.error('❌ Error fetching Instagram media:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Instagram media' },
      { status: 500 }
    );
  }
}
