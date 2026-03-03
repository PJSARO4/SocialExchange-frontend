import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { refreshLongLivedToken } from '@/app/lib/social/instagram';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Cron route: proactively refresh tokens that expire within 7 days
 *
 * Instagram long-lived tokens expire after 60 days. This cron runs daily
 * to refresh any tokens that will expire within the next 7 days, ensuring
 * uninterrupted API access.
 *
 * Token lifecycle:
 * 1. User authenticates via OAuth -> short-lived token (~1hr)
 * 2. /api/feeds/instagram/connect exchanges for long-lived token (~60 days)
 * 3. This cron refreshes tokens before expiry -> new 60-day token
 *
 * Security: Validates CRON_SECRET to ensure only Vercel can trigger this.
 */
export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const results: Array<{
    feedId: string;
    handle: string;
    success: boolean;
    newExpiry?: string;
    error?: string;
  }> = [];

  try {
    // Find feeds with tokens expiring within 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const expiringFeeds = await prisma.socialFeed.findMany({
      where: {
        platform: 'INSTAGRAM',
        isConnected: true,
        accessToken: { not: '' },
        OR: [
          // Token expires within 7 days
          {
            accessTokenExpires: {
              not: null,
              lte: sevenDaysFromNow,
            },
          },
          // Token has no expiry set (needs refresh to establish one)
          {
            accessTokenExpires: null,
          },
        ],
      },
      select: {
        id: true,
        handle: true,
        accessToken: true,
        accessTokenExpires: true,
      },
    });

    console.log(`[refresh-tokens] Found ${expiringFeeds.length} feeds needing token refresh`);

    for (const feed of expiringFeeds) {
      try {
        const refreshed = await refreshLongLivedToken(feed.accessToken);

        const newExpiry = new Date(Date.now() + refreshed.expiresIn * 1000);

        await prisma.socialFeed.update({
          where: { id: feed.id },
          data: {
            accessToken: refreshed.accessToken,
            accessTokenExpires: newExpiry,
          },
        });

        // Also update the NextAuth Account record if possible
        try {
          await prisma.account.updateMany({
            where: {
              provider: { in: ['instagram', 'instagram-direct', 'facebook'] },
              access_token: feed.accessToken,
            },
            data: {
              access_token: refreshed.accessToken,
              expires_at: Math.floor(newExpiry.getTime() / 1000),
            },
          });
        } catch {
          // Non-critical - Account record may not match
        }

        results.push({
          feedId: feed.id,
          handle: feed.handle,
          success: true,
          newExpiry: newExpiry.toISOString(),
        });

        console.log(`[refresh-tokens] Refreshed ${feed.handle} - new expiry: ${newExpiry.toISOString()}`);
      } catch (error: any) {
        results.push({
          feedId: feed.id,
          handle: feed.handle,
          success: false,
          error: error.message,
        });

        // If token refresh fails, mark the feed's sync error
        await prisma.socialFeed.update({
          where: { id: feed.id },
          data: {
            lastSyncError: `Token refresh failed: ${error.message}`,
          },
        });

        console.error(`[refresh-tokens] Failed for ${feed.handle}:`, error.message);
      }
    }

    const duration = Date.now() - startTime;
    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(`[refresh-tokens] Done: ${succeeded} refreshed, ${failed} failed (${duration}ms)`);

    return NextResponse.json({
      success: true,
      checked: expiringFeeds.length,
      refreshed: succeeded,
      failed,
      duration_ms: duration,
      results,
    });
  } catch (error: any) {
    console.error('[refresh-tokens] Critical error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
