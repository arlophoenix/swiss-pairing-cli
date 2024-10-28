import {
  PlayedOpponents,
  ReadonlyMatch,
  ReadonlyPlayedOpponents,
  ReadonlyRoundMatches,
  Result,
} from '../types/types.js';
import { createBidirectionalMap, mutableCloneBidirectionalMap } from './swissPairingUtils.js';
import { validateRoundMatchesInput, validateRoundMatchesOutput } from './swissValidator.js';

/**
 * Generates multiple rounds of matches for a Swiss-style tournament.
 * @param {Object} params - The parameters for updating played opponents.
 * @param {readonly string[]} params.teams - The list of teams.
 * @param {readonly number} params.numRounds - The number of rounds of matches to generate.
 * @param {readonly number} params.startRound - The number with which to label the first round generated.
 * @param {ReadonlyPlayedOpponents} params.playedOpponents - The matches already played.
 * @param {ReadonlyMap<string, string>} [params.squadMap] - A map of team names to squad names.
 * @returns {Result<ReadonlyRoundMatches>} The generated matches or an error.
 */
export function generateRoundMatches({
  teams,
  numRounds,
  startRound,
  playedOpponents,
  squadMap = new Map(),
}: {
  readonly teams: readonly string[];
  readonly numRounds: number;
  readonly startRound: number;
  readonly playedOpponents: ReadonlyPlayedOpponents;
  readonly squadMap?: ReadonlyMap<string, string>;
}): Result<ReadonlyRoundMatches> {
  // Validate input parameters
  const inputValidation = validateRoundMatchesInput({ teams, numRounds, playedOpponents, squadMap });
  if (!inputValidation.success) {
    return inputValidation;
  }

  const roundMatches: ReadonlyRoundMatches = {};
  let currentPlayedOpponents = mutableCloneBidirectionalMap(playedOpponents);

  // Generate matches for each round
  for (let roundNumber = 0; roundNumber < numRounds; roundNumber++) {
    const roundLabel = `Round ${String(startRound + roundNumber)}`;
    const newMatches = generateSingleRoundMatches({
      teams,
      playedOpponents: currentPlayedOpponents,
      squadMap,
    });

    // If unable to generate valid matches for a round, return an error
    if (!newMatches) {
      return {
        success: false,
        error: {
          type: 'NoValidSolution',
          message: `unable to generate valid matches for ${roundLabel}.`,
        },
      };
    }
    // eslint-disable-next-line functional/immutable-data
    roundMatches[roundLabel] = newMatches;

    // Update played opponents for the next round
    currentPlayedOpponents = updatePlayedOpponents({ currentPlayedOpponents, newMatches });
  }

  // Validate the generated matches
  const resultValidation = validateRoundMatchesOutput({
    teams,
    roundMatches,
    numRounds,
    playedOpponents,
    squadMap,
  });

  if (!resultValidation.success) {
    return resultValidation;
  }

  return { success: true, value: roundMatches };
}

/**
 * Updates the played opponents map with new matches.
 * @param {Object} params - The parameters for updating played opponents.
 * @param {ReadonlyPlayedOpponents} params.currentPlayedOpponents - The current played opponents map.
 * @param {readonly ReadonlyMatch[]} params.newMatches - The new matches to add.
 * @returns {PlayedOpponents} The updated played opponents map.
 */
function updatePlayedOpponents({
  currentPlayedOpponents,
  newMatches,
}: {
  readonly currentPlayedOpponents: ReadonlyPlayedOpponents;
  readonly newMatches: readonly ReadonlyMatch[];
}): PlayedOpponents {
  const updatedPlayedOpponents = mutableCloneBidirectionalMap(currentPlayedOpponents);
  const newPlayedOpponents = createBidirectionalMap(newMatches);

  // Update the played opponents map with new matches
  for (const [team, newOpponents] of newPlayedOpponents.entries()) {
    if (!updatedPlayedOpponents.has(team)) {
      updatedPlayedOpponents.set(team, new Set());
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const currentOpponents = updatedPlayedOpponents.get(team)!;
    newOpponents.forEach((opponent) => currentOpponents.add(opponent));
  }

  return updatedPlayedOpponents;
}

/**
 * Generates matches for a single round using a recursive backtracking algorithm.
 * @param {Object} params - The parameters for generating matches.
 * @param {readonly string[]} params.teams - The list of teams.
 * @param {ReadonlyPlayedOpponents} params.playedOpponents - The matches already played.
 * @param {ReadonlyMap<string, string>} [params.squadMap] - A map of team names to squad names.
 * @returns {readonly ReadonlyMatch[] | null} The generated matches or null if no valid matches are possible.
 */
function generateSingleRoundMatches({
  teams,
  playedOpponents,
  squadMap,
}: {
  readonly teams: readonly string[];
  readonly playedOpponents: ReadonlyPlayedOpponents;
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
      !playedOpponents.get(currentTeam)?.has(opponent) &&
      (!currentSquad || currentSquad !== squadMap.get(opponent))
    ) {
      // Recursively generate matches for the remaining teams
      const newMatches = generateSingleRoundMatches({
        teams: remainingTeams.filter((p) => p !== opponent),
        playedOpponents,
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
