/**
 * Swiss tournament pairing algorithm implementation.
 *
 * Generates optimal pairings for tournament rounds based on:
 * - Previous match history (teams shouldn't play each other twice)
 * - Squad constraints (teams in same squad cannot play each other)
 * - Swiss tournament rules (matches generated in rank order)
 *
 * Uses recursive backtracking to find valid pairings.
 *
 * @module swiss-pairing
 */

import {
  ErrorTemplate,
  createBidirectionalMap,
  formatError,
  mutableCloneBidirectionalMap,
} from './swissPairingUtils.js';
import {
  PlayedTeams,
  ReadonlyMatch,
  ReadonlyPlayedTeams,
  Result,
  Round,
  SwissPairingResult,
} from '../types/types.js';

/**
 * Generates multiple rounds of Swiss tournament pairings.
 *
 * @param teams - List of team names in rank order
 * @param numRounds - Number of rounds to generate
 * @param startRound - Starting round number for labeling
 * @param playedTeams - Map of previous matches between teams
 * @param squadMap - Optional map of team names to squad names
 * @returns Generated rounds or error message
 *
 * @example
 * const result = generateRounds({
 *   teams: ['Team1', 'Team2', 'Team3', 'Team4'],
 *   numRounds: 2,
 *   startRound: 1,
 *   playedTeams: new Map(),
 *   squadMap: new Map([['Team1', 'A'], ['Team2', 'A']])
 * });
 */
export function generateRounds({
  teams,
  numRounds,
  startRound,
  playedTeams,
  squadMap = new Map(),
}: {
  readonly teams: readonly string[];
  readonly numRounds: number;
  readonly startRound: number;
  readonly playedTeams: ReadonlyPlayedTeams;
  readonly squadMap?: ReadonlyMap<string, string>;
}): Result<SwissPairingResult> {
  let currentPlayedTeams = mutableCloneBidirectionalMap(playedTeams);
  // eslint-disable-next-line functional/prefer-readonly-type
  const rounds: Round[] = [];

  for (let roundNumber = 0; roundNumber < numRounds; roundNumber++) {
    const number = startRound + roundNumber;
    const label = `Round ${String(number)}`;

    const newMatches = generateSingleRound({
      teams,
      playedTeams: currentPlayedTeams,
      squadMap,
    });

    if (!newMatches) {
      return {
        success: false,
        message: formatError({
          template: ErrorTemplate.NO_VALID_PAIRINGS,
          values: { round: label },
        }),
      };
    }

    // eslint-disable-next-line functional/immutable-data
    rounds.push({ label, number, matches: newMatches });
    currentPlayedTeams = updatePlayedTeams({ currentPlayedTeams, newMatches });
  }

  return {
    success: true,
    value: {
      rounds,
    },
  };
}

/**
 * Updates the played teams map with new matches.
 * Creates bidirectional relationships between paired teams.
 *
 * @param currentPlayedTeams - Current map of played matches
 * @param newMatches - New matches to add to the map
 * @returns Updated played teams map
 */
function updatePlayedTeams({
  currentPlayedTeams,
  newMatches,
}: {
  readonly currentPlayedTeams: ReadonlyPlayedTeams;
  readonly newMatches: readonly ReadonlyMatch[];
}): PlayedTeams {
  const updatedPlayedTeams = mutableCloneBidirectionalMap(currentPlayedTeams);
  const newPlayedTeams = createBidirectionalMap(newMatches);

  // Update the played teams map with new matches
  for (const [team, newOpponents] of newPlayedTeams.entries()) {
    if (!updatedPlayedTeams.has(team)) {
      updatedPlayedTeams.set(team, new Set());
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const currentOpponents = updatedPlayedTeams.get(team)!;
    newOpponents.forEach((opponent) => currentOpponents.add(opponent));
  }

  return updatedPlayedTeams;
}

/**
 * Generates matches for a single round using recursive backtracking.
 * Ensures no teams play against previous opponents or squadmates.
 *
 * @param teams - Remaining teams to pair
 * @param playedTeams - Map of previous matches
 * @param squadMap - Optional squad assignments
 * @returns Generated matches or null if no valid pairings possible
 */
function generateSingleRound({
  teams,
  playedTeams,
  squadMap,
}: {
  readonly teams: readonly string[];
  readonly playedTeams: ReadonlyPlayedTeams;
  readonly squadMap: ReadonlyMap<string, string>;
}): readonly ReadonlyMatch[] | null {
  // Base case: if no teams left, we've successfully paired everyone
  if (teams.length === 0) {
    return [];
  }

  const [currentTeam, ...remainingTeams] = teams;
  const currentSquad = squadMap.get(currentTeam);

  // Try to pair the current team with each remaining team
  for (const opponent of remainingTeams) {
    // Skip if these teams have already played each other or are from the same squad
    if (
      !playedTeams.get(currentTeam)?.has(opponent) &&
      (!currentSquad || currentSquad !== squadMap.get(opponent))
    ) {
      // Recursively generate matches for the remaining teams
      const newMatches = generateSingleRound({
        teams: remainingTeams.filter((p) => p !== opponent),
        playedTeams,
        squadMap,
      });

      // If we found valid matches for the remaining teams, we're done
      if (newMatches !== null) {
        return [[currentTeam, opponent], ...newMatches];
      }
    }
  }

  // If we couldn't pair the current team with anyone, backtrack
  return null;
}
