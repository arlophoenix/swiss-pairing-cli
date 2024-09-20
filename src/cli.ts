import { CLIOptions } from './types.js';
import { Command } from 'commander';
import { handleCLIAction } from './cliAction.js';

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
      `List of pairs of player names that have already played against each other \ne.g. ${exampleMatches}`,
      // eslint-disable-next-line functional/prefer-readonly-type, max-params
      (value: string, previous: string[][] = []) => {
        const matchPlayers = value.split(',');

        if (matchPlayers.length !== 2) {
          exitWithError(
            `Invalid input: match "${value}" is formatted incorrectly; expected "player1,player2".`
          );
        }
        previous.push(matchPlayers);

        return previous;
      }
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
    .action((options: CLIOptions) => {
      const result = handleCLIAction(options);

      if (!result.success) {
        exitWithError(result.errorMessage);
      }
      console.log(result.value);
    });

  return program;
}

function exitWithError(message: string): never {
  console.error(message);
  process.exit(1);
}
