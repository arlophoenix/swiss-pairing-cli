import { Command } from 'commander';
import { generatePairings } from './swissPairing.js';

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
  const programName = 'swiss-pairing';
  const examplePlayers = 'player1 player2 player3 player4';
  const exampleMatches = '"player1,player2" "player3,player4"';
  program
    .name(programName)
    .description('A CLI tool for generating Swiss-style tournament pairings')
    .requiredOption(
      '-p, --players <names...>',
      `List of player names in order from top standing to bottom [required] \ne.g. ${examplePlayers}`
    )
    .option(
      '-m, --matches <matches...>',
      `List of pairs of player names that have already played against each other \ne.g. ${exampleMatches}`
    )
    .option(
      '-n, --num-rounds <number>',
      'Number of rounds to generate',
      (value) => {
        const parsed = parseInt(value, 10);
        if (isNaN(parsed)) {
          throw new Error('num-rounds must be a valid number');
        }
        return parsed;
      },
      1 // default to 1 round
    )
    .option(
      '-s, --start-round <number>',
      'Used to name the generated rounds',
      (value) => {
        const parsed = parseInt(value, 10);
        if (isNaN(parsed)) {
          throw new Error('start-round must be a valid number');
        }
        return parsed;
      },
      1 // default to calling the first Round 1
    )
    .helpOption('-h, --help', 'Display this help information')
    .addHelpText('afterAll', `Examples:\n  ${programName} -p ${examplePlayers} -m ${exampleMatches}`)
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
  numRounds = 1,
  startRound = 1,
  matches = [],
}: {
  players?: string[];
  numRounds?: number;
  startRound?: number;
  matches?: string[];
}): CLIResult {
  const playedMatches = buildPlayedMatches(matches.map((m) => m.split(',') as [string, string]));

  const pairings = generatePairings({ players, numRounds, startRound, playedMatches });
  if (pairings instanceof Error) {
    return {
      type: 'failure',
      message: pairings.message,
    };
  }
  return {
    type: 'success',
    message: 'Pairings generated successfully: ' + JSON.stringify(pairings),
  };
}
