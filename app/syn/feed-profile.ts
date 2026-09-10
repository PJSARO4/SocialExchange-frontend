/**
 * FeedProfile — the intelligence object SYN reasons from.
 *
 * SYN-0 SCOPE: CONTRACT ONLY. Nothing reads or writes this yet. No Prisma
 * migration, no API route, no persistence. The point of landing the shape first
 * is that every later layer (Content Director, capability registry, autonomy
 * gating) can be written against a stable type instead of against whatever the
 * first implementation happened to store.
 *
 * Design rules applied here:
 *  - Every field is optional except feedId. A half-filled profile must be
 *    usable; demanding a complete profile before SYN says anything useful is
 *    how this feature would die.
 *  - Free text over enums wherever a human would express nuance. Enums are used
 *    only where SYN must branch on the value.
 *  - `restrictions` is the one section SYN must treat as hard constraints
 *    rather than preferences.
 */

export const FEED_PROFILE_VERSION = 1;

export type ExperimentationTolerance = 'conservative' | 'balanced' | 'aggressive';

export interface FeedIdentity {
  /** Human name for the account, not necessarily the handle. */
  accountName?: string;
  /** What this account is, in the operator's own words. */
  description?: string;
  /** e.g. "meme page", "fitness", "local news". */
  niche?: string;
  category?: string;
}

export interface FeedObjectives {
  /** The single thing this account is for. Drives every recommendation. */
  primary?: string;
  secondary?: string[];
}

export interface FeedAudience {
  description?: string;
  /** Deliberately free-form: age bands, geography, platform habits. */
  demographics?: string;
  interests?: string[];
}

export interface FeedVoice {
  /** e.g. "dry, deadpan, never earnest". */
  tone?: string;
  /** Humour register / comedic style. */
  style?: string;
  /** Words, phrases, punctuation habits to use. */
  preferredVocabulary?: string[];
  /** Words and tics to avoid — softer than a restriction. */
  avoidVocabulary?: string[];
}

export interface ContentPillar {
  id: string;
  name: string;
  description?: string;
  /** Rough share of output, 0-100. Advisory, not enforced. */
  targetSharePercent?: number;
}

/**
 * HARD CONSTRAINTS. SYN must treat these as non-negotiable and must refuse to
 * propose content that violates them, rather than proposing it with a caveat.
 */
export interface FeedRestrictions {
  prohibitedTopics?: string[];
  prohibitedStyles?: string[];
  /** Brand/legal/safety notes in the operator's words. */
  safetyNotes?: string;
  /** If true, every proposal needs human sign-off regardless of control mode. */
  requireHumanReviewAlways?: boolean;
}

export interface FeedCadence {
  postsPerDay?: number;
  /** Local wall-clock windows, e.g. ["09:00-11:00", "18:00-20:00"]. */
  preferredWindows?: string[];
  timezone?: string;
}

export interface FeedStrategy {
  experimentation?: ExperimentationTolerance;
  /** Ordered: the first entry is what SYN optimises for. */
  growthPriorities?: string[];
}

export interface FeedProfile {
  /** SocialFeed.id — the join key to everything else. */
  feedId: string;
  version: number;

  identity?: FeedIdentity;
  objectives?: FeedObjectives;
  audience?: FeedAudience;
  voice?: FeedVoice;
  contentPillars?: ContentPillar[];
  restrictions?: FeedRestrictions;
  cadence?: FeedCadence;
  strategy?: FeedStrategy;

  createdAt?: string;
  updatedAt?: string;
  /** Who last edited: 'user' or 'syn' (SYN may propose profile updates later). */
  updatedBy?: 'user' | 'syn';
}

/** An empty, valid profile. */
export function emptyFeedProfile(feedId: string): FeedProfile {
  return { feedId, version: FEED_PROFILE_VERSION };
}

/**
 * How much of the profile is filled in, 0-1. SYN uses this to calibrate its own
 * confidence and to tell the operator what it still needs to know — rather than
 * silently inventing an identity for the account.
 */
export function profileCompleteness(p: FeedProfile): number {
  const checks: boolean[] = [
    !!p.identity?.description,
    !!p.identity?.niche,
    !!p.objectives?.primary,
    !!p.audience?.description,
    !!p.voice?.tone,
    !!p.voice?.style,
    !!(p.contentPillars && p.contentPillars.length > 0),
    !!(p.restrictions?.prohibitedTopics && p.restrictions.prohibitedTopics.length > 0),
    !!p.cadence?.postsPerDay,
    !!p.strategy?.experimentation,
  ];
  return checks.filter(Boolean).length / checks.length;
}

/** Storage key if/when SystemConfig is used as the V1 home. */
export function feedProfileConfigKey(feedId: string): string {
  return `feedProfile:${feedId}`;
}
