import { NextResponse } from 'next/server';

import { query } from '@/app/lib/db';
import { normalizeFeed } from '@/app/lib/feeds';

// Force dynamic rendering - prevent build-time pre-rendering
export const dynamic = 'force-dynamic';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: feedId } = await params;

    const result = await query(
      `
      UPDATE feeds
      SET automation_enabled = NOT automation_enabled,
          updated_at = NOW()
      WHERE id = $1
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
      [feedId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Feed not found' },
        { status: 404 }
      );
    }

    const feed = normalizeFeed(result.rows[0]);

    return NextResponse.json(feed);
  } catch (error) {
    console.error('toggle-automation failed:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to toggle automation' },
      { status: 500 }
    );
  }
}
