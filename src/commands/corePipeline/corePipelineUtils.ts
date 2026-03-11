/**
 * Utilities for the core tournament generation pipeline.
 * Handles post-generation transformations such as output ordering.
 *
 * @module corePipelineUtils
 */

import { ReadonlyMatch, Round } from '../../types/types.js';

/**
 * Sorts rounds so the highest-ranked game appears first in each round.
 * Within each match, the higher-ranked team is listed first.
 * Across matches in a round, the match containing the top-ranked team appears first.
 * Teams not present in orderedTeams (e.g. BYE) sort to the end.
 *
 * @param rounds - Rounds whose matches should be reordered
 * @param orderedTeams - Teams in rank order (index 0 = highest rank)
 * @returns New rounds array with matches sorted highest-rank-first
 */
export function sortRoundsHighestRankFirst({
  rounds,
  orderedTeams,
}: {
  readonly rounds: readonly Round[];
  readonly orderedTeams: readonly string[];
}): readonly Round[] {
  const rankOf = (team: string): number => {
    const idx = orderedTeams.indexOf(team);
    return idx === -1 ? orderedTeams.length : idx; // unknown teams (e.g. BYE) sort last
  };
  return rounds.map((round) => ({
    ...round,
    matches: round.matches
      .map(([a, b]): ReadonlyMatch => (rankOf(a) <= rankOf(b) ? [a, b] : [b, a]))
      .slice()
      // eslint-disable-next-line max-params
      .sort((a, b) => rankOf(a[0]) - rankOf(b[0])),
  }));
}
