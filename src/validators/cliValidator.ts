/**
 * Direct CLI input validation.
 * Simplest validation path as input format matches internal types.
 * Used as baseline for CSV/JSON validation.
 *
 * @module cliValidator
 */

import { Result, UnvalidatedCLIOptions, ValidatedCLIOptions } from '../types/types.js';

import { validateAllOptions } from './validatorUtils.js';

/**
 * Validates raw CLI options.
 * Direct pass-through to common validator since CLI format
 * already matches expected structure.
 */
export function validateCLIOptions(options: UnvalidatedCLIOptions): Result<Partial<ValidatedCLIOptions>> {
  return validateAllOptions({ input: options, origin: 'CLI' });
}
