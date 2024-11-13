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
import { TelemetryClient } from '../telemetry/TelemetryClient.js';
import { handleCLIActionCommand } from '../commands/cliAction/cliActionCommand.js';
import { showTelemetryNoticeIfNecessary } from './cliUtils.js';

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
    .name(PROGRAM_NAME)
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
      const startTime = Date.now();
      showTelemetryNoticeIfNecessary();

      const telemetry = TelemetryClient.getInstance();

      // Record command invocation with provided args
      telemetry.record({
        name: 'command_invoked',
        properties: {
          args_provided: {
            file: options.file != undefined,
            format: options.format != undefined,
            matches: options.matches != undefined,
            numRounds: options.numRounds != undefined,
            order: options.order != undefined,
            startRound: options.startRound != undefined,
            teams: options.teams != undefined,
          },
          teams_count: options.teams?.length,
          squad_count: options.teams?.filter((t) => t.includes('[') && t.includes(']')).length,
          rounds_count: Number(options.numRounds),
          start_round: Number(options.startRound),
          order: CLI_OPTION_ORDER.some((o) => o === options.order) ? options.order : undefined,
          format: CLI_OPTION_FORMAT.some((o) => o === options.format) ? options.format : undefined,
        },
      });

      try {
        const result = await handleCLIActionCommand(options);

        if (result.success) {
          telemetry.record({
            name: 'command_succeeded',
            properties: {
              duration_ms: Date.now() - startTime,
            },
          });
          await telemetry.shutdown();
          console.log(result.value);
          return;
        }

        // Handle validation failure
        telemetry.record({
          name: 'command_failed',
          properties: {
            error_name: 'validation_failed',
            error_message: result.message,
            duration_ms: Date.now() - startTime,
          },
        });
        await telemetry.shutdown();
        console.error(result.message);
        process.exit(1);
      } catch (error) {
        // Handle unexpected errors
        telemetry.record({
          name: 'command_error',
          properties: {
            error_name: error instanceof Error ? error.name : 'unknown',
            error_message: error instanceof Error ? error.message : String(error),
            duration_ms: Date.now() - startTime,
          },
        });
        await telemetry.shutdown();
        console.error(error);
        process.exit(1);
      }
    });

  return program;
}
