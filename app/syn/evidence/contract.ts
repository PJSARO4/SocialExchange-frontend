/**
 * SYN-2B FIRST EYES — the evidence contract.
 *
 * SYN does not receive database data. It receives EVIDENCE: a value that
 * carries its own definition, source, observation time, quality and trust, so
 * that neither the model nor a future UI has to guess what a number means.
 *
 * WHY A DISCRIMINATED UNION
 *
 * `quality` discriminates, so `value` exists ONLY on the measured branch. A
 * consumer physically cannot read a number that was never measured — the
 * compiler enforces at the read what METRICS-1 enforces at the write. The
 * defect class this closes is the one SYN-2A found everywhere: an unavailable
 * metric silently becoming 0.
 *
 * THREE STATES THAT MUST NEVER COLLAPSE
 *
 *   measured      we observed it. 0 here is a real zero.
 *   unavailable   not obtainable through the CURRENT trusted measurement and
 *                 integration path. Repeating the same observation will not
 *                 produce it; a different integration or account type might.
 *                 This is a statement about our present pipeline, not a claim
 *                 that the metric is impossible in principle.
 *   insufficient  obtainable through the current path, but we do not yet have
 *                 enough observations.
 *
 * "Reach is not obtainable on our current measurement path" and "weekly growth
 * needs more observations" are different answers to the operator and must
 * produce different behaviour from SYN.
 *
 * SCOPE: evidence IN. This milestone defines no durable SYN assertion protocol
 * and changes no SYN output format.
 */

/** Bumped when any shape or metric key below changes. */
export const EVIDENCE_CONTRACT_VERSION = 1 as const;

/** Stable metric keys. UI columns, exports and saved views bind to these. */
export const METRIC_KEYS = [
  'followers',
  'following',
  'postsCount',
  'engagementRate',
  'avgLikesPerPost',
  'avgCommentsPerPost',
  'impressions',
  'reach',
  'profileViews',
] as const;
export type MetricKey = (typeof METRIC_KEYS)[number];

export type EvidenceQuality = 'measured' | 'unavailable' | 'insufficient';

/**
 * trusted    written by the canonical METRICS-1 writer and accepted by its
 *            trust classifier. Provenance is recorded, not guessed.
 * inferred   provenance deduced from writer logic rather than recorded. Sound,
 *            but weaker — SYN must not present it as recorded fact.
 * legacy     pre-METRICS-1 or non-canonical. Never used as evidence.
 * untrusted  client-asserted or otherwise unverified.
 */
export type EvidenceTrust = 'trusted' | 'inferred' | 'legacy' | 'untrusted';

export type EvidenceSource =
  | 'metrics_history'       // FeedMetricsHistory, canonical rows only
  | 'current_state_cache'   // SocialFeed columns — ambiguous, needs inference
  | 'application_state'     // first-party rows we wrote ourselves
  /** No source on the CURRENT trusted path. Not a claim of impossibility. */
  | 'not_obtainable';

/** Point-in-time, or a last-N-media sample. Never conflate the two. */
export type EvidenceWindow =
  | { kind: 'point_in_time' }
  | { kind: 'last_n_media'; targetSample: number };

export interface EvidenceDefinition {
  metric: MetricKey | string;
  /** One line SYN may quote to the operator. */
  meaning: string;
  unit: 'count' | 'percent' | 'text' | 'boolean' | 'timestamp';
  window: EvidenceWindow;
}

export interface EvidenceFreshness {
  /** The ACTUAL observation instant. Never a proxy timestamp. */
  observedAt: string;
  ageSeconds: number;
  staleAfterSeconds: number;
  isStale: boolean;
}

export type EvidenceValue<T> =
  | {
      quality: 'measured';
      value: T;
      definition: EvidenceDefinition;
      source: EvidenceSource;
      trust: EvidenceTrust;
      freshness: EvidenceFreshness;
      /** Provenance caveats. Quotable. */
      note?: string;
    }
  | {
      quality: 'unavailable';
      definition: EvidenceDefinition;
      source: EvidenceSource;
      reason: string;
    }
  | {
      quality: 'insufficient';
      definition: EvidenceDefinition;
      source: EvidenceSource;
      reason: string;
      have: number;
      need: number;
    };

export interface EvidenceSufficiency {
  trustedPoints: number;
  required: number;
  sufficient: boolean;
  /** Rows the METRICS-1 classifier rejected. Reported, never used. */
  excludedLegacyPoints: number;
  span?: { from: string; to: string };
}

export interface EvidenceSeries<T> {
  definition: EvidenceDefinition;
  /** Trusted points only. NEVER rendered to the model as rows. */
  points: Array<{ observedAt: string; value: T }>;
  sufficiency: EvidenceSufficiency;
  trust: 'trusted';
}

/** A named hole in what we know, and how (or whether) it can be closed. */
export interface EvidenceGap {
  metric: string;
  reason: string;
  resolvableBy?: string;
}

/**
 * Could the selected asset be proven to belong to the authenticated user?
 * 'unverified_client_claim' yields ZERO tenant evidence — unknown and
 * non-owned are deliberately indistinguishable.
 */
export type IdentityTrust = 'server_verified' | 'unverified_client_claim';

export interface AssetIdentityEvidence {
  /** Request-local opaque alias. The ONLY asset id the model ever sees. */
  assetRef: string;
  handle: string | null;
  platform: string | null;
  displayName: string | null;
  identityTrust: IdentityTrust;
  note?: string;
}

export interface AssetEvidencePackage {
  contractVersion: typeof EVIDENCE_CONTRACT_VERSION;
  assembledAt: string;
  asset: AssetIdentityEvidence;
  connection: {
    isConnected: EvidenceValue<boolean>;
    lastSuccessfulObservation: EvidenceValue<string>;
    lastObservationError: EvidenceValue<string>;
  };
  current: Record<MetricKey, EvidenceValue<number>>;
  history: { followers: EvidenceSeries<number> };
  derived: { followerChange: EvidenceValue<number> };
  operational: {
    controlMode: EvidenceValue<string>;
    pendingScheduledPosts: EvidenceValue<number>;
  };
  gaps: EvidenceGap[];
}

// ---------------------------------------------------------------------------
// Definitions — one per metric, stated once
// ---------------------------------------------------------------------------

const point: EvidenceWindow = { kind: 'point_in_time' };

/** Must match app/lib/metrics/contract.ts CANONICAL_MEDIA_SAMPLE_SIZE. */
export const ENGAGEMENT_TARGET_SAMPLE = 25;
const lastN: EvidenceWindow = { kind: 'last_n_media', targetSample: ENGAGEMENT_TARGET_SAMPLE };

export const DEFINITIONS: Record<MetricKey, EvidenceDefinition> = {
  followers: { metric: 'followers', meaning: 'total account followers', unit: 'count', window: point },
  following: { metric: 'following', meaning: 'accounts this account follows', unit: 'count', window: point },
  postsCount: { metric: 'postsCount', meaning: 'total media on the account', unit: 'count', window: point },
  engagementRate: {
    metric: 'engagementRate',
    meaning:
      'average (likes + comments) per valid recent media divided by total followers, x100. ' +
      'A last-N-media measurement, NOT a time-window metric.',
    unit: 'percent',
    window: lastN,
  },
  avgLikesPerPost: {
    metric: 'avgLikesPerPost',
    meaning: 'average likes per valid recent media',
    unit: 'count',
    window: lastN,
  },
  avgCommentsPerPost: {
    metric: 'avgCommentsPerPost',
    meaning: 'average comments per valid recent media',
    unit: 'count',
    window: lastN,
  },
  impressions: { metric: 'impressions', meaning: 'times content was displayed', unit: 'count', window: point },
  reach: { metric: 'reach', meaning: 'unique accounts that saw content', unit: 'count', window: point },
  profileViews: { metric: 'profileViews', meaning: 'profile page views', unit: 'count', window: point },
};

// ---------------------------------------------------------------------------
// Constructors
// ---------------------------------------------------------------------------

/** Two daily observation cycles. Beyond this, current evidence reads stale. */
export const DEFAULT_STALE_AFTER_SECONDS = 48 * 60 * 60;

export function freshnessFrom(observedAt: Date, now: Date, staleAfterSeconds = DEFAULT_STALE_AFTER_SECONDS): EvidenceFreshness {
  const ageSeconds = Math.max(0, Math.round((now.getTime() - observedAt.getTime()) / 1000));
  return {
    observedAt: observedAt.toISOString(),
    ageSeconds,
    staleAfterSeconds,
    isStale: ageSeconds > staleAfterSeconds,
  };
}

export function evidenceMeasured<T>(
  definition: EvidenceDefinition,
  value: T,
  source: EvidenceSource,
  trust: EvidenceTrust,
  freshness: EvidenceFreshness,
  note?: string
): EvidenceValue<T> {
  return { quality: 'measured', value, definition, source, trust, freshness, ...(note ? { note } : {}) };
}

export function evidenceUnavailable<T>(
  definition: EvidenceDefinition,
  reason: string,
  source: EvidenceSource = 'not_obtainable'
): EvidenceValue<T> {
  return { quality: 'unavailable', definition, reason, source };
}

export function evidenceInsufficient<T>(
  definition: EvidenceDefinition,
  reason: string,
  have: number,
  need: number,
  source: EvidenceSource = 'metrics_history'
): EvidenceValue<T> {
  return { quality: 'insufficient', definition, reason, have, need, source };
}

/** Type guard. The only sanctioned way to read a value. */
export function isMeasuredEvidence<T>(
  e: EvidenceValue<T>
): e is Extract<EvidenceValue<T>, { quality: 'measured' }> {
  return e.quality === 'measured';
}
