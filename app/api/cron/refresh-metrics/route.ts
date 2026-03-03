import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAccountInsights, refreshLongLivedToken } from '@/app/lib/social/instagram';

// Force dynamic rendering - prevent build-time pre-rendering
export const dynamic = 'force-dynamic';

/**
 * Cron route: refresh metrics for all connected Instagram feeds
 *
 * Called daily by Vercel Cron. For each connected feed:
 * 1. Fetches fresh insights from Instagram Graph API
 * 2. Updates the feed record with new metrics
 * 3. Stores a metrics history snapshot
 * 4. Proactively refreshes tokens expiring within 7 days
 *
 * Security: Validates CRON_SECRET to ensure only Vercel can trigger this.
 */
export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const startTime = Date.now();
  const results: Array<{
    feedId: string;
    handle: string;
    success: boolean;
    tokenRefreshed?: boolean;
    error?: string;
  }> = [];

  try {
    // Fetch all connected Instagram feeds with valid tokens
    const feeds = await prisma.socialFeed.findMany({
      where: {
        platform: 'INSTAGRAM',
        isConnected: true,
        accessToken: { not: '' },
      },
      select: {
        id: true,
        handle: true,
        platformAccountId: true,
        accessToken: true,
        accessTokenExpires: true,
        followers: true,
        following: true,
        postsCount: true,
        engagementRate: true,
      },
    });

    console.log(`[refresh-metrics] Processing ${feeds.length} connected feeds...`);

    for (const feed of feeds) {
      try {
        let accessToken = feed.accessToken;
        let tokenRefreshed = false;

        // Check if token expires within 7 days and refresh proactively
        if (feed.accessTokenExpires) {
          const sevenDaysFromNow = new Date();
          sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

          if (feed.accessTokenExpires < sevenDaysFromNow) {
            try {
              const refreshed = await refreshLongLivedToken(accessToken);
              accessToken = refreshed.accessToken;
              tokenRefreshed = true;

              await prisma.socialFeed.update({
                where: { id: feed.id },
                data: {
                  accessToken: refreshed.accessToken,
                  accessTokenExpires: new Date(Date.now() + refreshed.expiresIn * 1000),
                },
              });

              console.log(`[refresh-metrics] Token refreshed for ${feed.handle}`);
            } catch (tokenError) {
              console.warn(`[refresh-metrics] Token refresh failed for ${feed.handle}:`, tokenError);
              // Continue with existing token
            }
          }
        }

        // Fetch fresh insights from Instagram Graph API
        const insights = await getAccountInsights(
          feed.platformAccountId,
          accessToken,
          'days_28'
        );

        // Update feed record with new metrics
        await prisma.socialFeed.update({
          where: { id: feed.id },
          data: {
            followers: insights.followerCount || feed.followers,
            engagementRate: insights.engagementRate || feed.engagementRate,
            lastSyncAt: new Date(),
            lastSyncError: null,
          },
        });

        // Store metrics history snapshot
        await prisma.feedMetricsHistory.create({
          data: {
            feedId: feed.id,
            followers: insights.followerCount || feed.followers,
            following: feed.following,
            postsCount: feed.postsCount,
            engagementRate: insights.engagementRate || feed.engagementRate,
            impressions: insights.impressions,
            reach: insights.reach,
            profileViews: insights.profileViews,
          },
        });

        results.push({
          feedId: feed.id,
          handle: feed.handle,
          success: true,
          tokenRefreshed,
        });

        console.log(`[refresh-metrics] Updated ${feed.handle}: ${insights.followerCount} followers, ${insights.engagementRate}% engagement`);
      } catch (feedError: any) {
        // Mark the feed's sync error but don't stop processing others
        await prisma.socialFeed.update({
          where: { id: feed.id },
          data: {
            lastSyncError: feedError.message || 'Failed to refresh metrics',
            lastSyncAt: new Date(),
          },
        });

        results.push({
          feedId: feed.id,
          handle: feed.handle,
          success: false,
          error: feedError.message,
        });

        console.error(`[refresh-metrics] Failed for ${feed.handle}:`, feedError.message);
      }
    }

    const duration = Date.now() - startTime;
    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(`[refresh-metrics] Done: ${succeeded} succeeded, ${failed} failed (${duration}ms)`);

    return NextResponse.json({
      success: true,
      refreshed: succeeded,
      failed,
      duration_ms: duration,
      results,
    });
  } catch (error: any) {
    console.error('[refresh-metrics] Critical error:', error);

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to refresh metrics' },
      { status: 500 }
    );
  }
}
