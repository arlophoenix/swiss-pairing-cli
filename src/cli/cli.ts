import {
  ARG_FILE,
  ARG_FORMAT,
  ARG_MATCHES,
  ARG_MATCHES_SHORT,
  ARG_NUM_ROUNDS,
  ARG_NUM_ROUNDS_SHORT,
  ARG_ORDER,
  ARG_ORDER_SHORT,
  ARG_START_ROUND,
  ARG_START_ROUND_SHORT,
  ARG_TEAMS,
  ARG_TEAMS_SHORT,
  CLI_OPTION_FORMAT_DEFAULT,
  CLI_OPTION_NUM_ROUND_DEFAULT,
  CLI_OPTION_ORDER_DEFAULT,
  CLI_OPTION_START_ROUND_DEFAULT,
  EXAMPLE_FILE_CSV,
  EXAMPLE_FILE_JSON,
  EXAMPLE_MATCHES,
  EXAMPLE_TEAMS,
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
      `-${ARG_TEAMS_SHORT}, --${ARG_TEAMS} <names...>`,
      `List of team names in order from top standing to bottom\ne.g. ${EXAMPLE_TEAMS}`
    )
    .option(
      `-${ARG_NUM_ROUNDS_SHORT}, --${ARG_NUM_ROUNDS} <number>`,
      `Number of rounds to generate (default: ${String(CLI_OPTION_NUM_ROUND_DEFAULT)})`
    )
    .option(
      `-${ARG_START_ROUND_SHORT}, --${ARG_START_ROUND} <number>`,
      `Name the generated rounds starting with this number (default: ${String(CLI_OPTION_START_ROUND_DEFAULT)})`
    )
    .option(
      `-${ARG_ORDER_SHORT}, --${ARG_ORDER} <order>`,
      `The sequence in which teams should be paired (default: ${CLI_OPTION_ORDER_DEFAULT})`
    )
    .option(`--${ARG_FORMAT} <format>`, `Output format (default: ${CLI_OPTION_FORMAT_DEFAULT})`)
    .option(
      `--${ARG_FILE} <path>`,
      `Path to input file (${SUPPORTED_FILE_TYPES.join(', ')}). Options provided via cli override file contents`
    )
    .option(
      `-${ARG_MATCHES_SHORT}, --${ARG_MATCHES} <matches...>`,
      `List of pairs of team names that have already played against each other\ne.g. ${EXAMPLE_MATCHES}`,
      // eslint-disable-next-line max-params, functional/prefer-readonly-type
      (value: string, previous: ReadonlyMatch[] = []) => {
        const matchTeams = value.split(',');
        return [...previous, matchTeams as Match];
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

1. Generate random pairings for 4 teams:

  ${PROGRAM_NAME} --${ARG_TEAMS} ${EXAMPLE_TEAMS} --${ARG_ORDER} random

2. Generate pairings for 4 teams, on round 2, with some matches already played:

  ${PROGRAM_NAME} --${ARG_TEAMS} ${EXAMPLE_TEAMS} --${ARG_START_ROUND} 2 --${ARG_MATCHES} ${EXAMPLE_MATCHES}

3. Generate pairings using a CSV file:

  ${PROGRAM_NAME} --file ${EXAMPLE_FILE_CSV}

4. Generate pairings using a JSON file, overriding the pairing order:

  ${PROGRAM_NAME} --file ${EXAMPLE_FILE_JSON} --${ARG_ORDER} bottom-up

5. Generate multiple rounds of pairings:

  ${PROGRAM_NAME} --${ARG_TEAMS} ${EXAMPLE_TEAMS} --${ARG_NUM_ROUNDS} 3`;
}
