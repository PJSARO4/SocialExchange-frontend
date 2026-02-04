import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
import { query } from '@/app/lib/db';


/**
 * GET — fetch recent logs across all users
 * NOTE: Protect this route with admin auth later.
 */
export async function GET() {
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
