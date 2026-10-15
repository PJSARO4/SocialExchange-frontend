# SYN-3C4 Slice 1B — behavioral tenant-isolation certification

Proves, against a real PostgreSQL server through the real Prisma client, that
the three **repository-enforced** evidence relationships refuse cross-tenant
targets:

| rel | evidence column → target | resolver under certification |
|----:|---|---|
| 4 | `metricsHistoryId` → `FeedMetricsHistory` | `resolveOwnedMetricsHistory` |
| 5 | `scheduledPostId` → `scheduled_posts_new` | `resolveOwnedScheduledPost` |
| 6 | `automationActionId` → `automation_actions` | `resolveOwnedAutomationAction` |

These three have **no** database protection and cannot have any: their target
tables carry no tenant column, so the certified composite-FK approach cannot
reach them. The certified adversarial suite says so as CONTROL 20/21/22 —
those cross-tenant inserts succeed in Postgres *by design*. The resolvers are
the only guard.

## Run

    export SYN3C4_TEST_DATABASE_URL='postgresql://<user>@127.0.0.1:55432/syn3c4_test'
    unset DATABASE_URL
    bash lib/security/__tests__/syn3c4-slice1b/run-certification.sh

Negative controls alone, no database required:

    node_modules/.bin/tsc -p lib/security/__tests__/syn3c4-slice1b/tsconfig.selftest.json \
      && node lib/security/__tests__/syn3c4-slice1b/build-selftest/lib/security/__tests__/syn3c4-slice1b/selftest.js

## Files

| file | role |
|---|---|
| `guard.ts` | fail-closed URL guard. Pure, no imports. Runs before Prisma is loaded. |
| `isolation.ts` | the certification logic. Takes a resolver as a function; never reimplements one. |
| `selftest.ts` | negative controls. Imports only the two above — no Prisma, no database. |
| `certify.ts` | the harness: controls → guard → identity → fixtures → assertions → cleanup. |
| `alias-register.cjs` | CJS resolve hook for the project's `@/` alias (tsc emits it verbatim). |
| `tsconfig.cert.json` | compiles the harness **against the real generated client**. |
| `tsconfig.selftest.json` | compiles the pure modules only. |
| `run-certification.sh` | the one command. Contains no database URL. |

## Safety

* Target comes only from `SYN3C4_TEST_DATABASE_URL`; a pre-existing
  `DATABASE_URL` is treated as a hazard, not authorization.
* Exact-match guard: `127.0.0.1`, port `55432`, database `syn3c4_test`.
* Denied by name: production `ep-cold-grass-aix5azhw`, SYN-3C1 rehearsal
  `ep-wispy-salad-ai3q3pj6`, SYN-3C3 Attempt #1 `ep-broad-sea-aiyayyem`,
  SYN-3C3 Attempt #2 `ep-snowy-resonance-aihia1q2`. All four are evidence.
  **The SYN-3C3 rehearsal harness holds Attempt #2 as its *authorized* target;
  here it is forbidden. Do not copy guards between the two programs.**
* Runtime identity (`current_database`, `inet_server_addr`, `inet_server_port`,
  server version, `current_schema`) and schema identity are checked **before**
  any row is written.
* The URL is passed to Prisma in-process via `process.env`; never written to
  `.env`, never put on a command line, never echoed.
* Cleanup is prefix-scoped (`syn3c4cert_<ts>_<rand>`), runs in `finally`, and
  is followed by a zero-residue proof. No `TRUNCATE`. No unrelated row is ever
  in a delete's `where`.

## Why not a rolled-back transaction

The resolvers use the `lib/prisma.ts` singleton directly. A
`prisma.$transaction(tx => …)` would give the fixtures to `tx` while the
resolvers kept querying the singleton outside it — they would not see the
uncommitted rows, and the certification would test nothing. Making it work
would mean threading a transaction client through the production resolver
signatures, which Slice 1B is forbidden to do. Hence namespaced ids,
deterministic cleanup, and a residue proof instead.
