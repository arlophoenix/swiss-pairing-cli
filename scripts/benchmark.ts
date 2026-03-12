/**
 * Performance benchmark script.
 *
 * Measures the performance of the Swiss pairing algorithm and CLI across a
 * range of tournament sizes using tinybench for accurate, statistically sound
 * measurements.
 *
 * Regression detection:
 * - On first run, writes benchmark-baseline.json and exits successfully.
 * - On subsequent runs, compares results against the baseline. If any task's
 *   p50 (median) latency exceeds the baseline by more than REGRESSION_THRESHOLD,
 *   the script exits with code 1.
 * - Run `npm run benchmark:update` to deliberately accept new numbers.
 *
 * Results are always written to benchmark-results.json for inspection.
 *
 * @module benchmark
 */
import { Bench, type TaskResultWithStatistics } from 'tinybench';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

import { execSync } from 'child_process';
import { generateRounds } from '../src/swiss-pairing/swissPairing.js';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Multiplier above which a result is considered a regression. 1.5 = 50% slower. */
const REGRESSION_THRESHOLD = 1.5;

const BENCHMARK_DIR = 'benchmark';
const BASELINE_PATH = `${BENCHMARK_DIR}/baseline.json`;
const RESULTS_PATH = `${BENCHMARK_DIR}/results.json`;

const TEST_CASES = [
  { name: 'small', teamCount: 16, roundCount: 3 },
  { name: 'medium', teamCount: 64, roundCount: 7 },
  { name: 'large', teamCount: 256, roundCount: 9 },
  { name: 'extra-large', teamCount: 1024, roundCount: 12 },
] as const;

const SQUADS = ['Alpha', 'Beta', 'Gamma', 'Delta'] as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TaskBaseline {
  readonly latencyP50Ms: number;
}

interface BenchmarkBaseline {
  readonly metadata: {
    readonly updatedAt: string;
    readonly node: string;
  };
  readonly tasks: Partial<Record<string, TaskBaseline>>;
}

interface TaskResult {
  readonly latencyP50Ms: number;
  readonly latencyP99Ms: number;
  readonly samples: number;
}

interface BenchmarkResults {
  readonly metadata: {
    readonly createdAt: string;
    readonly node: string;
  };
  readonly tasks: Record<string, TaskResult>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateTeams(count: number): readonly string[] {
  // eslint-disable-next-line max-params
  return Array.from({ length: count }, (_, i) => {
    const squad = SQUADS[i % SQUADS.length];
    return `Team${String(i + 1)} [${squad}]`;
  });
}

function taskName({
  caseName,
  type,
}: {
  readonly caseName: string;
  readonly type: 'algorithm' | 'CLI';
}): string {
  return `${caseName} - ${type}`;
}

// ---------------------------------------------------------------------------
// Benchmark setup
// ---------------------------------------------------------------------------

async function runBenchmarks(): Promise<BenchmarkResults> {
  // Warm up V8 before measuring
  generateRounds({ teams: generateTeams(8), numRounds: 3, startRound: 1, playedTeams: new Map() });

  const bench = new Bench({ iterations: 10 });
  const taskResults: Record<string, TaskResult> = {};

  for (const { name, teamCount, roundCount } of TEST_CASES) {
    const teams = generateTeams(teamCount);

    bench.add(taskName({ caseName: name, type: 'algorithm' }), () => {
      generateRounds({ teams, numRounds: roundCount, startRound: 1, playedTeams: new Map() });
    });

    const teamArgs = teams.map((team) => `"${team}"`).join(' ');
    const command = `node dist/index.js --teams ${teamArgs} --num-rounds ${String(roundCount)}`;

    bench.add(taskName({ caseName: name, type: 'CLI' }), () => {
      execSync(command, { encoding: 'utf8' });
    });
  }

  await bench.run();

  for (const task of bench.tasks) {
    const result = task.result;

    if (result.state === 'errored') {
      throw new Error(`Benchmark task "${task.name}" failed: ${result.error.message}`);
    }

    if (result.state !== 'completed' && result.state !== 'aborted-with-statistics') {
      throw new Error(`Benchmark task "${task.name}" produced no results (state: ${result.state})`);
    }

    const { latency } = result as TaskResultWithStatistics;

    // eslint-disable-next-line functional/immutable-data
    taskResults[task.name] = {
      latencyP50Ms: latency.p50,
      latencyP99Ms: latency.p99,
      samples: latency.samplesCount,
    };
  }

  return {
    metadata: { createdAt: new Date().toISOString(), node: process.version },
    tasks: taskResults,
  };
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

function printResultsTable({
  results,
  baseline,
}: {
  readonly results: BenchmarkResults;
  readonly baseline: BenchmarkBaseline | null;
}): void {
  console.log('\nBenchmark Results\n');

  const rows = Object.entries(results.tasks).map(([name, task]) => {
    const baselineP50 = baseline?.tasks[name]?.latencyP50Ms ?? undefined;
    const vsBaseline =
      baselineP50 !== undefined
        ? `${((task.latencyP50Ms / baselineP50 - 1) * 100).toFixed(1)}%`
        : '(no baseline)';

    return {
      Task: name,
      'p50 (ms)': task.latencyP50Ms.toFixed(3),
      'p99 (ms)': task.latencyP99Ms.toFixed(3),
      Samples: task.samples,
      'vs Baseline': vsBaseline,
    };
  });

  console.table(rows);
}

// ---------------------------------------------------------------------------
// Regression check
// ---------------------------------------------------------------------------

function checkRegressions({
  results,
  baseline,
}: {
  readonly results: BenchmarkResults;
  readonly baseline: BenchmarkBaseline;
}): readonly string[] {
  // eslint-disable-next-line functional/prefer-readonly-type
  const regressions: string[] = [];

  for (const [name, task] of Object.entries(results.tasks)) {
    const baselineTask = baseline.tasks[name];

    if (baselineTask == null) {
      console.warn(`  Warning: no baseline entry for "${name}", skipping regression check`);
      continue;
    }

    const threshold = baselineTask.latencyP50Ms * REGRESSION_THRESHOLD;
    if (task.latencyP50Ms > threshold) {
      // eslint-disable-next-line functional/immutable-data
      regressions.push(
        `  "${name}": p50 ${task.latencyP50Ms.toFixed(3)}ms > ` +
          `${threshold.toFixed(3)}ms (baseline ${baselineTask.latencyP50Ms.toFixed(3)}ms × ${String(REGRESSION_THRESHOLD)})`
      );
    }
  }

  return regressions;
}

// ---------------------------------------------------------------------------
// Baseline management
// ---------------------------------------------------------------------------

function loadBaseline(): BenchmarkBaseline | null {
  if (!existsSync(BASELINE_PATH)) {
    return null;
  }
  return JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) as BenchmarkBaseline;
}

function ensureBenchmarkDir(): void {
  mkdirSync(BENCHMARK_DIR, { recursive: true });
}

function writeBaseline(results: BenchmarkResults): void {
  const baseline: BenchmarkBaseline = {
    metadata: { updatedAt: results.metadata.createdAt, node: results.metadata.node },
    tasks: Object.fromEntries(
      Object.entries(results.tasks).map(([name, task]) => [name, { latencyP50Ms: task.latencyP50Ms }])
    ),
  };
  ensureBenchmarkDir();
  writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2));
}

function writeResults(results: BenchmarkResults): void {
  ensureBenchmarkDir();
  writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2));
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('Running benchmarks...');
  const results = await runBenchmarks();

  writeResults(results);

  const baseline = loadBaseline();

  printResultsTable({ results, baseline });

  if (baseline === null) {
    console.log(`\nNo baseline found. Writing ${BASELINE_PATH} for this machine.\n`);
    writeBaseline(results);
    console.log('Re-run benchmarks to check for regressions against the new baseline.');
    return;
  }

  const regressions = checkRegressions({ results, baseline });

  if (regressions.length > 0) {
    console.error(`\n${String(regressions.length)} regression(s) detected:\n`);

    for (const r of regressions) {
      console.error(r);
    }
    console.error(`\nIf this is expected, run 'npm run benchmark:update' to accept the new numbers.\n`);
    process.exit(1);
  }

  console.log(`\nAll tasks within ${String((REGRESSION_THRESHOLD - 1) * 100)}% of baseline. ✓\n`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
