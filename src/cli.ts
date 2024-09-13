import { generatePairings, validateInput } from './swissPairing';

import { Command } from 'commander';
import { SwissPairingInput } from './types';

export function generateSwissPairings(input: SwissPairingInput): string[][] {
  if (!validateInput(input)) {
    throw new Error('Invalid input. Please check your player list and number of rounds.');
  }
  return generatePairings(input);
}

export function buildPlayedMatches(matches: [string, string][] = []): Record<string, string[]> {
  const playedMatches: Record<string, string[]> = {};
  matches.forEach(([player, opponent]) => {
    if (!playedMatches[player]) playedMatches[player] = [];
    if (!playedMatches[opponent]) playedMatches[opponent] = [];
    playedMatches[player].push(opponent);
    playedMatches[opponent].push(player);
  });
  return playedMatches;
}

export function createCLI(): Command {
  const program = new Command();
  program
    .name('swiss-pairing')
    .description('A CLI tool for generating Swiss-style tournament pairings')
    .option(
      '-p, --players <names...>',
      'player names in order from top standing to bottom e.g. player1 player2 player3 player4'
    )
    .option(
      '-r, --rounds <number>',
      'number of rounds to generate',
      (value) => {
        const parsed = parseInt(value, 10);
        if (isNaN(parsed)) {
          throw new Error('Rounds must be a valid number');
        }
        return parsed;
      },
      1 // default to 1 round
    )
    .option('-m, --matches <matches...>', 'matches already played e.g. "player1,player3" "player2,player4"')
    .action(handleCLIAction);

  return program;
}

export function handleCLIAction({
  players = [],
  rounds = 1,
  matches = [],
}: {
  players?: string[];
  rounds?: number;
  matches?: string[];
}) {
  try {
    const playedMatches = buildPlayedMatches(matches.map((m) => m.split(',') as [string, string]));
    const input: SwissPairingInput = {
      players: players,
      rounds: rounds,
      playedMatches,
    };
    const pairings = generateSwissPairings(input);
    console.log('Generated pairings:', pairings);
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'An unknown error occurred');
    process.exit(1);
  }
}
