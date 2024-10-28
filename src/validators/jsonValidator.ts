import { ARG_NUM_ROUNDS, ARG_START_ROUND } from '../constants.js';
import { Result, Team, UnvalidatedCLIOptions, ValidatedCLIOptions } from '../types/types.js';
import { teamToString, validateAllOptions } from './validatorUtils.js';

/**
 * Represents unvalidated JSON data containing Swiss pairing configuration.
 * Maps closely to CLI arguments but allows team objects instead of just strings.
 */
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
  const teams = jsonOptions.teams?.map((team) => {
    if (typeof team === 'string') {
      return team;
    } else {
      return teamToString(team);
    }
  });

  const input: UnvalidatedCLIOptions = {
    teams,
    numRounds: jsonOptions[ARG_NUM_ROUNDS] ? String(jsonOptions[ARG_NUM_ROUNDS]) : undefined,
    startRound: jsonOptions[ARG_START_ROUND] ? String(jsonOptions[ARG_START_ROUND]) : undefined,
    order: jsonOptions.order,
    format: jsonOptions.format,
    matches: jsonOptions.matches,
  };

  return validateAllOptions({ input, origin: 'JSON' });
}
