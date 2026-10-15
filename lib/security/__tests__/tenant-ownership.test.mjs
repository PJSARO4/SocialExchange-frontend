/**
 * SYN-3C4 Slice 1 — tenant-ownership invariants for certified relationships
 * 4, 5 and 6.
 *
 * WHAT THIS PROVES, AND WHAT IT DOES NOT
 *
 * This repository has no test runner, no test files and no installed
 * node_modules, and SYN-3C4 Slice 1 is explicitly forbidden from running an
 * installer, `prisma generate`, a migration, or any database. So there is no
 * way here to execute the resolvers or to observe the SQL Prisma emits.
 *
 * What CAN be proven offline, with zero dependencies, is that each resolver is
 * *written* in the only shape that enforces tenancy in the query: a single
 * findFirst whose where clause carries both the target id and feed.userId, a
 * narrow select, a direct return, and no post-fetch comparison of user ids.
 * That is a real regression guard -- it fails the moment someone rewrites a
 * resolver to fetch-then-compare, swaps findFirst for findUnique, drops the
 * join, or widens the select.
 *
 * It is NOT proof that Prisma renders that where clause as a correct SQL join,
 * and it must never be cited as such. That requires the integration test
 * described at the end of this file, against a throwaway Postgres.
 *
 * Every assertion below is also run against deliberately-broken synthetic
 * resolvers, which MUST fail. A control that cannot fail is not a control.
 *
 * Run:  node --test lib/security/__tests__/
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const SRC = readFileSync(new URL('../tenant.ts', import.meta.url), 'utf8');

/**
 * Pull one exported async function's body out of the source.
 *
 * The parameter list is closed by paren matching, then the body brace is the
 * first `{` at angle-bracket depth 0 -- so a return type like
 * `Promise<{ id: string } | null>` is skipped rather than mistaken for the
 * body. (The first version of this helper made exactly that mistake and every
 * assertion below failed against correct code.)
 */
function bodyOf(src, name) {
  const start = src.indexOf(`export async function ${name}(`);
  if (start === -1) return null;
  let i = src.indexOf('(', start), paren = 0;
  for (; i < src.length; i++) {
    if (src[i] === '(') paren++;
    else if (src[i] === ')' && --paren === 0) { i++; break; }
  }
  let angle = 0, open = -1;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '<') angle++;
    else if (c === '>') angle = Math.max(0, angle - 1);
    else if (c === '{' && angle === 0) { open = i; break; }
  }
  if (open === -1) return null;
  let depth = 0;
  for (let j = open; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}' && --depth === 0) return src.slice(open + 1, j);
  }
  return null;
}

/** Extract the contents of a `where: { ... }` object by brace matching. */
function whereOf(body) {
  const k = body.indexOf('where:');
  if (k === -1) return null;
  const open = body.indexOf('{', k);
  if (open === -1) return null;
  let depth = 0;
  for (let i = open; i < body.length; i++) {
    if (body[i] === '{') depth++;
    else if (body[i] === '}' && --depth === 0) return body.slice(open + 1, i);
  }
  return null;
}

/**
 * The tenant-security audit. Returns a list of violations; [] means the
 * resolver is written in the enforced-in-query shape.
 */
function auditResolver(body, { model, idParam }) {
  const v = [];
  if (body === null) return ['resolver not found or not exported'];

  const calls = [...body.matchAll(/prisma\.(\w+)\.(\w+)\s*\(/g)];
  if (calls.length !== 1) v.push(`expected exactly 1 prisma call, found ${calls.length}`);
  if (calls.length) {
    const [, gotModel, gotMethod] = calls[0];
    if (gotModel !== model) v.push(`queries prisma.${gotModel}, expected prisma.${model}`);
    if (gotMethod !== 'findFirst') {
      v.push(`uses ${gotMethod}, expected findFirst (findUnique cannot take a relation filter)`);
    }
  }

  const w = whereOf(body);
  if (w === null) v.push('no where clause found');
  else {
    if (!new RegExp(`\\bid:\\s*${idParam}\\b`).test(w)) v.push(`where does not filter on id: ${idParam}`);
    if (!/feed:\s*\{\s*userId\s*\}/.test(w)) v.push('where does not carry the tenant join feed: { userId }');
  }

  if (!/select:\s*\{/.test(body)) v.push('no select -- returns whole rows');
  if (!/return\s+prisma\./.test(body)) v.push('does not return the prisma call directly');

  // fetch-then-compare, in any of its usual spellings
  for (const re of [/[!=]==\s*userId\b/, /\buserId\s*[!=]==/, /\.userId\s*[!=]==/,
                    /if\s*\([^)]*userId[^)]*\)\s*(return|throw)/]) {
    if (re.test(body)) { v.push('compares user ids in application code after fetching'); break; }
  }

  // tenant identity must come from the parameter, never from the request
  if (/\b(req|request|body|searchParams|headers|cookies|params)\b/.test(body)) {
    v.push('reads tenant-relevant input from client-controlled request data');
  }
  return v;
}

/** The three certified repository-enforced relationships. */
const RELATIONSHIPS = [
  { rel: 4, target: 'FeedMetricsHistory',  fn: 'resolveOwnedMetricsHistory',
    model: 'feedMetricsHistory', idParam: 'metricsHistoryId' },
  { rel: 5, target: 'scheduled_posts_new', fn: 'resolveOwnedScheduledPost',
    model: 'scheduledPostNew',   idParam: 'postId' },
  { rel: 6, target: 'automation_actions',  fn: 'resolveOwnedAutomationAction',
    model: 'automationAction',   idParam: 'automationActionId' },
];

for (const r of RELATIONSHIPS) {
  test(`rel ${r.rel}: ${r.fn} enforces tenancy inside the query (${r.target})`, () => {
    const violations = auditResolver(bodyOf(SRC, r.fn), r);
    assert.deepEqual(violations, [], `rel ${r.rel} violations: ${violations.join('; ')}`);
  });

  test(`rel ${r.rel}: ${r.fn} cross-tenant and nonexistent are the same code path`, () => {
    const body = bodyOf(SRC, r.fn);
    assert.notEqual(body, null);
    // One unconditional return of one findFirst means there is no branch that
    // could distinguish "someone else's row" from "no such row": both are the
    // empty result of the same filtered query, surfaced as the same null.
    assert.equal((body.match(/\breturn\b/g) || []).length, 1,
      'more than one return -- a second path could distinguish the two cases');
    assert.equal(/\b(throw|if\s*\()/.test(body), false,
      'branching or throwing could make cross-tenant distinguishable from nonexistent');
    assert.equal((body.match(/prisma\.\w+\.\w+\s*\(/g) || []).length, 1,
      'a second query could leak existence');
  });
}

test('every resolver takes userId as its first parameter, from the caller only', () => {
  for (const r of RELATIONSHIPS) {
    const sig = SRC.slice(SRC.indexOf(`export async function ${r.fn}(`));
    const params = sig.slice(sig.indexOf('(') + 1, sig.indexOf(')'));
    assert.match(params, /^\s*userId:\s*string\s*,/, `${r.fn} must take userId: string first`);
  }
});

test('pre-existing security model is unchanged: getTenantUser resolves session -> email -> User row', () => {
  const body = bodyOf(SRC, 'getTenantUser');
  assert.notEqual(body, null, 'getTenantUser must still exist');
  assert.match(body, /getServerSession\(authOptions\)/);
  assert.match(body, /session\?\.user\?\.email/);
  assert.match(body, /where:\s*\{\s*email\s*\}/);
  assert.match(body, /select:\s*\{\s*id:\s*true\s*,?\s*\}/);
  assert.equal(/session[.?]*\.user[.?]*\.id/.test(body), false,
    'must not trust session.user.id -- a forged or stale token id could address a tenant');
});

test('pre-existing security model is unchanged: 401 unauthenticated, 404 unknown-or-not-owned', () => {
  assert.match(SRC, /export function unauthorized\(\)[\s\S]{0,200}status:\s*401/);
  assert.match(SRC, /export function notFound\([\s\S]{0,240}status:\s*404/);
  assert.equal(/status:\s*403/.test(SRC), false,
    '403 would distinguish not-owned from nonexistent and act as an existence oracle');
});

/* ---------------------------------------------------------------------------
 * NEGATIVE CONTROLS. The audit must reject each of these. If any of them
 * passes, the audit above is decorative and every result it reports is void.
 * ------------------------------------------------------------------------- */
const BAD = [
  { why: 'fetch-then-compare in application code',
    expect: /compares user ids in application code/,
    body: `
      const row = await prisma.feedMetricsHistory.findUnique({
        where: { id: metricsHistoryId },
        select: { id: true, feedId: true, recordedAt: true, feed: { select: { userId: true } } },
      });
      if (row && row.feed.userId === userId) return row;
      return null;` },
  { why: 'findUnique with no tenant join',
    expect: /where does not carry the tenant join/,
    body: `
      return prisma.feedMetricsHistory.findUnique({
        where: { id: metricsHistoryId },
        select: { id: true, feedId: true, recordedAt: true },
      });` },
  { why: 'tenant id taken from the request instead of the session',
    expect: /client-controlled request data/,
    body: `
      return prisma.feedMetricsHistory.findFirst({
        where: { id: metricsHistoryId, feed: { userId: body.userId } },
        select: { id: true, feedId: true, recordedAt: true },
      });` },
  { why: 'no select -- returns the whole row',
    expect: /no select/,
    body: `
      return prisma.feedMetricsHistory.findFirst({
        where: { id: metricsHistoryId, feed: { userId } },
      });` },
];

for (const b of BAD) {
  test(`NEGATIVE CONTROL rejected: ${b.why}`, () => {
    const violations = auditResolver(b.body, { model: 'feedMetricsHistory', idParam: 'metricsHistoryId' });
    assert.notEqual(violations.length, 0, 'the audit failed to reject a deliberately broken resolver');
    assert.ok(violations.some((x) => b.expect.test(x)),
      `expected a violation matching ${b.expect}, got: ${violations.join('; ')}`);
  });
}

test('NEGATIVE CONTROL rejected: a correctly-shaped resolver still passes', () => {
  // Guards the opposite failure: an audit that rejects everything is also useless.
  const good = `
      return prisma.feedMetricsHistory.findFirst({
        where: { id: metricsHistoryId, feed: { userId } },
        select: { id: true, feedId: true, recordedAt: true },
      });`;
  assert.deepEqual(auditResolver(good, { model: 'feedMetricsHistory', idParam: 'metricsHistoryId' }), []);
});

/* ---------------------------------------------------------------------------
 * REMAINING INTEGRATION-TEST REQUIREMENT  (NOT satisfiable in Slice 1)
 *
 * The above proves shape, not runtime behaviour. Still owed, against a
 * throwaway Postgres -- never production, never a Neon rehearsal branch:
 *
 *   fixture: userA + feedA(userId=A), userB + feedB(userId=B),
 *            one FeedMetricsHistory / scheduled_posts_new / automation_actions
 *            row under each feed.
 *
 *   per relationship (4, 5, 6), three assertions:
 *     own tenant      resolveOwnedX(A, rowA) -> non-null, id === rowA
 *     cross tenant    resolveOwnedX(A, rowB) -> null
 *     nonexistent     resolveOwnedX(A, 'no-such-id') -> null
 *   and: the cross-tenant and nonexistent results are deep-equal, so no
 *   caller can tell them apart.
 *
 * Prerequisites Slice 1 may not perform: npm ci, prisma generate, a reachable
 * throwaway Postgres, and a test runner choice. Until those exist, relationships
 * 4, 5 and 6 are enforced by code that is correctly shaped and NOT yet
 * behaviourally proven. That distinction belongs in the SYN-3C2 enforcement
 * matrix, not in a footnote.
 * ------------------------------------------------------------------------- */
