import { generateRounds } from '../src/swiss-pairing/swissPairing.js';
import { performance } from 'perf_hooks';

function generateRandomTeams(count: number): readonly string[] {
  // eslint-disable-next-line max-params
  return Array.from({ length: count }, (_, i) => `Team${String(i + 1)}`);
}

function logMemoryUsage() {
  const used = process.memoryUsage();
  console.log(`Memory usage: ${String(Math.round((used.heapUsed / 1024 / 1024) * 100) / 100)} MB`);
}

function runPerformanceTest({
  teamCount,
  roundCount,
  iterations,
}: {
  readonly teamCount: number;
  readonly roundCount: number;
  readonly iterations: number;
}) {
  const teams = generateRandomTeams(teamCount);
  // eslint-disable-next-line functional/prefer-readonly-type
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();

    generateRounds({
      teams,
      numRounds: roundCount,
      startRound: 1,
      playedTeams: new Map(),
    });

    const endTime = performance.now();
    // eslint-disable-next-line functional/immutable-data
    times.push(endTime - startTime);
  }

  // eslint-disable-next-line max-params
  const avgTime = times.reduce((sum, time) => sum + time, 0) / iterations;
  console.log(
    `Teams: ${String(teamCount)}, Rounds: ${String(roundCount)}, Avg Time: ${avgTime.toFixed(2)}ms`
  );
}

// Test cases
const testCases = [
  { teamCount: 8, roundCount: 3 },
  { teamCount: 16, roundCount: 3 },
  { teamCount: 16, roundCount: 5 },
  { teamCount: 32, roundCount: 5 },
  { teamCount: 64, roundCount: 5 },
  { teamCount: 100, roundCount: 9 },
  { teamCount: 1000, roundCount: 9 },
];

testCases.forEach(({ teamCount, roundCount }) => {
  console.log(`Start test with ${String(teamCount)} teams and ${String(roundCount)} rounds:`);
  logMemoryUsage();
  runPerformanceTest({ teamCount, roundCount, iterations: 10 });
  console.log(`End test with ${String(teamCount)} teams and ${String(roundCount)} rounds:`);
  logMemoryUsage();
});
