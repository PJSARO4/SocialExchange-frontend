import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { observeFeedMetrics } from '@/app/lib/metrics/observe';
import { applyObservation } from '@/app/lib/metrics/persist';

// Force dynamic rendering - prevent build-time pre-rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/feeds/[id]/metrics
 *
 * Take one canonical observation for a feed the caller owns, persist what was
 * genuinely measured, and return it with per-metric quality.
 *
 * METRICS-1: this route previously called getAccountInsights() and wrote
 * `insights.followerCount` — the follower PERIOD INSIGHT — straight into
 * SocialFeed.followers with no fallback, so a small period value could have
 * replaced the account's total follower count outright. It now uses the
 * canonical observer; total followers come only from the profile
 * `followers_count` field.
 *
 * NOTE: this is a read-shaped route that WRITES (it refreshes the cache and may
 * record a history snapshot). That was true before METRICS-1 and is unchanged.
 * SEC-1 ownership gating is unchanged.
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
      const observation = await observeFeedMetrics(feed.accessToken);
      const persisted = await applyObservation(feed.id, observation);

      if (!observation.ok) {
        return NextResponse.json(
          {
            success: false,
            error: observation.error ?? 'Observation failed',
            // Freshness is NOT advanced on failure.
            lastSync: feed.lastSyncAt?.toISOString() ?? null,
          },
          { status: 502 }
        );
      }

      // Every metric carries its own quality. `null` means not measured this
      // cycle — it must never be rendered or stored as zero.
      const m = <T,>(x: { value: T | null; quality: string; reason?: string }) => ({
        value: x.value,
        quality: x.quality,
        ...(x.reason ? { reason: x.reason } : {}),
      });

      return NextResponse.json({
        success: true,
        observedAt: observation.observedAt.toISOString(),
        contractVersion: observation.contractVersion,
        source: observation.source,
        metrics: {
          followers: m(observation.followers),
          following: m(observation.following),
          postsCount: m(observation.postsCount),
          engagementRate: m(observation.engagementRate),
          avgLikesPerPost: m(observation.avgLikesPerPost),
          avgCommentsPerPost: m(observation.avgCommentsPerPost),
          sampleSize: m(observation.sampleSize),
          impressions: m(observation.impressions),
          reach: m(observation.reach),
          profileViews: m(observation.profileViews),
        },
        persisted: {
          updatedFields: persisted.updatedFields,
          historyWritten: persisted.historyWritten,
          ...(persisted.historySkippedReason
            ? { historySkippedReason: persisted.historySkippedReason }
            : {}),
        },
        lastSync: observation.observedAt.toISOString(),
      });
    }

    return NextResponse.json(
      { error: `Metrics not supported for platform: ${feed.platform}` },
      { status: 400 }
    );
  } catch (error) {
    console.error('GET /api/feeds/[id]/metrics failed:', error);

    // SEC-1: scope the error write to a feed this session owns. Previously this
    // updated by bare id, so any error raised before the ownership check above
    // would have written to another tenant's row.
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (userId) {
      const { id } = await params;
      await prisma.socialFeed.updateMany({
        where: { id, userId },
        data: {
          lastSyncError: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }

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
