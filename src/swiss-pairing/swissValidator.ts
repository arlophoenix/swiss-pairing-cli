import { ARG_MATCHES, ARG_NUM_ROUNDS, ARG_TEAMS } from '../constants.js';
import { BooleanResult, ReadonlyPlayedOpponents, ReadonlyRoundMatches } from '../types/types.js';

import { mutableCloneBidirectionalMap } from './swissPairingUtils.js';

/**
 * Validates the input for generating round matches
 * @param {Object} params - The parameters to validate
 * @param {readonly string[]} params.teams - The list of teams
 * @param {number} params.numRounds - The number of rounds to generate
 * @param {ReadonlyPlayedOpponents} params.playedMatches - The matches already played
 * @param {ReadonlyMap<string, string>} params.squadMap - The map of teams to squads
 * @returns {BooleanResult} The result of the validation
 */
export function validateRoundMatchesInput({
  teams,
  numRounds,
  playedOpponents,
  squadMap,
}: {
  readonly teams: readonly string[];
  readonly numRounds: number;
  readonly playedOpponents: ReadonlyPlayedOpponents;
  readonly squadMap: ReadonlyMap<string, string>;
}): BooleanResult {
  // Check if there are at least two teams
  if (teams.length < 2) {
    return {
      success: false,
      error: { type: 'InvalidInput', message: `there must be at least two ${ARG_TEAMS}.` },
    };
  }

  // Check there is an even number of teams
  if (teams.length % 2 !== 0) {
    return {
      success: false,
      error: { type: 'InvalidInput', message: `there must be an even number of ${ARG_TEAMS}.` },
    };
  }

  // Check for duplicate teams
  if (new Set(teams).size !== teams.length) {
    return {
      success: false,
      error: { type: 'InvalidInput', message: `duplicate ${ARG_TEAMS} are not allowed.` },
    };
  }

  // Check if rounds is at least 1
  if (numRounds < 1) {
    return {
      success: false,
      error: { type: 'InvalidInput', message: `${ARG_NUM_ROUNDS} to generate must be at least 1.` },
    };
  }

  // Check if rounds is not greater than teams minus 1
  if (numRounds >= teams.length) {
    return {
      success: false,
      error: {
        type: 'InvalidInput',
        message: `${ARG_NUM_ROUNDS} to generate must be fewer than the number of ${ARG_TEAMS}.`,
      },
    };
  }

  // Check if all teams in playedMatches are valid
  const allTeamsInPlayedMatches = new Set<string>();
  for (const [team, opponents] of playedOpponents.entries()) {
    allTeamsInPlayedMatches.add(team);
    for (const opponent of opponents) {
      allTeamsInPlayedMatches.add(opponent);
    }
  }

  for (const team of allTeamsInPlayedMatches.keys()) {
    if (!teams.includes(team)) {
      return {
        success: false,
        error: { type: 'InvalidInput', message: `${ARG_MATCHES} contains invalid team name: '${team}'.` },
      };
    }
  }

  // Check if playedMatches is symmetrical
  for (const [team, opponents] of playedOpponents.entries()) {
    for (const opponent of opponents) {
      if (!playedOpponents.get(opponent)?.has(team)) {
        return {
          success: false,
          error: { type: 'InvalidInput', message: `${ARG_MATCHES} are not symmetrical.` },
        };
      }
    }
  }

  // Check if all teams in squadMap are valid
  for (const team of squadMap.keys()) {
    if (!teams.includes(team)) {
      return {
        success: false,
        error: { type: 'InvalidInput', message: `squadMap contains invalid team name: '${team}'.` },
      };
    }
  }

  // If all checks pass, return true
  return { success: true };
}

/**
 * Validates the result of generating round matches
 * @param {Object} params - The parameters to validate
 * @param {ReadonlyRoundMatches} params.roundMatches - The generated round matches
 * @param {readonly string[]} params.teams - The list of teams
 * @param {number} params.numRounds - The number of rounds generated
 * @param {ReadonlyPlayedOpponents} params.playedMatches - The matches already played
 * @param {ReadonlyMap<string, string>} params.squadMap - The map of teams to squads
 * @returns {BooleanResult} The result of the validation
 */
export function validateRoundMatchesOutput({
  roundMatches,
  teams,
  numRounds,
  playedOpponents,
  squadMap,
}: {
  readonly roundMatches: ReadonlyRoundMatches;
  readonly teams: readonly string[];
  readonly numRounds: number;
  readonly playedOpponents: ReadonlyPlayedOpponents;
  readonly squadMap: ReadonlyMap<string, string>;
}): BooleanResult {
  const numGamesPerRound = teams.length / 2;

  // 1. There is one key per round in the record
  const resultNumRounds = Object.keys(roundMatches).length;
  if (resultNumRounds !== numRounds) {
    return {
      success: false,
      error: {
        type: 'InvalidOutput',
        message: `invalid number of rounds in the result. Expected ${String(numRounds)}, got ${String(resultNumRounds)}.`,
      },
    };
  }

  const currentPlayedMatches = mutableCloneBidirectionalMap(playedOpponents);

  for (const [roundLabel, matches] of Object.entries(roundMatches)) {
    // 2. There are num teams / 2 values per round
    if (matches.length !== numGamesPerRound) {
      return {
        success: false,
        error: {
          type: 'InvalidOutput',
          message: `invalid number of matches in ${roundLabel}. Expected ${String(numGamesPerRound)}, got ${String(matches.length)}.`,
        },
      };
    }

    const teamsInRound = new Set<string>();

    for (const [team1, team2] of matches) {
      // 3. No round contains a match of teams who are already listed in playedMatches
      if (currentPlayedMatches.get(team1)?.has(team2)) {
        return {
          success: false,
          error: {
            type: 'InvalidOutput',
            message: `invalid match in ${roundLabel}: ${team1} and ${team2} have already played.`,
          },
        };
      }

      if (currentPlayedMatches.get(team1) === undefined) {
        currentPlayedMatches.set(team1, new Set());
      }
      if (currentPlayedMatches.get(team2) === undefined) {
        currentPlayedMatches.set(team2, new Set());
      }
      currentPlayedMatches.get(team1)?.add(team2);
      currentPlayedMatches.get(team2)?.add(team1);

      // 4. No team appears more than once in the values for a round
      if (teamsInRound.has(team1) || teamsInRound.has(team2)) {
        return {
          success: false,
          error: {
            type: 'InvalidOutput',
            message: `invalid match in ${roundLabel}: ${team1} or ${team2} appears more than once.`,
          },
        };
      }
      teamsInRound.add(team1);
      teamsInRound.add(team2);

      // 5. No teams from the same squad are paired
      if (squadMap.get(team1) === squadMap.get(team2) && squadMap.get(team1) !== undefined) {
        return {
          success: false,
          error: {
            type: 'InvalidOutput',
            message: `invalid match in ${roundLabel}: ${team1} and ${team2} are from the same squad.`,
          },
        };
      }
    }
  }

  return { success: true };
}
