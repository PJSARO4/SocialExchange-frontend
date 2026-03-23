import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/instagram/comments
 * Fetch recent comments on posts for a connected Instagram account
 * Query params: accessToken, limit (default 10)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = request.nextUrl.searchParams.get('accessToken');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');

    if (!accessToken) {
      return NextResponse.json(
        { error: 'accessToken is required' },
        { status: 400 }
      );
    }

    console.log('💬 Fetching recent comments...');

    // Step 1: Fetch recent media for the user
    const media = await fetchRecentMedia(accessToken, 5); // Get last 5 posts

    // Step 2: For each media item, fetch comments
    const allComments: any[] = [];

    for (const post of media) {
      try {
        const comments = await fetchMediaComments(post.id, accessToken, limit);
        allComments.push(...comments.map((c: any) => ({
          ...c,
          postId: post.id,
          postCaption: post.caption?.substring(0, 100),
          postImageUrl: post.media_type === 'IMAGE' ? post.media_url : post.thumbnail_url,
        })));
      } catch (error) {
        console.warn(`Failed to fetch comments for post ${post.id}:`, error);
      }
    }

    // Sort by timestamp (newest first) and limit
    const sortedComments = allComments
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      comments: sortedComments,
      count: sortedComments.length,
    });

  } catch (error: any) {
    console.error('Comments fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

async function fetchRecentMedia(accessToken: string, limit: number) {
  const fields = [
    'id',
    'caption',
    'media_type',
    'media_url',
    'thumbnail_url',
    'timestamp',
    'like_count',
    'comments_count',
  ].join(',');

  const url = `https://graph.instagram.com/me/media?fields=${fields}&limit=${limit}&access_token=${accessToken}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'Failed to fetch media');
    }

    return data.data || [];
  } catch (error: any) {
    console.error('Media fetch error:', error);
    throw error;
  }
}

async function fetchMediaComments(mediaId: string, accessToken: string, limit: number) {
  const fields = [
    'id',
    'text',
    'timestamp',
    'username',
    'like_count',
  ].join(',');

  const url = `https://graph.instagram.com/${mediaId}/comments?fields=${fields}&limit=${limit}&access_token=${accessToken}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'Failed to fetch comments');
    }

    return data.data || [];
  } catch (error: any) {
    console.error('Comments fetch error:', error);
    throw error;
  }
}

/**
 * POST /api/instagram/comments
 * Respond to a comment on an Instagram post (requires instagram_content_publish permission)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { commentId, accessToken, message } = body;

    if (!commentId || !accessToken || !message) {
      return NextResponse.json(
        { error: 'commentId, accessToken, and message are required' },
        { status: 400 }
      );
    }

    console.log('💬 Posting reply to comment:', commentId);

    const url = `https://graph.instagram.com/${commentId}/replies`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        message,
        access_token: accessToken,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return NextResponse.json(
        { error: data.error.message || 'Failed to post reply' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      replyId: data.id,
      message: 'Reply posted successfully',
    });

  } catch (error: any) {
    console.error('Reply post error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to post reply' },
      { status: 500 }
    );
  }
}
