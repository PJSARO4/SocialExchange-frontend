/**
 * METRICS-1 — the canonical Instagram measurement contract.
 *
 * ONE definition per metric lives here. Nothing else in the codebase may
 * redefine what "followers" or "engagement rate" means.
 *
 * WHY THIS FILE EXISTS
 *
 * The SYN-2A audit found two Instagram fields with different meanings flowing
 * into one database column, an engagement rate divided by the wrong
 * denominator, and unavailable metrics coerced to 0. Those are not display
 * bugs; they make every downstream number untrustworthy. This module states
 * the definitions, and the observer/persister enforce them.
 *
 * THE TWO FOLLOWER FIELDS — DO NOT CONFUSE THEM
 *
 *   followers_count   profile field   TOTAL account followers.        <-- ours
 *   follower_count    insight metric  followers gained IN A PERIOD.   <-- never
 *
 * Only `followers_count` may populate SocialFeed.followers or
 * FeedMetricsHistory.followers, and only `followers_count` may be the
 * engagement-rate denominator.
 */

/** Bumped when any definition below changes. Recorded in observations. */
export const METRICS_CONTRACT_VERSION = 1 as const;

/**
 * METRICS-1 TRUST BOUNDARY — the genesis instant of canonical measurement.
 *
 * WHAT THE EPOCH MEANS
 *
 *   It is the EARLIEST INSTANT AT WHICH A CANONICAL METRICS-1 OBSERVATION
 *   COULD EXIST. It is a deliberately selected genesis boundary, set after the
 *   canonical pipeline was implemented — not at the start of that day — so that
 *   no row written while the pipeline was still being built can fall inside it.
 *
 * WHAT THE EPOCH DOES NOT MEAN
 *
 *   A TIMESTAMP ALONE NEVER ESTABLISHES TRUST. The epoch is a necessary
 *   condition, never a sufficient one. Structural validation of the row against
 *   the canonical shape is mandatory and is applied to every row regardless of
 *   when it was recorded (see isTrustedHistoryRow below).
 *
 *   - Rows recorded BEFORE the epoch are ALWAYS legacy and untrusted. They were
 *     written by the pre-METRICS-1 writers and may carry period-insight
 *     followers, a wrong-denominator engagement rate, stale copied
 *     following/postsCount, or zeros standing in for unavailable metrics. No
 *     amount of structural plausibility rehabilitates them.
 *   - Rows recorded AFTER the epoch that are malformed or non-canonical are
 *     STILL untrusted. Being recent is not being correct.
 *
 * Production FeedMetricsHistory count when this boundary was chosen: 0,
 * verified 2026-09-12 against the production database. The boundary therefore
 * excludes no existing data — it exists so that any row written by a path we
 * have not yet found is excluded by default rather than trusted by default.
 */
export const METRICS_1_EPOCH = new Date('2026-09-12T20:00:00.000Z');

/**
 * Target number of most-recent media sampled for interaction averages.
 * Fewer is normal (new accounts); the actual count used is reported as
 * `sampleSize` and is never assumed.
 */
export const CANONICAL_MEDIA_SAMPLE_SIZE = 25;

/** The only host the Instagram-Login token is valid against. */
export const INSTAGRAM_LOGIN_HOST = 'https://graph.instagram.com';

// ---------------------------------------------------------------------------
// Metric values
// ---------------------------------------------------------------------------

/**
 * 'measured'     an actual observation. 0 here means a real, measured zero.
 * 'unavailable'  not obtainable this cycle. NEVER render or store as 0.
 */
export type MetricQuality = 'measured' | 'unavailable';

export interface Metric<T> {
  value: T | null;
  quality: MetricQuality;
  /** Why it is unavailable. Quotable to an operator. */
  reason?: string;
}

export const measured = <T>(value: T): Metric<T> => ({ value, quality: 'measured' });
export const unavailable = <T>(reason: string): Metric<T> => ({
  value: null,
  quality: 'unavailable',
  reason,
});

/** True only for a genuine measurement. The guard before any write. */
export function isMeasured<T>(m: Metric<T>): m is Metric<T> & { value: T } {
  return m.quality === 'measured' && m.value !== null && m.value !== undefined;
}

// ---------------------------------------------------------------------------
// The observation
// ---------------------------------------------------------------------------

export interface FeedObservation {
  /** True when the authoritative profile call succeeded. */
  ok: boolean;
  /** When the observation was taken. Only meaningful when ok. */
  observedAt: Date;
  contractVersion: typeof METRICS_CONTRACT_VERSION;
  /** Provenance, for reports and logs. */
  source: 'instagram-login/graph.instagram.com';

  /** Handle as Instagram reported it this cycle. Diagnostic only. */
  username: string | null;

  // --- authoritative profile totals ---
  followers: Metric<number>;
  following: Metric<number>;
  postsCount: Metric<number>;

  // --- derived from the last N media ---
  /** N: number of media with usable interaction counts. */
  sampleSize: Metric<number>;
  avgLikesPerPost: Metric<number>;
  avgCommentsPerPost: Metric<number>;
  engagementRate: Metric<number>;

  // --- not obtainable under Instagram Login ---
  impressions: Metric<number>;
  reach: Metric<number>;
  profileViews: Metric<number>;

  /** Present when ok === false. Safe to store in lastSyncError. */
  error?: string;
}

/**
 * Why impressions / reach / profileViews are permanently unavailable here.
 *
 * Verified live 2026-09-12: the account-level Insights call goes to
 * graph.facebook.com and returns "Invalid OAuth access token - Cannot parse
 * access token" for an Instagram-Login token, and the connected account is
 * MEDIA_CREATOR rather than Business, so account Insights are not available to
 * it under any host. Quarantined rather than faked.
 */
export const INSIGHTS_UNAVAILABLE_REASON =
  'Account-level Instagram Insights require a Business account and a Facebook ' +
  'Graph token; this feed uses Instagram Login. Not measured.';

// ---------------------------------------------------------------------------
// Trusted history
// ---------------------------------------------------------------------------

/** The subset of a history row the trust classifier needs. */
export interface HistoryRowShape {
  recordedAt: Date;
  followers: number;
  following: number;
  postsCount: number;
  engagementRate: number;
  impressions: number | null;
  reach: number | null;
  profileViews: number | null;
}

/**
 * Is this history row usable as trend evidence?
 *
 * Two conditions, BOTH REQUIRED. Neither is sufficient alone: a timestamp
 * never makes malformed data trusted, and canonical shape never rehabilitates
 * a pre-epoch row:
 *
 *  1. EPOCH      recorded at or after METRICS_1_EPOCH — the earliest instant a
 *                canonical observation could exist. Anything earlier is legacy,
 *                permanently, whatever it looks like.
 *  2. SHAPE      structurally consistent with the canonical writer, which
 *                always leaves impressions/reach/profileViews NULL (they are
 *                unavailable under this architecture) and never writes a
 *                negative or non-finite value. A row carrying numeric
 *                impressions/reach/profileViews came from the pre-METRICS-1
 *                cron writer and is rejected even if its timestamp is recent.
 *
 * LIMITATION, STATED PLAINLY: the schema has no provenance column, so this is
 * a structural classifier, not a recorded fact. It is sound today because the
 * canonical writers are the only live writers of this table. If a future
 * writer is added, it must either satisfy this shape or the schema must gain a
 * provenance column.
 */
export function isTrustedHistoryRow(row: HistoryRowShape): boolean {
  if (!(row.recordedAt instanceof Date) || Number.isNaN(row.recordedAt.getTime())) return false;
  if (row.recordedAt.getTime() < METRICS_1_EPOCH.getTime()) return false;

  if (row.impressions !== null || row.reach !== null || row.profileViews !== null) return false;

  const finiteNonNegative = (n: number) => Number.isFinite(n) && n >= 0;
  if (!finiteNonNegative(row.followers)) return false;
  if (!finiteNonNegative(row.following)) return false;
  if (!finiteNonNegative(row.postsCount)) return false;
  if (!finiteNonNegative(row.engagementRate)) return false;

  return true;
}

/** Partition rows for trend derivation. Never mutates or rewrites anything. */
export function selectTrustedHistory<T extends HistoryRowShape>(
  rows: T[]
): { trusted: T[]; legacy: T[] } {
  const trusted: T[] = [];
  const legacy: T[] = [];
  for (const r of rows) (isTrustedHistoryRow(r) ? trusted : legacy).push(r);
  return { trusted, legacy };
}

/** Minimum trusted rows before any delta may be described. Two points. */
export const MIN_ROWS_FOR_TREND = 2;

export type TrendVerdict =
  | { kind: 'insufficient_evidence'; trustedRows: number; reason: string }
  | { kind: 'trend'; trustedRows: number; from: Date; to: Date; change: number };

/**
 * Deterministic follower change over trusted rows. Returns
 * insufficient_evidence rather than inventing a direction from one point.
 */
export function followerTrend(rows: HistoryRowShape[]): TrendVerdict {
  const { trusted } = selectTrustedHistory(rows);
  if (trusted.length < MIN_ROWS_FOR_TREND) {
    return {
      kind: 'insufficient_evidence',
      trustedRows: trusted.length,
      reason:
        trusted.length === 0
          ? 'No trusted observations recorded yet.'
          : `Only ${trusted.length} trusted observation; at least ${MIN_ROWS_FOR_TREND} are required to describe a change.`,
    };
  }
  const sorted = [...trusted].sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  return {
    kind: 'trend',
    trustedRows: sorted.length,
    from: first.recordedAt,
    to: last.recordedAt,
    change: last.followers - first.followers,
  };
}
