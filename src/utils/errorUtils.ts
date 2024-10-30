/**
 * Error handling utilities for consistent error messages.
 * Uses template system to ensure error format consistency
 * while allowing for variable content.
 *
 * @module errorUtils
 */

import { CLIArg, FailureResult, InputOrigin } from '../types/types.js';

// Extract variables from template strings for type safety
type ExtractVariables<T extends string> = T extends `${string}\${${infer Var}}${infer Rest}`
  ? Var | ExtractVariables<Rest>
  : never;

// Ensure all template variables are provided
type TemplateVariables<T extends ErrorTemplate> = Record<ExtractVariables<T>, string | number>;

/**
 * Error message templates.
 * All messages must:
 * - Start with capital letter
 * - Not end with period
 * - Use double quotes for literals
 * - Use ${name} for variables
 */
export const enum ErrorTemplate {
  // File handling
  FILE_NOT_FOUND = 'File not found: "${path}"',
  FILE_READ_ERROR = 'Error reading file: ${error}',
  INVALID_FILE_TYPE = 'Invalid file type: expected one of ${types}',

  // Parsing
  PARSE_CSV_ERROR = 'Invalid CSV: ${error}',
  PARSE_JSON_ERROR = 'Invalid JSON: ${error}',
  NO_DATA = 'No data found in ${source}',

  // Validation
  INVALID_ARGUMENT = 'Invalid ${origin} argument "${name}": "${value}". Expected ${expected}',
  INVALID_VALUE = 'Invalid value: "${value}". Expected one of "${options}"',

  // Teams
  MIN_TEAMS = 'Must have at least 2 teams',
  EVEN_TEAMS = 'Must have an even number of teams',
  UNIQUE_TEAMS = 'All team names must be unique',
  UNKNOWN_TEAM = 'Unknown team in ${context}: "${team}"',
  SELF_PLAY = 'Team "${team}" cannot play against itself',
  ASYMMETRIC_MATCH = 'Match history must be symmetrical - found ${team1} vs ${team2} but not ${team2} vs ${team1}',
  SAME_SQUAD = 'Teams "${team1}" and "${team2}" cannot play each other - they are in the same squad',

  // Rounds
  MIN_ROUNDS = 'Must generate at least one round',
  MAX_ROUNDS = 'Number of rounds (${rounds}) must be less than number of teams (${teams})',
  ROUND_COUNT_MISMATCH = 'Generated ${actual} rounds but expected ${expected}',
  MATCH_COUNT_MISMATCH = '${round} has ${actual} matches but expected ${expected}',
  DUPLICATE_MATCH = 'Duplicate match found: "${team1}" vs "${team2}"',
  MULTIPLE_MATCHES = 'Teams "${team1}" or "${team2}" are scheduled multiple times in ${round}',
  NO_VALID_PAIRINGS = 'No valid pairings possible for ${round}',
  ROUND_NUMBER_SEQUENCE = '${round} has incorrect number ${actual} (should be ${expected})',

  // CLI Actions
  INVALID_INPUT = 'Invalid input: ${message}',
  GENERATION_FAILED = 'Failed to generate matches: ${message}',
}

/**
 * Creates error message from template and variables.
 * Type system ensures all required variables are provided.
 */
export function formatError<T extends ErrorTemplate>({
  template,
  values,
}: {
  readonly template: T;
  readonly values: TemplateVariables<T>;
}): string {
  // eslint-disable-next-line max-params
  return template.replace(/\${(\w+)}/g, (_, key) => String(values[key as keyof typeof values]));
}

/**
 * Creates validation error for CLI arguments.
 * Used when input value doesn't match expected format.
 */
export function createInvalidValueMessage({
  origin,
  argName,
  inputValue,
  expectedValue,
}: {
  readonly origin: InputOrigin;
  readonly argName: CLIArg;
  readonly inputValue: string;
  readonly expectedValue: string | readonly string[];
}): string {
  return formatError({
    template: ErrorTemplate.INVALID_ARGUMENT,
    values: {
      origin,
      name: argName,
      value: inputValue,
      expected: Array.isArray(expectedValue)
        ? `one of "${expectedValue.join(', ')}"`
        : (expectedValue as string),
    },
  });
}

/**
 * Wraps error with context about its source.
 * Used when converting between input formats.
 */
export function wrapErrorWithOrigin({
  error,
  origin,
}: {
  readonly error: string | FailureResult;
  readonly origin: InputOrigin;
}): FailureResult {
  const message = typeof error === 'string' ? error : error.message;
  return {
    success: false,
    message: `Invalid ${origin} data: ${message}`,
  };
}
