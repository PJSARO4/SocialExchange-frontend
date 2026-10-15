/**
 * SYN-3C4 Slice 1B — BEHAVIORAL TENANT-ISOLATION CERTIFICATION
 *
 * Proves, through the real Prisma client against a real PostgreSQL server,
 * that the three repository-enforced evidence relationships refuse
 * cross-tenant targets:
 *
 *   rel 4  MemoryEvidenceLink.metricsHistoryId   -> FeedMetricsHistory
 *   rel 5  MemoryEvidenceLink.scheduledPostId    -> scheduled_posts_new
 *   rel 6  MemoryEvidenceLink.automationActionId -> automation_actions
 *
 * These three have NO database protection and cannot have any: their target
 * tables carry no tenant column, so the certified composite-FK approach cannot
 * reach them. The certified adversarial suite states it as CONTROL 20/21/22 --
 * those cross-tenant inserts succeed in Postgres BY DESIGN. The resolvers are
 * the only guard, and this file is what turns "correctly shaped" into "proven".
 *
 * It imports and invokes the REAL exported functions from
 * lib/security/tenant.ts. It does not reimplement, wrap or shadow their query
 * logic, and it does not modify them.
 *
 * ORDER OF OPERATIONS IS LOAD-BEARING:
 *   1. negative controls (no database touched)
 *   2. URL guard (no database touched)
 *   3. only then is DATABASE_URL set and Prisma loaded
 *   4. runtime identity + schema identity, BEFORE any write
 *   5. fixtures -> assertions -> cleanup in finally -> residue proof
 */
import { assertAuthorizedTestUrl, describeTarget, EXPECTED, GuardError } from './guard';
import { certifyTenantView, SPECS, type Check, type OwnershipResolver } from './isolation';
import { runSelfTests } from './selftest';

/** Unique per run, so cleanup can never touch a row this run did not create. */
const RUN = `syn3c4cert_${new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)}_${Math.random()
  .toString(16)
  .slice(2, 8)}`;

const id = (s: string) => `${RUN}_${s}`;

/** Type adapter only -- the real function is still the thing invoked. */
const adapt =
  <T extends object>(f: (u: string, i: string) => Promise<T | null>): OwnershipResolver =>
  (u, i) =>
    f(u, i) as Promise<Record<string, unknown> | null>;

const line = (s = '') => console.log(s);
let hardFailure: string | null = null;

async function main(): Promise<number> {
  line('================================================================');
  line('SYN-3C4 SLICE 1B — BEHAVIORAL TENANT-ISOLATION CERTIFICATION');
  line(`run id: ${RUN}`);
  line(`utc   : ${new Date().toISOString()}`);
  line('================================================================');
  line();

  // ---- 1. negative controls, before anything else --------------------------
  if (!(await runSelfTests())) {
    line();
    line('ABORT [HARNESS_SELFTEST_FAILED] the certification logic failed to detect a');
    line('      planted failure. No database was contacted. Nothing may be believed');
    line('      from this harness until the controls pass.');
    return 1;
  }
  line();

  // ---- 2. guard, before Prisma is loaded -----------------------------------
  line('--- FAIL-CLOSED DATABASE GUARD ---');
  let url: string;
  try {
    url = assertAuthorizedTestUrl(process.env.SYN3C4_TEST_DATABASE_URL, process.env);
  } catch (e) {
    line(`  ABORT ${(e as Error).message}`);
    line('  No Prisma module was loaded. No database was contacted. No row was written.');
    return 1;
  }
  line(`  [PASS] authorized target  ${describeTarget(url)}`);
  line('  [PASS] production, SYN-3C1, SYN-3C3 Attempt #1 and Attempt #2 denied by name');
  line();

  // ---- 3. only now may Prisma exist ----------------------------------------
  process.env.DATABASE_URL = url;
  process.env.DIRECT_URL = url;
  const { prisma } = await import('@/lib/prisma');

  /** Counts only rows this run created. Typed from the real client, not by hand. */
  const countResidue = async () => {
    const where = { where: { id: { startsWith: RUN } } };
    const byTable: Record<string, number> = {
      automation_actions: await prisma.automationAction.count(where),
      automation_rules: await prisma.automationRule.count(where),
      scheduled_posts_new: await prisma.scheduledPostNew.count(where),
      FeedMetricsHistory: await prisma.feedMetricsHistory.count(where),
      SocialFeed: await prisma.socialFeed.count(where),
      User: await prisma.user.count(where),
    };
    return { total: Object.values(byTable).reduce((a, b) => a + b, 0), byTable };
  };
  const {
    resolveOwnedMetricsHistory,
    resolveOwnedScheduledPost,
    resolveOwnedAutomationAction,
  } = await import('@/lib/security/tenant');

  const resolvers: Record<number, OwnershipResolver> = {
    4: adapt(resolveOwnedMetricsHistory),
    5: adapt(resolveOwnedScheduledPost),
    6: adapt(resolveOwnedAutomationAction),
  };

  const checks: Check[] = [];
  let fixturesCreated = false;

  try {
    // ---- 4a. runtime identity, BEFORE any mutation -------------------------
    line('--- RUNTIME DATABASE IDENTITY (before any write) ---');
    const idRows = await prisma.$queryRawUnsafe<
      Array<{ db: string; addr: string | null; port: string; svn: string; sch: string; ver: string }>
    >(
      `SELECT current_database() AS db,
              host(inet_server_addr())      AS addr,
              inet_server_port()::text      AS port,
              current_setting('server_version_num') AS svn,
              current_schema()              AS sch,
              version()                     AS ver`,
    );
    const idn = idRows[0];
    if (!idn) {
      hardFailure = 'IDENTITY_QUERY_EMPTY';
      line('  ABORT [IDENTITY_QUERY_EMPTY] identity query returned no row.');
      return 1;
    }
    const major = Math.floor(Number(idn.svn) / 10000);
    const idChecks: Array<[string, boolean, string]> = [
      ['current_database() = syn3c4_test', idn.db === EXPECTED.database, `got ${idn.db}`],
      ['inet_server_addr() = 127.0.0.1', idn.addr === EXPECTED.hostname, `got ${idn.addr ?? 'NULL'}`],
      ['inet_server_port() = 55432', idn.port === EXPECTED.port, `got ${idn.port}`],
      [`PostgreSQL major = ${EXPECTED.serverVersionMajor}`, major === EXPECTED.serverVersionMajor, `got ${major} (server_version_num ${idn.svn})`],
      ['current_schema() = public', idn.sch === 'public', `got ${idn.sch}`],
    ];
    for (const [n, p, d] of idChecks) line(`  [${p ? 'PASS' : 'FAIL'}] ${n}  ${d}`);
    if (idChecks.some(([, p]) => !p)) {
      hardFailure = 'RUNTIME_IDENTITY_MISMATCH';
      line('  ABORT [RUNTIME_IDENTITY_MISMATCH] aborting before any fixture mutation.');
      return 1;
    }
    line(`  server: ${idn.ver.split(' on ')[0]}`);
    line();

    // ---- 4b. schema identity, BEFORE any mutation --------------------------
    line('--- SCHEMA IDENTITY (before any write) ---');
    const tables = (
      await prisma.$queryRawUnsafe<Array<{ table_name: string }>>(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`,
      )
    ).map((r) => r.table_name);
    const required = ['User', 'SocialFeed', 'FeedMetricsHistory', 'scheduled_posts_new', 'automation_rules', 'automation_actions'];
    const memory = ['MemoryRecord', 'MemoryRelation', 'MemoryEvidenceLink', 'Experiment', 'Constitution'];
    const missing = required.filter((t) => !tables.includes(t));
    const leaked = memory.filter((t) => tables.includes(t));
    line(`  [${missing.length === 0 ? 'PASS' : 'FAIL'}] all 6 fixture tables present  missing=[${missing.join(', ')}]`);
    line(`  [${leaked.length === 0 ? 'PASS' : 'FAIL'}] pre-memory schema: memory tables absent  present=[${leaked.join(', ')}]`);
    line(`  public table count: ${tables.length}`);
    if (missing.length || leaked.length) {
      hardFailure = 'SCHEMA_IDENTITY_MISMATCH';
      line('  ABORT [SCHEMA_IDENTITY_MISMATCH] aborting before any fixture mutation.');
      return 1;
    }
    line();

    // ---- 4c. target must be free of this run's namespace -------------------
    const pre = await countResidue();
    if (pre.total !== 0) {
      hardFailure = 'TARGET_NOT_EMPTY';
      line(`  ABORT [TARGET_NOT_EMPTY] ${pre.total} row(s) already carry this run's prefix.`);
      return 1;
    }

    // ---- 5. fixtures, in FK order ------------------------------------------
    line('--- FIXTURES (FK order; each automation action AFTER its rule) ---');
    fixturesCreated = true;
    for (const t of ['A', 'B'] as const) {
      await prisma.user.create({
        data: { id: id(`user${t}`), email: `${RUN}.${t.toLowerCase()}@syn3c4.invalid`, name: `SYN3C4 cert tenant ${t}` },
      });
      await prisma.socialFeed.create({
        data: {
          id: id(`feed${t}`), userId: id(`user${t}`), platform: 'INSTAGRAM',
          platformAccountId: `${RUN}-acct-${t}`, handle: `syn3c4_${t.toLowerCase()}`,
          displayName: `SYN3C4 cert feed ${t}`, accessToken: 'SYNTHETIC-NOT-A-SECRET',
        },
      });
      await prisma.feedMetricsHistory.create({
        data: { id: id(`mh${t}`), feedId: id(`feed${t}`), followers: 1, following: 1, postsCount: 1, engagementRate: 0 },
      });
      await prisma.scheduledPostNew.create({
        data: { id: id(`sp${t}`), feedId: id(`feed${t}`), caption: `SYN3C4 cert ${t}`, scheduledFor: new Date('2027-01-01T00:00:00Z') },
      });
      // The rule MUST exist before the action: automation_actions.rule_id is
      // NOT NULL. Omitting it is precisely the SYN-3C3 Attempt #1 Step 9
      // failure (automation_actions_rule_id_fkey). Not repeated here.
      await prisma.automationRule.create({
        data: { id: id(`rule${t}`), feedId: id(`feed${t}`), name: `SYN3C4 cert rule ${t}`, type: 'ENGAGEMENT' },
      });
      await prisma.automationAction.create({
        data: { id: id(`action${t}`), ruleId: id(`rule${t}`), feedId: id(`feed${t}`), actionType: 'LIKE', targetType: 'POST' },
      });
      line(`  [PASS] tenant ${t}: user, feed, metricsHistory, scheduledPost, rule, action`);
    }
    line();

    // ---- 6. the certification ----------------------------------------------
    line('--- TENANT ISOLATION, VIA THE REAL EXPORTED RESOLVERS ---');
    const targets: Record<number, string> = { 4: 'mh', 5: 'sp', 6: 'action' };
    for (const spec of SPECS) {
      for (const t of ['A', 'B'] as const) {
        const other = t === 'A' ? 'B' : 'A';
        const got = await certifyTenantView(
          spec, t, resolvers[spec.relationship],
          id(`user${t}`), id(`${targets[spec.relationship]}${t}`),
          id(`${targets[spec.relationship]}${other}`),
          `${RUN}_does_not_exist`,
        );
        checks.push(...got);
        line(`  rel ${spec.relationship} / tenant ${t}  ${spec.fn}  (${spec.table})`);
        for (const c of got) line(`    [${c.pass ? 'PASS' : 'FAIL'}] ${c.name}  ${c.detail}`);
      }
    }
    line();
  } catch (e) {
    hardFailure = `UNCAUGHT: ${(e as Error).message}`;
    line(`  ABORT [HARNESS_ERROR] ${(e as Error).message}`);
  } finally {
    // ---- 7. deterministic cleanup, always ---------------------------------
    line('--- CLEANUP (prefix-scoped deletes, reverse FK order; no TRUNCATE) ---');
    try {
      const w = { id: { startsWith: RUN } };
      const d: Array<[string, number]> = [
        ['automation_actions', (await prisma.automationAction.deleteMany({ where: w })).count],
        ['automation_rules', (await prisma.automationRule.deleteMany({ where: w })).count],
        ['scheduled_posts_new', (await prisma.scheduledPostNew.deleteMany({ where: w })).count],
        ['FeedMetricsHistory', (await prisma.feedMetricsHistory.deleteMany({ where: w })).count],
        ['SocialFeed', (await prisma.socialFeed.deleteMany({ where: w })).count],
        ['User', (await prisma.user.deleteMany({ where: w })).count],
      ];
      for (const [t, n] of d) line(`  deleted ${n} from ${t}`);
      const post = await countResidue();
      line(`  [${post.total === 0 ? 'PASS' : 'FAIL'}] zero certification rows remain  ${JSON.stringify(post.byTable)}`);
      if (post.total !== 0) hardFailure = hardFailure ?? 'RESIDUE_REMAINS';
      if (!fixturesCreated) line('  (no fixtures had been created)');
    } catch (e) {
      hardFailure = hardFailure ?? `CLEANUP_FAILED: ${(e as Error).message}`;
      line(`  [FAIL] cleanup error: ${(e as Error).message}`);
    }
    await prisma.$disconnect();
    line();
  }

  // ---- 8. verdict ----------------------------------------------------------
  const failed = checks.filter((c) => !c.pass);
  line('================================================================');
  line(`assertions: ${checks.length - failed.length}/${checks.length} passed`);
  for (const f of failed) line(`  FAILED  rel ${f.relationship} tenant ${f.tenant}: ${f.name}  ${f.detail}`);
  const expectedCount = SPECS.length * 2 * 6; // 3 relationships x 2 tenants x 6 checks
  if (checks.length !== expectedCount) {
    line(`  INCOMPLETE: expected ${expectedCount} assertions, ran ${checks.length}`);
  }
  const ok = !hardFailure && failed.length === 0 && checks.length === expectedCount;
  line(ok
    ? 'SYN-3C4 SLICE 1B BEHAVIORAL CERTIFICATION — PASS'
    : `SYN-3C4 SLICE 1B BEHAVIORAL CERTIFICATION — FAIL${hardFailure ? ` (${hardFailure})` : ''}`);
  line('================================================================');
  return ok ? 0 : 1;
}

main()
  .then((code) => process.exit(code))
  .catch((e) => {
    console.error('FATAL', e);
    process.exit(1);
  });
