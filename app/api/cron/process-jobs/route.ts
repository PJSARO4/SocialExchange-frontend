import { NextRequest, NextResponse } from 'next/server';
import { processJob } from '@/lib/worker/job-processor';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Cron Job Processor
 *
 * Called by Vercel Cron every 5 minutes to process pending jobs.
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
    // Try to use Prisma for job queue if available
    let prisma: any;
    try {
      const { PrismaClient } = await import('@prisma/client');
      prisma = new PrismaClient();
    } catch {
      // Prisma not available - return info
      return NextResponse.json({
        message: 'Job processor ready. Prisma not configured - using demo mode.',
        processed: 0,
        duration_ms: Date.now() - startTime,
      });
    }

    // Fetch pending jobs ordered by scheduled time
    const pendingJobs = await prisma.job.findMany({
      where: {
        status: 'PENDING',
        scheduledFor: {
          lte: new Date(),
        },
      },
      orderBy: {
        scheduledFor: 'asc',
      },
      take: MAX_JOBS_PER_RUN,
    });

    console.log(`🔧 Processing ${pendingJobs.length} pending jobs...`);

    for (const job of pendingJobs) {
      try {
        // Lock the job
        await prisma.job.update({
          where: { id: job.id },
          data: {
            status: 'PROCESSING',
            startedAt: new Date(),
          },
        });

        // Process the job
        const result = await processJob({
          id: job.id,
          type: job.type,
          payload: job.payload,
          status: 'PROCESSING',
          attempts: job.attempts,
          maxAttempts: job.maxAttempts,
          scheduledFor: job.scheduledFor,
          createdAt: job.createdAt,
        });

        // Update job status
        await prisma.job.update({
          where: { id: job.id },
          data: {
            status: result.success ? 'COMPLETED' : 'FAILED',
            completedAt: new Date(),
            result: result.data || null,
            error: result.error || null,
            attempts: job.attempts + 1,
          },
        });

        results.push({
          jobId: job.id,
          type: job.type,
          success: result.success,
          error: result.error,
        });

        console.log(`${result.success ? '✅' : '❌'} Job ${job.id} (${job.type}): ${result.success ? 'completed' : result.error}`);
      } catch (error: any) {
        // Mark job as failed
        await prisma.job.update({
          where: { id: job.id },
          data: {
            status: job.attempts + 1 >= job.maxAttempts ? 'FAILED' : 'PENDING',
            error: error.message,
            attempts: job.attempts + 1,
          },
        });

        results.push({
          jobId: job.id,
          type: job.type,
          success: false,
          error: error.message,
        });
      }
    }

    await prisma.$disconnect();

    const duration = Date.now() - startTime;
    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`🏁 Cron complete: ${succeeded} succeeded, ${failed} failed (${duration}ms)`);

    return NextResponse.json({
      processed: results.length,
      succeeded,
      failed,
      duration_ms: duration,
      results,
    });
  } catch (error: any) {
    console.error('❌ Cron processor error:', error);
    return NextResponse.json(
      { error: 'Cron processor failed', details: error.message },
      { status: 500 }
    );
  }
}
