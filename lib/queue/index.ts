/**
 * Job Queue Module
 *
 * Exports the queue system for scheduling and processing background jobs.
 * Currently uses PostgreSQL-based queue, can be upgraded to Redis/BullMQ for scale.
 */

export * from './types';
export * from './database-queue';
export { jobQueue } from './database-queue';
