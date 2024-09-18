import { GeneratePairingsResult, SwissPairingInput, ValidationResult } from './types.js';

export function generatePairings({
  players,
  numRounds,
  startRound,
  playedMatches,
}: SwissPairingInput): GeneratePairingsResult {
  const inputValidation = validateInput({ players, numRounds, playedMatches });
  if (!inputValidation.isValid) {
    return {
      success: false,
      errorType: 'InvalidInput',
      errorMessage: inputValidation.errorMessage,
    };
  }

  const result: { [round: string]: string[][] } = {};
  let currentPlayedMatches = { ...playedMatches };
  if (players.length % 2 === 1) {
    players.push('BYE');
  }

  for (let round = 1; round <= numRounds; round++) {
    const roundLabel = `Round ${startRound + round - 1}`;
    const roundPairings = generateRoundPairings({ players, playedMatches: currentPlayedMatches });
    if (!roundPairings) {
      return {
        success: false,
        errorType: 'NoValidSolution',
        errorMessage: `unable to generate valid pairings for ${roundLabel}`,
      };
    }
    result[roundLabel] = roundPairings;

    // Update currentPlayedMatches for the next round, if necessary
    roundPairings.forEach(([player1, player2]) => {
      currentPlayedMatches[player1] = [...(currentPlayedMatches[player1] || []), player2];
      currentPlayedMatches[player2] = [...(currentPlayedMatches[player2] || []), player1];
    });
  }

  const resultValidation = validateResult({ pairings: result, players, numRounds, playedMatches });
  if (!resultValidation.isValid) {
    return {
      success: false,
      errorType: 'InvalidOutput',
      errorMessage: resultValidation.errorMessage,
    };
  }

  return { success: true, roundPairings: result };
}

function generateRoundPairings({
  players,
  playedMatches,
}: {
  players: string[];
  playedMatches: Record<string, string[]>;
}): string[][] | null {
  if (players.length === 0) {
    return [];
  }

  const currentPlayer = players[0];
  const remainingPlayers = players.slice(1);

  for (const opponent of remainingPlayers) {
    if (!playedMatches[currentPlayer]?.includes(opponent)) {
      const subPairings = generateRoundPairings({
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
  players: string[];
  numRounds: number;
  playedMatches: Record<string, string[]>;
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
  const playedMatchesPlayers = new Set([...Object.keys(playedMatches), ...Object.values(playedMatches).flat()]);
  if (!Array.from(playedMatchesPlayers).every((player) => players.includes(player))) {
    return { isValid: false, errorMessage: 'matches contains invalid player names.' };
  }

  // Check if playedMatches is symmetrical
  for (const [player, opponents] of Object.entries(playedMatches)) {
    for (const opponent of opponents) {
      if (!playedMatches[opponent] || !playedMatches[opponent].includes(player)) {
        return { isValid: false, errorMessage: 'matches are not symmetrical.' };
      }
    }
  }

  // If all checks pass, return true
  return { isValid: true };
}

export function validateResult({
  pairings,
  players,
  numRounds,
  playedMatches,
}: {
  pairings: { [round: string]: string[][] };
  players: string[];
  numRounds: number;
  playedMatches: Record<string, string[]>;
}): ValidationResult {
  const numGamesPerRound = players.length / 2;

  // 1. There is one key per round in the record
  if (Object.keys(pairings).length !== numRounds) {
    return {
      isValid: false,
      errorMessage: `invalid number of rounds in the result. Expected ${numRounds}, got ${Object.keys(pairings).length}.`,
    };
  }

  const currentPlayedMatches = { ...playedMatches };

  for (const [roundLabel, roundPairings] of Object.entries(pairings)) {
    // 2. There are num players / 2 values per round
    if (roundPairings.length !== numGamesPerRound) {
      return {
        isValid: false,
        errorMessage: `invalid number of pairings in ${roundLabel}. Expected ${numGamesPerRound}, got ${roundPairings.length}.`,
      };
    }

    const playersInRound = new Set<string>();

    for (const [player1, player2] of roundPairings) {
      // 3. No round contains a pairing of players who are already listed in playedMatches
      if (currentPlayedMatches[player1]?.includes(player2)) {
        return {
          isValid: false,
          errorMessage: `invalid pairing in ${roundLabel}: ${player1} and ${player2} have already played.`,
        };
      }
      currentPlayedMatches[player1] = [...(currentPlayedMatches[player1] || []), player2];
      currentPlayedMatches[player2] = [...(currentPlayedMatches[player2] || []), player1];

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
