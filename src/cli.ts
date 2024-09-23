import {
  ARG_FILE,
  ARG_MATCHES,
  ARG_NUM_ROUNDS,
  ARG_ORDER,
  ARG_PLAYERS,
  ARG_START_ROUND,
  CLI_OPTION_ORDER,
  CLI_OPTION_ORDER_DEFAULT,
} from './constants.js';
import { CLIOptionOrder, CLIOptions } from './types.js';
import { buildErrorMessage, parseStringLiteral } from './utils.js';
import { isSupportedFileType, parseFile } from './fileParser.js';

import { Command } from 'commander';
import { handleCLIAction } from './cliAction.js';

/**
 * Creates and configures the CLI command for Swiss pairing generation
 * @returns {Command} Configured Command object
 */
export function createCLI(): Command {
  const program = new Command();
  const programName = 'swiss-pairing';
  const examplePlayers = 'player1 player2 player3 player4';
  const exampleMatches = '"player1,player2" "player3,player4"';

  program
    .name(programName)
    .description('A CLI tool for generating Swiss-style tournament pairings')
    .option(
      `-p, --${ARG_PLAYERS} <names...>`,
      `List of player names in order from top standing to bottom \ne.g. ${examplePlayers}`
    )
    .option(
      `-m, --${ARG_MATCHES} <matches...>`,
      `List of pairs of player names that have already played against each other \ne.g. ${exampleMatches}`,
      // eslint-disable-next-line functional/prefer-readonly-type, max-params
      (value: string, previous: string[][] = []) => {
        const matchPlayers = value.split(',');

        if (matchPlayers.length !== 2) {
          exitWithInputError(
            `${ARG_MATCHES} "${value}" is formatted incorrectly; expected "player1,player2".`
          );
        }
        // eslint-disable-next-line functional/immutable-data
        previous.push(matchPlayers);

        return previous;
      }
    )
    .option(
      `-n, --${ARG_NUM_ROUNDS} <number>`,
      'Number of rounds to generate',
      (value: string) => {
        const parsed = parseInt(value, 10);

        if (isNaN(parsed)) {
          exitWithInputError(`${ARG_NUM_ROUNDS} must be a positive whole number.`);
        }

        return parsed;
      },
      1 // default to 1 round
    )
    .option(
      `-s, --${ARG_START_ROUND} <number>`,
      'Name the generated rounds starting with this number',
      (value: string) => {
        const parsed = parseInt(value, 10);

        if (isNaN(parsed)) {
          exitWithInputError(`${ARG_START_ROUND} must be a positive whole number.`);
        }

        return parsed;
      },
      1 // default to calling the first Round 1
    )
    .option(
      `-o --${ARG_ORDER} <${CLI_OPTION_ORDER.join(' | ')}>`,
      'The sequence in which players should be paired.',
      (value?: string) => {
        const lowercaseValue = (value ?? '').toLowerCase();
        const result = parseStringLiteral<CLIOptionOrder>({
          input: lowercaseValue,
          options: CLI_OPTION_ORDER,
        });
        if (result.success) {
          return result.value;
        }
        exitWithInputError(`${ARG_ORDER} must be one of: ${CLI_OPTION_ORDER.join(', ')}.`);
      },
      CLI_OPTION_ORDER_DEFAULT
    )
    .option(
      `-f, --${ARG_FILE} <path>`,
      'Path to input file (CSV or JSON). Options provided via cli take precedence over file contents.',
      (value: string) => {
        const result = isSupportedFileType(value);
        if (!result.success) {
          exitWithInputError(result.errorMessage);
        }
        return value;
      }
    )
    .helpOption('-h, --help', 'Display this help information')
    .addHelpText('afterAll', `Examples:\n  ${programName} -p ${examplePlayers} -m ${exampleMatches}`)
    .action(async (options: CLIOptions) => {
      if (!options.players && !options.file) {
        exitWithInputError(`either --${ARG_PLAYERS} or --${ARG_FILE} is required.`);
      }
      const file = options.file;
      if (file) {
        try {
          const fileData = await parseFile(file);
          options = { ...fileData, ...options };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          exitWithInputError(`error parsing file - ${errorMessage}`);
        }
      }
      const result = handleCLIAction(options);

      if (!result.success) {
        exitWithError(result.errorMessage);
      }
      console.log(result.value);
    });

  return program;
}

function exitWithInputError(message: string): never {
  exitWithError(
    buildErrorMessage({
      type: 'InvalidInput',
      message,
    })
  );
}

function exitWithError(message: string): never {
  console.error(message);
  process.exit(1);
}
