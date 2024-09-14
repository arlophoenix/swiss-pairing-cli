// src/swissPairing.ts
import { SwissPairingInput } from './types.js';

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export function generatePairings({ players, rounds, playedMatches }: SwissPairingInput): Record<number, string[][]> {
  // Implement your Swiss pairing logic here
  // Return an array of pairings
  return [];
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
