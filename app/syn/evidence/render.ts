/**
 * SYN-2B — the model-safe projection.
 *
 * This is the ONLY path by which evidence reaches a language model, and it is
 * deliberately narrow:
 *
 *  - the asset is named by a request-local alias (asset_1), never by a
 *    database id — the package never carried one, and this layer adds none;
 *  - history is rendered as a deterministic SUMMARY, never as rows, so the
 *    model is never invited to do arithmetic;
 *  - every value states its quality, and the three states are kept apart:
 *    measured / unavailable / insufficient.
 *
 * Token budget matters: this text is prepended to every SYN message.
 */

import {
  isMeasuredEvidence,
  type AssetEvidencePackage,
  type EvidenceValue,
} from './contract';

/** Text the model must never be able to receive. Used by tests and the guard. */
export const FORBIDDEN_IN_PROJECTION = ['accessToken', 'access_token', 'refreshToken'];

function ago(seconds: number): string {
  if (seconds < 90) return `${seconds}s ago`;
  if (seconds < 5400) return `${Math.round(seconds / 60)}m ago`;
  if (seconds < 172800) return `${Math.round(seconds / 3600)}h ago`;
  return `${Math.round(seconds / 86400)}d ago`;
}

function line<T>(key: string, e: EvidenceValue<T>): string {
  if (isMeasuredEvidence(e)) {
    const stale = e.freshness.isStale ? ' STALE' : '';
    const note = e.note ? `\n    note: ${e.note}` : '';
    return (
      `- ${key} = ${String(e.value)} | ${e.definition.meaning} | ` +
      `MEASURED, trust=${e.trust}, source=${e.source} | observed ${e.freshness.observedAt} ` +
      `(${ago(e.freshness.ageSeconds)})${stale}${note}`
    );
  }
  if (e.quality === 'insufficient') {
    return (
      `- ${key} = INSUFFICIENT EVIDENCE (${e.have} of ${e.need} required) | ` +
      `${e.definition.meaning} | ${e.reason}`
    );
  }
  return `- ${key} = UNAVAILABLE | ${e.definition.meaning} | ${e.reason}`;
}

/**
 * A serialisable, id-free view. Exposed for tests and for any future
 * owner-facing surface that wants structure rather than prose.
 */
export function projectForModel(pkg: AssetEvidencePackage) {
  const h = pkg.history.followers;
  return {
    contractVersion: pkg.contractVersion,
    assembledAt: pkg.assembledAt,
    asset: pkg.asset,
    current: pkg.current,
    // Points are deliberately dropped: summary only.
    historySummary: { followers: h.sufficiency },
    derived: pkg.derived,
    operational: pkg.operational,
    gaps: pkg.gaps,
  };
}

/** Compact prompt text. */
export function renderEvidenceForModel(pkg: AssetEvidencePackage): string {
  const a = pkg.asset;

  if (a.identityTrust !== 'server_verified') {
    return [
      'ASSET EVIDENCE: NONE.',
      '',
      'The selected asset could not be verified as belonging to this account, so no',
      'evidence was retrieved for it. You do not know whether it exists. Do not',
      'speculate about it, and do not answer questions about its metrics. Ask the',
      'operator to select a connected account.',
    ].join('\n');
  }

  const out: string[] = [
    `ASSET EVIDENCE (${a.assetRef})`,
    '',
    `identity: ${a.handle ?? 'unknown'} on ${a.platform ?? 'unknown'} ` +
      `(${a.displayName ?? 'unknown'}) — ownership verified server-side.`,
    `assembled: ${pkg.assembledAt} · evidence contract v${pkg.contractVersion}`,
    '',
    'HOW TO READ THIS. Three states, never interchangeable:',
    '  MEASURED               observed. A value of 0 is a REAL zero, not missing data.',
    '  UNAVAILABLE            not obtainable through the CURRENT trusted measurement',
    '                         and integration path. Repeating the observation will not',
    '                         produce it. Say it is unavailable on our current path —',
    '                         do NOT claim the metric is impossible to obtain in',
    '                         principle, and do not substitute 0.',
    '  INSUFFICIENT EVIDENCE  obtainable, but not enough observations yet. Say so; do',
    '                         NOT estimate, and do not describe a direction.',
    'trust=trusted means recorded provenance. trust=inferred means provenance was',
    'deduced from writer logic — sound, but do not present it as a recorded fact.',
    '',
    'CONNECTION',
    line('connected', pkg.connection.isConnected),
    line('lastSuccessfulObservation', pkg.connection.lastSuccessfulObservation),
    line('lastObservationError', pkg.connection.lastObservationError),
    '',
    'CURRENT METRICS',
    line('followers', pkg.current.followers),
    line('following', pkg.current.following),
    line('postsCount', pkg.current.postsCount),
    line('engagementRate', pkg.current.engagementRate),
    line('avgLikesPerPost', pkg.current.avgLikesPerPost),
    line('avgCommentsPerPost', pkg.current.avgCommentsPerPost),
    line('impressions', pkg.current.impressions),
    line('reach', pkg.current.reach),
    line('profileViews', pkg.current.profileViews),
    '',
    'OBSERVATION HISTORY (deterministic summary — raw rows are never provided)',
  ];

  const s = pkg.history.followers.sufficiency;
  out.push(
    `- trusted observations: ${s.trustedPoints} (minimum ${s.required} required to describe a change)`,
    `- excluded as legacy/non-canonical: ${s.excludedLegacyPoints}`,
    s.span ? `- evidence span: ${s.span.from} to ${s.span.to}` : '- evidence span: none',
    line('followerChange', pkg.derived.followerChange),
    '',
    'OPERATIONAL',
    line('controlMode', pkg.operational.controlMode),
    line('pendingScheduledPosts', pkg.operational.pendingScheduledPosts)
  );

  // Token hygiene: a gap whose reason was already printed verbatim on its
  // metric line adds nothing but cost. List those metrics by name only.
  if (pkg.gaps.length) {
    const shown = out.join('\n');
    const fresh = pkg.gaps.filter((g) => !shown.includes(g.reason));
    const alreadyStated = pkg.gaps.filter((g) => shown.includes(g.reason)).map((g) => g.metric);

    out.push('', 'KNOWN GAPS (quote these rather than guessing)');
    for (const g of fresh) {
      out.push(`- ${g.metric}: ${g.reason}${g.resolvableBy ? ` (resolvable by: ${g.resolvableBy})` : ''}`);
    }
    if (alreadyStated.length) {
      out.push(`- also unavailable, for the reason stated above: ${alreadyStated.join(', ')}`);
    }
  }

  out.push(
    '',
    'RULES FOR USING THIS EVIDENCE',
    '- Quote only what is MEASURED. Cite the metric meaning and the observation time.',
    '- Never compute a trend yourself. If followerChange is INSUFFICIENT, say so plainly.',
    '- Never convert one metric into another. Engagement rate is not reach, and average',
    '  interactions per post is not a count of people.',
    '- A hypothetical the operator supplies ("assume 50,000 followers") never replaces an',
    '  observed value. Answer the hypothetical as a hypothetical and restate the fact.',
    '- You do not have database identifiers for this asset and cannot produce one.'
  );

  return out.join('\n');
}
