/**
 * SYN-3C4 Slice 1B — CommonJS resolve hook for the project's "@/" alias.
 *
 * tsc resolves "@/..." for TYPE-CHECKING but emits require("@/lib/prisma")
 * verbatim, and Node cannot resolve that. lib/security/tenant.ts itself
 * imports "@/lib/auth" and "@/lib/prisma", so the hook is needed for the
 * compiled dependency graph, not just for the harness's own imports.
 *
 * It maps "@/x" to <compiled output root>/x. It changes NOTHING about module
 * contents or resolver behaviour -- it only teaches Node the alias the
 * bundler would normally apply. Everything else (next/server, next-auth,
 * @prisma/client) resolves normally by walking up to the repo's node_modules.
 */
const path = require('path');
const Module = require('module');

// Output root: tsconfig.cert.json sets rootDir=<repo> and outDir=<here>/build,
// so the compiled tree mirrors the repo under build/.
const OUT_ROOT = path.resolve(__dirname, 'build');

const original = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (typeof request === 'string' && request.startsWith('@/')) {
    request = path.join(OUT_ROOT, request.slice(2));
  }
  return original.call(this, request, parent, isMain, options);
};
