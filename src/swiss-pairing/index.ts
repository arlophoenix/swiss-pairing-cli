import {
  GenerateRoundPairingsInput,
  GenerateRoundPairingsOutput,
  ReadonlyPairing,
  ReadonlyPlayedMatches,
  ReadonlyRoundPairings,
} from '../types.js';
import { validateRoundPairingsInput, validateRoundPairingsOutput } from './validation.js';

import { createBidirectionalMap } from '../utils.js';
import { mutableClonePlayedMatches } from './utils.js';

/**
 * Generates round pairings for a Swiss-style tournament
 * @param {GenerateRoundPairingsInput} input - The input parameters for generating pairings
 * @returns {GenerateRoundPairingsOutput} The generated pairings or an error
 */
export function generateRoundPairings({
  players,
  numRounds,
  startRound,
  playedMatches,
}: GenerateRoundPairingsInput): GenerateRoundPairingsOutput {
  const inputValidation = validateRoundPairingsInput({ players, numRounds, playedMatches });

  if (!inputValidation.isValid) {
    return {
      success: false,
      errorType: 'InvalidInput',
      errorMessage: inputValidation.errorMessage,
    };
  }

  const roundPairings: ReadonlyRoundPairings = {};

  const currentPlayers = [...players];
  const currentPlayedMatches = mutableClonePlayedMatches(playedMatches);

  if (currentPlayers.length % 2 === 1) {
    currentPlayers.push('BYE');
  }

  for (let round = 1; round <= numRounds; round++) {
    const roundLabel = `Round ${String(startRound + round - 1)}`;
    const pairings = generateSingleRoundPairings({
      players: currentPlayers,
      playedMatches: currentPlayedMatches,
    });

    if (!pairings) {
      return {
        success: false,
        errorType: 'NoValidSolution',
        errorMessage: `unable to generate valid pairings for ${roundLabel}.`,
      };
    }
    roundPairings[roundLabel] = pairings;

    // Update currentPlayedMatches for the next round, if necessary
    const newMatches = createBidirectionalMap(pairings);
    for (const [player, newOpponents] of newMatches.entries()) {
      if (!currentPlayedMatches.has(player)) {
        currentPlayedMatches.set(player, new Set());
      }
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const currentOpponents = currentPlayedMatches.get(player)!;
      newOpponents.forEach((opponent) => currentOpponents.add(opponent));
    }
  }

  const resultValidation = validateRoundPairingsOutput({
    players: currentPlayers,
    roundPairings,
    numRounds,
    playedMatches,
  });

  if (!resultValidation.isValid) {
    return {
      success: false,
      errorType: 'InvalidOutput',
      errorMessage: resultValidation.errorMessage,
    };
  }

  return { success: true, roundPairings };
}

/**
 * Generates pairings for a single round
 * @param {Object} params - The parameters for generating pairings
 * @param {readonly string[]} params.players - The list of players
 * @param {ReadonlyPlayedMatches} params.playedMatches - The matches already played
 * @returns {readonly ReadonlyPairing[] | null} The generated pairings or null if no valid pairings are possible
 */
function generateSingleRoundPairings({
  players,
  playedMatches,
}: {
  readonly players: readonly string[];
  readonly playedMatches: ReadonlyPlayedMatches;
}): readonly ReadonlyPairing[] | null {
  if (players.length === 0) {
    return [];
  }

  const currentPlayer = players[0];
  const remainingPlayers = players.slice(1);

  for (const opponent of remainingPlayers) {
    if (!playedMatches.get(currentPlayer)?.has(opponent)) {
      const subPairings = generateSingleRoundPairings({
        players: remainingPlayers.filter((p) => p !== opponent),
        playedMatches,
      });

      if (subPairings !== null) {
        return [[currentPlayer, opponent], ...subPairings];
      }
    }
  }

  return null;
}
