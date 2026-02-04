import { NextRequest, NextResponse } from 'next/server';

import { jobQueue } from '@/lib/queue';

// Force dynamic rendering - prevent build-time pre-rendering
export const dynamic = 'force-dynamic';

/**
 * Job Queue API
 *
 * Provides endpoints for monitoring and managing the job queue.
 */

// GET - Get queue status and jobs
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const feedId = searchParams.get('feed_id');
  const status = searchParams.get('status');

  try {
    // Get overall queue stats
    const stats = await jobQueue.getStats();

    const response: any = { stats };

    // If feed_id provided, get jobs for that feed
    if (feedId) {
      const jobs = await jobQueue.getJobsForFeed(feedId, {
        status: status?.toUpperCase() as any,
      });

      response.jobs = jobs.map((job) => ({
        id: job.id,
        type: job.type,
        status: job.status.toLowerCase(),
        scheduled_for: job.scheduledFor?.toISOString(),
        attempts: job.attempts,
        max_attempts: job.maxAttempts,
        last_error: job.lastError,
        created_at: job.createdAt.toISOString(),
      }));
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Queue GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Add a job to the queue (admin/testing)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, payload, scheduled_for, priority } = body;

    if (!type || !payload) {
      return NextResponse.json(
        { error: 'type and payload are required' },
        { status: 400 }
      );
    }

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

// DELETE - Cancel a job or cleanup old jobs
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const jobId = searchParams.get('job_id');
  const cleanup = searchParams.get('cleanup');

  try {
    if (jobId) {
      // Cancel a specific job
      const cancelled = await jobQueue.cancelJob(jobId);
      return NextResponse.json({
        cancelled,
        job_id: jobId,
      });
    } else if (cleanup) {
      // Cleanup old completed/failed jobs
      const days = parseInt(cleanup, 10) || 7;
      const count = await jobQueue.cleanup(days);
      return NextResponse.json({
        cleaned_up: count,
        older_than_days: days,
      });
    } else {
      return NextResponse.json(
        { error: 'Either job_id or cleanup parameter is required' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Queue DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
