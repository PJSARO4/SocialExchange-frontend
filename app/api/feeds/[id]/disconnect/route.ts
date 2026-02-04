import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { normalizeFeed } from '@/app/lib/feeds';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: feedId } = await params;

    const result = await query(
      `
      UPDATE feeds
      SET
        is_connected = false,
        automation_enabled = false,
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
    console.error('disconnect feed failed:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to disconnect feed' },
      { status: 500 }
    );
  }
}
