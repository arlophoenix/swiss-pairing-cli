import {
  GenerateRoundPairingsInput,
  GenerateRoundPairingsOutput,
  PlayedMatches,
  ReadonlyPairing,
  ReadonlyPlayedMatches,
  ReadonlyRoundPairings,
  ValidationResult,
} from './types.js';

import { createBidirectionalMap } from './utils.js';

function mutableClonePlayedMatches(playedMatches: ReadonlyPlayedMatches): PlayedMatches {
  return new Map(Array.from(playedMatches, ([key, set]) => [key, new Set(set)]));
}

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
        errorMessage: `unable to generate valid pairings for ${roundLabel}`,
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
  if (numRounds > players.length - 1) {
    return {
      isValid: false,
      errorMessage: 'num-rounds to generate cannot be greater than the number of players minus 1.',
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
