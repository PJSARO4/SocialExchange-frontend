/**
 * Database-Based Job Queue
 *
 * This is a PostgreSQL-based job queue implementation that works without Redis.
 * It uses PostgreSQL's row-level locking for job distribution.
 *
 * For production with high volume, consider migrating to Redis + BullMQ.
 */

import { prisma } from '../prisma';
import {
  Job,
  JobPayload,
  JobType,
  JobStatus,
  JobResult,
  QueueConfig,
  DEFAULT_QUEUE_CONFIG,
} from './types';

export class DatabaseQueue {
  private config: QueueConfig;
  private workerId: string;
  private isRunning: boolean = false;
  private pollInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<QueueConfig> = {}) {
    this.config = { ...DEFAULT_QUEUE_CONFIG, ...config };
    this.workerId = `worker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add a job to the queue
   */
  async addJob<T extends JobPayload>(
    type: JobType,
    payload: T,
    options: {
      scheduledFor?: Date;
      priority?: number;
      maxAttempts?: number;
    } = {}
  ): Promise<string> {
    const job = await prisma.jobQueue.create({
      data: {
        queueName: this.config.name,
        jobType: type,
        entityType: this.getEntityType(type),
        entityId: this.getEntityId(type, payload),
        feedId: payload.feedId,
        payload: payload as any,
        scheduledFor: options.scheduledFor,
        priority: options.priority ?? 0,
        maxAttempts: options.maxAttempts ?? this.config.retryAttempts,
        status: 'PENDING',
      },
    });

    console.log(`📥 Job added to queue: ${job.id} (${type})`);
    return job.id;
  }

  /**
   * Add multiple jobs at once
   */
  async addJobs<T extends JobPayload>(
    jobs: Array<{
      type: JobType;
      payload: T;
      scheduledFor?: Date;
      priority?: number;
    }>
  ): Promise<string[]> {
    const createdJobs = await prisma.$transaction(
      jobs.map((job) =>
        prisma.jobQueue.create({
          data: {
            queueName: this.config.name,
            jobType: job.type,
            entityType: this.getEntityType(job.type),
            entityId: this.getEntityId(job.type, job.payload),
            feedId: job.payload.feedId,
            payload: job.payload as any,
            scheduledFor: job.scheduledFor,
            priority: job.priority ?? 0,
            maxAttempts: this.config.retryAttempts,
            status: 'PENDING',
          },
        })
      )
    );

    console.log(`📥 ${createdJobs.length} jobs added to queue`);
    return createdJobs.map((j) => j.id);
  }

  /**
   * Get the next available job and lock it
   * Uses optimistic locking to prevent deadlocks
   */
  async getNextJob(): Promise<Job | null> {
    const now = new Date();
    const lockExpiry = new Date(now.getTime() + this.config.lockDuration);
    const maxRetryAttempts = this.config.retryAttempts;

    // Step 1: Find next available job (read-only, no lock)
    const pendingJob = await prisma.jobQueue.findFirst({
      where: {
        queueName: this.config.name,
        status: { in: ['PENDING', 'LOCKED'] },
        OR: [
          { scheduledFor: null },
          { scheduledFor: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { lockedAt: null },
              { lockExpiry: { lt: now } }, // Lock expired
            ],
          },
        ],
        attempts: { lt: maxRetryAttempts }, // Use config value, not prisma field reference
      },
      orderBy: [
        { priority: 'desc' },
        { scheduledFor: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    if (!pendingJob) return null;

    try {
      // Step 2: Try to lock the job with optimistic locking
      const lockedJob = await prisma.jobQueue.updateMany({
        where: {
          id: pendingJob.id,
          status: { in: ['PENDING', 'LOCKED'] }, // Only lock if still available
          OR: [
            { lockedAt: null },
            { lockExpiry: { lt: now } },
          ],
        },
        data: {
          status: 'LOCKED',
          workerId: this.workerId,
          lockedAt: now,
          lockExpiry: lockExpiry,
        },
      });

      // Check if we actually acquired the lock
      if (lockedJob.count === 0) {
        return null; // Another worker locked it first
      }

      // Fetch the locked job
      const job = await prisma.jobQueue.findUnique({
        where: { id: pendingJob.id },
      });

      return job ? this.mapDbJobToJob(job) : null;
    } catch (error) {
      // If lock fails, another worker got it
      console.log(`Job ${pendingJob.id} was claimed by another worker`);
      return null;
    }
  }

  /**
   * Mark a job as completed
   */
  async completeJob(jobId: string, result?: any): Promise<void> {
    const now = new Date();

    await prisma.jobQueue.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        completedAt: now,
        processedAt: now,
      },
    });

    console.log(`✅ Job completed: ${jobId}`);
  }

  /**
   * Mark a job as failed
   */
  async failJob(jobId: string, error: string): Promise<void> {
    const job = await prisma.jobQueue.findUnique({
      where: { id: jobId },
    });

    if (!job) return;

    const attempts = job.attempts + 1;
    const shouldRetry = attempts < job.maxAttempts;

    await prisma.jobQueue.update({
      where: { id: jobId },
      data: {
        status: shouldRetry ? 'PENDING' : 'FAILED',
        attempts,
        lastError: error,
        lockedAt: null,
        lockExpiry: null,
        workerId: null,
        // If retrying, schedule for later
        scheduledFor: shouldRetry
          ? new Date(Date.now() + this.config.retryDelay * attempts)
          : job.scheduledFor,
      },
    });

    if (shouldRetry) {
      console.log(`🔄 Job ${jobId} will retry (attempt ${attempts}/${job.maxAttempts})`);
    } else {
      console.log(`❌ Job failed permanently: ${jobId} - ${error}`);
    }
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  }> {
    const stats = await prisma.jobQueue.groupBy({
      by: ['status'],
      where: { queueName: this.config.name },
      _count: true,
    });

    const result = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      total: 0,
    };

    for (const stat of stats) {
      const count = stat._count;
      result.total += count;

      switch (stat.status) {
        case 'PENDING':
          result.pending += count;
          break;
        case 'LOCKED':
        case 'PROCESSING':
          result.processing += count;
          break;
        case 'COMPLETED':
          result.completed += count;
          break;
        case 'FAILED':
        case 'DEAD_LETTER':
          result.failed += count;
          break;
      }
    }

    return result;
  }

  /**
   * Clean up old completed/failed jobs
   */
  async cleanup(olderThanDays: number = 7): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);

    const result = await prisma.jobQueue.deleteMany({
      where: {
        queueName: this.config.name,
        status: { in: ['COMPLETED', 'FAILED', 'DEAD_LETTER'] },
        updatedAt: { lt: cutoff },
      },
    });

    console.log(`🧹 Cleaned up ${result.count} old jobs`);
    return result.count;
  }

  /**
   * Get jobs for a specific feed
   */
  async getJobsForFeed(
    feedId: string,
    options: { status?: JobStatus; limit?: number } = {}
  ): Promise<Job[]> {
    const jobs = await prisma.jobQueue.findMany({
      where: {
        queueName: this.config.name,
        feedId,
        ...(options.status && { status: options.status }),
      },
      orderBy: { createdAt: 'desc' },
      take: options.limit ?? 50,
    });

    return jobs.map(this.mapDbJobToJob);
  }

  /**
   * Cancel a pending job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const result = await prisma.jobQueue.updateMany({
      where: {
        id: jobId,
        status: { in: ['PENDING', 'LOCKED'] },
      },
      data: {
        status: 'FAILED',
        lastError: 'Cancelled by user',
      },
    });

    return result.count > 0;
  }

  // Helper methods

  private getEntityType(type: JobType): string {
    switch (type) {
      case 'PUBLISH_POST':
        return 'scheduled_post';
      case 'AUTO_LIKE':
      case 'AUTO_COMMENT':
      case 'AUTO_FOLLOW':
      case 'AUTO_DM':
        return 'automation_action';
      case 'FETCH_ANALYTICS':
        return 'analytics';
      default:
        return 'unknown';
    }
  }

  private getEntityId(type: JobType, payload: any): string {
    switch (type) {
      case 'PUBLISH_POST':
        return payload.scheduledPostId || '';
      case 'AUTO_LIKE':
      case 'AUTO_COMMENT':
      case 'AUTO_FOLLOW':
      case 'AUTO_DM':
        return payload.ruleId || '';
      default:
        return payload.feedId || '';
    }
  }

  private mapDbJobToJob(dbJob: any): Job {
    return {
      id: dbJob.id,
      type: dbJob.jobType as JobType,
      payload: dbJob.payload as JobPayload,
      status: dbJob.status as JobStatus,
      priority: dbJob.priority,
      scheduledFor: dbJob.scheduledFor,
      attempts: dbJob.attempts,
      maxAttempts: dbJob.maxAttempts,
      lastError: dbJob.lastError,
      createdAt: dbJob.createdAt,
      updatedAt: dbJob.updatedAt,
      processedAt: dbJob.processedAt,
      completedAt: dbJob.completedAt,
    };
  }
}

// Export a singleton instance
export const jobQueue = new DatabaseQueue();
