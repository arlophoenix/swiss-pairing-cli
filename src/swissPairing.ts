// src/swissPairing.ts
import { SwissPairingInput } from './types';

export function generatePairings({ players, rounds, playedMatches }: SwissPairingInput): string[][] {
  // Implement your Swiss pairing logic here
  // Return an array of pairings
  return [];
}

export function validateInput({ players, rounds, playedMatches }: SwissPairingInput): boolean {
  // Check if there are at least two players
  if (players.length < 2) {
    return false;
  }

  // Check for duplicate players
  if (new Set(players).size !== players.length) {
    return false;
  }

  // Check if rounds is at least 1
  if (rounds < 1) {
    return false;
  }

  // Check if rounds is not greater than players minus 1
  if (rounds > players.length - 1) {
    return false;
  }

  // Check if all players in playedMatches are valid
  const playedMatchesPlayers = new Set([...Object.keys(playedMatches), ...Object.values(playedMatches).flat()]);
  if (!Array.from(playedMatchesPlayers).every((player) => players.includes(player))) {
    return false;
  }

  // Check if playedMatches is symmetrical
  for (const [player, opponents] of Object.entries(playedMatches)) {
    for (const opponent of opponents) {
      if (!playedMatches[opponent] || !playedMatches[opponent].includes(player)) {
        return false;
      }
    }
  }

  // If all checks pass, return true
  return true;
}
