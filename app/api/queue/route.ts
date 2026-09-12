import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';

import { jobQueue } from '@/lib/queue';
import {
  getTenantUser,
  notFound,
  resolveOwnedFeed,
  resolveOwnedJob,
  unauthorized,
} from '@/lib/security/tenant';

// Force dynamic rendering - prevent build-time pre-rendering
export const dynamic = 'force-dynamic';

/**
 * Job Queue API
 *
 * Provides endpoints for monitoring and managing the job queue.
 *
 * SEC-1 — WHAT CHANGED AND WHY
 *
 * Before this milestone all three methods were unauthenticated. Anyone could
 * enumerate another tenant's jobs by feed_id, enqueue arbitrary jobs (including
 * PUBLISH_POST against a feed they did not own), cancel another tenant's queued
 * publishes, or call the maintenance cleanup and delete queue rows globally.
 *
 * MIXED SYSTEM / USER SURFACE — REPORTED, NOT MERGED
 *
 * This one endpoint carried both per-tenant operations and two system-wide
 * operations (global queue stats, and cleanup of old rows across every tenant).
 * Applying a browser session to a system operation would be wrong in both
 * directions, so the two are now separated by gate rather than by route:
 *
 *   - per-feed read / enqueue / cancel  -> session + feed ownership
 *   - cleanup (system maintenance)      -> CRON_SECRET bearer, fail closed
 *   - global cross-tenant stats         -> removed from the user-facing response
 *
 * The worker and cron publishing paths do not call this route; they use
 * lib/queue directly, so internal processing is unaffected.
 */

/** Fail-closed system-secret check, matching the cron routes' pattern. */
function isSystemCaller(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const authHeader = request.headers.get('authorization') || '';
  const expected = `Bearer ${cronSecret}`;

  const a = Buffer.from(authHeader);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// GET - List jobs for a feed the caller owns
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const feedId = searchParams.get('feed_id');
  const status = searchParams.get('status');

  const user = await getTenantUser();
  if (!user) return unauthorized();

  if (!feedId) {
    return NextResponse.json({ error: 'feed_id is required' }, { status: 400 });
  }

  const ownedFeed = await resolveOwnedFeed(user.id, feedId);
  if (!ownedFeed) return notFound('Feed');

  try {
    const jobs = await jobQueue.getJobsForFeed(feedId, {
      status: status?.toUpperCase() as any,
    });

    return NextResponse.json({
      jobs: jobs.map((job) => ({
        id: job.id,
        type: job.type,
        status: job.status.toLowerCase(),
        scheduled_for: job.scheduledFor?.toISOString(),
        attempts: job.attempts,
        max_attempts: job.maxAttempts,
        last_error: job.lastError,
        created_at: job.createdAt.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('Queue GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Add a job to the queue for a feed the caller owns
export async function POST(request: NextRequest) {
  const user = await getTenantUser();
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const { type, payload, scheduled_for, priority } = body;

    if (!type || !payload) {
      return NextResponse.json(
        { error: 'type and payload are required' },
        { status: 400 }
      );
    }

    // Every job in this system is feed-scoped. The feed named in the payload
    // must belong to the caller before anything is enqueued.
    const feedId = typeof payload?.feedId === 'string' ? payload.feedId : null;
    if (!feedId) {
      return NextResponse.json(
        { error: 'payload.feedId is required' },
        { status: 400 }
      );
    }

    const ownedFeed = await resolveOwnedFeed(user.id, feedId);
    if (!ownedFeed) return notFound('Feed');

    const jobId = await jobQueue.addJob(type, payload, {
      scheduledFor: scheduled_for ? new Date(scheduled_for) : undefined,
      priority,
    });

    return NextResponse.json({ job_id: jobId }, { status: 201 });
  } catch (error: any) {
    console.error('Queue POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Cancel one owned job, or (system only) clean up old rows
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const jobId = searchParams.get('job_id');
  const cleanup = searchParams.get('cleanup');

  try {
    if (jobId) {
      const user = await getTenantUser();
      if (!user) return unauthorized();

      // Ownership through the job's owning feed.
      const owned = await resolveOwnedJob(user.id, jobId);
      if (!owned) return notFound('Job');

      const cancelled = await jobQueue.cancelJob(jobId);
      return NextResponse.json({
        cancelled,
        job_id: jobId,
      });
    }

    if (cleanup) {
      // System maintenance: deletes rows across every tenant. Never reachable
      // with a browser session.
      if (!isSystemCaller(request)) return unauthorized();

      const days = parseInt(cleanup, 10) || 7;
      const count = await jobQueue.cleanup(days);
      return NextResponse.json({
        cleaned_up: count,
        older_than_days: days,
      });
    }

    return NextResponse.json(
      { error: 'Either job_id or cleanup parameter is required' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Queue DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
