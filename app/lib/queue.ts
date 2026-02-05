/**
 * Job Queue - In-memory queue with localStorage persistence
 *
 * For production, this should be replaced with Redis/BullMQ or a database-backed queue
 */

export type JobType = 'PUBLISH_POST' | 'AUTO_COMMENT' | 'WELCOME_DM' | 'SYNC_METRICS' | 'REFRESH_TOKEN';
export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface Job {
  id: string;
  type: JobType;
  feedId: string;
  payload: Record<string, any>;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  scheduledFor: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  error?: string;
  result?: any;
}

interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}

// In-memory job storage (would be Redis/DB in production)
let jobs: Job[] = [];

// Load from localStorage on init (client-side only)
if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem('socialexchange_job_queue');
    if (stored) {
      jobs = JSON.parse(stored).map((j: any) => ({
        ...j,
        scheduledFor: new Date(j.scheduledFor),
        createdAt: new Date(j.createdAt),
        updatedAt: new Date(j.updatedAt),
        completedAt: j.completedAt ? new Date(j.completedAt) : undefined,
      }));
    }
  } catch (e) {
    console.error('Failed to load job queue:', e);
  }
}

// Persist to localStorage
function persist() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('socialexchange_job_queue', JSON.stringify(jobs));
    } catch (e) {
      console.error('Failed to persist job queue:', e);
    }
  }
}

function generateId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const jobQueue = {
  /**
   * Add a job to the queue
   */
  async addJob(params: {
    type: JobType;
    feedId: string;
    payload: Record<string, any>;
    scheduledFor?: Date;
    maxAttempts?: number;
  }): Promise<Job> {
    const job: Job = {
      id: generateId(),
      type: params.type,
      feedId: params.feedId,
      payload: params.payload,
      status: 'PENDING',
      attempts: 0,
      maxAttempts: params.maxAttempts || 3,
      scheduledFor: params.scheduledFor || new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    jobs.push(job);
    persist();

    console.log(`📥 Job added: ${job.id} (${job.type})`);
    return job;
  },

  /**
   * Get the next job ready for processing
   */
  async getNextJob(): Promise<Job | null> {
    const now = new Date();

    // Find a pending job that's ready to run
    const job = jobs.find(
      j => j.status === 'PENDING' &&
           j.scheduledFor <= now &&
           j.attempts < j.maxAttempts
    );

    if (job) {
      job.status = 'PROCESSING';
      job.attempts++;
      job.updatedAt = new Date();
      persist();
    }

    return job || null;
  },

  /**
   * Get jobs by feed ID
   */
  async getJobsByFeed(feedId: string, status?: JobStatus): Promise<Job[]> {
    return jobs.filter(j =>
      j.feedId === feedId &&
      (!status || j.status === status)
    );
  },

  /**
   * Get all jobs with optional filters
   */
  async getJobs(filters?: { status?: JobStatus; type?: JobType; feedId?: string }): Promise<Job[]> {
    let result = [...jobs];

    if (filters?.status) {
      result = result.filter(j => j.status === filters.status);
    }
    if (filters?.type) {
      result = result.filter(j => j.type === filters.type);
    }
    if (filters?.feedId) {
      result = result.filter(j => j.feedId === filters.feedId);
    }

    return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  /**
   * Mark a job as completed
   */
  async completeJob(jobId: string, result?: any): Promise<void> {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      job.status = 'COMPLETED';
      job.completedAt = new Date();
      job.updatedAt = new Date();
      job.result = result;
      persist();
      console.log(`✅ Job completed: ${jobId}`);
    }
  },

  /**
   * Mark a job as failed
   */
  async failJob(jobId: string, error: string): Promise<void> {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      job.error = error;
      job.updatedAt = new Date();

      // If max attempts reached, mark as failed
      if (job.attempts >= job.maxAttempts) {
        job.status = 'FAILED';
        console.log(`❌ Job failed permanently: ${jobId}`);
      } else {
        // Reset to pending for retry
        job.status = 'PENDING';
        console.log(`⚠️ Job failed, will retry: ${jobId} (attempt ${job.attempts}/${job.maxAttempts})`);
      }

      persist();
    }
  },

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const index = jobs.findIndex(j => j.id === jobId);
    if (index !== -1 && jobs[index].status === 'PENDING') {
      jobs.splice(index, 1);
      persist();
      console.log(`🗑️ Job cancelled: ${jobId}`);
      return true;
    }
    return false;
  },

  /**
   * Get queue statistics
   */
  async getStats(): Promise<QueueStats> {
    return {
      pending: jobs.filter(j => j.status === 'PENDING').length,
      processing: jobs.filter(j => j.status === 'PROCESSING').length,
      completed: jobs.filter(j => j.status === 'COMPLETED').length,
      failed: jobs.filter(j => j.status === 'FAILED').length,
      total: jobs.length,
    };
  },

  /**
   * Clean up old completed/failed jobs
   */
  async cleanup(olderThanHours: number = 24): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    const before = jobs.length;

    jobs = jobs.filter(j =>
      j.status === 'PENDING' ||
      j.status === 'PROCESSING' ||
      j.updatedAt > cutoff
    );

    persist();
    return before - jobs.length;
  },
};

export type { Job as QueueJob };
