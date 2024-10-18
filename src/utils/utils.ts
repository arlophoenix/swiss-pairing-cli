import {
  CLIArg,
  InputOrigin,
  PlayedOpponents,
  PlayedTeams,
  ReadonlyMatch,
  ReadonlyPlayedOpponents,
  ReadonlyPlayedTeams,
  ReadonlyTeamMatch,
  Result,
  Team,
} from '../types/types.js';

import { createInvalidInputError } from './errorUtils.js';

/**
 * Creates a bidirectional map from an array of pairs.
 * Each element in a pair becomes a key in the map, with its partner added to its corresponding set of values.
 *
 * @template T The type of elements in the pairs
 * @param {readonly (readonly [T, T])[]} pairs - An array of paired elements
 * @returns {ReadonlyMap<T, ReadonlySet<T>>} A map where each element of a pair is a key,
 *          and its value is a set containing all elements it was paired with
 */
export function createBidirectionalMap<T>(
  pairs: readonly (readonly [T, T])[] = []
): ReadonlyMap<T, ReadonlySet<T>> {
  // eslint-disable-next-line functional/prefer-readonly-type
  const bidirectionalMap = new Map<T, Set<T>>();

  pairs.forEach(([a, b]) => {
    if (!bidirectionalMap.has(a)) {
      bidirectionalMap.set(a, new Set());
    }
    if (!bidirectionalMap.has(b)) {
      bidirectionalMap.set(b, new Set());
    }
    bidirectionalMap.get(a)?.add(b);
    bidirectionalMap.get(b)?.add(a);
  });

  return bidirectionalMap;
}

/**
 * Shuffles an array using the Fisher-Yates algorithm
 * @param {readonly T[]} array - The array to shuffle
 * @returns {readonly T[]} A new shuffled array
 */
export function shuffle<T>(array: readonly T[]): readonly T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Reverse a list without modifying the original
 * @param {readonly T[]} teams - The original array
 * @returns {readonly T[]} A new reversed array
 */
export function reverse<T>(array: readonly T[]): readonly T[] {
  return [...array].reverse();
}

export function parseStringLiteral<T extends string>({
  input,
  options,
  errorInfo,
}: {
  readonly input: string;
  readonly options: readonly T[];
  readonly errorInfo?: {
    readonly origin: InputOrigin;
    readonly argName: CLIArg;
  };
}): Result<T> {
  if (options.includes(input as T)) {
    return { success: true, value: input as T };
  }
  return {
    success: false,
    error: errorInfo
      ? createInvalidInputError({
          origin: errorInfo.origin,
          argName: errorInfo.argName,
          inputValue: input,
          expectedValue: options,
        })
      : {
          type: 'InvalidInput',
          message: `Invalid value: "${input}". Expected one of "${options.join(',')}".`,
        },
  };
}

/**
 * Converts a Team object to a string representation.
 * @param {Team} team - The team to convert
 * @returns {string} A string representation of the team
 */
export function teamToString(team: Team): string {
  return team.squad ? `${team.name} [${team.squad}]` : team.name;
}

/**
 * Converts a string representation of a team to a Team object.
 * @param {string} str - The string to convert
 * @returns {Team} A Team object
 */
export function stringToTeam(str: string): Team {
  const match = /^(.+?)(\s+\[(.+)\])?$/.exec(str);
  if (match) {
    return { name: match[1].trim(), squad: match[3] };
  }
  return { name: str.trim(), squad: undefined };
}

/**
 * Converts a string-based Match to a Team-based TeamMatch.
 * @param {ReadonlyMatch} match - The string-based match to convert
 * @returns {ReadonlyTeamMatch} A Team-based match
 */
export function matchToTeamMatch(match: ReadonlyMatch): ReadonlyTeamMatch {
  return [stringToTeam(match[0]), stringToTeam(match[1])];
}

/**
 * Converts a Team-based TeamMatch to a string-based Match.
 * @param {ReadonlyTeamMatch} teamMatch - The Team-based match to convert
 * @returns {ReadonlyMatch} A string-based match
 */
export function teamMatchToMatch(teamMatch: ReadonlyTeamMatch): ReadonlyMatch {
  return [teamToString(teamMatch[0]), teamToString(teamMatch[1])];
}

/**
 * Converts a string-based PlayedOpponents map to a Team-based PlayedTeams map.
 * @param {ReadonlyPlayedOpponents} playedOpponents - The string-based map to convert
 * @returns {PlayedTeams} A Team-based map of played teams
 */
export function playedOpponentsToPlayedTeams(playedOpponents: ReadonlyPlayedOpponents): PlayedTeams {
  // eslint-disable-next-line functional/prefer-readonly-type
  const playedTeams = new Map<Team, Set<Team>>();
  for (const [team, opponents] of playedOpponents.entries()) {
    const teamObj = stringToTeam(team);
    playedTeams.set(teamObj, new Set([...opponents].map(stringToTeam)));
  }
  return playedTeams;
}

/**
 * Converts a Team-based PlayedTeams map to a string-based PlayedOpponents map.
 * @param {ReadonlyPlayedTeams} playedTeams - The Team-based map to convert
 * @returns {PlayedOpponents} A string-based map of played opponents
 */
export function playedTeamsToPlayedOpponents(playedTeams: ReadonlyPlayedTeams): PlayedOpponents {
  // eslint-disable-next-line functional/prefer-readonly-type
  const playedOpponents = new Map<string, Set<string>>();
  for (const [team, opponents] of playedTeams.entries()) {
    const teamStr = teamToString(team);
    playedOpponents.set(teamStr, new Set([...opponents].map(teamToString)));
  }
  return playedOpponents;
}
