import { NextRequest, NextResponse } from 'next/server';

import { query } from '@/app/lib/db';

// Force dynamic rendering - prevent build-time pre-rendering
export const dynamic = 'force-dynamic';


/**
 * GET — fetch recent logs across all users
 * Protected with CRON_SECRET / DEV_MASTER_KEY bearer token auth.
 */
export async function GET(request: NextRequest) {
  // --- AUTH CHECK ---
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const devMasterKey = process.env.DEV_MASTER_KEY;

  const tokenFromHeader = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  const isAuthorized =
    (cronSecret && tokenFromHeader === cronSecret) ||
    (devMasterKey && tokenFromHeader === devMasterKey);

  if (!isAuthorized) {
    // In development, allow access if no CRON_SECRET is configured
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev || cronSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }
  const { rows } = await query(
    `
    SELECT
      id,
      user_id AS "userId",
      created_at AS "createdAt",
      category,
      level,
      message,
      context
    FROM system_logs
    ORDER BY created_at DESC
    LIMIT 100
    `
  );

  return NextResponse.json(rows);
}
