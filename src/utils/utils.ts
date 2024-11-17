/**
 * Core utility functions for Swiss tournament pairing.
 * Provides pure functions for:
 * - Data structure manipulation
 * - Team and squad parsing
 * - Array operations
 * - Type validation
 *
 * @module utils
 */

import { Environment, Result, Team } from '../types/types.js';

import { PROJECT_NAME } from '../constants.js';
import { detectExecutionContext } from './detectExecutionContext.js';
import os from 'os';
import path from 'path';

export * from './detectExecutionContext.js';

export * from './errorUtils.js';

/**
 * Creates a bidirectional map from pairs of items.
 * Each item in a pair becomes a key pointing to a set of its partners.
 *
 * @template T - Type of items in the pairs
 * @param pairs - Array of item pairs to map
 * @returns Map where each item points to all items it was paired with
 *
 * @example
 * const matches = [["A", "B"], ["A", "C"]];
 * const map = createBidirectionalMap(matches);
 * // map.get("A") -> Set(["B", "C"])
 * // map.get("B") -> Set(["A"])
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
 * Deep clones both the map and its contained sets.
 *
 * @template T - Type of map keys and set values
 * @param input - Original bidirectional map to clone
 * @returns Mutable clone of the map and its sets
 */
export function mutableCloneBidirectionalMap<T>(
  input: ReadonlyMap<T, ReadonlySet<T>>
  // eslint-disable-next-line functional/prefer-readonly-type
): Map<T, Set<T>> {
  return new Map(Array.from(input, ([key, set]) => [key, new Set(set)]));
}

/**
 * Shuffles an array using Fisher-Yates algorithm.
 * Creates a new array; does not modify input.
 *
 * @template T - Type of array elements
 * @param array - Array to shuffle
 * @returns New array with elements in random order
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
 * Reverses an array without modifying the original.
 *
 * @template T - Type of array elements
 * @param array - Array to reverse
 * @returns New array with elements in reverse order
 */
export function reverse<T>(array: readonly T[]): readonly T[] {
  return [...array].reverse();
}

/**
 * Validates a string value against a set of allowed options.
 *
 * @template T - String literal type of valid options
 * @param input - String to validate
 * @param options - Array of valid option values
 * @returns Validated value or error message
 *
 * @example
 * const result = parseStringLiteral({
 *   input: "green",
 *   options: ["red", "green", "blue"] as const
 * });
 */
export function parseStringLiteral<T extends string>({
  input,
  options,
}: {
  readonly input: string;
  readonly options: readonly T[];
}): Result<T> {
  if (options.includes(input as T)) {
    return { success: true, value: input as T };
  }
  return {
    success: false,
    message: `Invalid value: "${input}". Expected one of "${options.join(', ')}"`,
  };
}

/**
 * Converts a Team object to string representation.
 * Format: "name [squad]" or just "name" if no squad.
 *
 * @param team - Team to convert
 * @returns String representation of team
 */
export function teamToString(team: Team): string {
  return team.squad && team.squad.trim().length > 0 ? `${team.name} [${team.squad}]` : team.name;
}

// Regular expression for parsing team strings
const TEAM_STRING_REGEX = /^\s*([^\[\]]+)\s*(\[\s*([^\[\]]+)\s*\])?\s*$/;

/**
 * Validates a string representation of a team.
 * Valid formats: "name" or "name [squad]"
 *
 * @param str - String to validate
 * @returns true if string can be parsed as a team
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
 * Converts a string to a Team object.
 * Parses team name and optional squad from string.
 *
 * @param str - String to parse
 * @returns Parsed Team object
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

/**
 * Determines the current environment context based on environment variables
 * and execution context. Priority order:
 * 1. CI environment
 * 2. Test environment
 * 3. Development environment
 * 4. Local install (development)
 * 5. Global/npx install (production)
 *
 * @returns The detected environment context
 */
export function detectEnvironment(): Environment {
  if (process.env.CI) {
    return 'ci';
  }
  if (process.env.NODE_ENV === 'test') {
    return 'test';
  }
  if (process.env.NODE_ENV === 'development') {
    return 'development';
  }
  // Global/npx installs are "production", local installs are "development"
  const context = detectExecutionContext();
  return context === 'local' ? 'development' : 'production';
}

/**
 * Resolves OS-specific config paths.
 */
export function getConfigPath(): string {
  const configDir =
    process.platform === 'win32'
      ? (process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming'))
      : (process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), '.config'));

  return path.join(configDir, PROJECT_NAME);
}
