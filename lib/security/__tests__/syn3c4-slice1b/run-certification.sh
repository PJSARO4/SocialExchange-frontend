#!/usr/bin/env bash
# SYN-3C4 Slice 1B behavioral certification runner.
#
# Contains NO database URL of any kind. The target comes solely from the
# exported SYN3C4_TEST_DATABASE_URL, is validated by guard.ts before Prisma is
# loaded, and is passed to Prisma in-process via process.env -- never written
# to .env, never placed on a command line, never echoed.
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/../../../.." && pwd)"
cd "$REPO" || exit 1

echo "repo : $REPO"
echo "HEAD : $(git rev-parse HEAD 2>/dev/null)"
echo

if [ -z "${SYN3C4_TEST_DATABASE_URL:-}" ]; then
  echo "ABORT [TEST_ENDPOINT_NOT_CONFIGURED] export SYN3C4_TEST_DATABASE_URL first."
  echo "      Nothing was compiled, loaded or contacted."
  exit 1
fi
if [ -n "${DATABASE_URL:-}" ]; then
  echo "ABORT [PREEXISTING_DATABASE_URL] DATABASE_URL is set in this shell."
  echo "      Run: unset DATABASE_URL   then retry. (Value not printed.)"
  exit 1
fi

TSC="$REPO/node_modules/.bin/tsc"
[ -x "$TSC" ] || { echo "ABORT [TSC_MISSING] run npm ci first."; exit 1; }

echo "--- TYPE-CHECK + COMPILE (against the REAL generated Prisma client) ---"
"$TSC" -p "$HERE/tsconfig.cert.json" || {
  echo
  echo "ABORT [COMPILE_FAILED] the harness does not type-check against the real"
  echo "      generated Prisma client. This is a REAL failure, not a setup issue:"
  echo "      it means a model accessor, relation filter, required fixture field or"
  echo "      return type in the harness or in lib/security/tenant.ts is wrong."
  echo "      No database was contacted."
  exit 1
}
echo "  [PASS] tsc clean"
echo

ENTRY="$HERE/build/lib/security/__tests__/syn3c4-slice1b/certify.js"
[ -f "$ENTRY" ] || { echo "ABORT [ENTRY_MISSING] expected $ENTRY"; exit 1; }

echo "--- EXECUTE ---"
node -r "$HERE/alias-register.cjs" "$ENTRY"
rc=$?
echo
echo "runner exit: $rc"
exit $rc
