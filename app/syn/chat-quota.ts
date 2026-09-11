/**
 * SYN chat spend guardrail — development stage.
 *
 * WHY NOT THE EXISTING LIMITERS
 *
 *  app/api/organism/rate-limit.ts is a module-scope Map. On Vercel each cold
 *  start gets a fresh copy and concurrent instances do not share it, so it
 *  cannot bound spend — it only smooths bursts within one warm instance. It is
 *  kept in place (the milestone says preserve existing behaviour) but it is NOT
 *  the spend guardrail and must not be described as one.
 *
 *  lib/rate-limit/rate-limiter.ts IS Prisma-backed and durable, but the
 *  RateLimit model is scoped to a SocialFeed (feedId + actionType). SYN chat is
 *  user-scoped and often has no feed at all, so it does not fit without a
 *  schema change — and schema changes are out of scope.
 *
 * WHAT THIS IS
 *
 *  A durable per-user daily request ceiling stored in the existing SystemConfig
 *  table (key: String @unique, value: Json). No migration, no new dependency,
 *  no Redis. Shared across every serverless instance because it lives in
 *  Postgres.
 *
 * WHAT THIS IS NOT
 *
 *  Not a production quota system. It is a coarse daily ceiling whose job is to
 *  stop an accidental loop or a stuck retry from turning into an unbounded
 *  Anthropic bill while SYN is being developed. It has a benign race (two
 *  concurrent requests can both read the same count), which is acceptable for a
 *  single-operator development ceiling and is not acceptable for public SaaS.
 */

import { prisma } from '@/lib/prisma';

/** Conservative default. Override with SYN_DAILY_CHAT_LIMIT. */
const DEFAULT_DAILY_LIMIT = 100;

function dailyLimit(): number {
  const raw = parseInt(process.env.SYN_DAILY_CHAT_LIMIT || '', 10);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_DAILY_LIMIT;
}

function todayKey(userId: string): string {
  const d = new Date().toISOString().slice(0, 10); // UTC day
  return `synChatQuota:${userId}:${d}`;
}

export interface QuotaResult {
  allowed: boolean;
  used: number;
  limit: number;
}

/**
 * Count one SYN chat request against today's ceiling.
 *
 * Fails OPEN on a database error: a transient Neon blip should degrade SYN's
 * cost guard, not take SYN offline. The ceiling is a safety net, not a security
 * control — an attacker is not the threat model here, an infinite loop is.
 */
export async function consumeChatQuota(userId: string): Promise<QuotaResult> {
  const limit = dailyLimit();
  const key = todayKey(userId);

  try {
    const existing = await prisma.systemConfig.findUnique({ where: { key } });
    const used = ((existing?.value as { count?: number } | null)?.count ?? 0);

    if (used >= limit) {
      return { allowed: false, used, limit };
    }

    const next = used + 1;
    await prisma.systemConfig.upsert({
      where: { key },
      update: { value: { count: next } },
      create: {
        key,
        value: { count: next },
        description: 'SYN chat daily request counter (development spend guardrail)',
      },
    });

    return { allowed: true, used: next, limit };
  } catch {
    // Never log the error body here — it can contain the connection string.
    console.error('[SYN] chat quota check failed; allowing request');
    return { allowed: true, used: 0, limit };
  }
}
