/**
 * SEC-1 — tenant boundary primitives.
 *
 * THE INVARIANT THIS FILE EXISTS TO ENFORCE
 *
 *   No user may read, create, modify, delete, queue or schedule another user's
 *   tenant-scoped resources, even with knowledge of the resource id.
 *
 * The rule everywhere below: a client may name the resource it wants. The
 * SERVER decides whether that resource belongs to the authenticated session.
 * A userId, ownerId or tenantId arriving from a browser is never trusted.
 *
 * WHY 404 RATHER THAN 403
 *
 * A non-owned resource returns the same shape as a non-existent one, so the API
 * cannot be used as an existence oracle to enumerate other tenants' ids.
 * Unauthenticated requests still get 401 — that distinction leaks nothing,
 * because it is answerable without touching any tenant's data.
 *
 * SCOPE NOTE: this module performs authentication and ownership resolution
 * only. It deliberately contains no business logic, no metric handling and no
 * Instagram API calls.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** Identity derived from the server session. Never from the request body. */
export interface TenantUser {
  id: string;
}

/**
 * Resolve the authenticated user from the server session.
 *
 * Resolution goes session -> email -> User row rather than trusting
 * session.user.id directly, so a stale or forged token id cannot address a
 * tenant. Returns null when there is no usable session; callers must fail
 * closed on null.
 */
export async function getTenantUser(): Promise<TenantUser | null> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return null;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  return user ? { id: user.id } : null;
}

/** 401 — no authenticated session. Tenant-private routes must fail closed. */
export function unauthorized(): NextResponse {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

/** 404 — unknown OR not owned. Deliberately indistinguishable. */
export function notFound(resource = 'Resource'): NextResponse {
  return NextResponse.json({ error: `${resource} not found` }, { status: 404 });
}

/** The non-secret shape of a feed. Safe to use for routing decisions. */
export interface OwnedFeedRef {
  id: string;
  platform: string;
  platformAccountId: string;
  handle: string;
  displayName: string;
  isConnected: boolean;
}

/**
 * A feed the server has confirmed the user owns, including its access token.
 *
 * The token is present so route handlers can call Instagram SERVER-SIDE. It
 * must never be placed in a response body, a URL, a query string or a log.
 */
export interface OwnedFeedWithToken extends OwnedFeedRef {
  accessToken: string;
}

const FEED_REF_SELECT = {
  id: true,
  platform: true,
  platformAccountId: true,
  handle: true,
  displayName: true,
  isConnected: true,
} as const;

const FEED_TOKEN_SELECT = {
  ...FEED_REF_SELECT,
  accessToken: true,
} as const;

/**
 * The core ownership gate.
 *
 *   authenticated user -> requested feed -> ownership resolved in the database
 *   -> authorized or denied -> only then any tenant data is touched.
 *
 * Passing a feedId that belongs to someone else resolves to null, exactly like
 * a feedId that does not exist. Omitting feedId falls back to the caller's own
 * first connected Instagram feed — the pre-existing behaviour of
 * /api/instagram/recent and /api/instagram/publish, kept so those contracts do
 * not change.
 */
export async function resolveOwnedFeed(
  userId: string,
  feedId?: string | null
): Promise<OwnedFeedWithToken | null> {
  if (feedId) {
    return prisma.socialFeed.findFirst({
      where: { id: feedId, userId },
      select: FEED_TOKEN_SELECT,
    });
  }

  return prisma.socialFeed.findFirst({
    where: {
      userId,
      platform: 'INSTAGRAM',
      isConnected: true,
      accessToken: { not: '' },
    },
    orderBy: { createdAt: 'asc' },
    select: FEED_TOKEN_SELECT,
  });
}

/**
 * Same gate, but refuses to hand back a token for a disconnected feed so a
 * caller cannot accidentally drive Instagram with a cleared credential.
 */
export async function resolveConnectedOwnedFeed(
  userId: string,
  feedId?: string | null
): Promise<OwnedFeedWithToken | null> {
  const feed = await resolveOwnedFeed(userId, feedId);
  if (!feed || !feed.isConnected || !feed.accessToken) return null;
  return feed;
}

/**
 * Nested resources establish ownership THROUGH their owning feed, never by
 * their own id alone. Prisma renders these as a join, so a guessed post id
 * belonging to another tenant returns no row at all.
 */
export async function resolveOwnedScheduledPost(
  userId: string,
  postId: string
): Promise<{ id: string; feedId: string; status: string; jobId: string | null } | null> {
  return prisma.scheduledPostNew.findFirst({
    where: { id: postId, feed: { userId } },
    select: { id: true, feedId: true, status: true, jobId: true },
  });
}

export async function resolveOwnedAutomationRule(
  userId: string,
  ruleId: string
): Promise<{ id: string; feedId: string } | null> {
  return prisma.automationRule.findFirst({
    where: { id: ruleId, feed: { userId } },
    select: { id: true, feedId: true },
  });
}

export async function resolveOwnedJob(
  userId: string,
  jobId: string
): Promise<{ id: string; feedId: string } | null> {
  return prisma.jobQueue.findFirst({
    where: { id: jobId, feed: { userId } },
    select: { id: true, feedId: true },
  });
}

/* --------------------------------------------------------------------------
 * SYN-3C4 Slice 1 — repository-enforced tenant ownership for the certified
 * institutional-memory evidence relationships 4, 5 and 6.
 *
 * WHY THESE EXIST
 *
 * The SYN-3C1/SYN-3C3 certification established that 6 of the 9 memory
 * relationships are enforced by the DATABASE, via composite foreign keys that
 * carry userId so a cross-tenant edge is literally unrepresentable. Three are
 * not, and cannot be: relationships 4, 5 and 6 point at FeedMetricsHistory,
 * scheduled_posts_new and automation_actions, none of which has a tenant
 * column for a composite FK to reference. They reach their tenant only
 * indirectly, through feedId -> SocialFeed.userId.
 *
 * The certified adversarial suite says so in the open, as CONTROL 20/21/22:
 *
 *   "[REPOSITORY_ENFORCED_V1 GAP, rel N]: <table> has no tenant column, so
 *    this cross-tenant evidence row MUST succeed at DB level. NOT DB
 *    protection: the repository is the only guard."
 *
 * Those three inserts succeed in Postgres BY DESIGN. These resolvers are the
 * only thing standing between that and a cross-tenant evidence link. They are
 * load-bearing security code, not convenience helpers.
 *
 * THE SHAPE, AND WHY IT IS THIS SHAPE
 *
 * Each resolver filters on the target id AND feed.userId IN THE SAME QUERY, so
 * the database never returns a row the caller is not entitled to. The
 * alternative -- fetch by id, then compare userId in TypeScript -- is rejected
 * on purpose: it pulls another tenant's row into process memory, where a
 * logging statement, an error path or a later refactor can leak it.
 *
 * findFirst, not findUnique: findUnique cannot take a relation filter, so
 * using it would force exactly the fetch-then-compare pattern above.
 *
 * A target owned by another tenant and a target that does not exist both
 * resolve to null, through the same code path, with no distinguishing signal.
 * Callers pair that null with notFound() so the HTTP surface cannot be used as
 * an existence oracle to enumerate other tenants' ids.
 *
 * userId arrives from getTenantUser() only -- session -> email -> User row.
 * Never from a body, query string, header or path parameter.
 * ------------------------------------------------------------------------ */

/**
 * Relationship 4 — MemoryEvidenceLink.metricsHistoryId -> FeedMetricsHistory.
 *
 * recordedAt is returned because the evidence link's observedAt is derived
 * from it; feedId because ASSET-scoped memory must agree with the feed the
 * evidence came from.
 */
export async function resolveOwnedMetricsHistory(
  userId: string,
  metricsHistoryId: string
): Promise<{ id: string; feedId: string; recordedAt: Date } | null> {
  return prisma.feedMetricsHistory.findFirst({
    where: { id: metricsHistoryId, feed: { userId } },
    select: { id: true, feedId: true, recordedAt: true },
  });
}

/**
 * Relationship 6 — MemoryEvidenceLink.automationActionId -> automation_actions.
 *
 * Ownership runs through feedId, not ruleId: automation_actions carries both,
 * and feedId is the column that reaches SocialFeed.userId in one hop.
 */
export async function resolveOwnedAutomationAction(
  userId: string,
  automationActionId: string
): Promise<{ id: string; feedId: string; status: string; executedAt: Date | null } | null> {
  return prisma.automationAction.findFirst({
    where: { id: automationActionId, feed: { userId } },
    select: { id: true, feedId: true, status: true, executedAt: true },
  });
}
