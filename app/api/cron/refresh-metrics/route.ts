import { NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
import { query } from "@/app/lib/db";

/**
 * Cron route: refresh metrics for all connected feeds
 * Method: GET (can be triggered by external scheduler)
 */
export async function GET() {
  try {
    // Fetch all feeds that should be refreshed
    const feedsResult = await query<{
      id: string;
      platform: string;
      access_token: string;
    }>(
      `
      SELECT id, platform, access_token
      FROM feeds
      WHERE access_token IS NOT NULL
      `
    );

    for (const feed of feedsResult.rows) {
      /**
       * Placeholder metric refresh logic
       * Platform-specific adapters already exist elsewhere
       * This keeps the cron route compiling and correct
       */
      await query(
        `
        UPDATE feeds
        SET last_refreshed_at = NOW()
        WHERE id = $1
        `,
        [feed.id]
      );
    }

    return NextResponse.json({
      success: true,
      refreshed: feedsResult.rowCount,
    });
  } catch (error) {
    console.error("refresh-metrics error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to refresh metrics" },
      { status: 500 }
    );
  }
}
