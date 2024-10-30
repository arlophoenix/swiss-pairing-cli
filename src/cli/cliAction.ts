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

import { Result, UnvalidatedCLIOptions } from '../types/types.js';
import { createSquadMap, mergeOptions, prepareTeams, validateFileOptions } from './cliUtils.js';

import { handleGenerateRounds } from '../commands/generateRounds.js';
import { validateCLIOptions } from '../validators/cliValidator.js';

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
export async function handleCLIAction(cliOptions: UnvalidatedCLIOptions): Promise<Result<string>> {
  const validateCLIOptionsResult = validateCLIOptions(cliOptions);
  if (!validateCLIOptionsResult.success) {
    return validateCLIOptionsResult;
  }

  const validateFileOptionsResult = await validateFileOptions(cliOptions.file);
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

  return handleGenerateRounds({
    teams: preparedTeams,
    numRounds,
    startRound,
    matches,
    format,
    squadMap,
  });
}
