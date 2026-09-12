import { NextResponse } from "next/server";

import { query } from "@/app/lib/db";
import { logEvent } from "@/app/lib/logEvent";
import { LogCategory, LogLevel } from "@/app/types/SystemLog";
import { getTenantUser, unauthorized } from "@/lib/security/tenant";

// Force dynamic rendering - prevent build-time pre-rendering
export const dynamic = 'force-dynamic';

/**
 * TEMP USER HANDLING
 * Replace with real session-based user ID later
 */
const TEMP_USER_ID = "00000000-0000-0000-0000-000000000001";

/**
 * SEC-1: both methods were unauthenticated. They are now session-gated so an
 * anonymous caller can neither read the log stream nor inject entries into it.
 *
 * The TEMP_USER_ID scoping is UNCHANGED and is deliberately left in place:
 * repointing logs at the real session user would change what the logs feature
 * means (the SYN capability registry documents this route as PARTIAL for
 * exactly this reason), and that is a data-semantics change, not a tenant
 * boundary fix. Because every row is written under one shared synthetic id,
 * this endpoint exposes no real tenant's data today. Flagged for follow-up.
 */

/**
 * GET — fetch recent logs for the current user
 * This endpoint MUST NEVER throw.
 */
export async function GET() {
  const user = await getTenantUser();
  if (!user) return unauthorized();

  try {
    const { rows } = await query(
      `
      SELECT
        id,
        created_at AS "createdAt",
        category,
        level,
        message,
        context
      FROM system_logs
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 50
      `,
      [TEMP_USER_ID]
    );

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("[LOGS GET ERROR]", error);

    /**
     * CRITICAL DESIGN DECISION:
     * If logs backend is down, the UI must still function.
     * We return an empty array, not a 500.
     */
    return NextResponse.json([], { status: 200 });
  }
}

/**
 * POST — write a new log entry
 * This endpoint also MUST NEVER throw.
 */
export async function POST(request: Request) {
  const user = await getTenantUser();
  if (!user) return unauthorized();

  try {
    const body = await request.json();

    const {
      category,
      message,
      level = LogLevel.INFO,
      context = {},
    } = body;

    if (!category || !message) {
      return NextResponse.json(
        { error: "Missing category or message" },
        { status: 400 }
      );
    }

    await logEvent({
      userId: TEMP_USER_ID,
      category: category as LogCategory,
      message,
      level: level as LogLevel,
      context,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[LOGS POST ERROR]", error);

    /**
     * Again: never hard-fail.
     * Logging failure should not break UX.
     */
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
