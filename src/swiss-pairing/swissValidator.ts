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

  const allTeamsInPlayedMatches = new Set<string>();
  for (const [team, opponents] of playedOpponents.entries()) {
    allTeamsInPlayedMatches.add(team);
    for (const opponent of opponents) {
      allTeamsInPlayedMatches.add(opponent);
    }
  }

  for (const team of allTeamsInPlayedMatches.keys()) {
    if (!teams.includes(team)) {
      return { success: false, message: `Unknown team in match history: "${team}"` };
    }
  }

  for (const [team, opponents] of playedOpponents.entries()) {
    for (const opponent of opponents) {
      if (!playedOpponents.get(opponent)?.has(team)) {
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
  const resultNumRounds = Object.keys(roundMatches).length;

  if (resultNumRounds !== numRounds) {
    return {
      success: false,
      message: `Generated ${String(resultNumRounds)} rounds but expected ${String(numRounds)}`,
    };
  }

  const currentPlayedMatches = mutableCloneBidirectionalMap(playedOpponents);

  for (const [roundLabel, matches] of Object.entries(roundMatches)) {
    if (matches.length !== numGamesPerRound) {
      return {
        success: false,
        message: `${roundLabel} has ${String(matches.length)} matches but expected ${String(numGamesPerRound)}`,
      };
    }

    const teamsInRound = new Set<string>();

    for (const [team1, team2] of matches) {
      if (currentPlayedMatches.get(team1)?.has(team2)) {
        return {
          success: false,
          message: `${team1} and ${team2} have already played each other`,
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
