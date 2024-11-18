import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';

import { DEBUG_PERFORMANCE } from '../src/constants.js';
import debug from 'debug';
import { detectEnvironment } from '../src/utils/utils.js';
import { execSync } from 'child_process';
import { generateRounds } from '../src/swiss-pairing/swissPairing.js';
import { performance } from 'perf_hooks';

const log = debug(DEBUG_PERFORMANCE);

/**
 * Test cases covering range of tournament sizes
 *
 * The thresholds are vague upper bounds determined by:
 * 1. running npm test locally (slower than running the performance tests individually)
 * 2. adding at least 4 stdevs to the mean
 * 3. rounding up to the nearest power of 10
 *
 * Algorithm performance: { size: '16 teams, 3 rounds', mean: '0ms', stdDev: '0ms', memory: '-2.74MB' }
 * Algorithm performance: { size: '64 teams, 7 rounds', mean: '1ms', stdDev: '1ms', memory: '1.19MB' }
 * Algorithm performance: { size: '256 teams, 9 rounds', mean: '4ms', stdDev: '0ms', memory: '3.43MB' }
 * Algorithm performance: { size: '1024 teams, 12 rounds', mean: '64ms', stdDev: '9ms', memory: '38.18MB' }
 * CLI performance: { size: '16 teams, 3 rounds', mean: '60ms', stdDev: '4ms' }
 * CLI performance: { size: '64 teams, 7 rounds', mean: '59ms', stdDev: '2ms' }
 * CLI performance: { size: '256 teams, 9 rounds', mean: '72ms', stdDev: '1ms' }
 * CLI performance: { size: '1024 teams, 12 rounds', mean: '224ms', stdDev: '24ms' }
 */
const TEST_CASES = [
  { name: 'small', teamCount: 16, roundCount: 3, pairing_threshold: 10, cli_threshold: 100 },
  { name: 'medium', teamCount: 64, roundCount: 7, pairing_threshold: 10, cli_threshold: 100 },
  { name: 'large', teamCount: 256, roundCount: 9, pairing_threshold: 10, cli_threshold: 100 },
  { name: 'extra-large', teamCount: 1024, roundCount: 12, pairing_threshold: 100, cli_threshold: 400 },
] as const;

const SQUADS = ['Alpha', 'Beta', 'Gamma', 'Delta'] as const;
const ITERATIONS = 10;

function generateTeams(count: number): readonly string[] {
  // eslint-disable-next-line max-params
  return Array.from({ length: count }, (_, i) => {
    const squadIndex = i % SQUADS.length;
    const squad = SQUADS[squadIndex];
    return `Team${String(i + 1)} [${squad}]`;
  });
}

function measurePerformance({
  operation,
  iterations = ITERATIONS,
}: {
  readonly operation: () => void;
  readonly iterations?: number;
}): {
  readonly mean: number;
  readonly stdDev: number;
  readonly memoryMB?: number;
} {
  // eslint-disable-next-line functional/prefer-readonly-type
  const durations: number[] = [];
  let memoryBefore: number | undefined;
  let memoryAfter: number | undefined;

  const isMemoryMeasurementEnabled = detectEnvironment() === 'test' && global.gc !== undefined;

  // Force GC if available to get clean memory measurements
  if (isMemoryMeasurementEnabled && global.gc) {
    global.gc();
    memoryBefore = process.memoryUsage().heapUsed;
  }

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    operation();
    // eslint-disable-next-line functional/immutable-data
    durations.push(performance.now() - startTime);
  }

  if (memoryBefore !== undefined) {
    memoryAfter = process.memoryUsage().heapUsed;
  }

  // Calculate timing statistics
  // eslint-disable-next-line max-params
  const mean = durations.reduce((sum, d) => sum + d, 0) / iterations;
  // eslint-disable-next-line max-params
  const variance = durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / iterations;
  const stdDev = Math.sqrt(variance);

  // Calculate memory impact if measured
  const memoryMB =
    memoryBefore !== undefined && memoryAfter !== undefined
      ? Math.round(((memoryAfter - memoryBefore) / 1024 / 1024) * 100) / 100
      : undefined;

  return { mean, stdDev, memoryMB };
}

describe('Performance Tests', () => {
  let initialMemoryUsage: number;

  beforeAll(() => {
    // Warm up V8
    const teams = generateTeams(8);
    generateRounds({
      teams,
      numRounds: 3,
      startRound: 1,
      playedTeams: new Map(),
    });
    initialMemoryUsage = process.memoryUsage().heapUsed;
  });

  afterAll(() => {
    // Force garbage collection if running with --expose-gc
    if (global.gc) {
      global.gc();
    }
  });

  describe.each(TEST_CASES)(
    '$name tournament',
    ({ teamCount, roundCount, pairing_threshold, cli_threshold }) => {
      describe('Swiss Pairing Algorithm', () => {
        it(`should generate ${String(roundCount)} rounds for ${String(teamCount)} teams within ${String(pairing_threshold)}ms`, () => {
          const teams = generateTeams(teamCount);

          const { mean, stdDev } = measurePerformance({
            operation: () => {
              const result = generateRounds({
                teams,
                numRounds: roundCount,
                startRound: 1,
                playedTeams: new Map(),
              });

              // Verify successful generation
              expect(result.success).toBe(true);
              if (result.success) {
                expect(result.value.rounds).toHaveLength(roundCount);
              }
            },
          });

          // Verify performance
          expect(mean).toBeLessThan(pairing_threshold);

          // Calculate memory impact
          const memoryUsed = process.memoryUsage().heapUsed - initialMemoryUsage;
          const memoryMB = Math.round((memoryUsed / 1024 / 1024) * 100) / 100;

          // Log all performance metrics in a single message
          log('Algorithm performance: %o', {
            size: `${String(teamCount)} teams, ${String(roundCount)} rounds`,
            mean: `${String(Math.round(mean))}ms`,
            stdDev: `${String(Math.round(stdDev))}ms`,
            memory: `${String(memoryMB)}MB`,
          });
        });
      });

      describe('CLI Performance', () => {
        it(`should output ${String(roundCount)} rounds for ${String(teamCount)} teams within ${String(cli_threshold)}ms`, () => {
          const teams = generateTeams(teamCount);
          const teamArgs = teams.map((team) => `"${team}"`).join(' ');
          const command = `node dist/index.js --teams ${teamArgs} --num-rounds ${String(roundCount)}`;

          const { mean, stdDev } = measurePerformance({
            operation: () => {
              const output = execSync(command, { encoding: 'utf8' });
              // Verify output contains expected number of rounds
              const roundMatches = output.match(/\*\*Round \d+\*\*/g);
              expect(roundMatches).toHaveLength(roundCount);
            },
          });

          // Verify performance
          expect(mean).toBeLessThan(cli_threshold);

          // Log CLI performance metrics
          log('CLI performance: %o', {
            size: `${String(teamCount)} teams, ${String(roundCount)} rounds`,
            mean: `${String(Math.round(mean))}ms`,
            stdDev: `${String(Math.round(stdDev))}ms`,
          });
        });
      });
    }
  );
});
