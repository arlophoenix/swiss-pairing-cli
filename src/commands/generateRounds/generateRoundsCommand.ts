/**
 * Tournament round generation command.
 * Core business logic for Swiss tournament pairing:
 * - Validates tournament configuration
 * - Generates optimal pairings per round
 * - Validates generated matches
 *
 * Enforces tournament rules:
 * - Even number of teams required
 * - No repeat matches
 * - No intra-squad matches
 * - Sequential round numbers
 * - All teams paired each round
 *
 * @module generateRounds
 */

import { ErrorTemplate, formatError } from '../../utils/errorUtils.js';
import { GenerateRoundsCommand, GenerateRoundsCommandOutput } from '../commandTypes.js';
import {
  validateGenerateRoundsInput,
  validateGenerateRoundsOutput,
} from '../../swiss-pairing/swissValidator.js';

import { createBidirectionalMap } from '../../utils/utils.js';
import { generateRounds } from '../../swiss-pairing/swissPairing.js';

/**
 * Generates tournament rounds using Swiss pairing algorithm.
 * Validates inputs and outputs to ensure tournament rules.
 *
 * @param command - Validated tournament configuration
 * @returns Generated rounds with pairings or error message
 *
 * @example
 * const result = handleGenerateRounds({
 *   teams: ["Team1", "Team2", "Team3", "Team4"],
 *   numRounds: 2,
 *   startRound: 1,
 *   squadMap: new Map([["Team1", "A"], ["Team2", "A"]])
 * });
 * // Success: {
 *   success: true,
 *   value: {
 *     rounds: [{
 *       label: "Round 1",
 *       matches: [["Team1", "Team3"], ["Team2", "Team4"]]
 *     }]
 *   }
 * }
 */
export function handleGenerateRounds(command: GenerateRoundsCommand): GenerateRoundsCommandOutput {
  // Convert matches to bidirectional map for lookups
  const playedTeams = createBidirectionalMap(command.matches);

  // Validate input configuration
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

  // Generate tournament rounds
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

  // Validate generated rounds
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
