import { PlayedOpponents, ReadonlyPlayedOpponents, ReadonlyRoundMatches } from '../types.js';

/**
 * Creates a mutable clone of the played opponents map
 * @param {ReadonlyPlayedOpponents} playedOpponents - The original played opponents map
 * @returns {PlayedOpponents} A mutable clone of the played opponents map
 */
export function mutableClonePlayedOpponents(playedOpponents: ReadonlyPlayedOpponents): PlayedOpponents {
  return new Map(Array.from(playedOpponents, ([key, set]) => [key, new Set(set)]));
}
