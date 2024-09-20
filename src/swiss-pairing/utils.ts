import { PlayedMatches, ReadonlyPlayedMatches } from '../types.js';

/**
 * Creates a mutable clone of the played matches map
 * @param {ReadonlyPlayedMatches} playedMatches - The original played matches map
 * @returns {PlayedMatches} A mutable clone of the played matches map
 */
export function mutableClonePlayedMatches(playedMatches: ReadonlyPlayedMatches): PlayedMatches {
  return new Map(Array.from(playedMatches, ([key, set]) => [key, new Set(set)]));
}
