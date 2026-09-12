import { NextResponse } from 'next/server';

import { query } from '@/app/lib/db';
import { normalizeFeed } from '@/app/lib/feeds';
import { getTenantUser, unauthorized } from '@/lib/security/tenant';

// Force dynamic rendering - prevent build-time pre-rendering
export const dynamic = 'force-dynamic';

/**
 * SEC-1 NOTE — LEGACY RAW-SQL FEED ROUTE
 *
 * This route writes to a raw `feeds` table via app/lib/db (a separate pg Pool),
 * NOT to the Prisma `SocialFeed` model. No migration in prisma/migrations
 * creates that table, and the row it returns has no user/owner column, so
 * ownership CANNOT be resolved here without a schema change — which is out of
 * scope for SEC-1.
 *
 * What this milestone does: close the unauthenticated hole (fail closed on no
 * session). What it does NOT do: prove tenant ownership. Full resolution is
 * flagged in the SEC-1 report as an open decision — either delete these legacy
 * routes or add an owner column, both of which need explicit approval.
 */


export async function POST(req: Request) {
  const user = await getTenantUser();
  if (!user) return unauthorized();

  try {
    const body = await req.json();
    const { platform, handle, displayName } = body;

    const result = await query(
      `
      INSERT INTO feeds (
        platform,
        handle,
        display_name,
        is_connected,
        automation_enabled,
        followers,
        engagement,
        posts_per_week,
        uptime
      )
      VALUES ($1, $2, $3, true, false, 0, 0, 0, 100)
      RETURNING
        id,
        platform,
        handle,
        display_name,
        is_connected,
        automation_enabled,
        followers,
        engagement,
        posts_per_week,
        uptime,
        last_sync
      `,
      [platform, handle, displayName]
    );

    const feed = normalizeFeed(result.rows[0]);

    return NextResponse.json(feed);
  } catch (error) {
    console.error('POST /api/feeds/connect failed:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to connect feed' },
      { status: 500 }
    );
  }
}
