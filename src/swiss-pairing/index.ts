import {
  GenerateRoundPairingsInput,
  GenerateRoundPairingsOutput,
  ReadonlyPairing,
  ReadonlyPlayedMatches,
  ReadonlyRoundPairings,
} from '../types.js';
import { validateInput, validateResult } from './validation.js';

import { createBidirectionalMap } from '../utils.js';
import { mutableClonePlayedMatches } from './utils.js';

export function generateRoundPairings({
  players,
  numRounds,
  startRound,
  playedMatches,
}: GenerateRoundPairingsInput): GenerateRoundPairingsOutput {
  const inputValidation = validateInput({ players, numRounds, playedMatches });

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
    const pairings = generatePairings({ players: currentPlayers, playedMatches: currentPlayedMatches });

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

  const resultValidation = validateResult({
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

function generatePairings({
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
      const subPairings = generatePairings({
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
