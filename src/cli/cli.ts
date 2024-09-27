import {
  ARG_FILE,
  ARG_FORMAT,
  ARG_MATCHES,
  ARG_NUM_ROUNDS,
  ARG_ORDER,
  ARG_PLAYERS,
  ARG_START_ROUND,
  CLI_OPTION_FORMAT_DEFAULT,
  CLI_OPTION_NUM_ROUND_DEFAULT,
  CLI_OPTION_ORDER_DEFAULT,
  CLI_OPTION_START_ROUND_DEFAULT,
  EXAMPLE_FILE_CSV,
  EXAMPLE_FILE_JSON,
  EXAMPLE_MATCHES,
  EXAMPLE_PLAYERS,
  PROGRAM_NAME,
  SUPPORTED_FILE_TYPES,
} from '../constants.js';
import { Match, ReadonlyMatch, UnvalidatedCLIOptions } from '../types/types.js';

import { Command } from 'commander';
import { handleCLIAction } from './cliAction.js';

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
      `-n, --${ARG_NUM_ROUNDS} <number>`,
      `Number of rounds to generate (default: ${String(CLI_OPTION_NUM_ROUND_DEFAULT)})`
    )
    .option(
      `-s, --${ARG_START_ROUND} <number>`,
      `Name the generated rounds starting with this number (default: ${String(CLI_OPTION_START_ROUND_DEFAULT)})`
    )
    .option(
      `-o, --${ARG_ORDER} <order>`,
      `The sequence in which players should be paired (default: ${CLI_OPTION_ORDER_DEFAULT})`
    )
    .option(`--${ARG_FORMAT} <format>`, `Output format (default: ${CLI_OPTION_FORMAT_DEFAULT})`)
    .option(
      `--${ARG_FILE} <path>`,
      `Path to input file (${SUPPORTED_FILE_TYPES.join(', ')}). Options provided via cli override file contents`
    )
    .option(
      `-m, --${ARG_MATCHES} <matches...>`,
      `List of pairs of player names that have already played against each other\ne.g. ${EXAMPLE_MATCHES}`,
      // eslint-disable-next-line max-params, functional/prefer-readonly-type
      (value: string, previous: ReadonlyMatch[] = []) => {
        const matchPlayers = value.split(',');
        return [...previous, matchPlayers as Match];
      }
    )
    .action(async (options: UnvalidatedCLIOptions) => {
      const result = await handleCLIAction(options);
      if (result.success) {
        console.log(result.value);
      } else {
        console.error(`${result.error.type}: ${result.error.message}`);
        process.exit(1);
      }
    });

  return program;
}

export function helpWithExamples(): string {
  return `${createCLI().helpInformation()}\n${exampleUsage()}`;
}

export function exampleUsage(): string {
  return `Examples:

1. Generate random pairings for 4 players:

  ${PROGRAM_NAME} --${ARG_PLAYERS} ${EXAMPLE_PLAYERS} --${ARG_ORDER} random

2. Generate pairings for 4 players, on round 2, with some matches already played:

  ${PROGRAM_NAME} --${ARG_PLAYERS} ${EXAMPLE_PLAYERS} --${ARG_START_ROUND} 2 --${ARG_MATCHES} ${EXAMPLE_MATCHES}

3. Generate pairings using a CSV file:

  ${PROGRAM_NAME} --file ${EXAMPLE_FILE_CSV}

4. Generate pairings using a JSON file, overriding the pairing order:

  ${PROGRAM_NAME} --file ${EXAMPLE_FILE_JSON} --${ARG_ORDER} bottom-up

5. Generate multiple rounds of pairings:

  ${PROGRAM_NAME} --${ARG_PLAYERS} ${EXAMPLE_PLAYERS} --${ARG_NUM_ROUNDS} 3`;
}
