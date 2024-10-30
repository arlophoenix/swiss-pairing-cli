import { CLIOptionFormat, ReadonlyMatch, Result } from '../types/types.js';
import { ErrorTemplate, formatError } from '../utils/errorUtils.js';
import {
  validateGenerateRoundsInput,
  validateGenerateRoundsOutput,
} from '../swiss-pairing/swissValidator.js';

import { createBidirectionalMap } from '../utils/utils.js';
import { formatOutput } from '../cli/outputFormatter.js';
import { generateRounds } from '../swiss-pairing/swissPairing.js';

/**
 * Command to generate Swiss-style tournament rounds
 */
export interface GenerateRoundsCommand {
  readonly teams: readonly string[];
  readonly numRounds: number;
  readonly startRound: number;
  readonly matches?: readonly ReadonlyMatch[];
  readonly format: CLIOptionFormat;
  readonly squadMap: ReadonlyMap<string, string>;
}

/**
 * Handles the generate rounds command
 */
export function handleGenerateRounds(command: GenerateRoundsCommand): Result<string> {
  const playedTeams = createBidirectionalMap(command.matches);

  const validateInputResult = validateGenerateRoundsInput({
    teams: command.teams,
    numRounds: command.numRounds,
    playedTeams,
    squadMap: command.squadMap,
  });

  if (!validateInputResult.success) {
    return {
      success: false,
      message: formatError({
        template: ErrorTemplate.INVALID_INPUT,
        values: { message: validateInputResult.message },
      }),
    };
  }

  const roundsResult = generateRounds({
    teams: command.teams,
    numRounds: command.numRounds,
    startRound: command.startRound,
    playedTeams,
    squadMap: command.squadMap,
  });

  if (!roundsResult.success) {
    return {
      success: false,
      message: formatError({
        template: ErrorTemplate.GENERATION_FAILED,
        values: { message: roundsResult.message },
      }),
    };
  }

  const validateOutputResult = validateGenerateRoundsOutput({
    rounds: roundsResult.value.rounds,
    teams: command.teams,
    numRounds: command.numRounds,
    startRound: command.startRound,
    playedTeams,
    squadMap: command.squadMap,
  });

  if (!validateOutputResult.success) {
    return {
      success: false,
      message: formatError({
        template: ErrorTemplate.GENERATION_FAILED,
        values: { message: validateOutputResult.message },
      }),
    };
  }

  return {
    success: true,
    value: formatOutput({
      results: roundsResult.value,
      format: command.format,
    }),
  };
}
