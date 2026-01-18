import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { logEvent } from "@/app/lib/logEvent";
import { LogCategory, LogLevel } from "@/app/types/SystemLog";

/**
 * TEMP USER HANDLING
 * Replace with real session-based user ID later
 */
const TEMP_USER_ID = "00000000-0000-0000-0000-000000000001";

/**
 * GET — fetch recent logs for the current user
 * This endpoint MUST NEVER throw.
 */
export async function GET() {
  try {
    const { rows } = await db.query(
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
