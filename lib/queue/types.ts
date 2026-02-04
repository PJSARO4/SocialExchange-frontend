/**
 * Job Queue Types
 *
 * These types define the structure of jobs in our queue system.
 * The system supports both Redis-based (BullMQ) and database-based queues.
 */

export type JobType =
  | 'PUBLISH_POST'
  | 'AUTO_LIKE'
  | 'AUTO_COMMENT'
  | 'AUTO_FOLLOW'
  | 'AUTO_DM'
  | 'FETCH_ANALYTICS';

export type JobStatus =
  | 'PENDING'
  | 'LOCKED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'DEAD_LETTER';

export interface BaseJobPayload {
  feedId: string;
  userId?: string;
}

export interface PublishPostPayload extends BaseJobPayload {
  scheduledPostId: string;
  caption: string;
  mediaUrls: string[];
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL' | 'REELS';
  accessToken: string;
  instagramUserId: string;
}

export interface AutoLikePayload extends BaseJobPayload {
  ruleId: string;
  targetPostId: string;
  accessToken: string;
}

export interface AutoCommentPayload extends BaseJobPayload {
  ruleId: string;
  targetPostId: string;
  comment: string;
  accessToken: string;
}

export interface AutoFollowPayload extends BaseJobPayload {
  ruleId: string;
  targetUserId: string;
  accessToken: string;
}

export interface AutoDMPayload extends BaseJobPayload {
  ruleId: string;
  targetUserId: string;
  message: string;
  accessToken: string;
}

export type JobPayload =
  | PublishPostPayload
  | AutoLikePayload
  | AutoCommentPayload
  | AutoFollowPayload
  | AutoDMPayload
  | BaseJobPayload;

export interface Job<T extends JobPayload = JobPayload> {
  id: string;
  type: JobType;
  payload: T;
  status: JobStatus;
  priority: number;
  scheduledFor?: Date;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  completedAt?: Date;
}

export interface JobResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface QueueConfig {
  name: string;
  concurrency: number;
  retryAttempts: number;
  retryDelay: number; // ms
  lockDuration: number; // ms
}

export const DEFAULT_QUEUE_CONFIG: QueueConfig = {
  name: 'social-exchange',
  concurrency: 5,
  retryAttempts: 3,
  retryDelay: 60000, // 1 minute
  lockDuration: 300000, // 5 minutes
};

// Instagram API rate limits
export const INSTAGRAM_RATE_LIMITS = {
  LIKE: { daily: 150, hourly: 30 },
  COMMENT: { daily: 30, hourly: 10 },
  FOLLOW: { daily: 50, hourly: 15 },
  DM: { daily: 20, hourly: 5 },
  PUBLISH: { daily: 25, hourly: 10 },
};
