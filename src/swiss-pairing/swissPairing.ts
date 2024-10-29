import {
  PlayedTeams,
  ReadonlyMatch,
  ReadonlyPlayedTeams,
  ReadonlyRoundMatches,
  Result,
} from '../types/types.js';
import { createBidirectionalMap, mutableCloneBidirectionalMap } from './swissPairingUtils.js';

/**
 * Generates multiple rounds of matches for a Swiss-style tournament.
 * @param {Object} params - The input parameters
 * @param {readonly string[]} params.teams - The list of teams.
 * @param {readonly number} params.numRounds - The number of rounds of matches to generate.
 * @param {readonly number} params.startRound - The number with which to label the first round generated.
 * @param {ReadonlyPlayedTeams} params.playedTeams - The teams already played.
 * @param {ReadonlyMap<string, string>} [params.squadMap] - A map of team names to squad names.
 * @returns {Result<ReadonlyRoundMatches>} The generated matches or an error.
 */
export function generateRoundMatches({
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
}): Result<ReadonlyRoundMatches> {
  const roundMatches: ReadonlyRoundMatches = {};
  let currentPlayedTeams = mutableCloneBidirectionalMap(playedTeams);

  for (let roundNumber = 0; roundNumber < numRounds; roundNumber++) {
    const roundLabel = `Round ${String(startRound + roundNumber)}`;
    const newMatches = generateSingleRoundMatches({
      teams,
      playedTeams: currentPlayedTeams,
      squadMap,
    });

    if (!newMatches) {
      return {
        success: false,
        message: `No valid pairings possible for ${roundLabel}`,
      };
    }

    // eslint-disable-next-line functional/immutable-data
    roundMatches[roundLabel] = newMatches;
    currentPlayedTeams = updatePlayedTeams({ currentPlayedTeams, newMatches });
  }

  return { success: true, value: roundMatches };
}

/**
 * Updates the played teams map with new matches.
 * @param {Object} params - The input parameters
 * @param {ReadonlyPlayedTeams} params.currentPlayedTeams - The current played teams map.
 * @param {readonly ReadonlyMatch[]} params.newMatches - The new matches to add.
 * @returns {PlayedTeams} The updated played teams map.
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
 * Generates matches for a single round using a recursive backtracking algorithm.
 * @param {Object} params - The parameters for generating matches.
 * @param {readonly string[]} params.teams - The list of teams.
 * @param {ReadonlyPlayedTeams} params.playedTeams - The matches already played.
 * @param {ReadonlyMap<string, string>} [params.squadMap] - A map of team names to squad names.
 * @returns {readonly ReadonlyMatch[] | null} The generated matches or null if no valid matches are possible.
 */
function generateSingleRoundMatches({
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
      const newMatches = generateSingleRoundMatches({
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
