/**
 * Tournament generation command handling.
 * Implements the core tournament generation workflow:
 * 1. Input validation
 * 2. Round generation
 * 3. Output validation
 * 4. Result formatting
 *
 * @module generateRounds
 */

import { ErrorTemplate, formatError } from '../../utils/errorUtils.js';
import { Result, SwissPairingResult } from '../../types/types.js';
import {
  validateGenerateRoundsInput,
  validateGenerateRoundsOutput,
} from '../../swiss-pairing/swissValidator.js';

import { GenerateRoundsCommand } from '../commandTypes.js';
import { createBidirectionalMap } from '../../utils/utils.js';
import { generateRounds } from '../../swiss-pairing/swissPairing.js';

/**
 * Handles tournament generation command.
 * Ensures all validation steps pass before
 * attempting to generate pairings.
 *
 * Note: Teams must already be in desired pairing order
 * and any BYE team must be added before calling.
 *
 * @example
 * const result = handleGenerateRounds({
 *   teams: ["Team1", "Team2", "Team3", "BYE"],
 *   numRounds: 2,
 *   startRound: 1,
 *   format: "text-markdown",
 *   squadMap: new Map([["Team1", "A"], ["Team2", "B"]])
 * });
 */
export function handleGenerateRounds(command: GenerateRoundsCommand): Result<SwissPairingResult> {
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

  return roundsResult;
}
