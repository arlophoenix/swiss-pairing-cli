import { ReadonlyPlayedMatches, ReadonlyRoundPairings, ValidationResult } from '../types.js';

import { mutableClonePlayedMatches } from './utils.js';

/**
 * Validates the input for generating round pairings
 * @param {Object} params - The parameters to validate
 * @param {readonly string[]} params.players - The list of players
 * @param {number} params.numRounds - The number of rounds to generate
 * @param {ReadonlyPlayedMatches} params.playedMatches - The matches already played
 * @returns {ValidationResult} The result of the validation
 */

export function validateInput({
  players,
  numRounds,
  playedMatches,
}: {
  readonly players: readonly string[];
  readonly numRounds: number;
  readonly playedMatches: ReadonlyPlayedMatches;
}): ValidationResult {
  // Check if there are at least two players
  if (players.length < 2) {
    return { isValid: false, errorMessage: 'there must be at least two players.' };
  }

  // Check for duplicate players
  if (new Set(players).size !== players.length) {
    return { isValid: false, errorMessage: 'duplicate players are not allowed.' };
  }

  // Check if rounds is at least 1
  if (numRounds < 1) {
    return { isValid: false, errorMessage: 'num-rounds to generate must be at least 1.' };
  }

  // Check if rounds is not greater than players minus 1
  if (numRounds >= players.length) {
    return {
      isValid: false,
      errorMessage: 'num-rounds to generate must be fewer than the number of players.',
    };
  }

  // Check if all players in playedMatches are valid
  const playedMatchesPlayers = new Set<string>();
  for (const [player, opponents] of playedMatches.entries()) {
    playedMatchesPlayers.add(player);
    for (const opponent of opponents) {
      playedMatchesPlayers.add(opponent);
    }
  }

  if (!Array.from(playedMatchesPlayers).every((player) => players.includes(player))) {
    return { isValid: false, errorMessage: 'matches contains invalid player names.' };
  }

  // Check if playedMatches is symmetrical
  for (const [player, opponents] of playedMatches.entries()) {
    for (const opponent of opponents) {
      if (!playedMatches.get(opponent)?.has(player)) {
        return { isValid: false, errorMessage: 'matches are not symmetrical.' };
      }
    }
  }

  // If all checks pass, return true
  return { isValid: true };
}

/**
 * Validates the result of generating round pairings
 * @param {Object} params - The parameters to validate
 * @param {ReadonlyRoundPairings} params.roundPairings - The generated round pairings
 * @param {readonly string[]} params.players - The list of players
 * @param {number} params.numRounds - The number of rounds generated
 * @param {ReadonlyPlayedMatches} params.playedMatches - The matches already played
 * @returns {ValidationResult} The result of the validation
 */
export function validateResult({
  roundPairings,
  players,
  numRounds,
  playedMatches,
}: {
  readonly roundPairings: ReadonlyRoundPairings;
  readonly players: readonly string[];
  readonly numRounds: number;
  readonly playedMatches: ReadonlyPlayedMatches;
}): ValidationResult {
  const numGamesPerRound = players.length / 2;

  // 1. There is one key per round in the record
  const resultNumRounds = Object.keys(roundPairings).length;
  if (resultNumRounds !== numRounds) {
    return {
      isValid: false,
      errorMessage: `invalid number of rounds in the result. Expected ${String(numRounds)}, got ${String(resultNumRounds)}.`,
    };
  }

  const currentPlayedMatches = mutableClonePlayedMatches(playedMatches);

  for (const [roundLabel, pairings] of Object.entries(roundPairings)) {
    // 2. There are num players / 2 values per round
    if (pairings.length !== numGamesPerRound) {
      return {
        isValid: false,
        errorMessage: `invalid number of pairings in ${roundLabel}. Expected ${String(numGamesPerRound)}, got ${String(pairings.length)}.`,
      };
    }

    const playersInRound = new Set<string>();

    for (const [player1, player2] of pairings) {
      // 3. No round contains a pairing of players who are already listed in playedMatches
      if (currentPlayedMatches.get(player1)?.has(player2)) {
        return {
          isValid: false,
          errorMessage: `invalid pairing in ${roundLabel}: ${player1} and ${player2} have already played.`,
        };
      }

      if (currentPlayedMatches.get(player1) === undefined) {
        currentPlayedMatches.set(player1, new Set());
      }
      if (currentPlayedMatches.get(player2) === undefined) {
        currentPlayedMatches.set(player2, new Set());
      }
      currentPlayedMatches.get(player1)?.add(player2);
      currentPlayedMatches.get(player2)?.add(player1);

      // 4. No player appears more than once in the values for a round
      if (playersInRound.has(player1) || playersInRound.has(player2)) {
        return {
          isValid: false,
          errorMessage: `invalid pairing in ${roundLabel}: ${player1} or ${player2} appears more than once.`,
        };
      }
      playersInRound.add(player1);
      playersInRound.add(player2);
    }
  }

  return { isValid: true };
}
