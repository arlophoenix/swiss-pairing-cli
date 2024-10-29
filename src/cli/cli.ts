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
  CLI_OPTION_FORMAT,
  CLI_OPTION_FORMAT_DEFAULT,
  CLI_OPTION_NUM_ROUND_DEFAULT,
  CLI_OPTION_ORDER,
  CLI_OPTION_ORDER_DEFAULT,
  CLI_OPTION_START_ROUND_DEFAULT,
  EXAMPLE_MATCHES,
  EXAMPLE_TEAMS_WITH_SQUADS,
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
      `List of team names in order from top standing to bottom, with optional squad in square brackets\ne.g. ${EXAMPLE_TEAMS_WITH_SQUADS}`
    )
    .option(
      `-${ARG_NUM_ROUNDS_SHORT}, --${ARG_NUM_ROUNDS} <number>`,
      `Number of rounds to generate\n(default: ${String(CLI_OPTION_NUM_ROUND_DEFAULT)})`
    )
    .option(
      `-${ARG_START_ROUND_SHORT}, --${ARG_START_ROUND} <number>`,
      `Name the generated rounds starting with this number\n(default: ${String(CLI_OPTION_START_ROUND_DEFAULT)})`
    )
    .option(
      `-${ARG_ORDER_SHORT}, --${ARG_ORDER} <${CLI_OPTION_ORDER.join('|')}>`,
      `The sequence in which teams should be paired\n(default: ${CLI_OPTION_ORDER_DEFAULT})`
    )
    .option(
      `--${ARG_FORMAT} <${CLI_OPTION_FORMAT.join('|')}>`,
      `Output format\n(default: ${CLI_OPTION_FORMAT_DEFAULT})`
    )
    .option(
      `--${ARG_FILE} <path${SUPPORTED_FILE_TYPES.join('|')}>`,
      `Path to input file. Options provided via cli override file contents`
    )
    .option(
      `-${ARG_MATCHES_SHORT}, --${ARG_MATCHES} <matches...>`,
      `List of pairs of team names that have already played against each other\ne.g. ${EXAMPLE_MATCHES}`,
      // eslint-disable-next-line max-params, functional/prefer-readonly-type
      (value: string, previous: ReadonlyMatch[] = []) => {
        const [team1, team2] = value.split(',');
        return [...previous, [team1, team2] as Match];
      }
    )
    .action(async (options: UnvalidatedCLIOptions) => {
      const result = await handleCLIAction(options);
      if (result.success) {
        console.log(result.value);
      } else {
        console.error(result.message);
        process.exit(1);
      }
    });

  return program;
}
