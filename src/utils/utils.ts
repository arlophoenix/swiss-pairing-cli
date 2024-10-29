import { CLIArg, InputOrigin, Result, Team } from '../types/types.js';

import { createInvalidInputError } from './errorUtils.js';

export * from './errorUtils.js';

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
 * Creates a mutable clone of a bidirectional map.
 * @param {ReadonlyMap<T, ReadonlySet<T>>} input - The original bidirectional map
 * @returns {Map<T, Set<T>>} A mutable clone of the bidirectional map
 */
// eslint-disable-next-line functional/prefer-readonly-type
export function mutableCloneBidirectionalMap<T>(input: ReadonlyMap<T, ReadonlySet<T>>): Map<T, Set<T>> {
  return new Map(Array.from(input, ([key, set]) => [key, new Set(set)]));
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

// TODO: this errorInfo seems like a bad pattern. The error should be created in the function that calls this one.
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
  return team.squad && team.squad.trim().length > 0 ? `${team.name} [${team.squad}]` : team.name;
}

const TEAM_STRING_REGEX = /^\s*([^\[\]]+)\s*(\[\s*([^\[\]]+)\s*\])?\s*$/;

/**
 * Validates a string representation of a team.
 * @param {string} str - The string to validate
 * @returns {boolean} true if the string can be converted to a Team object, false otherwise
 */
export function isValidTeamString(str: string): boolean {
  const match = TEAM_STRING_REGEX.exec(str.trim());
  if (!match) {
    return false;
  }

  const [_0, _name, _2, squad] = match;
  return !squad || squad.trim() !== '';
}

/**
 * Converts a string representation of a team to a Team object.
 * @param {string} str - The string to convert
 * @returns {Team} A Team object
 */
export function stringToTeam(str: string): Team {
  const match = TEAM_STRING_REGEX.exec(str.trim());
  if (!match || !isValidTeamString(str)) {
    return { name: str.trim(), squad: undefined };
  }

  const [_0, name, _2, squad] = match;
  return {
    name: name.trim(),
    squad: squad ? squad.trim() : undefined,
  };
}
