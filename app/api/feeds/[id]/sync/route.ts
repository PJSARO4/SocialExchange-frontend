import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { normalizeFeed } from '@/app/lib/feeds';

/**
 * Manual, user-initiated sync.
 * This does NOT run cron logic.
 * It simply marks last_sync and returns updated state.
 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const feedId = params.id;

    // For now, we simulate a sync by touching last_sync.
    // Platform adapters will be invoked here later.
    const result = await query(
      `
      UPDATE feeds
      SET
        last_sync = NOW(),
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
    console.error('manual sync failed:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to sync feed' },
      { status: 500 }
    );
  }
}
