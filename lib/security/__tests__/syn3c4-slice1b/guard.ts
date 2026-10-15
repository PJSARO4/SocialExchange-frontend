/**
 * SYN-3C4 Slice 1B — fail-closed database guard.
 *
 * Pure. Imports nothing. No Prisma, no network, no filesystem. That is
 * deliberate: it can therefore be unit-tested offline, and it runs to
 * completion BEFORE any Prisma module is loaded or any row is written.
 *
 * The rule: authorization comes from SYN3C4_TEST_DATABASE_URL and from nothing
 * else. A DATABASE_URL already present in the environment is NOT authorization
 * -- it is a hazard, because it may point at production.
 */

export class GuardError extends Error {
  constructor(public readonly code: string, message: string) {
    super(`[${code}] ${message}`);
    this.name = 'GuardError';
  }
}

/** The one authorized target. Exact match on every component. */
export const EXPECTED = {
  hostname: '127.0.0.1',
  port: '55432',
  pathname: '/syn3c4_test',
  database: 'syn3c4_test',
  serverVersionMajor: 17,
} as const;

/**
 * Denied by name, independently of the allowlist, so that no edit, typo or
 * paste can make any of them reachable and so an operator sees WHICH forbidden
 * endpoint they nearly hit rather than a generic error.
 *
 * All four are evidence. Attempt #2 is the SUCCESS certification branch: note
 * that the SYN-3C3 rehearsal harness holds it as its AUTHORIZED target, while
 * here it is forbidden. Two programs, opposite polarity. Do not copy guards
 * between them.
 */
export const DENIED_ENDPOINTS: ReadonlyArray<readonly [string, string]> = [
  ['ep-cold-grass-aix5azhw', 'DENY_PRODUCTION'],
  ['ep-wispy-salad-ai3q3pj6', 'DENY_SYN3C1_REHEARSAL'],
  ['ep-broad-sea-aiyayyem', 'DENY_SYN3C3_ATTEMPT1'],
  ['ep-snowy-resonance-aihia1q2', 'DENY_SYN3C3_ATTEMPT2'],
];

/** Substrings that can only mean a managed/remote Postgres. */
const DENIED_SUBSTRINGS: ReadonlyArray<readonly [string, string]> = [
  ['neon', 'DENY_NEON'],
  ['amazonaws', 'DENY_AMAZONAWS'],
  ['pooler', 'DENY_POOLER'],
];

/**
 * Validate the candidate URL. Returns it unchanged on success; throws
 * GuardError with a named code otherwise. Never includes a password in the
 * message.
 */
export function assertAuthorizedTestUrl(
  raw: string | undefined,
  env: Record<string, string | undefined> = {},
): string {
  if (!raw || !raw.trim()) {
    throw new GuardError(
      'TEST_ENDPOINT_NOT_CONFIGURED',
      'SYN3C4_TEST_DATABASE_URL is not set. There is no default and no fallback.',
    );
  }
  const url = raw.trim();

  // A pre-existing DATABASE_URL is never authorization. If one is present and
  // is not byte-identical to the authorized test URL, refuse: it may be
  // production, and we will not guess.
  const existing = env.DATABASE_URL;
  if (existing && existing !== url) {
    throw new GuardError(
      'PREEXISTING_DATABASE_URL',
      'DATABASE_URL is already set in the environment and differs from ' +
        'SYN3C4_TEST_DATABASE_URL. Run `unset DATABASE_URL` and retry. ' +
        '(Value not printed.)',
    );
  }

  const lower = url.toLowerCase();
  // Named endpoints FIRST, so an operator sees WHICH forbidden endpoint they
  // nearly hit rather than a generic DENY_NEON. (Found by running the harness:
  // the Attempt #2 endpoint was reporting DENY_NEON, which defeats the point
  // of having named denials at all.)
  for (const [endpoint, code] of DENIED_ENDPOINTS) {
    if (lower.includes(endpoint)) {
      throw new GuardError(code, `URL names the forbidden endpoint ${endpoint}, which is preserved evidence.`);
    }
  }
  for (const [needle, code] of DENIED_SUBSTRINGS) {
    if (lower.includes(needle)) {
      throw new GuardError(code, `URL contains the forbidden substring "${needle}".`);
    }
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new GuardError('MALFORMED_URL', 'SYN3C4_TEST_DATABASE_URL is not a parseable URL.');
  }

  if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') {
    throw new GuardError('BAD_PROTOCOL', `protocol is "${parsed.protocol}", expected postgres: or postgresql:`);
  }
  if (parsed.hostname !== EXPECTED.hostname) {
    throw new GuardError('NON_LOCAL_HOST', `hostname is "${parsed.hostname}", expected exactly ${EXPECTED.hostname}`);
  }
  if (parsed.port !== EXPECTED.port) {
    throw new GuardError('UNEXPECTED_PORT', `port is "${parsed.port || '<none>'}", expected exactly ${EXPECTED.port}`);
  }
  if (parsed.pathname !== EXPECTED.pathname) {
    throw new GuardError('UNEXPECTED_DATABASE', `database path is "${parsed.pathname}", expected exactly ${EXPECTED.pathname}`);
  }

  // Loopback has no endpoint routing; the parameter's presence means a managed
  // connection string was pasted in.
  const opts = parsed.searchParams.get('options') ?? '';
  if (/endpoint\s*=/i.test(decodeURIComponent(opts))) {
    throw new GuardError('ENDPOINT_OVERRIDE_PRESENT', 'URL carries an options=endpoint= override.');
  }

  return url;
}

/** Redacted form, safe for logs. Never prints user or password. */
export function describeTarget(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//***@${u.hostname}:${u.port}${u.pathname}`;
  } catch {
    return '<unparseable>';
  }
}
