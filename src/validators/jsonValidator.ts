import { ARG_NUM_ROUNDS, ARG_START_ROUND } from '../constants.js';
import { Result, UnvalidatedCLIOptions, ValidatedCLIOptions } from '../types/types.js';

import { validateAllOptions } from './validatorUtils.js';

interface JSONRecord {
  readonly teams?: readonly string[];
  readonly 'num-rounds'?: number;
  readonly 'start-round'?: number;
  readonly order?: string;
  readonly format?: string;
  readonly matches?: readonly (readonly string[])[];
}

export function validateJSONOptions(jsonRecord: JSONRecord): Result<Partial<ValidatedCLIOptions>> {
  const input: UnvalidatedCLIOptions = {
    teams: jsonRecord.teams,
    numRounds: jsonRecord[ARG_NUM_ROUNDS] ? String(jsonRecord[ARG_NUM_ROUNDS]) : undefined,
    startRound: jsonRecord[ARG_START_ROUND] ? String(jsonRecord[ARG_START_ROUND]) : undefined,
    order: jsonRecord.order,
    format: jsonRecord.format,
    matches: jsonRecord.matches,
  };

  return validateAllOptions({ input, origin: 'JSON' });
}
