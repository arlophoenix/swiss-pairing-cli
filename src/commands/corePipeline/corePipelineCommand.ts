/**
 * Handles CLI command processing and tournament generation.
 * Implements the main validation and execution pipeline:
 * 1. Validates CLI options
 * 2. Validates file input (if present)
 * 3. Merges options from both sources
 * 4. Prepares team pairings
 * 5. Generates tournament rounds
 *
 * @module corePipelineCommand
 */

import { CorePipelineCommand, CorePipelineCommandOutput } from '../commandTypes.js';

import { formatOutput } from '../../formatters/outputFormatter.js';
import { handleGenerateRounds } from '../generateRounds/generateRoundsCommand.js';
import { handleProcessInput } from '../processInput/processInputCommand.js';

/**
 * Processes CLI input through the tournament generation pipeline.
 * Validates input, generates pairings, and formats output.
 *
 * Note: CLI options take precedence over file options when both are provided.
 * Teams must be prepared (ordered, BYE added if needed) before generation.
 *
 * @param cliOptions - Raw options from command line
 * @returns Formatted tournament results or error message
 */
export async function handleCorePipelineCommand(
  command: CorePipelineCommand
): Promise<CorePipelineCommandOutput> {
  const processInputResult = await handleProcessInput(command);
  if (!processInputResult.success) {
    return processInputResult;
  }

  const { teams, numRounds, startRound, matches, squadMap, format } = processInputResult.value;

  const roundsResult = handleGenerateRounds({
    teams,
    numRounds,
    startRound,
    matches,
    squadMap,
  });
  if (!roundsResult.success) {
    return roundsResult;
  }

  const formattedOutput = formatOutput({
    results: roundsResult.value,
    format,
  });

  return {
    success: true,
    value: formattedOutput,
  };
}
