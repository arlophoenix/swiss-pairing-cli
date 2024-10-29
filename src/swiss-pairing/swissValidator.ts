import { BooleanResult, ReadonlyPlayedTeams, ReadonlyRoundMatches } from '../types/types.js';

import { mutableCloneBidirectionalMap } from './swissPairingUtils.js';

/**
 * Validates the input for generating round matches
 * @param {Object} params - The parameters to validate
 * @param {readonly string[]} params.teams - The list of teams
 * @param {number} params.numRounds - The number of rounds to generate
 * @param {ReadonlyPlayedTeams} params.playedTeams - The matches already played
 * @param {ReadonlyMap<string, string>} params.squadMap - The map of teams to squads
 * @returns {BooleanResult} The result of the validation
 */
export function validateRoundMatchesInput({
  teams,
  numRounds,
  playedTeams,
  squadMap,
}: {
  readonly teams: readonly string[];
  readonly numRounds: number;
  readonly playedTeams: ReadonlyPlayedTeams;
  readonly squadMap: ReadonlyMap<string, string>;
}): BooleanResult {
  if (teams.length < 2) {
    return { success: false, message: 'Must have at least 2 teams' };
  }

  if (teams.length % 2 !== 0) {
    return { success: false, message: 'Must have an even number of teams' };
  }

  if (new Set(teams).size !== teams.length) {
    return { success: false, message: 'All team names must be unique' };
  }

  if (numRounds < 1) {
    return { success: false, message: 'Must generate at least one round' };
  }

  if (numRounds >= teams.length) {
    return {
      success: false,
      message: `Number of rounds (${String(numRounds)}) must be less than number of teams (${String(teams.length)})`,
    };
  }

  const allTeamsInPlayedTeams = new Set<string>();
  for (const [team, opponents] of playedTeams.entries()) {
    allTeamsInPlayedTeams.add(team);
    for (const opponent of opponents) {
      allTeamsInPlayedTeams.add(opponent);
    }
  }

  for (const team of allTeamsInPlayedTeams.keys()) {
    if (!teams.includes(team)) {
      return { success: false, message: `Unknown team in match history: "${team}"` };
    }
  }

  for (const [team, opponents] of playedTeams.entries()) {
    for (const opponent of opponents) {
      if (team === opponent) {
        return {
          success: false,
          message: `${team} cannot play against itself`,
        };
      }
      if (!playedTeams.get(opponent)?.has(team)) {
        return {
          success: false,
          message: `Match history must be symmetrical - found ${team} vs ${opponent} but not ${opponent} vs ${team}`,
        };
      }
    }
  }

  for (const team of squadMap.keys()) {
    if (!teams.includes(team)) {
      return { success: false, message: `Unknown team in squad assignments: "${team}"` };
    }
  }

  return { success: true };
}

/**
 * Validates the result of generating round matches
 * @param {Object} params - The parameters to validate
 * @param {ReadonlyRoundMatches} params.roundMatches - The generated round matches
 * @param {readonly string[]} params.teams - The list of teams
 * @param {number} params.numRounds - The number of rounds generated
 * @param {ReadonlyPlayedTeams} params.playedTeams - The matches already played
 * @param {ReadonlyMap<string, string>} params.squadMap - The map of teams to squads
 * @returns {BooleanResult} The result of the validation
 */
export function validateRoundMatchesOutput({
  roundMatches,
  teams,
  numRounds,
  playedTeams,
  squadMap,
}: {
  readonly roundMatches: ReadonlyRoundMatches;
  readonly teams: readonly string[];
  readonly numRounds: number;
  readonly playedTeams: ReadonlyPlayedTeams;
  readonly squadMap: ReadonlyMap<string, string>;
}): BooleanResult {
  const numGamesPerRound = teams.length / 2;
  const resultNumRounds = Object.keys(roundMatches).length;

  if (resultNumRounds !== numRounds) {
    return {
      success: false,
      message: `Generated ${String(resultNumRounds)} rounds but expected ${String(numRounds)}`,
    };
  }

  const currentPlayedTeams = mutableCloneBidirectionalMap(playedTeams);

  for (const [roundLabel, matches] of Object.entries(roundMatches)) {
    if (matches.length !== numGamesPerRound) {
      return {
        success: false,
        message: `${roundLabel} has ${String(matches.length)} matches but expected ${String(numGamesPerRound)}`,
      };
    }

    const teamsInRound = new Set<string>();

    for (const [team1, team2] of matches) {
      if (team1 === team2) {
        return {
          success: false,
          message: `${team1} cannot play against itself`,
        };
      }

      if (currentPlayedTeams.get(team1)?.has(team2)) {
        return {
          success: false,
          message: `Duplicate match found in history: ${team1} vs ${team2}`,
        };
      }

      if (currentPlayedTeams.get(team1) === undefined) {
        currentPlayedTeams.set(team1, new Set());
      }
      if (currentPlayedTeams.get(team2) === undefined) {
        currentPlayedTeams.set(team2, new Set());
      }
      currentPlayedTeams.get(team1)?.add(team2);
      currentPlayedTeams.get(team2)?.add(team1);

      if (teamsInRound.has(team1) || teamsInRound.has(team2)) {
        return {
          success: false,
          message: `${team1} or ${team2} is scheduled multiple times in ${roundLabel}`,
        };
      }
      teamsInRound.add(team1);
      teamsInRound.add(team2);

      if (squadMap.get(team1) === squadMap.get(team2) && squadMap.get(team1) !== undefined) {
        return {
          success: false,
          message: `${team1} and ${team2} cannot play each other - they are in the same squad`,
        };
      }
    }
  }

  return { success: true };
}
