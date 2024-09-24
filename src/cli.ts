import {
  ARG_FILE,
  ARG_MATCHES,
  ARG_NUM_ROUNDS,
  ARG_ORDER,
  ARG_PLAYERS,
  ARG_START_ROUND,
  CLI_OPTION_ORDER,
  CLI_OPTION_ORDER_BOOTOM_UP,
  CLI_OPTION_ORDER_DEFAULT,
  CLI_OPTION_ORDER_RANDOM,
  EXAMPLE_FILE_CSV,
  EXAMPLE_FILE_JSON,
  EXAMPLE_MATCHES,
  EXAMPLE_PLAYERS,
  PROGRAM_NAME,
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

  program
    .name(PROGRAM_NAME)
    .description('A CLI tool for generating Swiss-style tournament pairings')
    .option(
      `-p, --${ARG_PLAYERS} <names...>`,
      `List of player names in order from top standing to bottom\ne.g. ${EXAMPLE_PLAYERS}`
    )
    .option(
      `-m, --${ARG_MATCHES} <matches...>`,
      `List of pairs of player names that have already played against each other\ne.g. ${EXAMPLE_MATCHES}`,
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
      'The sequence in which players should be paired',
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
      'Path to input file (CSV or JSON). File contents take precedence over options provided via cli',
      (value: string) => {
        const result = isSupportedFileType(value);
        if (!result.success) {
          exitWithInputError(result.errorMessage);
        }
        return value;
      }
    )
    .helpOption('-h, --help', 'Display this help information')
    .addHelpText('afterAll', `\n${exampleUsage()}`)
    .action(async (options: CLIOptions) => {
      if (!options.players && !options.file) {
        exitWithInputError(`either --${ARG_PLAYERS} or --${ARG_FILE} is required.`);
      }
      const file = options.file;
      if (file) {
        try {
          const fileData = await parseFile(file);
          options = { ...options, ...fileData };
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

export function helpWithExamples(): string {
  return `${createCLI().helpInformation()}\n${exampleUsage()}`;
}

export function exampleUsage(): string {
  return `Examples:\n
1. Generate random pairings for 4 players:\n
  ${PROGRAM_NAME} --${ARG_PLAYERS} ${EXAMPLE_PLAYERS} --${ARG_ORDER} ${CLI_OPTION_ORDER_RANDOM}\n
2. Generate pairings for 4 players, on round 2, with some matches already played:\n
  ${PROGRAM_NAME} --${ARG_PLAYERS} ${EXAMPLE_PLAYERS} --${ARG_START_ROUND} 2 --${ARG_MATCHES} ${EXAMPLE_MATCHES}\n
3. Generate pairings using a CSV file:\n
  ${PROGRAM_NAME} --${ARG_FILE} ${EXAMPLE_FILE_CSV}\n
4. Generate pairings using a JSON file, providing a default pairing order:\n
  ${PROGRAM_NAME} --${ARG_FILE} ${EXAMPLE_FILE_JSON} --${ARG_ORDER} ${CLI_OPTION_ORDER_BOOTOM_UP}\n
5. Generate multiple rounds of pairings:\n
  ${PROGRAM_NAME} --${ARG_PLAYERS} ${EXAMPLE_PLAYERS} --${ARG_NUM_ROUNDS} 3`;
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
