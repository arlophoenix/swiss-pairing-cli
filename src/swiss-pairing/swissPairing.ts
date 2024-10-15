import {
  GenerateRoundMatchesInput,
  PlayedOpponents,
  ReadonlyMatch,
  ReadonlyPlayedOpponents,
  ReadonlyRoundMatches,
  Result,
} from '../types/types.js';
import { validateRoundMatchesInput, validateRoundMatchesOutput } from './validation.js';

import { createBidirectionalMap } from '../utils/utils.js';
import { mutableClonePlayedOpponents } from './utils.js';

/**
 * Generates multiple rounds worth of matches for a Swiss-style tournament
 * @param {GenerateRoundMatchesInput} input - The input parameters for generating matches
 * @returns {GenerateRoundMatchesOutput} The generated matches or an error
 */
export function generateRoundMatches({
  teams,
  numRounds,
  startRound,
  playedOpponents,
}: GenerateRoundMatchesInput): Result<ReadonlyRoundMatches> {
  const inputValidation = validateRoundMatchesInput({ teams, numRounds, playedOpponents });

  if (!inputValidation.success) {
    return inputValidation;
  }

  const roundMatches: ReadonlyRoundMatches = {};

  let currentPlayedOpponents = mutableClonePlayedOpponents(playedOpponents);

  for (let roundNumber = 1; roundNumber <= numRounds; roundNumber++) {
    const roundLabel = `Round ${String(startRound + roundNumber - 1)}`;
    const newMatches = generateSingleRoundMatches({
      teams,
      playedOpponents: currentPlayedOpponents,
    });

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

    currentPlayedOpponents = updatePlayedOpponents({ currentPlayedOpponents, newMatches });
  }

  const resultValidation = validateRoundMatchesOutput({
    teams,
    roundMatches,
    numRounds,
    playedOpponents,
  });

  if (!resultValidation.success) {
    return resultValidation;
  }

  return { success: true, value: roundMatches };
}

/**
 * Updates the played opponents with new opponents
 * @param {ReadonlyPlayedOpponents} currentPlayedOpponents - The current played opponents
 * @param {readonly ReadonlyMatch[]} newMatches - The new matches to add
 * @returns {PlayedOpponents} The updated played opponents
 */
function updatePlayedOpponents({
  currentPlayedOpponents,
  newMatches,
}: {
  readonly currentPlayedOpponents: ReadonlyPlayedOpponents;
  readonly newMatches: readonly ReadonlyMatch[];
}): PlayedOpponents {
  const updatedPlayedOpponents = mutableClonePlayedOpponents(currentPlayedOpponents);
  const newPlayedOpponents = createBidirectionalMap(newMatches);

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
 * Generates matches for a single round
 * @param {Object} params - The parameters for generating matches
 * @param {readonly string[]} params.teams - The list of teams
 * @param {ReadonlyPlayedOpponents} params.playedMatches - The matches already played
 * @returns {readonly ReadonlyMatch[] | null} The generated matches or null if no valid matches are possible
 */
function generateSingleRoundMatches({
  teams,
  playedOpponents,
}: {
  readonly teams: readonly string[];
  readonly playedOpponents: ReadonlyPlayedOpponents;
}): readonly ReadonlyMatch[] | null {
  // Base case: if no teams left, we've successfully paired everyone
  if (teams.length === 0) {
    return [];
  }

  const [currentTeam, ...remainingTeams] = teams;

  // Try to pair the current team with each remaining team
  for (const opponent of remainingTeams) {
    // Skip if these teams have already played each other
    if (!playedOpponents.get(currentTeam)?.has(opponent)) {
      // Recursively generate matches for the remaining teams
      const newMatches = generateSingleRoundMatches({
        teams: remainingTeams.filter((p) => p !== opponent),
        playedOpponents,
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
