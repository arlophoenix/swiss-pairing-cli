import { Result, UnvalidatedCLIOptions, ValidatedCLIOptions } from '../types/types.js';

import { validateAllOptions } from './validatorUtils.js';

export function validateCLIOptions(options: UnvalidatedCLIOptions): Result<Partial<ValidatedCLIOptions>> {
  return validateAllOptions({ input: options, origin: 'CLI' });
}
