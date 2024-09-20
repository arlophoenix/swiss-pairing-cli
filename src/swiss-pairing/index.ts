import {
  GenerateRoundPairingsInput,
  GenerateRoundPairingsOutput,
  PlayedMatches,
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
  const currentPlayers = preparePlayersForPairing(players);
  let currentPlayedMatches = mutableClonePlayedMatches(playedMatches);

  for (let roundNumber = 1; roundNumber <= numRounds; roundNumber++) {
    const roundLabel = `Round ${String(startRound + roundNumber - 1)}`;
    const newPairings = generateSingleRoundPairings({
      players: currentPlayers,
      playedMatches: currentPlayedMatches,
    });

    if (!newPairings) {
      return {
        success: false,
        errorType: 'NoValidSolution',
        errorMessage: `unable to generate valid pairings for ${roundLabel}.`,
      };
    }
    roundPairings[roundLabel] = newPairings;

    currentPlayedMatches = updatePlayedMatches({ currentPlayedMatches, newPairings });
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
 * Prepares the list of players for pairing, adding a 'BYE' player if necessary
 * @param {readonly string[]} players - The original list of players
 * @returns {readonly string[]} The prepared list of players
 */
function preparePlayersForPairing(players: readonly string[]): readonly string[] {
  return players.length % 2 === 1 ? [...players, 'BYE'] : players;
}

/**
 * Updates the played matches with new pairings
 * @param {ReadonlyPlayedMatches} currentMatches - The current played matches
 * @param {readonly ReadonlyPairing[]} newPairings - The new pairings to add
 * @returns {PlayedMatches} The updated played matches
 */
function updatePlayedMatches({
  currentPlayedMatches,
  newPairings,
}: {
  readonly currentPlayedMatches: ReadonlyPlayedMatches;
  readonly newPairings: readonly ReadonlyPairing[];
}): PlayedMatches {
  const updatedMatches = mutableClonePlayedMatches(currentPlayedMatches);
  const newMatches = createBidirectionalMap(newPairings);

  for (const [player, newOpponents] of newMatches.entries()) {
    if (!updatedMatches.has(player)) {
      updatedMatches.set(player, new Set());
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const currentOpponents = updatedMatches.get(player)!;
    newOpponents.forEach((opponent) => currentOpponents.add(opponent));
  }

  return updatedMatches;
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

  const [currentPlayer, ...remainingPlayers] = players;

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
