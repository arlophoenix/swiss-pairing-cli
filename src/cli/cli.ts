/**
 * Command Line Interface for Swiss tournament pairing generation.
 * Uses Commander.js for argument parsing and help documentation.
 *
 * Supports input via:
 * - Direct command line arguments
 * - CSV file
 * - JSON file
 *
 * @module cli
 */

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
  BIN_NAME,
  CLI_OPTION_FORMAT,
  CLI_OPTION_FORMAT_DEFAULT,
  CLI_OPTION_NUM_ROUND_DEFAULT,
  CLI_OPTION_ORDER,
  CLI_OPTION_ORDER_DEFAULT,
  CLI_OPTION_START_ROUND_DEFAULT,
  EXAMPLE_MATCHES,
  EXAMPLE_TEAMS_WITH_SQUADS,
  SUPPORTED_FILE_TYPES,
} from '../constants.js';
import { Match, ReadonlyMatch, UnvalidatedCLIOptions } from '../types/types.js';

import { Command } from 'commander';
import { handleCLIAction } from '../commands/cliAction/cliActionCommand.js';

/**
 * Creates and configures the CLI command parser.
 * Sets up all command options with help text and validation.
 *
 * @returns Configured Commander instance
 *
 * @example
 * const program = createCLI();
 * program.parse(process.argv);
 */
export function createCLI(): Command {
  const program = new Command();

  program
    .name(BIN_NAME)
    .description('A CLI tool for generating Swiss-style tournament pairings')
    // Teams list with optional squad assignments
    .option(
      `-${ARG_TEAMS_SHORT}, --${ARG_TEAMS} <names...>`,
      `List of team names in order from top standing to bottom, with optional squad in square brackets\ne.g. ${EXAMPLE_TEAMS_WITH_SQUADS}`
    )
    // Number of rounds to generate
    .option(
      `-${ARG_NUM_ROUNDS_SHORT}, --${ARG_NUM_ROUNDS} <number>`,
      `Number of rounds to generate\n(default: ${String(CLI_OPTION_NUM_ROUND_DEFAULT)})`
    )
    // Starting round number
    .option(
      `-${ARG_START_ROUND_SHORT}, --${ARG_START_ROUND} <number>`,
      `Name the generated rounds starting with this number\n(default: ${String(CLI_OPTION_START_ROUND_DEFAULT)})`
    )
    // Team pairing order
    .option(
      `-${ARG_ORDER_SHORT}, --${ARG_ORDER} <order-enum>`,
      `The sequence in which teams should be paired; one of: ${CLI_OPTION_ORDER.join('|')}\n(default: ${CLI_OPTION_ORDER_DEFAULT})`
    )
    // Output format
    .option(
      `--${ARG_FORMAT} <format-enum>`,
      `Output format; one of: ${CLI_OPTION_FORMAT.join('|')}\n(default: ${CLI_OPTION_FORMAT_DEFAULT})`
    )
    // Input file
    .option(
      `--${ARG_FILE} <path{${SUPPORTED_FILE_TYPES.join('|')}}>`,
      `Path to input file. Options provided via cli override file contents`
    )
    // Previously played matches
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
      const { output, exitCode } = await handleCLIAction(options);
      if (exitCode > 0) {
        // eslint-disable-next-line no-console
        console.error(output);
        process.exit(exitCode);
      }
      // eslint-disable-next-line no-console
      console.log(output);
    });

  return program;
}
