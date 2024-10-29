import { ARG_NUM_ROUNDS, ARG_START_ROUND } from '../constants.js';
import { Result, Team, UnvalidatedCLIOptions, ValidatedCLIOptions } from '../types/types.js';
import { teamToString, validateAllOptions } from './validatorUtils.js';

interface UnvalidatedJSONOptions {
  readonly teams?: readonly (string | Team)[];
  readonly 'num-rounds'?: number;
  readonly 'start-round'?: number;
  readonly order?: string;
  readonly format?: string;
  readonly matches?: readonly (readonly string[])[];
}

export function validateJSONOptions(
  jsonOptions: UnvalidatedJSONOptions
): Result<Partial<ValidatedCLIOptions>> {
  // Convert team format to consistent string representation
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
