import { generateRoundMatches } from '../src/swiss-pairing/swissPairing.js';
import { performance } from 'perf_hooks';

function generateRandomPlayers(count: number): readonly string[] {
  // eslint-disable-next-line max-params
  return Array.from({ length: count }, (_, i) => `Player${String(i + 1)}`);
}

function logMemoryUsage() {
  const used = process.memoryUsage();
  console.log(`Memory usage: ${String(Math.round((used.heapUsed / 1024 / 1024) * 100) / 100)} MB`);
}

function runPerformanceTest({
  playerCount,
  roundCount,
  iterations,
}: {
  readonly playerCount: number;
  readonly roundCount: number;
  readonly iterations: number;
}) {
  const players = generateRandomPlayers(playerCount);
  // eslint-disable-next-line functional/prefer-readonly-type
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();

    generateRoundMatches({
      players,
      numRounds: roundCount,
      startRound: 1,
      playedOpponents: new Map(),
    });

    const endTime = performance.now();
    // eslint-disable-next-line functional/immutable-data
    times.push(endTime - startTime);
  }

  // eslint-disable-next-line max-params
  const avgTime = times.reduce((sum, time) => sum + time, 0) / iterations;
  console.log(
    `Players: ${String(playerCount)}, Rounds: ${String(roundCount)}, Avg Time: ${avgTime.toFixed(2)}ms`
  );
}

// Test cases
const testCases = [
  { playerCount: 8, roundCount: 3 },
  { playerCount: 16, roundCount: 3 },
  { playerCount: 16, roundCount: 5 },
  { playerCount: 32, roundCount: 5 },
  { playerCount: 64, roundCount: 5 },
  { playerCount: 100, roundCount: 9 },
  { playerCount: 1000, roundCount: 9 },
];

testCases.forEach(({ playerCount, roundCount }) => {
  console.log(`Start test with ${String(playerCount)} players and ${String(roundCount)} rounds:`);
  logMemoryUsage();
  runPerformanceTest({ playerCount, roundCount, iterations: 10 });
  logMemoryUsage();
  console.log(`End test with ${String(playerCount)} players and ${String(roundCount)} rounds:`);
});
