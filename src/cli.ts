import { generatePairings, validateInput } from './swissPairing';

import { Command } from 'commander';
import { SwissPairingInput } from './types';

interface CLIResult {
  type: 'success' | 'failure';
  message: string;
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
    .action((options) => {
      const result = handleCLIAction(options);
      switch (result.type) {
        case 'success':
          console.log(result.message);
          break;
        case 'failure':
          console.error(result.message);
          process.exit(1);
      }
    });

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
}): CLIResult {
  const playedMatches = buildPlayedMatches(matches.map((m) => m.split(',') as [string, string]));
  const input: SwissPairingInput = {
    players: players,
    rounds: rounds,
    playedMatches,
  };
  if (!validateInput(input)) {
    return {
      type: 'failure',
      message: 'Invalid input. Please check your player list and number of rounds.',
    };
  }

  const pairings = generatePairings(input);
  return {
    type: 'success',
    message: 'Pairings generated successfully: ' + JSON.stringify(pairings),
  };
}
