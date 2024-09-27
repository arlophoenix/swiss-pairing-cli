import { Result, ValidatedCLIOptions } from '../types.js';

import { validateJSONOptions } from '../validators/jsonValidator.js';

export function parseOptionsFromJSON(content: string): Result<Partial<ValidatedCLIOptions>> {
  let parsedJSON: unknown;
  try {
    parsedJSON = JSON.parse(content);
  } catch (error) {
    return {
      success: false,
      error: { type: 'InvalidInput', message: `Invalid JSON: ${(error as Error).message}` },
    };
  }

  if (typeof parsedJSON !== 'object' || Array.isArray(parsedJSON) || parsedJSON === null) {
    return { success: false, error: { type: 'InvalidInput', message: 'Invalid JSON: not an object' } };
  }

  return validateJSONOptions(parsedJSON);
}
