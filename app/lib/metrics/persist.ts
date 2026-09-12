/**
 * METRICS-1 — how an observation is allowed to touch the database.
 *
 * DECISION 2 (approved): SocialFeed's metric columns stay as the legacy
 * current-state cache. They are non-nullable with @default(0), so the column
 * itself cannot express "unknown". This module therefore enforces honesty at
 * the WRITE, which is the only place it can be enforced without a migration:
 *
 *   - a field is written ONLY when it was genuinely measured this cycle
 *   - an unmeasured field is OMITTED from the update, so the last good value
 *     survives; unknown never overwrites a measurement
 *   - nothing is ever coerced to 0 to fill a gap
 *
 * Consequence to keep in mind downstream: a 0 in one of these columns is still
 * ambiguous (it may be the Prisma default and not a measurement). Consumers
 * that need certainty must read FeedMetricsHistory, where every row is a
 * complete canonical observation by construction.
 *
 * FRESHNESS
 *
 *   lastSyncAt    = the time of the last SUCCESSFUL observation. A failed
 *                   cycle does not touch it, so it never advertises freshness
 *                   the data does not have.
 *   lastSyncError = cleared on success, set on failure.
 */

import { prisma } from '@/lib/prisma';
import { isMeasured, type FeedObservation } from './contract';

export interface PersistResult {
  /** Current-state columns actually written this cycle. */
  updatedFields: string[];
  /** True when a canonical history snapshot was recorded. */
  historyWritten: boolean;
  /** Why no snapshot was written, when none was. */
  historySkippedReason?: string;
}

/**
 * A history row is written only when EVERY column the schema requires is a
 * genuine measurement.
 *
 * FeedMetricsHistory.followers/following/postsCount/engagementRate are
 * non-nullable. If any of them is unavailable this cycle, there is no honest
 * row to write, so we write none. We do NOT insert a zero, and we do NOT copy
 * a stale cached value forward and call it an observation — that is precisely
 * the defect SYN-2A found. A missing snapshot is a truthful gap in the series;
 * a fabricated one is a lie that survives forever.
 *
 * impressions / reach / profileViews are nullable and are deliberately left
 * unset, which is both honest and the structural marker the trust classifier
 * in contract.ts uses to recognise a canonical row.
 */
function historyInputFrom(observation: FeedObservation) {
  const { followers, following, postsCount, engagementRate } = observation;
  if (
    !isMeasured(followers) ||
    !isMeasured(following) ||
    !isMeasured(postsCount) ||
    !isMeasured(engagementRate)
  ) {
    const missing = [
      !isMeasured(followers) && 'followers',
      !isMeasured(following) && 'following',
      !isMeasured(postsCount) && 'postsCount',
      !isMeasured(engagementRate) && 'engagementRate',
    ].filter(Boolean);
    return {
      ok: false as const,
      reason:
        `Snapshot skipped: ${missing.join(', ')} not measured this cycle and the ` +
        'history schema cannot represent them as unknown. No fabricated value was written.',
    };
  }

  return {
    ok: true as const,
    data: {
      followers: followers.value,
      following: following.value,
      postsCount: postsCount.value,
      engagementRate: engagementRate.value,
      // impressions / reach / profileViews intentionally omitted -> NULL.
    },
  };
}

/**
 * Apply an observation to one feed.
 *
 * Caller is responsible for authorisation. SEC-1 ownership rules are unchanged
 * by this module: it never resolves a feed itself and never reads a token.
 */
export async function applyObservation(
  feedId: string,
  observation: FeedObservation
): Promise<PersistResult> {
  // ---- failed observation: record the error, claim no freshness -----------
  if (!observation.ok) {
    await prisma.socialFeed.update({
      where: { id: feedId },
      data: { lastSyncError: observation.error ?? 'Observation failed' },
    });
    return {
      updatedFields: [],
      historyWritten: false,
      historySkippedReason: 'Observation failed; nothing was measured.',
    };
  }

  // ---- current-state cache: measured fields only --------------------------
  const data: Record<string, unknown> = {
    lastSyncAt: observation.observedAt,
    lastSyncError: null,
  };
  const updatedFields: string[] = [];

  const put = (column: string, metric: { value: number | null; quality: string }) => {
    if (metric.quality === 'measured' && metric.value !== null) {
      data[column] = metric.value;
      updatedFields.push(column);
    }
  };

  put('followers', observation.followers);
  put('following', observation.following);
  put('postsCount', observation.postsCount);
  put('engagementRate', observation.engagementRate);
  put('avgLikesPerPost', observation.avgLikesPerPost);
  put('avgCommentsPerPost', observation.avgCommentsPerPost);

  await prisma.socialFeed.update({ where: { id: feedId }, data });

  // ---- history snapshot ---------------------------------------------------
  const history = historyInputFrom(observation);
  if (!history.ok) {
    return { updatedFields, historyWritten: false, historySkippedReason: history.reason };
  }

  await prisma.feedMetricsHistory.create({
    data: { feedId, ...history.data },
  });

  return { updatedFields, historyWritten: true };
}
