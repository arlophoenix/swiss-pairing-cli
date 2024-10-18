import { ARG_NUM_ROUNDS, ARG_START_ROUND } from '../constants.js';
import { Result, Team, UnvalidatedCLIOptions, ValidatedCLIOptions } from '../types/types.js';
import { teamToString, validateAllOptions } from './validatorUtils.js';

interface JSONRecord {
  readonly teams?: readonly (string | Team)[];
  readonly 'num-rounds'?: number;
  readonly 'start-round'?: number;
  readonly order?: string;
  readonly format?: string;
  readonly matches?: readonly (readonly string[])[];
}

export function validateJSONOptions(jsonRecord: JSONRecord): Result<Partial<ValidatedCLIOptions>> {
  const teams = jsonRecord.teams?.map((team) => {
    if (typeof team === 'string') {
      return team;
    } else {
      return teamToString(team);
    }
  });

  const input: UnvalidatedCLIOptions = {
    teams,
    numRounds: jsonRecord[ARG_NUM_ROUNDS] ? String(jsonRecord[ARG_NUM_ROUNDS]) : undefined,
    startRound: jsonRecord[ARG_START_ROUND] ? String(jsonRecord[ARG_START_ROUND]) : undefined,
    order: jsonRecord.order,
    format: jsonRecord.format,
    matches: jsonRecord.matches,
  };

  return validateAllOptions({ input, origin: 'JSON' });
}
