import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@/app/generated/prisma';
import { getAccountInsights, getRecentMedia } from '@/app/lib/social/instagram';

const prisma = new PrismaClient();

/**
 * GET /api/feeds/[id]/metrics
 *
 * Fetch real-time metrics from Instagram for a connected feed
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as any).id;

    // Get the feed
    const feed = await prisma.socialFeed.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!feed) {
      return NextResponse.json({ error: 'Feed not found' }, { status: 404 });
    }

    if (!feed.isConnected) {
      return NextResponse.json(
        { error: 'Feed is disconnected. Please reconnect your account.' },
        { status: 400 }
      );
    }

    // Fetch fresh data from Instagram
    if (feed.platform === 'INSTAGRAM') {
      const insights = await getAccountInsights(
        feed.platformAccountId,
        feed.accessToken
      );

      // Update the cached metrics in the database
      await prisma.socialFeed.update({
        where: { id: feed.id },
        data: {
          followers: insights.followerCount,
          engagementRate: insights.engagementRate,
          lastSyncAt: new Date(),
          lastSyncError: null,
        },
      });

      // Record metrics history
      await prisma.feedMetricsHistory.create({
        data: {
          feedId: feed.id,
          followers: insights.followerCount,
          following: feed.following,
          postsCount: feed.postsCount,
          engagementRate: insights.engagementRate,
        },
      });

      return NextResponse.json({
        success: true,
        metrics: {
          followers: insights.followerCount,
          following: feed.following,
          postsCount: feed.postsCount,
          engagement: insights.engagementRate,
          impressions: insights.impressions,
          reach: insights.reach,
          profileViews: insights.profileViews,
          totalLikes: insights.totalLikes,
          totalComments: insights.totalComments,
        },
        lastSync: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { error: `Metrics not supported for platform: ${feed.platform}` },
      { status: 400 }
    );
  } catch (error) {
    console.error('GET /api/feeds/[id]/metrics failed:', error);

    // Update the feed with the error
    const { id } = await params;
    await prisma.socialFeed.update({
      where: { id },
      data: {
        lastSyncError: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch metrics',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/feeds/[id]/metrics
 *
 * Force refresh metrics (same as GET but explicit refresh action)
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return GET(req, { params });
}
