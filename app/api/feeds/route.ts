import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering - prevent build-time pre-rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/feeds
 *
 * Get all connected social feeds for the current user
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const feeds = await prisma.socialFeed.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        platform: true,
        platformAccountId: true,
        handle: true,
        displayName: true,
        profilePictureUrl: true,
        isConnected: true,
        automationEnabled: true,
        controlMode: true,
        lastSyncAt: true,
        lastSyncError: true,
        followers: true,
        following: true,
        postsCount: true,
        engagementRate: true,
        createdAt: true,
      },
    });

    // Transform to frontend format
    const transformedFeeds = feeds.map((feed) => ({
      id: feed.id,
      platform: feed.platform.toLowerCase(),
      platformAccountId: feed.platformAccountId,
      handle: feed.handle,
      displayName: feed.displayName,
      profilePictureUrl: feed.profilePictureUrl,
      isConnected: feed.isConnected,
      automationEnabled: feed.automationEnabled,
      controlMode: feed.controlMode.toLowerCase(),
      lastSync: feed.lastSyncAt?.toISOString() || null,
      lastSyncError: feed.lastSyncError,
      metrics: {
        followers: feed.followers,
        following: feed.following,
        postsCount: feed.postsCount,
        engagement: feed.engagementRate,
        postsPerWeek: 0, // Calculate from scheduled posts
        uptime: feed.isConnected ? 100 : 0,
      },
      createdAt: feed.createdAt.toISOString(),
    }));

    return NextResponse.json(transformedFeeds);
  } catch (error) {
    console.error('GET /api/feeds failed:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to fetch feeds' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/feeds
 *
 * Disconnect a feed (doesn't delete, just marks as disconnected)
 */
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { feedId } = await req.json();
    const userId = (session.user as any).id;

    const feed = await prisma.socialFeed.findFirst({
      where: { id: feedId, userId },
    });

    if (!feed) {
      return NextResponse.json({ error: 'Feed not found' }, { status: 404 });
    }

    // Mark as disconnected (don't delete to preserve history)
    await prisma.socialFeed.update({
      where: { id: feedId },
      data: {
        isConnected: false,
        accessToken: '', // Clear the token
        refreshToken: null,
      },
    });

    return NextResponse.json({ success: true, message: 'Feed disconnected' });
  } catch (error) {
    console.error('DELETE /api/feeds failed:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to disconnect feed' },
      { status: 500 }
    );
  }
}
