import {
  GenerateRoundMatchesInput,
  PlayedOpponents,
  ReadonlyMatch,
  ReadonlyPlayedOpponents,
  ReadonlyRoundMatches,
  Result,
} from '../types/types.js';
import { validateRoundMatchesInput, validateRoundMatchesOutput } from './validation.js';

import { createBidirectionalMap } from '../utils.js';
import { mutableClonePlayedOpponents } from './utils.js';

/**
 * Generates multiple rounds worth of matches for a Swiss-style tournament
 * @param {GenerateRoundMatchesInput} input - The input parameters for generating matches
 * @returns {GenerateRoundMatchesOutput} The generated matches or an error
 */
export function generateRoundMatches({
  players,
  numRounds,
  startRound,
  playedOpponents,
}: GenerateRoundMatchesInput): Result<ReadonlyRoundMatches> {
  const inputValidation = validateRoundMatchesInput({ players, numRounds, playedOpponents });

  if (!inputValidation.success) {
    return inputValidation;
  }

  const roundMatches: ReadonlyRoundMatches = {};

  let currentPlayedOpponents = mutableClonePlayedOpponents(playedOpponents);

  for (let roundNumber = 1; roundNumber <= numRounds; roundNumber++) {
    const roundLabel = `Round ${String(startRound + roundNumber - 1)}`;
    const newMatches = generateSingleRoundMatches({
      players,
      playedOpponents: currentPlayedOpponents,
    });

    if (!newMatches) {
      return {
        success: false,
        error: {
          type: 'NoValidSolution',
          message: `unable to generate valid matches for ${roundLabel}.`,
        },
      };
    }
    // eslint-disable-next-line functional/immutable-data
    roundMatches[roundLabel] = newMatches;

    currentPlayedOpponents = updatePlayedOpponents({ currentPlayedOpponents, newMatches });
  }

  const resultValidation = validateRoundMatchesOutput({
    players,
    roundMatches,
    numRounds,
    playedOpponents,
  });

  if (!resultValidation.success) {
    return resultValidation;
  }

  return { success: true, value: roundMatches };
}

/**
 * Updates the played opponents with new opponents
 * @param {ReadonlyPlayedOpponents} currentPlayedOpponents - The current played opponents
 * @param {readonly ReadonlyMatch[]} newMatches - The new matches to add
 * @returns {PlayedOpponents} The updated played opponents
 */
function updatePlayedOpponents({
  currentPlayedOpponents,
  newMatches,
}: {
  readonly currentPlayedOpponents: ReadonlyPlayedOpponents;
  readonly newMatches: readonly ReadonlyMatch[];
}): PlayedOpponents {
  const updatedPlayedOpponents = mutableClonePlayedOpponents(currentPlayedOpponents);
  const newPlayedOpponents = createBidirectionalMap(newMatches);

  for (const [player, newOpponents] of newPlayedOpponents.entries()) {
    if (!updatedPlayedOpponents.has(player)) {
      updatedPlayedOpponents.set(player, new Set());
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const currentOpponents = updatedPlayedOpponents.get(player)!;
    newOpponents.forEach((opponent) => currentOpponents.add(opponent));
  }

  return updatedPlayedOpponents;
}

/**
 * Generates matches for a single round
 * @param {Object} params - The parameters for generating matches
 * @param {readonly string[]} params.players - The list of players
 * @param {ReadonlyPlayedOpponents} params.playedMatches - The matches already played
 * @returns {readonly ReadonlyMatch[] | null} The generated matches or null if no valid matches are possible
 */
function generateSingleRoundMatches({
  players,
  playedOpponents,
}: {
  readonly players: readonly string[];
  readonly playedOpponents: ReadonlyPlayedOpponents;
}): readonly ReadonlyMatch[] | null {
  // Base case: if no players left, we've successfully paired everyone
  if (players.length === 0) {
    return [];
  }

  const [currentPlayer, ...remainingPlayers] = players;

  // Try to pair the current player with each remaining player
  for (const opponent of remainingPlayers) {
    // Skip if these players have already played each other
    if (!playedOpponents.get(currentPlayer)?.has(opponent)) {
      // Recursively generate matches for the remaining players
      const newMatches = generateSingleRoundMatches({
        players: remainingPlayers.filter((p) => p !== opponent),
        playedOpponents,
      });

      // If we found valid matches for the remaining players, we're done
      if (newMatches !== null) {
        return [[currentPlayer, opponent], ...newMatches];
      }
    }
  }

  // If we couldn't pair the current player with anyone, backtrack
  return null;
}
