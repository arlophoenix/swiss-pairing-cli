import { SwissPairingInput, ValidationResult } from './types.js';

export function generatePairings({
  players,
  rounds,
  playedMatches,
}: SwissPairingInput): Record<string, string[][]> | Error {
  const inputValidation = validateInput({ players, rounds, playedMatches });
  if (!inputValidation.isValid) {
    return new Error(inputValidation.errorMessage);
  }

  const result: { [round: string]: string[][] } = {};
  let currentPlayedMatches = { ...playedMatches };

  for (let round = 1; round <= rounds; round++) {
    const roundPairings = generateRoundPairings({ players, playedMatches: currentPlayedMatches });
    if (!roundPairings) {
      return new Error(`Unable to generate valid pairings for Round ${round}`);
    }
    result[`Round ${round}`] = roundPairings;

    // Update currentPlayedMatches for the next round, if necessary
    roundPairings.forEach(([player1, player2]) => {
      currentPlayedMatches[player1] = [...(currentPlayedMatches[player1] || []), player2];
      currentPlayedMatches[player2] = [...(currentPlayedMatches[player2] || []), player1];
    });
  }

  const resultValidation = validateResult({ pairings: result, players, rounds, playedMatches });
  if (!resultValidation.isValid) {
    return new Error(resultValidation.errorMessage);
  }

  return result;
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

export function validateInput({ players, rounds, playedMatches }: SwissPairingInput): ValidationResult {
  // Check if there are at least two players
  if (players.length < 2) {
    return { isValid: false, errorMessage: 'There must be at least two players.' };
  }

  // Check for duplicate players
  if (new Set(players).size !== players.length) {
    return { isValid: false, errorMessage: 'Duplicate players are not allowed.' };
  }

  // Check if number of players is even
  // TODO: Support uneven number of players with a bye
  if (players.length % 2 !== 0) {
    return { isValid: false, errorMessage: 'Number of players must be even.' };
  }

  // Check if rounds is at least 1
  if (rounds < 1) {
    return { isValid: false, errorMessage: 'Number of rounds must be at least 1.' };
  }

  // Check if rounds is not greater than players minus 1
  if (rounds > players.length - 1) {
    return { isValid: false, errorMessage: 'Number of rounds cannot be greater than the number of players minus 1.' };
  }

  // Check if all players in playedMatches are valid
  const playedMatchesPlayers = new Set([...Object.keys(playedMatches), ...Object.values(playedMatches).flat()]);
  if (!Array.from(playedMatchesPlayers).every((player) => players.includes(player))) {
    return { isValid: false, errorMessage: 'Played matches contain invalid player names.' };
  }

  // Check if playedMatches is symmetrical
  for (const [player, opponents] of Object.entries(playedMatches)) {
    for (const opponent of opponents) {
      if (!playedMatches[opponent] || !playedMatches[opponent].includes(player)) {
        return { isValid: false, errorMessage: 'Played matches are not symmetrical.' };
      }
    }
  }

  // If all checks pass, return true
  return { isValid: true };
}

export function validateResult({
  pairings,
  players,
  rounds,
  playedMatches,
}: {
  pairings: { [round: string]: string[][] };
  players: string[];
  rounds: number;
  playedMatches: Record<string, string[]>;
}): ValidationResult {
  const numGamesPerRound = players.length / 2;

  // 1. There is one key per round in the record
  if (Object.keys(pairings).length !== rounds) {
    return {
      isValid: false,
      errorMessage: `Invalid number of rounds in the result. Expected ${rounds}, got ${Object.keys(pairings).length}.`,
    };
  }

  const currentPlayedMatches = { ...playedMatches };

  for (const [round, roundPairings] of Object.entries(pairings)) {
    // 2. There are num players / 2 values per round
    if (roundPairings.length !== numGamesPerRound) {
      return {
        isValid: false,
        errorMessage: `Invalid number of pairings in round ${round}. Expected ${numGamesPerRound}, got ${roundPairings.length}.`,
      };
    }

    const playersInRound = new Set<string>();

    for (const [player1, player2] of roundPairings) {
      // 3. No round contains a pairing of players who are already listed in playedMatches
      if (currentPlayedMatches[player1]?.includes(player2)) {
        return {
          isValid: false,
          errorMessage: `Invalid pairing in round ${round}: ${player1} and ${player2} have already played.`,
        };
      }
      currentPlayedMatches[player1] = [...(currentPlayedMatches[player1] || []), player2];
      currentPlayedMatches[player2] = [...(currentPlayedMatches[player2] || []), player1];

      // 4. No player appears more than once in the values for a round
      if (playersInRound.has(player1) || playersInRound.has(player2)) {
        return {
          isValid: false,
          errorMessage: `Invalid pairing in round ${round}: ${player1} or ${player2} appears more than once.`,
        };
      }
      playersInRound.add(player1);
      playersInRound.add(player2);
    }
  }

  return { isValid: true };
}
