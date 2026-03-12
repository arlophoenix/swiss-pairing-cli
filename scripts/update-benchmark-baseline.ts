/**
 * Promotes benchmark-results.json to benchmark-baseline.json.
 *
 * Run this deliberately after confirming that a performance change is
 * expected and acceptable. Commit the updated baseline so future runs
 * compare against the new numbers.
 *
 * @module update-benchmark-baseline
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';

const BASELINE_PATH = 'benchmark/baseline.json';
const RESULTS_PATH = 'benchmark/results.json';

function main(): void {
  if (!existsSync(RESULTS_PATH)) {
    console.error(`No ${RESULTS_PATH} found. Run 'npm run benchmark' first.`);
    process.exit(1);
  }

  const results = JSON.parse(readFileSync(RESULTS_PATH, 'utf8')) as {
    readonly metadata: { readonly createdAt: string; readonly node: string };
    readonly tasks: Record<string, { readonly latencyP50Ms: number }>;
  };

  const baseline = {
    metadata: { updatedAt: results.metadata.createdAt, node: results.metadata.node },
    tasks: Object.fromEntries(
      Object.entries(results.tasks).map(([name, task]) => [name, { latencyP50Ms: task.latencyP50Ms }])
    ),
  };

  writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2));
  console.log(`Updated ${BASELINE_PATH} from ${RESULTS_PATH}.`);
}

main();
