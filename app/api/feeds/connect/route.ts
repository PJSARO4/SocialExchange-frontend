import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { normalizeFeed } from '@/app/lib/feeds';

export async function POST(req: Request) {
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
