import { NextRequest, NextResponse } from 'next/server';
import { jobQueue, Job } from '@/lib/queue';
import { processJob } from '@/lib/worker/job-processor';

/**
 * Worker API
 *
 * In production, you would run the worker as a separate process.
 * This API provides a way to:
 * 1. Check worker status
 * 2. Manually trigger job processing (for development/testing)
 * 3. Process a single job (useful for debugging)
 */

// Track if the inline worker is running
let isInlineWorkerRunning = false;
let processedCount = 0;
let lastProcessedAt: Date | null = null;

// GET - Get worker status
export async function GET(request: NextRequest) {
  try {
    const queueStats = await jobQueue.getStats();

    return NextResponse.json({
      inline_worker: {
        running: isInlineWorkerRunning,
        processed_count: processedCount,
        last_processed_at: lastProcessedAt?.toISOString(),
      },
      queue: queueStats,
      recommendation: queueStats.pending > 10
        ? 'Consider running a dedicated worker process for production'
        : 'Queue is manageable with inline processing',
    });
  } catch (error: any) {
    console.error('Worker status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Process jobs
export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('mode') || 'single';
  const maxJobs = parseInt(searchParams.get('max') || '10', 10);

  try {
    if (mode === 'single') {
      // Process a single job
      const job = await jobQueue.getNextJob();

      if (!job) {
        return NextResponse.json({
          processed: false,
          message: 'No jobs available to process',
        });
      }

      const result = await processJobSafely(job);

      return NextResponse.json({
        processed: true,
        job_id: job.id,
        job_type: job.type,
        result,
      });
    } else if (mode === 'batch') {
      // Process multiple jobs
      const results: any[] = [];
      let count = 0;

      while (count < maxJobs) {
        const job = await jobQueue.getNextJob();
        if (!job) break;

        const result = await processJobSafely(job);
        results.push({
          job_id: job.id,
          job_type: job.type,
          result,
        });
        count++;
      }

      return NextResponse.json({
        processed: count,
        results,
      });
    } else if (mode === 'start') {
      // Start inline worker (for development)
      if (isInlineWorkerRunning) {
        return NextResponse.json({
          message: 'Inline worker is already running',
        });
      }

      startInlineWorker();

      return NextResponse.json({
        message: 'Inline worker started',
        note: 'This is for development only. Use a dedicated worker process in production.',
      });
    } else if (mode === 'stop') {
      // Stop inline worker
      isInlineWorkerRunning = false;

      return NextResponse.json({
        message: 'Inline worker stopped',
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid mode. Use: single, batch, start, or stop' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Worker POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Process a job safely with error handling
async function processJobSafely(job: Job) {
  try {
    console.log(`🔧 Processing job ${job.id} (${job.type})`);
    const result = await processJob(job);

    if (result.success) {
      await jobQueue.completeJob(job.id, result.data);
    } else {
      await jobQueue.failJob(job.id, result.error || 'Unknown error');
    }

    processedCount++;
    lastProcessedAt = new Date();

    return result;
  } catch (error: any) {
    console.error(`Job ${job.id} error:`, error);
    await jobQueue.failJob(job.id, error.message);
    return { success: false, error: error.message };
  }
}

// Start an inline worker (for development)
function startInlineWorker() {
  if (isInlineWorkerRunning) return;

  isInlineWorkerRunning = true;
  console.log('🚀 Starting inline worker...');

  const poll = async () => {
    if (!isInlineWorkerRunning) {
      console.log('🛑 Inline worker stopped');
      return;
    }

    try {
      const job = await jobQueue.getNextJob();
      if (job) {
        await processJobSafely(job);
      }
    } catch (error) {
      console.error('Inline worker error:', error);
    }

    // Poll every 10 seconds
    setTimeout(poll, 10000);
  };

  poll();
}
