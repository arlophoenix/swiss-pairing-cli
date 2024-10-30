/**
 * Common validation utilities.
 * Provides core validation functions for:
 * - Teams and squads
 * - Round numbers
 * - Match history
 * - File types
 * - Output formats
 *
 * Used by CLI, CSV, and JSON validators to ensure
 * consistent validation across input sources.
 *
 * @module validatorUtils
 */

import {
  ARG_FILE,
  ARG_FORMAT,
  ARG_MATCHES,
  ARG_NUM_ROUNDS,
  ARG_ORDER,
  ARG_START_ROUND,
  ARG_TEAMS,
  CLI_OPTION_FORMAT,
  CLI_OPTION_ORDER,
  SUPPORTED_FILE_TYPES,
} from '../constants.js';
import {
  CLIArg,
  InputOrigin,
  ReadonlyMatch,
  Result,
  Team,
  UnvalidatedCLIOptions,
  ValidatedCLIOptions,
} from '../types/types.js';
import {
  createInvalidValueMessage,
  isValidTeamString,
  parseStringLiteral,
  stringToTeam,
} from '../utils/utils.js';

import { extname } from 'path';

export * from '../utils/utils.js';

type Validator<K extends keyof ValidatedCLIOptions> = (
  input: UnvalidatedCLIOptions
) => Result<ValidatedCLIOptions[K] | undefined>;

/**
 * Core validation pipeline for all tournament options.
 * Validates each option independently and combines results.
 *
 * Note: Undefined values are allowed and treated as unset.
 * This enables partial configuration from different sources.
 *
 * @example
 * const result = validateAllOptions({
 *   input: { teams: ["A", "B"], numRounds: "2" },
 *   origin: "CLI"
 * });
 */
export function validateAllOptions({
  input,
  origin,
}: {
  readonly input: UnvalidatedCLIOptions;
  readonly origin: InputOrigin;
}): Result<Partial<ValidatedCLIOptions>> {
  // eslint-disable-next-line functional/prefer-readonly-type
  const validators: { [K in keyof ValidatedCLIOptions]: Validator<K> } = {
    teams: (i) => validateTeams({ teams: i.teams, origin }),
    numRounds: (i) => validateNumRounds({ numRounds: i.numRounds, origin }),
    startRound: (i) => validateStartRound({ startRound: i.startRound, origin }),
    order: (i) => validateOrder({ order: i.order, origin }),
    format: (i) => validateFormat({ format: i.format, origin }),
    matches: (i) => validateMatches({ matches: i.matches, origin }),
    file: (i) => validateFile({ file: i.file, origin }),
  };

  // Run all validators
  type ValidatorResult = {
    readonly [K in keyof ValidatedCLIOptions]: Result<ValidatedCLIOptions[K] | undefined>;
  };
  const results: ValidatorResult = Object.fromEntries(
    Object.entries(validators).map(([key, validator]) => [key, validator(input)])
  ) as ValidatorResult;

  // Return first error or combine successful results
  const firstError = Object.values(results).find(
    (result): result is { readonly success: false; readonly message: string } => !result.success
  );
  if (firstError) {
    return firstError;
  }

  const validatedOptions: Partial<ValidatedCLIOptions> = Object.fromEntries(
    Object.entries(results)
      .filter(
        (
          entry
          // eslint-disable-next-line functional/prefer-readonly-type
        ): entry is [
          keyof ValidatedCLIOptions,
          {
            readonly success: true;
            readonly value: Exclude<ValidatedCLIOptions[keyof ValidatedCLIOptions], undefined>;
          },
        ] => entry[1].success && entry[1].value !== undefined
      )
      .map(([key, result]) => [key, result.value])
  );

  return { success: true, value: validatedOptions };
}

/**
 * Validates a list of team names and their optional squad assignments.
 *
 * @param {Object} params - The parameters for validation
 * @param {readonly string[] | undefined} params.teams - Array of team names to validate
 * @param {InputOrigin} params.origin - The source of the input for error messaging
 * @returns {Result<readonly Team[] | undefined>} Success with validated teams or failure with message
 */
export function validateTeams({
  teams,
  origin,
}: {
  readonly teams: readonly string[] | undefined;
  readonly origin: InputOrigin;
}): Result<readonly Team[] | undefined> {
  // return success because the teams may be provided by either CLI or file input and be blank in the other
  if (teams === undefined) {
    return { success: true, value: undefined };
  }

  if (teams.length < 2) {
    return {
      success: false,
      message: createInvalidValueMessage({
        origin,
        argName: ARG_TEAMS,
        inputValue: teams.join(','),
        expectedValue: 'at least two teams',
      }),
    };
  }

  for (const team of teams) {
    if (!isValidTeamString(team)) {
      return {
        success: false,
        message: createInvalidValueMessage({
          origin,
          argName: ARG_TEAMS,
          inputValue: team,
          expectedValue: 'valid team name, optionally followed by [squad] e.g."Alice [Home]"',
        }),
      };
    }
  }

  const teamObjects: readonly Team[] = teams.map(stringToTeam);
  const uniqueTeamNames = new Set(teamObjects.map((team) => team.name));
  if (uniqueTeamNames.size !== teamObjects.length) {
    return {
      success: false,
      message: createInvalidValueMessage({
        origin,
        argName: ARG_TEAMS,
        inputValue: teams.join(','),
        expectedValue: 'unique team names',
      }),
    };
  }

  return { success: true, value: teamObjects };
}

/**
 * Common validation for number parameters (numRounds and startRound).
 * Ensures values are positive integers.
 *
 * @param {Object} params - The parameters for validation
 * @param {string | number | undefined} params.value - The number value to validate
 * @param {CLIArg} params.argName - The name of the argument for error messaging
 * @param {InputOrigin} params.origin - The source of the input for error messaging
 * @returns {Result<number | undefined>} Success with validated number or failure with message
 */
function validatePositiveInteger({
  value,
  argName,
  origin,
}: {
  readonly value: string | number | undefined;
  readonly argName: CLIArg;
  readonly origin: InputOrigin;
}): Result<number | undefined> {
  if (value === undefined) {
    return { success: true, value: undefined };
  }

  const parsedValue = typeof value === 'string' ? parseInt(value, 10) : value;
  if (isNaN(parsedValue) || !Number.isInteger(parsedValue) || parsedValue < 1) {
    return {
      success: false,
      message: createInvalidValueMessage({
        origin,
        argName,
        inputValue: String(value),
        expectedValue: 'a positive integer',
      }),
    };
  }

  return { success: true, value: parsedValue };
}

/**
 * Validates the number of rounds parameter.
 *
 * @param {Object} params - The parameters for validation
 * @param {string | number | undefined} params.numRounds - The number of rounds to validate
 * @param {InputOrigin} params.origin - The source of the input for error messaging
 * @returns {Result<number | undefined>} Success with validated number or failure with message
 */
export function validateNumRounds({
  numRounds,
  origin,
}: {
  readonly numRounds: string | number | undefined;
  readonly origin: InputOrigin;
}): Result<number | undefined> {
  return validatePositiveInteger({ value: numRounds, argName: ARG_NUM_ROUNDS, origin });
}

/**
 * Validates the starting round number parameter.
 *
 * @param {Object} params - The parameters for validation
 * @param {string | number | undefined} params.startRound - The starting round number to validate
 * @param {InputOrigin} params.origin - The source of the input for error messaging
 * @returns {Result<number | undefined>} Success with validated number or failure with message
 */
export function validateStartRound({
  startRound,
  origin,
}: {
  readonly startRound: string | number | undefined;
  readonly origin: InputOrigin;
}): Result<number | undefined> {
  return validatePositiveInteger({ value: startRound, argName: ARG_START_ROUND, origin });
}

/**
 * Validates the pairing order parameter against allowed values.
 *
 * @param {Object} params - The parameters for validation
 * @param {string | undefined} params.order - The order value to validate
 * @param {InputOrigin} params.origin - The source of the input for error messaging
 * @returns {Result<CLIOptionOrder | undefined>} Success with validated order or failure with message
 */
export function validateOrder({
  order,
  origin,
}: {
  readonly order: string | undefined;
  readonly origin: InputOrigin;
}): Result<(typeof CLI_OPTION_ORDER)[number] | undefined> {
  if (order === undefined) {
    return { success: true, value: undefined };
  }
  const result = parseStringLiteral({
    input: order,
    options: CLI_OPTION_ORDER,
  });

  if (!result.success) {
    return {
      success: false,
      message: createInvalidValueMessage({
        origin,
        argName: ARG_ORDER,
        inputValue: order,
        expectedValue: CLI_OPTION_ORDER,
      }),
    };
  }

  return result;
}

/**
 * Validates the output format parameter against allowed values.
 *
 * @param {Object} params - The parameters for validation
 * @param {string | undefined} params.format - The format value to validate
 * @param {InputOrigin} params.origin - The source of the input for error messaging
 * @returns {Result<CLIOptionFormat | undefined>} Success with validated format or failure with message
 */
export function validateFormat({
  format,
  origin,
}: {
  readonly format: string | undefined;
  readonly origin: InputOrigin;
}): Result<(typeof CLI_OPTION_FORMAT)[number] | undefined> {
  if (format === undefined) {
    return { success: true, value: undefined };
  }
  const result = parseStringLiteral({
    input: format,
    options: CLI_OPTION_FORMAT,
  });

  if (!result.success) {
    return {
      success: false,
      message: createInvalidValueMessage({
        origin,
        argName: ARG_FORMAT,
        inputValue: format,
        expectedValue: CLI_OPTION_FORMAT,
      }),
    };
  }

  return result;
}

/**
 * Validates the input file type against supported file types.
 *
 * @param {Object} params - The parameters for validation
 * @param {string | undefined} params.file - The file path to validate
 * @param {InputOrigin} params.origin - The source of the input for error messaging
 * @returns {Result<(typeof SUPPORTED_FILE_TYPES)[number] | undefined>} Success with validated file type or failure with message
 */
export function validateFile({
  file,
  origin,
}: {
  readonly file: string | undefined;
  readonly origin: InputOrigin;
}): Result<(typeof SUPPORTED_FILE_TYPES)[number] | undefined> {
  if (file === undefined) {
    return { success: true, value: undefined };
  }
  const ext = extname(file).toLowerCase();
  const result = parseStringLiteral({
    input: ext,
    options: SUPPORTED_FILE_TYPES,
  });

  if (!result.success) {
    return {
      success: false,
      message: createInvalidValueMessage({
        origin,
        argName: ARG_FILE,
        inputValue: file,
        expectedValue: `extension to be one of ${SUPPORTED_FILE_TYPES.join(', ')}`,
      }),
    };
  }

  return result;
}

/**
 * Validates an array of played matches.
 * Ensures each match consists of exactly two team names.
 *
 * @param {Object} params - The parameters for validation
 * @param {readonly (readonly string[])[] | undefined} params.matches - Array of matches to validate
 * @param {InputOrigin} params.origin - The source of the input for error messaging
 * @returns {Result<readonly ReadonlyMatch[] | undefined>} Success with validated matches or failure with message
 */
export function validateMatches({
  matches,
  origin,
}: {
  readonly matches: readonly (readonly string[])[] | undefined;
  readonly origin: InputOrigin;
}): Result<readonly ReadonlyMatch[] | undefined> {
  if (matches === undefined) {
    return { success: true, value: undefined };
  }

  for (const match of matches) {
    if (
      !Array.isArray(match) ||
      match.length !== 2 ||
      typeof match[0] !== 'string' ||
      typeof match[1] !== 'string'
    ) {
      return {
        success: false,
        message: createInvalidValueMessage({
          origin,
          argName: ARG_MATCHES,
          inputValue: JSON.stringify(match),
          expectedValue: 'an array of two team names',
        }),
      };
    }
  }
  return { success: true, value: matches as readonly ReadonlyMatch[] };
}
