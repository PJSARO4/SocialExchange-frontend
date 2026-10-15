/**
 * SYN-3C4 Slice 1B — the tenant-isolation certification logic.
 *
 * Pure with respect to Prisma: it takes a resolver as a FUNCTION and knows
 * nothing about how that resolver reaches a database. certify.ts passes the
 * real exported resolvers from lib/security/tenant.ts; selftest.ts passes
 * deliberately-broken fakes. That is what makes the negative controls
 * meaningful without touching production source.
 *
 * It never reimplements a resolver's query. It only observes results.
 */

/** Shape every resolver under certification shares. */
export type OwnershipResolver = (
  userId: string,
  targetId: string,
) => Promise<Record<string, unknown> | null>;

export interface Check {
  relationship: number;
  tenant: 'A' | 'B';
  name: string;
  pass: boolean;
  detail: string;
}

export interface RelationshipSpec {
  relationship: 4 | 5 | 6;
  /** The exported function's name, for the report. */
  fn: string;
  /** Underlying table, for the report. */
  table: string;
  /** Exactly the keys the resolver's select must return — sorted. */
  expectedKeys: readonly string[];
}

/** Derived from the select clauses in lib/security/tenant.ts. */
export const SPECS: readonly RelationshipSpec[] = [
  { relationship: 4, fn: 'resolveOwnedMetricsHistory', table: 'FeedMetricsHistory',
    expectedKeys: ['feedId', 'id', 'recordedAt'] },
  { relationship: 5, fn: 'resolveOwnedScheduledPost', table: 'scheduled_posts_new',
    expectedKeys: ['feedId', 'id', 'jobId', 'status'] },
  { relationship: 6, fn: 'resolveOwnedAutomationAction', table: 'automation_actions',
    expectedKeys: ['executedAt', 'feedId', 'id', 'status'] },
];

/** Deep structural equality, enough for resolver results (scalars/Date/null). */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || a === undefined || b === undefined) return a === b;
  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
  }
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  const ka = Object.keys(a as object).sort();
  const kb = Object.keys(b as object).sort();
  if (ka.length !== kb.length || ka.some((k, i) => k !== kb[i])) return false;
  return ka.every((k) => deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
}

function show(v: unknown): string {
  if (v === null) return 'null';
  if (v === undefined) return 'undefined';
  if (typeof v !== 'object') return String(v);
  return JSON.stringify(v, (_k, x) => (x instanceof Date ? x.toISOString() : x));
}

/**
 * Certify one relationship from one tenant's point of view.
 *
 * Five checks: own target resolves; own target's id is right; own target's
 * projection is EXACTLY the selected fields; the other tenant's target
 * resolves to null; a nonexistent id resolves to null. Plus one more: the
 * cross-tenant result and the nonexistent result must be DEEPLY
 * indistinguishable, not merely both falsy.
 */
export async function certifyTenantView(
  spec: RelationshipSpec,
  tenant: 'A' | 'B',
  resolver: OwnershipResolver,
  ownUserId: string,
  ownTargetId: string,
  otherTargetId: string,
  nonexistentId: string,
): Promise<Check[]> {
  const out: Check[] = [];
  const add = (name: string, pass: boolean, detail: string) =>
    out.push({ relationship: spec.relationship, tenant, name, pass, detail });

  const own = await resolver(ownUserId, ownTargetId);
  add('own target resolves (non-null)', own !== null && own !== undefined, `-> ${show(own)}`);

  if (own && typeof own === 'object') {
    add('own target id matches the requested id', own.id === ownTargetId,
        `id=${show(own.id)} requested=${ownTargetId}`);
    const keys = Object.keys(own).sort();
    const want = [...spec.expectedKeys].sort();
    const same = keys.length === want.length && keys.every((k, i) => k === want[i]);
    add('projection is exactly the selected fields', same,
        `got [${keys.join(', ')}] expected [${want.join(', ')}]`);
  } else {
    add('own target id matches the requested id', false, 'skipped: own target did not resolve');
    add('projection is exactly the selected fields', false, 'skipped: own target did not resolve');
  }

  const cross = await resolver(ownUserId, otherTargetId);
  add('other tenant target is refused (null)', cross === null, `-> ${show(cross)}`);

  const missing = await resolver(ownUserId, nonexistentId);
  add('nonexistent target is refused (null)', missing === null, `-> ${show(missing)}`);

  add('cross-tenant result is deeply indistinguishable from nonexistent',
      deepEqual(cross, missing),
      `cross=${show(cross)} nonexistent=${show(missing)}`);

  return out;
}
