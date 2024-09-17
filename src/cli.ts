import { Command } from 'commander';
import { createBidirectionalMap } from './utils.js';
import { generatePairings } from './swissPairing.js';

interface CLIResult {
  type: 'success' | 'failure';
  message: string;
}

function exitWithError(message: string): never {
  console.error(message);
  process.exit(1);
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
          exitWithError('Invalid input: num-rounds must be a positive whole number');
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
          exitWithError('Invalid input: start-round must be a positive whole number');
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
          exitWithError(result.message);
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
  let playedMatches;
  try {
    playedMatches = createBidirectionalMap(
      matches.map((m) => {
        const parts = m.split(',');
        if (parts.length !== 2) {
          throw new Error(`match "${m}" is formatted incorrectly. Expect "player1,player2"`);
        }
        return parts as [string, string];
      })
    );
  } catch (error) {
    return {
      type: 'failure',
      message: `Invalid input: ${(error as Error).message}`,
    };
  }

  const pairingResult = generatePairings({ players, numRounds, startRound, playedMatches });
  if (!pairingResult.success) {
    switch (pairingResult.errorType) {
      case 'InvalidInput':
        break;
      case 'InvalidOutput':
        break;
      case 'NoValidSolution':
        break;
    }
    return {
      type: 'failure',
      message: pairingResult.errorMessage,
    };
  }
  return {
    type: 'success',
    message: 'Pairings generated successfully: ' + JSON.stringify(pairingResult.roundPairings),
  };
}
