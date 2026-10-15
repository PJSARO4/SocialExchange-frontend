/**
 * SYN-3C4 Slice 1B — harness negative controls.
 *
 * Imports ONLY guard.ts and isolation.ts. No Prisma, no database, no network,
 * no import of lib/security/tenant.ts. It therefore runs anywhere, and it runs
 * FIRST inside certify.ts: if the certification logic cannot detect a planted
 * failure, no database result from it may be believed.
 *
 * A control that cannot fail is not a control.
 */
import { assertAuthorizedTestUrl, GuardError } from './guard';
import { certifyTenantView, deepEqual, SPECS, type OwnershipResolver } from './isolation';

const GOOD = 'postgresql://certuser@127.0.0.1:55432/syn3c4_test';

interface Row { name: string; pass: boolean; detail: string }
const rows: Row[] = [];
const add = (name: string, pass: boolean, detail = '') => rows.push({ name, pass, detail });

async function expectCertificationToFail(
  label: string,
  resolver: OwnershipResolver,
  failing: string,
): Promise<void> {
  const checks = await certifyTenantView(
    SPECS[0], 'A', resolver, 'userA', 'rowA', 'rowB', 'no-such-id',
  );
  const failed = checks.filter((c) => !c.pass).map((c) => c.name);
  add(`NC: ${label}`, failed.some((n) => n.includes(failing)),
      failed.length ? `detected: ${failed.join(' | ')}` : 'DETECTED NOTHING');
}

export async function runSelfTests(): Promise<boolean> {
  // ---- NC1: cross-tenant unexpectedly returns a row -----------------------
  await expectCertificationToFail(
    'cross-tenant leak is detected',
    async (_u, id) => ({ id, feedId: 'feedX', recordedAt: new Date(0) }), // returns a row for EVERYTHING
    'other tenant target is refused',
  );

  // ---- NC2: cross-tenant and nonexistent become distinguishable ----------
  await expectCertificationToFail(
    'cross-tenant vs nonexistent divergence is detected',
    async (_u, id) => {
      if (id === 'rowA') return { id, feedId: 'feedA', recordedAt: new Date(0) };
      if (id === 'rowB') return null;
      return undefined as unknown as null; // nonexistent -> undefined, not null
    },
    'indistinguishable',
  );

  // ---- NC2b: a widened projection is detected ----------------------------
  await expectCertificationToFail(
    'projection widening (secret leakage) is detected',
    async (_u, id) =>
      id === 'rowA'
        ? { id, feedId: 'feedA', recordedAt: new Date(0), accessToken: 'SHOULD-NEVER-BE-SELECTED' }
        : null,
    'projection is exactly the selected fields',
  );

  // ---- NC3: the guard rejects every target but the authorized one --------
  const bad: ReadonlyArray<readonly [string, string]> = [
    ['postgresql://u:p@ep-cold-grass-aix5azhw.c-4.us-east-1.aws.neon.tech/neondb', 'DENY_PRODUCTION'],
    ['postgresql://u:p@ep-broad-sea-aiyayyem.c-4.us-east-1.aws.neon.tech/neondb', 'DENY_SYN3C3_ATTEMPT1'],
    ['postgresql://u:p@ep-snowy-resonance-aihia1q2.c-4.us-east-1.aws.neon.tech/neondb', 'DENY_SYN3C3_ATTEMPT2'],
    ['postgresql://u:p@ep-unknown-xyz.eu-central-1.aws.neon.tech/neondb', 'DENY_NEON'],
    ['postgresql://u:p@db.cluster-x.us-east-1.rds.amazonaws.com:5432/syn3c4_test', 'DENY_AMAZONAWS'],
    ['postgresql://u:p@host-pooler.internal:55432/syn3c4_test', 'DENY_POOLER'],
    ['postgresql://u@127.0.0.1:5432/syn3c4_test', 'UNEXPECTED_PORT'],
    ['postgresql://u@127.0.0.1:55432/socialexchange', 'UNEXPECTED_DATABASE'],
    ['postgresql://u@localhost:55432/syn3c4_test', 'NON_LOCAL_HOST'],
    ['postgresql://u@192.168.1.10:55432/syn3c4_test', 'NON_LOCAL_HOST'],
    ['mysql://u@127.0.0.1:55432/syn3c4_test', 'BAD_PROTOCOL'],
    ['postgresql://u@127.0.0.1:55432/syn3c4_test?options=endpoint%3Dep-broad-sea-aiyayyem', 'DENY_SYN3C3_ATTEMPT1'],
    ['', 'TEST_ENDPOINT_NOT_CONFIGURED'],
  ];
  for (const [url, code] of bad) {
    let got = '<ACCEPTED — GUARD FAILED>';
    try {
      assertAuthorizedTestUrl(url, {});
    } catch (e) {
      got = e instanceof GuardError ? e.code : `<${(e as Error).name}>`;
    }
    add(`NC: guard rejects ${code}`, got === code, `got ${got}`);
  }

  // a pre-existing, different DATABASE_URL must block the run
  let pre = '<ACCEPTED — GUARD FAILED>';
  try {
    assertAuthorizedTestUrl(GOOD, { DATABASE_URL: 'postgresql://u:p@somewhere-else/db' });
  } catch (e) {
    pre = e instanceof GuardError ? e.code : '<other>';
  }
  add('NC: guard rejects PREEXISTING_DATABASE_URL', pre === 'PREEXISTING_DATABASE_URL', `got ${pre}`);

  // and the authorized URL must still be ACCEPTED -- a guard that rejects
  // everything is as useless as one that accepts everything
  let ok = true, why = 'accepted';
  try { assertAuthorizedTestUrl(GOOD, {}); } catch (e) { ok = false; why = (e as Error).message; }
  add('NC: guard ACCEPTS the authorized localhost target', ok, why);

  // deepEqual sanity, since indistinguishability rests on it
  add('deepEqual: null vs null', deepEqual(null, null) === true);
  add('deepEqual: null vs undefined differ', deepEqual(null, undefined) === false);
  add('deepEqual: equal objects', deepEqual({ a: 1, b: null }, { b: null, a: 1 }) === true);
  add('deepEqual: extra key differs', deepEqual({ a: 1 }, { a: 1, b: 2 }) === false);
  add('deepEqual: Date by value', deepEqual(new Date(5), new Date(5)) === true);

  const failed = rows.filter((r) => !r.pass);
  console.log('--- HARNESS NEGATIVE CONTROLS ---');
  for (const r of rows) {
    console.log(`  [${r.pass ? 'PASS' : 'FAIL'}] ${r.name}${r.detail ? `  ${r.detail}` : ''}`);
  }
  console.log(`  negative controls: ${rows.length - failed.length}/${rows.length} as expected`);
  return failed.length === 0;
}

// Allow running the controls alone, with no database present at all.
if (require.main === module) {
  runSelfTests().then((ok) => process.exit(ok ? 0 : 1));
}
