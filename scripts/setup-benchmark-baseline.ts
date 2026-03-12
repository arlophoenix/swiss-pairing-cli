/**
 * Generates initial benchmark baseline if none exists.
 * Skipped in CI and when baseline already present.
 * Called from prepare — build is already done, so tsx scripts/benchmark.ts
 * is invoked directly rather than via npm run benchmark (avoids redundant build).
 * @module setup-benchmark-baseline
 */
import { execSync } from 'child_process';
import { existsSync } from 'fs';

if (!process.env.CI && !existsSync('benchmark/baseline.json')) {
  // eslint-disable-next-line functional/immutable-data
  process.env.SWISS_PAIRING_TELEMETRY_OPT_OUT = '1';
  console.log('No benchmark baseline — generating for this machine...');
  execSync('tsx scripts/benchmark.ts', { stdio: 'inherit' });
}
