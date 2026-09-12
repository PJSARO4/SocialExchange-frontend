/**
 * METRICS-1 — the canonical Instagram-Login observation cycle.
 *
 * Replaces getAccountInsights() as the source for the trusted metric path.
 * getAccountInsights() is NOT deleted: /api/feeds/instagram/connect uses it for
 * the Business / Facebook-Page flow, which is a different auth architecture.
 * What changed is that the trusted writers no longer depend on it.
 *
 * WHY THE HOST MATTERS
 *
 * Verified live on 2026-09-12 against the production feed:
 *
 *   graph.instagram.com/me         -> 200, followers_count / follows_count / media_count
 *   graph.instagram.com/me/media   -> 200, like_count / comments_count
 *   graph.facebook.com/.../insights-> 500, "Invalid OAuth access token - Cannot parse access token"
 *
 * An Instagram-Login token is not a Facebook Graph token. This module never
 * sends one to graph.facebook.com.
 *
 * COST: exactly two upstream calls per feed per observation.
 */

import {
  CANONICAL_MEDIA_SAMPLE_SIZE,
  INSIGHTS_UNAVAILABLE_REASON,
  INSTAGRAM_LOGIN_HOST,
  METRICS_CONTRACT_VERSION,
  measured,
  unavailable,
  type FeedObservation,
  type Metric,
} from './contract';

interface ProfileResponse {
  username?: unknown;
  followers_count?: unknown;
  follows_count?: unknown;
  media_count?: unknown;
  error?: { message?: string };
}

interface MediaItem {
  like_count?: unknown;
  comments_count?: unknown;
}

/** Non-negative integers only. Anything else is "not measured". */
function asCount(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.trunc(v) : null;
}

function metricFromCount(v: unknown, field: string): Metric<number> {
  const n = asCount(v);
  return n === null ? unavailable(`Instagram did not return a usable ${field}.`) : measured(n);
}

/** Round to 2dp without letting float noise through. */
const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Observe one feed.
 *
 * The profile call is authoritative and mandatory: if it fails, the whole
 * observation fails and NOTHING is treated as fresh. The media call is
 * best-effort — losing it costs the interaction averages and the engagement
 * rate, which then report as unavailable rather than as zero.
 */
export async function observeFeedMetrics(accessToken: string): Promise<FeedObservation> {
  const base: Omit<
    FeedObservation,
    'ok' | 'followers' | 'following' | 'postsCount' | 'sampleSize' |
    'avgLikesPerPost' | 'avgCommentsPerPost' | 'engagementRate'
  > = {
    observedAt: new Date(),
    contractVersion: METRICS_CONTRACT_VERSION,
    source: 'instagram-login/graph.instagram.com',
    username: null,
    impressions: unavailable(INSIGHTS_UNAVAILABLE_REASON),
    reach: unavailable(INSIGHTS_UNAVAILABLE_REASON),
    profileViews: unavailable(INSIGHTS_UNAVAILABLE_REASON),
  };

  const failed = (error: string): FeedObservation => ({
    ...base,
    ok: false,
    error,
    followers: unavailable(error),
    following: unavailable(error),
    postsCount: unavailable(error),
    sampleSize: unavailable(error),
    avgLikesPerPost: unavailable(error),
    avgCommentsPerPost: unavailable(error),
    engagementRate: unavailable(error),
  });

  // ---- 1. Authoritative profile totals -----------------------------------
  let profile: ProfileResponse;
  try {
    const fields = ['username', 'followers_count', 'follows_count', 'media_count'].join(',');
    const res = await fetch(
      `${INSTAGRAM_LOGIN_HOST}/me?fields=${fields}&access_token=${encodeURIComponent(accessToken)}`
    );
    profile = (await res.json()) as ProfileResponse;
    if (profile?.error) {
      return failed(profile.error.message || 'Instagram profile request failed');
    }
    if (!res.ok) {
      return failed(`Instagram profile request failed (HTTP ${res.status})`);
    }
  } catch {
    // Never echo the thrown value: the request URL carries the access token.
    return failed('Network error contacting Instagram for profile metrics');
  }

  const followers = metricFromCount(profile.followers_count, 'followers_count');
  const following = metricFromCount(profile.follows_count, 'follows_count');
  const postsCount = metricFromCount(profile.media_count, 'media_count');

  // ---- 2. Recent media, for interaction averages --------------------------
  let mediaItems: MediaItem[] | null = null;
  let mediaError: string | null = null;
  try {
    const res = await fetch(
      `${INSTAGRAM_LOGIN_HOST}/me/media?fields=like_count,comments_count` +
        `&limit=${CANONICAL_MEDIA_SAMPLE_SIZE}&access_token=${encodeURIComponent(accessToken)}`
    );
    const body = (await res.json()) as { data?: MediaItem[]; error?: { message?: string } };
    if (body?.error) mediaError = body.error.message || 'Instagram media request failed';
    else if (!res.ok) mediaError = `Instagram media request failed (HTTP ${res.status})`;
    else mediaItems = Array.isArray(body.data) ? body.data : [];
  } catch {
    mediaError = 'Network error contacting Instagram for recent media';
  }

  // A media item counts only when BOTH interaction fields are usable. A missing
  // count reduces N; it is never read as zero interactions.
  let sumLikes = 0;
  let sumComments = 0;
  let n = 0;
  if (mediaItems) {
    for (const item of mediaItems) {
      const likes = asCount(item.like_count);
      const comments = asCount(item.comments_count);
      if (likes === null || comments === null) continue;
      sumLikes += likes;
      sumComments += comments;
      n += 1;
    }
  }

  const noSample =
    mediaError ??
    'No recent media with usable interaction counts; interaction averages not measured.';

  const sampleSize: Metric<number> = mediaItems ? measured(n) : unavailable(noSample);
  const avgLikesPerPost: Metric<number> =
    n > 0 ? measured(Math.round(sumLikes / n)) : unavailable(noSample);
  const avgCommentsPerPost: Metric<number> =
    n > 0 ? measured(Math.round(sumComments / n)) : unavailable(noSample);

  // ---- 3. Canonical engagement rate ---------------------------------------
  //
  //   avgInteractions = (likes + comments over the N valid media) / N
  //   engagementRate  = avgInteractions / TOTAL followers * 100
  //
  // The denominator is followers_count from the profile response. The
  // follower_count PERIOD INSIGHT is never fetched by this module and can
  // therefore never reach this division.
  let engagementRate: Metric<number>;
  if (n === 0) {
    engagementRate = unavailable(noSample);
  } else if (followers.quality !== 'measured' || followers.value === null) {
    engagementRate = unavailable('Total followers not measured; engagement rate not calculable.');
  } else if (followers.value === 0) {
    engagementRate = unavailable('Total followers is 0; engagement rate is undefined.');
  } else {
    const avgInteractions = (sumLikes + sumComments) / n;
    engagementRate = measured(round2((avgInteractions / followers.value) * 100));
  }

  return {
    ...base,
    ok: true,
    username: typeof profile.username === 'string' ? profile.username : null,
    followers,
    following,
    postsCount,
    sampleSize,
    avgLikesPerPost,
    avgCommentsPerPost,
    engagementRate,
  };
}
