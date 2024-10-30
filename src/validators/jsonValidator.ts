/**
 * JSON input validation for tournament configuration.
 * Supports two team input formats:
 * 1. String array with squad in brackets: ["Alice [A]", "Bob [B]"]
 * 2. Object array: [{ name: "Alice", squad: "A" }]
 *
 * @module jsonValidator
 */

import { ARG_NUM_ROUNDS, ARG_START_ROUND } from '../constants.js';
import { Result, Team, UnvalidatedCLIOptions, ValidatedCLIOptions } from '../types/types.js';
import { teamToString, validateAllOptions } from './validatorUtils.js';

/**
 * Raw JSON input structure before validation.
 * Matches CLI option names except num-rounds and start-round
 * which use hyphenated names for JSON convention.
 */
interface UnvalidatedJSONOptions {
  readonly teams?: readonly (string | Team)[];
  readonly 'num-rounds'?: number;
  readonly 'start-round'?: number;
  readonly order?: string;
  readonly format?: string;
  readonly matches?: readonly (readonly string[])[];
}

/**
 * Validates tournament configuration from JSON.
 * Converts number fields to strings to match CLI validation.
 *
 * Note: Both team input formats can be mixed in the same file,
 * useful when adding teams to existing tournament JSON.
 *
 * @param jsonOptions - Parsed JSON configuration
 * @returns Validated options or error message
 */
export function validateJSONOptions(
  jsonOptions: UnvalidatedJSONOptions
): Result<Partial<ValidatedCLIOptions>> {
  // Handle both string and object team formats
  const teams = jsonOptions.teams?.map((team) => {
    if (typeof team === 'string') {
      return team;
    }
    return teamToString(team);
  });

  const input: UnvalidatedCLIOptions = {
    teams,
    numRounds: jsonOptions[ARG_NUM_ROUNDS] ? String(jsonOptions[ARG_NUM_ROUNDS]) : undefined,
    startRound: jsonOptions[ARG_START_ROUND] ? String(jsonOptions[ARG_START_ROUND]) : undefined,
    order: jsonOptions.order,
    format: jsonOptions.format,
    matches: jsonOptions.matches,
  };

  const result = validateAllOptions({ input, origin: 'JSON' });
  if (!result.success) {
    return {
      success: false,
      message: `Invalid JSON data: ${result.message}`,
    };
  }

  return result;
}
