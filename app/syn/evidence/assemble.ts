/**
 * SYN-2B — evidence assembly.
 *
 * THE OWNERSHIP INVARIANT, ENFORCED BY THE TYPE SYSTEM
 *
 * These functions do not accept a feed id. They accept an AuthorizedAsset,
 * which only SEC-1's resolveOwnedFeed() can legitimately produce. An
 * unauthorised assembly is not merely rejected at runtime — it cannot be
 * expressed. Every query is additionally scoped by the owning user id, so a
 * mistake upstream still cannot cross a tenant boundary.
 *
 * WHAT THIS MODULE MAY DO: read Prisma.
 * WHAT IT MAY NOT DO: write anything, call Instagram, call Drive, touch a
 * token, or accept a raw identifier from a client.
 *
 * THE DATABASE ID NEVER ENTERS THE PACKAGE. Not to be stripped later — it is
 * never put in. A value that is never present cannot leak through a projection
 * bug or a prompt injection.
 */

import { prisma } from '@/lib/prisma';
import { METRICS_1_EPOCH, INSIGHTS_UNAVAILABLE_REASON } from '@/app/lib/metrics/contract';
import {
  DEFINITIONS,
  EVIDENCE_CONTRACT_VERSION,
  evidenceMeasured,
  evidenceUnavailable,
  freshnessFrom,
  type AssetEvidencePackage,
  type EvidenceGap,
  type EvidenceValue,
  type MetricKey,
} from './contract';
import { followerChangeEvidence, followerSeries, partitionHistory } from './summarise';

/**
 * An asset whose ownership the server has already proven.
 *
 * Construct this ONLY from the result of resolveOwnedFeed(). It deliberately
 * has no accessToken field, so a credential cannot reach this subsystem even
 * by accident.
 */
export interface AuthorizedAsset {
  /** Internal only. Never placed in the package, never sent to a model. */
  id: string;
  /** Internal only. Defence in depth on every query. */
  ownerUserId: string;
  handle: string;
  platform: string;
  displayName: string;
}

/** Rows this close together came from the same observation cycle. */
const SAME_CYCLE_TOLERANCE_MS = 5 * 60 * 1000;

/** How many rows to pull before the trust classifier filters them. */
const HISTORY_FETCH_LIMIT = 60;

const unknownIdentityNote =
  'The selected asset could not be verified as belonging to this account, so no ' +
  'evidence was assembled for it. This is the same response given for an asset ' +
  'that does not exist.';

/**
 * Evidence for an asset that could not be server-verified.
 *
 * Zero tenant data. NO query is issued — not even to test existence. Unknown
 * and non-owned are deliberately indistinguishable from the outside, so this
 * cannot be used to probe for the existence of another tenant's asset.
 */
export function unverifiedAssetEvidence(
  claim: { handle?: string | null; platform?: string | null; displayName?: string | null } | null,
  now: Date = new Date()
): AssetEvidencePackage {
  const na = <T>(k: MetricKey): EvidenceValue<T> =>
    evidenceUnavailable<T>(DEFINITIONS[k], unknownIdentityNote, 'not_obtainable');

  return {
    contractVersion: EVIDENCE_CONTRACT_VERSION,
    assembledAt: now.toISOString(),
    asset: {
      assetRef: 'asset_unverified',
      // Echoed back as an unverified CLAIM, never as identity.
      handle: claim?.handle ?? null,
      platform: claim?.platform ?? null,
      displayName: claim?.displayName ?? null,
      identityTrust: 'unverified_client_claim',
      note: unknownIdentityNote,
    },
    connection: {
      isConnected: evidenceUnavailable<boolean>(
        { metric: 'isConnected', meaning: 'account connection state', unit: 'boolean', window: { kind: 'point_in_time' } },
        unknownIdentityNote
      ),
      lastSuccessfulObservation: evidenceUnavailable<string>(
        { metric: 'lastSuccessfulObservation', meaning: 'time of the last successful observation', unit: 'timestamp', window: { kind: 'point_in_time' } },
        unknownIdentityNote
      ),
      lastObservationError: evidenceUnavailable<string>(
        { metric: 'lastObservationError', meaning: 'last observation error', unit: 'text', window: { kind: 'point_in_time' } },
        unknownIdentityNote
      ),
    },
    current: {
      followers: na('followers'), following: na('following'), postsCount: na('postsCount'),
      engagementRate: na('engagementRate'), avgLikesPerPost: na('avgLikesPerPost'),
      avgCommentsPerPost: na('avgCommentsPerPost'), impressions: na('impressions'),
      reach: na('reach'), profileViews: na('profileViews'),
    },
    history: {
      followers: {
        definition: DEFINITIONS.followers,
        points: [],
        sufficiency: { trustedPoints: 0, required: 2, sufficient: false, excludedLegacyPoints: 0 },
        trust: 'trusted',
      },
    },
    derived: {
      followerChange: evidenceUnavailable<number>(DEFINITIONS.followers, unknownIdentityNote),
    },
    operational: {
      controlMode: evidenceUnavailable<string>(
        { metric: 'controlMode', meaning: 'server-side automation control mode', unit: 'text', window: { kind: 'point_in_time' } },
        unknownIdentityNote
      ),
      pendingScheduledPosts: evidenceUnavailable<number>(
        { metric: 'pendingScheduledPosts', meaning: 'scheduled posts awaiting publication', unit: 'count', window: { kind: 'point_in_time' } },
        unknownIdentityNote
      ),
    },
    gaps: [{ metric: 'asset_identity', reason: unknownIdentityNote, resolvableBy: 'Select a connected account.' }],
  };
}

/**
 * Assemble evidence for an asset the server has proven the caller owns.
 *
 * METRIC SOURCE RULES (METRICS-1 semantics, applied not redefined)
 *
 *   followers / following / postsCount / engagementRate
 *       come from the LATEST TRUSTED FeedMetricsHistory row, whose recordedAt
 *       is the observation time. A history row is atomic: METRICS-1 writes one
 *       only when all four were genuinely measured in one cycle. The
 *       SocialFeed columns are NOT consulted for these — a number in a
 *       non-nullable @default(0) column is not evidence.
 *
 *   avgLikesPerPost / avgCommentsPerPost
 *       have no history columns; they exist only in the ambiguous cache. They
 *       are exposed only under the canonical-cycle inference below, and always
 *       as trust:'inferred'. Otherwise unavailable.
 *
 *   impressions / reach / profileViews
 *       unavailable under this auth architecture. Never read, never zeroed.
 */
export async function assembleAssetEvidence(
  asset: AuthorizedAsset,
  now: Date = new Date()
): Promise<AssetEvidencePackage> {
  const [feed, rawHistory, pendingCount] = await Promise.all([
    prisma.socialFeed.findFirst({
      where: { id: asset.id, userId: asset.ownerUserId },
      select: {
        isConnected: true, controlMode: true, lastSyncAt: true, lastSyncError: true,
        avgLikesPerPost: true, avgCommentsPerPost: true,
      },
    }),
    prisma.feedMetricsHistory.findMany({
      where: { feedId: asset.id, feed: { userId: asset.ownerUserId } },
      orderBy: { recordedAt: 'desc' },
      take: HISTORY_FETCH_LIMIT,
      select: {
        recordedAt: true, followers: true, following: true, postsCount: true,
        engagementRate: true, impressions: true, reach: true, profileViews: true,
      },
    }),
    prisma.scheduledPostNew.count({
      where: { feedId: asset.id, feed: { userId: asset.ownerUserId }, status: { in: ['PENDING', 'QUEUED'] } },
    }),
  ]);

  if (!feed) return unverifiedAssetEvidence({ handle: asset.handle, platform: asset.platform }, now);

  const history = partitionHistory(rawHistory);
  const latest = history.rows.length ? history.rows[history.rows.length - 1] : null;
  const gaps: EvidenceGap[] = [];

  // ---- current facts, from the latest trusted observation -----------------
  const noTrusted =
    'No trusted observation has been recorded yet. The canonical measurement ' +
    'pipeline records one per successful daily cycle.';

  const fromHistory = (key: MetricKey, pick: (r: typeof latest) => number): EvidenceValue<number> => {
    if (!latest) {
      gaps.push({ metric: key, reason: noTrusted, resolvableBy: 'Next successful metrics observation.' });
      return evidenceUnavailable<number>(DEFINITIONS[key], noTrusted, 'metrics_history');
    }
    return evidenceMeasured<number>(
      DEFINITIONS[key],
      pick(latest),
      'metrics_history',
      'trusted',
      freshnessFrom(latest.recordedAt, now)
    );
  };

  // ---- the constrained inference for the two averages ---------------------
  //
  // METRICS-1's persister writes avgLikesPerPost/avgCommentsPerPost only when
  // N > 0, and engagementRate is measurable only when N > 0 AND followers > 0.
  // So a trusted row implies both averages were measured in that same cycle —
  // PROVIDED the cache has not been written since by some other path. The
  // guards below establish that. This is a deduction from writer logic, not
  // recorded provenance, which is why the trust is 'inferred' and never
  // 'trusted'. Under these conditions a 0 is a MEASURED ZERO.
  const syncAt = feed.lastSyncAt;
  const cycleAligned =
    !!latest &&
    !!syncAt &&
    feed.lastSyncError === null &&
    syncAt.getTime() >= METRICS_1_EPOCH.getTime() &&
    Math.abs(syncAt.getTime() - latest.recordedAt.getTime()) <= SAME_CYCLE_TOLERANCE_MS;

  const inferenceFailedReason =
    'Cannot establish that the cached average came from a canonical observation ' +
    'cycle (no paired trusted observation, a recorded sync error, or a ' +
    'timestamp mismatch). The value is therefore not treated as evidence.';

  const inferredAverage = (key: 'avgLikesPerPost' | 'avgCommentsPerPost', value: number): EvidenceValue<number> => {
    if (!cycleAligned || !latest) {
      gaps.push({ metric: key, reason: inferenceFailedReason });
      return evidenceUnavailable<number>(DEFINITIONS[key], inferenceFailedReason, 'current_state_cache');
    }
    return evidenceMeasured<number>(
      DEFINITIONS[key],
      value,
      'current_state_cache',
      'inferred',
      // Timed to the paired observation cycle — the same basis as the inference.
      freshnessFrom(latest.recordedAt, now),
      'Provenance is inferred from the canonical writer, not recorded. The value ' +
        'was written in the same observation cycle as the paired trusted row. ' +
        'A 0 here is a measured zero, not a default.'
    );
  };

  const unavailableInsight = (key: MetricKey): EvidenceValue<number> => {
    gaps.push({ metric: key, reason: INSIGHTS_UNAVAILABLE_REASON });
    return evidenceUnavailable<number>(DEFINITIONS[key], INSIGHTS_UNAVAILABLE_REASON, 'not_obtainable');
  };

  // engagementRate additionally reports that the actual N behind a STORED value
  // is not recoverable: no schema column holds it. The target is definitional.
  const engagement = fromHistory('engagementRate', (r) => r!.engagementRate);
  if (engagement.quality === 'measured') {
    engagement.note =
      'Actual sample size (N) is NOT persisted and cannot be reconstructed for a ' +
      `stored value; the target sample is ${DEFINITIONS.engagementRate.window.kind === 'last_n_media' ? DEFINITIONS.engagementRate.window.targetSample : 25} most-recent media.`;
    gaps.push({
      metric: 'engagementRate.sampleSize',
      reason: 'The actual number of valid media (N) behind a stored engagement rate is not persisted.',
    });
  }

  const pointWindow = { kind: 'point_in_time' as const };
  const observedAtForState = latest ? latest.recordedAt : syncAt;

  return {
    contractVersion: EVIDENCE_CONTRACT_VERSION,
    assembledAt: now.toISOString(),
    asset: {
      assetRef: 'asset_1',
      handle: asset.handle,
      platform: asset.platform,
      displayName: asset.displayName,
      identityTrust: 'server_verified',
    },
    connection: {
      isConnected: evidenceMeasured<boolean>(
        { metric: 'isConnected', meaning: 'account connection state', unit: 'boolean', window: pointWindow },
        feed.isConnected, 'application_state', 'trusted',
        freshnessFrom(observedAtForState ?? now, now)
      ),
      lastSuccessfulObservation: syncAt
        ? evidenceMeasured<string>(
            { metric: 'lastSuccessfulObservation', meaning: 'time of the last successful observation cycle', unit: 'timestamp', window: pointWindow },
            syncAt.toISOString(), 'application_state', 'trusted', freshnessFrom(syncAt, now)
          )
        : evidenceUnavailable<string>(
            { metric: 'lastSuccessfulObservation', meaning: 'time of the last successful observation cycle', unit: 'timestamp', window: pointWindow },
            'No successful observation has been recorded.', 'application_state'
          ),
      lastObservationError: feed.lastSyncError
        ? evidenceMeasured<string>(
            { metric: 'lastObservationError', meaning: 'error from the most recent failed observation', unit: 'text', window: pointWindow },
            feed.lastSyncError, 'application_state', 'trusted', freshnessFrom(now, now)
          )
        : evidenceUnavailable<string>(
            { metric: 'lastObservationError', meaning: 'error from the most recent failed observation', unit: 'text', window: pointWindow },
            'No error is currently recorded.', 'application_state'
          ),
    },
    current: {
      followers: fromHistory('followers', (r) => r!.followers),
      following: fromHistory('following', (r) => r!.following),
      postsCount: fromHistory('postsCount', (r) => r!.postsCount),
      engagementRate: engagement,
      avgLikesPerPost: inferredAverage('avgLikesPerPost', feed.avgLikesPerPost),
      avgCommentsPerPost: inferredAverage('avgCommentsPerPost', feed.avgCommentsPerPost),
      impressions: unavailableInsight('impressions'),
      reach: unavailableInsight('reach'),
      profileViews: unavailableInsight('profileViews'),
    },
    history: { followers: followerSeries(history) },
    derived: { followerChange: followerChangeEvidence(history, now) },
    operational: {
      controlMode: evidenceMeasured<string>(
        { metric: 'controlMode', meaning: 'server-side automation control mode', unit: 'text', window: pointWindow },
        String(feed.controlMode), 'application_state', 'trusted', freshnessFrom(now, now),
        'This is the stored server value. The cockpit selector is known not to ' +
          'persist changes, so the UI may display a different mode. Treat a ' +
          'disagreement as a known defect, not as evidence of a recent change.'
      ),
      pendingScheduledPosts: evidenceMeasured<number>(
        { metric: 'pendingScheduledPosts', meaning: 'scheduled posts awaiting publication', unit: 'count', window: pointWindow },
        pendingCount, 'application_state', 'trusted', freshnessFrom(now, now)
      ),
    },
    gaps,
  };
}
