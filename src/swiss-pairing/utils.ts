import { PlayedMatches, ReadonlyPlayedMatches } from '../types.js';

export function mutableClonePlayedMatches(playedMatches: ReadonlyPlayedMatches): PlayedMatches {
  return new Map(Array.from(playedMatches, ([key, set]) => [key, new Set(set)]));
}
