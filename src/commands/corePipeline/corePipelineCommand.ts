/**
 * Core tournament generation pipeline.
 * Orchestrates the main tournament generation flow:
 * 1. Validate input data
 * 2. Process and normalize teams
 * 3. Generate tournament rounds
 * 4. Format output
 *
 * Each step returns a Result type for consistent error handling.
 * Pipeline stops on first error encountered.
 *
 * @module corePipeline
 */

import { CorePipelineCommand, CorePipelineCommandOutput } from '../commandTypes.js';

import { formatOutput } from '../../formatters/outputFormatter.js';
import { handleGenerateRounds } from '../generateRounds/generateRoundsCommand.js';
import { handleProcessInput } from '../processInput/processInputCommand.js';

/**
 * Executes tournament generation pipeline.
 * Coordinates validation, generation and formatting.
 *
 * @param command - Raw input options to process
 * @returns Formatted tournament output or error message
 *
 * @example
 * const result = await handleCorePipelineCommand({
 *   teams: ["Team1", "Team2"],
 *   numRounds: "2",
 *   format: "text-markdown"
 * });
 * // Success: { success: true, value: "Round 1: Team1 vs Team2..." }
 * // Failure: { success: false, message: "Invalid input: ..." }
 */
export async function handleCorePipelineCommand(
  command: CorePipelineCommand
): Promise<CorePipelineCommandOutput> {
  // Validate and normalize input
  const processInputResult = await handleProcessInput(command);
  if (!processInputResult.success) {
    return processInputResult;
  }

  // Extract validated configuration
  const { teams, numRounds, startRound, matches, squadMap, format } = processInputResult.value;

  // Generate tournament rounds
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

  // Format output in requested format
  const formattedOutput = formatOutput({
    results: roundsResult.value,
    format,
  });

  return {
    success: true,
    value: formattedOutput,
  };
}
