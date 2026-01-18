import { Pool } from 'pg';

/**
 * Shared PostgreSQL connection pool
 * Used by server utilities and API routes
 *
 * Requires:
 *   DATABASE_URL in environment variables
 */
export const db = new Pool({
  connectionString: process.env.DATABASE_URL,

  // Recommended defaults for serverless / Next.js
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
