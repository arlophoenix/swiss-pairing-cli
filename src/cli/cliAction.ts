/**
 * Handles CLI command processing and tournament generation.
 * Implements the main validation and execution pipeline:
 * 1. Validates CLI options
 * 2. Validates file input (if present)
 * 3. Merges options from both sources
 * 4. Prepares team pairings
 * 5. Generates tournament rounds
 *
 * @module cliAction
 */

import { createSquadMap, mergeOptions, prepareTeams, validateFileOptions } from './cliUtils.js';

import { Result } from '../types/types.js';
import { formatOutput } from './outputFormatter.js';
import { handleGenerateRounds } from '../commands/generateRounds.js';
import { validateCLIOptions } from '../validators/cliValidator.js';

/**
 * Raw command input from CLI
 */
export interface CLICommand {
  readonly teams?: readonly string[];
  readonly numRounds?: string;
  readonly startRound?: string;
  readonly matches?: readonly (readonly string[])[];
  readonly order?: string;
  readonly format?: string;
  readonly file?: string;
}

/**
 * Processes CLI input through the tournament generation pipeline.
 * Validates input, generates pairings, and formats output.
 *
 * Note: CLI options take precedence over file options when both are provided.
 * Teams must be prepared (ordered, BYE added if needed) before generation.
 *
 * @param cliOptions - Raw options from command line
 * @returns Formatted tournament results or error message
 *
 * @example
 * const result = await handleCLIAction({
 *   teams: ["Alice [A]", "Bob [B]"],
 *   numRounds: "2",
 *   format: "text-markdown"
 * });
 * if (result.success) {
 *   console.log(result.value);
 * }
 */
export async function handleCLICommand(command: CLICommand): Promise<Result<string>> {
  const validateCLIOptionsResult = validateCLIOptions(command);
  if (!validateCLIOptionsResult.success) {
    return validateCLIOptionsResult;
  }

  const validateFileOptionsResult = await validateFileOptions(command.file);
  if (!validateFileOptionsResult.success) {
    return validateFileOptionsResult;
  }

  const { teams, numRounds, startRound, order, matches, format } = mergeOptions({
    cliOptions: validateCLIOptionsResult.value,
    fileOptions: validateFileOptionsResult.value,
  });

  // Strip squad info before preparing teams - squads are handled separately via squadMap
  const preparedTeams = prepareTeams({ teams: teams.map((t) => t.name), order });
  const squadMap = createSquadMap(teams);

  const roundsResult = handleGenerateRounds({
    teams: preparedTeams,
    numRounds,
    startRound,
    matches,
    squadMap,
  });

  if (!roundsResult.success) {
    return roundsResult;
  }

  return {
    success: true,
    value: formatOutput({
      results: roundsResult.value,
      format,
    }),
  };
}
