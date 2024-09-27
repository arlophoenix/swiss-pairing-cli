import { Result, UnvalidatedCLIOptions, ValidatedCLIOptions } from '../types/types.js';

import { validateAllOptions } from './validatorUtils.js';

export function validateCLIOptions(options: UnvalidatedCLIOptions): Result<Partial<ValidatedCLIOptions>> {
  const input: UnvalidatedCLIOptions = {
    players: options.players,
    numRounds: options.numRounds,
    startRound: options.startRound,
    order: options.order,
    format: options.format,
    matches: options.matches,
  };

  return validateAllOptions({ input, origin: 'CLI' });
}
