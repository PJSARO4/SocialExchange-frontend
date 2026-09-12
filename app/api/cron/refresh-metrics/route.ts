import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/prisma';
import { refreshLongLivedToken } from '@/app/lib/social/instagram';
import { observeFeedMetrics } from '@/app/lib/metrics/observe';
import { applyObservation } from '@/app/lib/metrics/persist';

/**
 * Fail-closed CRON_SECRET check.
 * - If CRON_SECRET is undefined/empty => deny (return false).
 * - Otherwise require `Authorization: Bearer <CRON_SECRET>` (timing-safe).
 */
function isAuthorizedCron(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    // Fail closed: no secret configured means no one is authorized.
    return false;
  }

  const authHeader = request.headers.get('authorization') || '';
  const expected = `Bearer ${cronSecret}`;

  const a = Buffer.from(authHeader);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// Force dynamic rendering - prevent build-time pre-rendering
export const dynamic = 'force-dynamic';

/**
 * Cron route: refresh metrics for all connected Instagram feeds
 *
 * Called daily by Vercel Cron. For each connected feed:
 * 1. Proactively refreshes tokens expiring within 7 days
 * 2. Takes ONE canonical observation (app/lib/metrics/observe.ts)
 * 3. Writes only genuinely measured values (app/lib/metrics/persist.ts)
 * 4. Records a history snapshot only when the observation is complete
 *
 * METRICS-1: this route previously called getAccountInsights(), which sends an
 * Instagram-Login token to graph.facebook.com. That fails ("Invalid OAuth
 * access token - Cannot parse access token"), which is why this job has never
 * written a history row. Worse, it wrote the `follower_count` PERIOD INSIGHT
 * into SocialFeed.followers, a TOTAL-followers column. Both faults are gone:
 * the trusted path no longer touches getAccountInsights at all.
 *
 * Security: Validates CRON_SECRET to ensure only Vercel can trigger this.
 */
export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron (fail closed if CRON_SECRET unset)
  if (!isAuthorizedCron(request)) {
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
    updatedFields?: string[];
    historyWritten?: boolean;
    historySkippedReason?: string;
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

        // ONE canonical observation: profile totals + recent-media averages.
        const observation = await observeFeedMetrics(accessToken);
        const persisted = await applyObservation(feed.id, observation);

        if (!observation.ok) {
          results.push({
            feedId: feed.id,
            handle: feed.handle,
            success: false,
            tokenRefreshed,
            error: observation.error,
          });
          console.warn(`[refresh-metrics] Observation failed for ${feed.handle}`);
          continue;
        }

        results.push({
          feedId: feed.id,
          handle: feed.handle,
          success: true,
          tokenRefreshed,
          updatedFields: persisted.updatedFields,
          historyWritten: persisted.historyWritten,
          ...(persisted.historySkippedReason
            ? { historySkippedReason: persisted.historySkippedReason }
            : {}),
        });

        console.log(
          `[refresh-metrics] Observed ${feed.handle}: ` +
            `fields=[${persisted.updatedFields.join(',')}] history=${persisted.historyWritten}`
        );
      } catch (feedError: any) {
        // Mark the feed's sync error but don't stop processing others.
        // METRICS-1: lastSyncAt is NOT advanced here — it means "last successful
        // observation", and a failure must never advertise freshness.
        await prisma.socialFeed.update({
          where: { id: feed.id },
          data: {
            lastSyncError: feedError.message || 'Failed to refresh metrics',
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
