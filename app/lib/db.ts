import { Pool, QueryResult, QueryResultRow } from "pg";

/**
 * NOTE:
 * - This file is server-only by usage (imported only in route handlers)
 * - No "use server" directive needed
 * - Do NOT import this from client components
 */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : undefined,
});

/**
 * Stable query helper
 * This is the ONLY export consumers should use.
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}
