/**
 * SYN-2B — deterministic summarisation.
 *
 * ALL arithmetic about evidence happens here, in code. The model is never
 * handed rows to compute over: it receives finished numbers and an explicit
 * sufficiency verdict. A language model asked to subtract two follower counts
 * will produce a number even when it should refuse; deterministic code does
 * not have that failure mode.
 *
 * Trust decisions are NOT re-litigated here. Whether a history row may be used
 * is decided by METRICS-1's classifier, imported and applied unchanged.
 */

import {
  MIN_ROWS_FOR_TREND,
  followerTrend,
  selectTrustedHistory,
  type HistoryRowShape,
} from '@/app/lib/metrics/contract';
import {
  DEFINITIONS,
  evidenceInsufficient,
  evidenceMeasured,
  freshnessFrom,
  type EvidenceSeries,
  type EvidenceSufficiency,
  type EvidenceValue,
} from './contract';

/**
 * Hard ceiling on history points held in an evidence package. Even this is
 * never rendered row by row — render.ts emits a summary. The cap exists so a
 * long-lived account cannot grow the package without bound.
 */
export const MAX_HISTORY_POINTS = 30;

export interface TrustedHistory<T extends HistoryRowShape> {
  /** Oldest first. Trusted rows only. */
  rows: T[];
  excludedLegacyCount: number;
}

/**
 * Partition with METRICS-1's classifier and order oldest-first.
 * Rejected rows are counted, never inspected further.
 */
export function partitionHistory<T extends HistoryRowShape>(rows: T[]): TrustedHistory<T> {
  const { trusted, legacy } = selectTrustedHistory(rows);
  const sorted = [...trusted].sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());
  return { rows: sorted.slice(-MAX_HISTORY_POINTS), excludedLegacyCount: legacy.length };
}

export function sufficiencyFrom(history: TrustedHistory<HistoryRowShape>): EvidenceSufficiency {
  const n = history.rows.length;
  const base: EvidenceSufficiency = {
    trustedPoints: n,
    required: MIN_ROWS_FOR_TREND,
    sufficient: n >= MIN_ROWS_FOR_TREND,
    excludedLegacyPoints: history.excludedLegacyCount,
  };
  if (n > 0) {
    base.span = {
      from: history.rows[0].recordedAt.toISOString(),
      to: history.rows[n - 1].recordedAt.toISOString(),
    };
  }
  return base;
}

/** The follower series. Points are carried for the UI, never for the prompt. */
export function followerSeries(history: TrustedHistory<HistoryRowShape>): EvidenceSeries<number> {
  return {
    definition: DEFINITIONS.followers,
    points: history.rows.map((r) => ({ observedAt: r.recordedAt.toISOString(), value: r.followers })),
    sufficiency: sufficiencyFrom(history),
    trust: 'trusted',
  };
}

/**
 * Follower change across the trusted span.
 *
 * Delegates the verdict to METRICS-1's followerTrend(), so "how many points are
 * enough" is defined in exactly one place. With fewer than two trusted
 * observations this returns `insufficient` — never 0, never a direction, never
 * a comparison against a cached value that was not itself an observation.
 */
export function followerChangeEvidence(
  history: TrustedHistory<HistoryRowShape>,
  now: Date
): EvidenceValue<number> {
  const verdict = followerTrend(history.rows);
  const definition = {
    ...DEFINITIONS.followers,
    metric: 'followerChange',
    meaning: 'change in total followers between the first and last trusted observation',
  };

  if (verdict.kind === 'insufficient_evidence') {
    return evidenceInsufficient<number>(
      definition,
      verdict.reason,
      verdict.trustedRows,
      MIN_ROWS_FOR_TREND
    );
  }

  return evidenceMeasured<number>(
    definition,
    verdict.change,
    'metrics_history',
    'trusted',
    freshnessFrom(verdict.to, now),
    `Change between ${verdict.from.toISOString()} and ${verdict.to.toISOString()} ` +
      `across ${verdict.trustedRows} trusted observations.`
  );
}
