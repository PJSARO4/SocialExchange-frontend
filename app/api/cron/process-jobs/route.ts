import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processJob } from '@/lib/worker/job-processor';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Cron Job Processor
 *
 * Called daily by Vercel Cron to process pending jobs from the JobQueue table.
 * Processes up to 10 jobs per invocation.
 *
 * Security: Validates CRON_SECRET to ensure only Vercel can trigger this.
 */

const MAX_JOBS_PER_RUN = 10;

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const startTime = Date.now();
  const results: Array<{ jobId: string; type: string; success: boolean; error?: string }> = [];

  try {
    // Fetch pending jobs from JobQueue, ordered by priority then scheduled time
    const pendingJobs = await prisma.jobQueue.findMany({
      where: {
        status: 'PENDING',
        OR: [
          { scheduledFor: null },
          { scheduledFor: { lte: new Date() } },
        ],
        attempts: { lt: 3 }, // Don't retry exhausted jobs
      },
      orderBy: [
        { priority: 'desc' },
        { scheduledFor: 'asc' },
        { createdAt: 'asc' },
      ],
      take: MAX_JOBS_PER_RUN,
    });

    console.log(`[process-jobs] Processing ${pendingJobs.length} pending jobs...`);

    for (const job of pendingJobs) {
      try {
        // Lock the job
        await prisma.jobQueue.update({
          where: { id: job.id },
          data: {
            status: 'PROCESSING',
            processedAt: new Date(),
            workerId: 'vercel-cron',
          },
        });

        // Process the job
        const result = await processJob({
          id: job.id,
          type: job.jobType as any,
          payload: job.payload as any,
          status: 'PROCESSING' as any,
          priority: job.priority,
          attempts: job.attempts,
          maxAttempts: job.maxAttempts,
          scheduledFor: job.scheduledFor || undefined,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
        });

        // Update job status
        await prisma.jobQueue.update({
          where: { id: job.id },
          data: {
            status: result.success ? 'COMPLETED' : 'FAILED',
            completedAt: new Date(),
            lastError: result.error || null,
            attempts: job.attempts + 1,
            lockedAt: null,
            lockExpiry: null,
            workerId: null,
          },
        });

        results.push({
          jobId: job.id,
          type: job.jobType,
          success: result.success,
          error: result.error,
        });

        console.log(`[process-jobs] ${result.success ? 'OK' : 'FAIL'} Job ${job.id} (${job.jobType}): ${result.success ? 'completed' : result.error}`);
      } catch (error: any) {
        // Mark job as failed or retry
        const attempts = job.attempts + 1;
        await prisma.jobQueue.update({
          where: { id: job.id },
          data: {
            status: attempts >= job.maxAttempts ? 'FAILED' : 'PENDING',
            lastError: error.message,
            attempts,
            lockedAt: null,
            lockExpiry: null,
            workerId: null,
          },
        });

        results.push({
          jobId: job.id,
          type: job.jobType,
          success: false,
          error: error.message,
        });
      }
    }

    const duration = Date.now() - startTime;
    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`[process-jobs] Done: ${succeeded} succeeded, ${failed} failed (${duration}ms)`);

    return NextResponse.json({
      processed: results.length,
      succeeded,
      failed,
      duration_ms: duration,
      results,
    });
  } catch (error: any) {
    console.error('[process-jobs] Critical error:', error);
    return NextResponse.json(
      { error: 'Cron processor failed', details: error.message },
      { status: 500 }
    );
  }
}
