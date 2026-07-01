#!/usr/bin/env node
/**
 * Baselines existing Prisma migrations against the production DB.
 * Run before `prisma migrate deploy` when the DB was set up outside of migrations.
 * Idempotent — safe to run on every build.
 */
const { execSync } = require('child_process');

const migrations = [
  '20260128211729_add_scalability_models',
  '20260619000000_add_transfer_prep',
  '20260619010000_add_saved_listings',
];

let anyFailed = false;

for (const migration of migrations) {
  try {
    const output = execSync(`npx prisma migrate resolve --applied "${migration}"`, {
      stdio: 'pipe',
      encoding: 'utf-8',
    });
    console.log(`✓ Baselined: ${migration}`);
    if (output.trim()) console.log(output.trim());
  } catch (e) {
    const stderr = (e.stderr || '').toString();
    const stdout = (e.stdout || '').toString();
    const combined = stderr + stdout;

    // P3011 = migration already recorded — totally fine
    if (combined.includes('P3011') || combined.toLowerCase().includes('already')) {
      console.log(`→ Already applied: ${migration}`);
    } else {
      console.error(`✗ Failed to baseline ${migration}:`);
      console.error(combined || e.message);
      anyFailed = true;
    }
  }
}

if (anyFailed) {
  console.error('Baseline had failures — aborting build.');
  process.exit(1);
}

console.log('Baseline complete.');
