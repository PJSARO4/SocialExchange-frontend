/**
 * Background Worker
 *
 * This worker runs as a separate process and polls the job queue for work.
 * It processes jobs sequentially with configurable concurrency.
 *
 * To run: npx ts-node lib/worker/worker.ts
 * Or in production: node dist/lib/worker/worker.js
 */

import { jobQueue, Job } from '../queue';
import { processJob } from './job-processor';

interface WorkerConfig {
  pollInterval: number; // ms between polls
  concurrency: number; // max concurrent jobs
  shutdownTimeout: number; // ms to wait for graceful shutdown
}

const DEFAULT_CONFIG: WorkerConfig = {
  pollInterval: 5000, // 5 seconds
  concurrency: 3,
  shutdownTimeout: 30000, // 30 seconds
};

class Worker {
  private config: WorkerConfig;
  private isRunning: boolean = false;
  private activeJobs: Map<string, Promise<void>> = new Map();
  private pollTimeout: NodeJS.Timeout | null = null;

  constructor(config: Partial<WorkerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start the worker
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Worker is already running');
      return;
    }

    console.log('🚀 Starting worker...');
    console.log(`   Poll interval: ${this.config.pollInterval}ms`);
    console.log(`   Concurrency: ${this.config.concurrency}`);

    this.isRunning = true;
    this.setupShutdownHandlers();
    await this.poll();

    console.log('✅ Worker started');
  }

  /**
   * Stop the worker gracefully
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('⚠️ Worker is not running');
      return;
    }

    console.log('🛑 Stopping worker...');
    this.isRunning = false;

    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
      this.pollTimeout = null;
    }

    // Wait for active jobs to complete
    if (this.activeJobs.size > 0) {
      console.log(`⏳ Waiting for ${this.activeJobs.size} active jobs to complete...`);

      const timeout = new Promise<void>((resolve) => {
        setTimeout(resolve, this.config.shutdownTimeout);
      });

      await Promise.race([
        Promise.all(this.activeJobs.values()),
        timeout,
      ]);
    }

    console.log('✅ Worker stopped');
  }

  /**
   * Main polling loop
   */
  private async poll(): Promise<void> {
    if (!this.isRunning) return;

    try {
      // Check if we can take more jobs
      while (this.activeJobs.size < this.config.concurrency && this.isRunning) {
        const job = await jobQueue.getNextJob();
        if (!job) break;

        // Start processing the job
        const jobPromise = this.processJobWithTracking(job);
        this.activeJobs.set(job.id, jobPromise);
      }
    } catch (error) {
      console.error('❌ Poll error:', error);
    }

    // Schedule next poll
    if (this.isRunning) {
      this.pollTimeout = setTimeout(() => this.poll(), this.config.pollInterval);
    }
  }

  /**
   * Process a job and track its completion
   */
  private async processJobWithTracking(job: Job): Promise<void> {
    try {
      console.log(`🔄 Processing job ${job.id} (${job.type}) - attempt ${job.attempts + 1}/${job.maxAttempts}`);

      const result = await processJob(job);

      if (result.success) {
        await jobQueue.completeJob(job.id, result.data);
      } else {
        await jobQueue.failJob(job.id, result.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error(`❌ Job ${job.id} threw an error:`, error);
      await jobQueue.failJob(job.id, error.message || 'Unexpected error');
    } finally {
      this.activeJobs.delete(job.id);
    }
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupShutdownHandlers(): void {
    const shutdown = async (signal: string) => {
      console.log(`\n📡 Received ${signal}`);
      await this.stop();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  /**
   * Get worker status
   */
  getStatus(): {
    isRunning: boolean;
    activeJobs: number;
    concurrency: number;
  } {
    return {
      isRunning: this.isRunning,
      activeJobs: this.activeJobs.size,
      concurrency: this.config.concurrency,
    };
  }
}

// Create and export worker instance
export const worker = new Worker();

// Run if executed directly
if (require.main === module) {
  console.log('═══════════════════════════════════════════════');
  console.log('   Social Exchange - Background Worker');
  console.log('═══════════════════════════════════════════════');

  worker.start().catch((error) => {
    console.error('Failed to start worker:', error);
    process.exit(1);
  });
}
