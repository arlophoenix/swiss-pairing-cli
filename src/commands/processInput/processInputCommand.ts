/**
 * Input processing and validation for tournament generation.
 * Handles input from multiple sources:
 * - Direct CLI arguments
 * - CSV file input
 * - JSON file input
 *
 * Options are merged with precedence:
 * 1. CLI arguments (highest)
 * 2. File input
 * 3. Defaults      (lowest)
 *
 * @module processInput
 */

import { ProcessInputCommand, ProcessInputCommandOutput } from '../commandTypes.js';
import { createSquadMap, mergeOptions, prepareTeams, validateFileOptions } from './processInputUtils.js';

import { validateCLIOptions } from '../../validators/cliValidator.js';

/**
 * Validates and processes tournament input options.
 * Combines options from multiple sources and prepares teams.
 *
 * @param command - Raw input options to validate
 * @returns Validated and normalized tournament configuration
 *
 * @example
 * const result = await handleProcessInput({
 *   teams: ["Team1 [A]", "Team2 [B]"],
 *   numRounds: "2",
 *   file: "input.csv"
 * });
 * // Success: {
 *   success: true,
 *   value: {
 *     teams: ["Team1", "Team2"],
 *     squadMap: Map { "Team1" => "A", "Team2" => "B" },
 *     numRounds: 2
 *   }
 * }
 */
export async function handleProcessInput(command: ProcessInputCommand): Promise<ProcessInputCommandOutput> {
  // Validate CLI options
  const validateCLIOptionsResult = validateCLIOptions(command);
  if (!validateCLIOptionsResult.success) {
    return validateCLIOptionsResult;
  }

  // Process file input if provided
  const validateFileOptionsResult = await validateFileOptions(command.file);
  if (!validateFileOptionsResult.success) {
    return validateFileOptionsResult;
  }

  // Merge options from all sources
  const { teams, numRounds, startRound, order, matches, format } = mergeOptions({
    cliOptions: validateCLIOptionsResult.value,
    fileOptions: validateFileOptionsResult.value,
  });

  // Prepare teams in specified order
  const preparedTeams = prepareTeams({
    teams: teams.map((t) => t.name),
    order,
  });

  // Create squad assignments map
  const squadMap = createSquadMap(teams);

  return {
    success: true,
    value: {
      teams: preparedTeams,
      numRounds,
      startRound,
      matches,
      squadMap,
      format,
    },
  };
}
