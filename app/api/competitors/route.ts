import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/competitors - List all tracked competitors for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const feedId = searchParams.get('feedId');

    const where: any = { userId: session.user.id };
    if (feedId) {
      where.feedId = feedId;
    }

    const competitors = await prisma.competitor.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ competitors });
  } catch (error: any) {
    console.error('[competitors] Error fetching competitors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch competitors', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/competitors - Add a new competitor to track
 *
 * For Instagram competitors, attempts to fetch real profile data via Instagram Basic Display API.
 * For other platforms, creates a record with provided or default data.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { handle, platform = 'instagram', feedId, notes } = body;

    if (!handle) {
      return NextResponse.json({ error: 'Missing required field: handle' }, { status: 400 });
    }

    const cleanHandle = handle.startsWith('@') ? handle : `@${handle}`;

    // Check if already tracking this competitor
    const existing = await prisma.competitor.findUnique({
      where: {
        userId_handle_platform: {
          userId: session.user.id,
          handle: cleanHandle,
          platform,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Already tracking this competitor' },
        { status: 409 }
      );
    }

    // Try to fetch real Instagram data if the user has a connected feed
    let profileData: any = {};
    if (platform === 'instagram' && feedId) {
      try {
        profileData = await fetchInstagramCompetitorData(feedId, cleanHandle.replace('@', ''));
      } catch (err) {
        console.log(`[competitors] Could not fetch Instagram data for ${cleanHandle}:`, err);
        // Continue with defaults
      }
    }

    const competitor = await prisma.competitor.create({
      data: {
        userId: session.user.id,
        feedId: feedId || null,
        handle: cleanHandle,
        platform,
        displayName: profileData.displayName || cleanHandle.replace('@', ''),
        avatarUrl: profileData.avatarUrl || null,
        followers: profileData.followers || 0,
        following: profileData.following || 0,
        postsCount: profileData.postsCount || 0,
        engagementRate: profileData.engagementRate || 0,
        avgLikes: profileData.avgLikes || 0,
        avgComments: profileData.avgComments || 0,
        postsPerWeek: profileData.postsPerWeek || 0,
        followerGrowth: 0,
        contentMixImages: 40,
        contentMixVideos: 20,
        contentMixCarousels: 25,
        contentMixReels: 15,
        notes: notes || null,
        lastRefreshedAt: profileData.followers ? new Date() : null,
      },
    });

    return NextResponse.json({ competitor }, { status: 201 });
  } catch (error: any) {
    console.error('[competitors] Error adding competitor:', error);
    return NextResponse.json(
      { error: 'Failed to add competitor', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/competitors - Remove a tracked competitor
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const competitorId = searchParams.get('id');

    if (!competitorId) {
      return NextResponse.json({ error: 'Missing competitor id' }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.competitor.findFirst({
      where: { id: competitorId, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Competitor not found' }, { status: 404 });
    }

    await prisma.competitor.delete({ where: { id: competitorId } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[competitors] Error deleting competitor:', error);
    return NextResponse.json(
      { error: 'Failed to delete competitor', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Fetch Instagram competitor data using the user's connected feed token.
 * Uses Instagram Business Discovery API to look up public profiles.
 */
async function fetchInstagramCompetitorData(feedId: string, username: string) {
  const feed = await prisma.socialFeed.findUnique({
    where: { id: feedId },
    select: { accessToken: true, platformAccountId: true },
  });

  if (!feed?.accessToken || !feed?.platformAccountId) {
    throw new Error('Feed not found or not connected');
  }

  // Use Instagram Business Discovery API
  // This requires instagram_basic permission and a Business/Creator account
  const fields = 'username,name,profile_picture_url,followers_count,follows_count,media_count';
  const url = `https://graph.instagram.com/${feed.platformAccountId}?fields=business_discovery.fields(${fields}){username:${username}}&access_token=${feed.accessToken}`;

  const response = await fetch(
    `https://graph.instagram.com/${feed.platformAccountId}?fields=business_discovery.fields(${fields})&access_token=${feed.accessToken}`,
    { method: 'GET' }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Instagram API error: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  const bd = data.business_discovery;

  if (!bd) {
    throw new Error('Business discovery not available for this account');
  }

  return {
    displayName: bd.name || username,
    avatarUrl: bd.profile_picture_url || null,
    followers: bd.followers_count || 0,
    following: bd.follows_count || 0,
    postsCount: bd.media_count || 0,
    engagementRate: 0, // Would need media data to calculate
    avgLikes: 0,
    avgComments: 0,
    postsPerWeek: 0,
  };
}
