/* eslint-disable no-console */
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';

import { execSync } from 'child_process';
import { generateRounds } from '../src/swiss-pairing/swissPairing.js';
import { performance } from 'perf_hooks';

/**
 * Test cases covering range of tournament sizes
 */
const TEST_CASES = [
  { name: 'small', teamCount: 16, roundCount: 3, threshold: 100 },
  { name: 'medium', teamCount: 64, roundCount: 7, threshold: 200 },
  { name: 'large', teamCount: 256, roundCount: 9, threshold: 400 },
  { name: 'extra-large', teamCount: 1024, roundCount: 12, threshold: 1000 },
] as const;

function generateTeams(count: number): readonly string[] {
  // eslint-disable-next-line max-params
  return Array.from({ length: count }, (_, i) => `Team${String(i + 1)}`);
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

  describe.each(TEST_CASES)('$name tournament', ({ teamCount, roundCount, threshold }) => {
    describe('Swiss Pairing Algorithm', () => {
      it(`should generate ${String(roundCount)} rounds for ${String(teamCount)} teams within ${String(threshold)}ms`, () => {
        const teams = generateTeams(teamCount);

        const startTime = performance.now();
        const result = generateRounds({
          teams,
          numRounds: roundCount,
          startRound: 1,
          playedTeams: new Map(),
        });
        const duration = performance.now() - startTime;

        // Verify successful generation
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.rounds).toHaveLength(roundCount);
        }

        // Verify performance
        expect(duration).toBeLessThan(threshold);

        // Check memory impact
        const memoryUsed = process.memoryUsage().heapUsed - initialMemoryUsage;
        const memoryMB = Math.round((memoryUsed / 1024 / 1024) * 100) / 100;

        // Log performance metrics
        console.log(`Tournament size: ${String(teamCount)} teams, ${String(roundCount)} rounds`);
        console.log(`Execution time: ${String(Math.round(duration))}ms`);
        console.log(`Memory used: ${String(memoryMB)}MB`);
      });

      it('should maintain consistent performance across multiple runs', () => {
        const teams = generateTeams(teamCount);
        const iterations = 5;
        // eslint-disable-next-line functional/prefer-readonly-type
        const durations: number[] = [];

        for (let i = 0; i < iterations; i++) {
          const startTime = performance.now();
          generateRounds({
            teams,
            numRounds: roundCount,
            startRound: 1,
            playedTeams: new Map(),
          });
          // eslint-disable-next-line functional/immutable-data
          durations.push(performance.now() - startTime);
        }

        // Calculate statistics
        // eslint-disable-next-line max-params
        const mean = durations.reduce((sum, d) => sum + d, 0) / iterations;
        // eslint-disable-next-line max-params
        const variance = durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / iterations;
        const stdDev = Math.sqrt(variance);

        // Verify consistency - standard deviation should be less than 25% of mean
        expect(stdDev / mean).toBeLessThan(0.25);

        console.log(`Mean execution time: ${String(Math.round(mean))}ms`);
        console.log(`Standard deviation: ${String(Math.round(stdDev))}ms`);
      });
    });

    describe('CLI Performance', () => {
      it(`should output ${String(roundCount)} rounds for ${String(teamCount)} teams within ${String(threshold)}ms`, () => {
        const teams = generateTeams(teamCount);
        const teamArgs = teams.map((team) => `"${team}"`).join(' ');
        const command = `node dist/index.js --teams ${teamArgs} --num-rounds ${String(roundCount)}`;

        const startTime = performance.now();
        const output = execSync(command, { encoding: 'utf8' });
        const duration = performance.now() - startTime;

        // Verify output contains expected number of rounds
        const roundMatches = output.match(/\*\*Round \d+\*\*/g);
        expect(roundMatches).toHaveLength(roundCount);

        // Verify performance
        expect(duration).toBeLessThan(threshold);

        console.log(`CLI execution time: ${String(Math.round(duration))}ms`);
      });
    });
  });
});
