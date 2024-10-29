import { Result, ValidatedCLIOptions } from '../types/types.js';

import { validateJSONOptions } from '../validators/jsonValidator.js';

export function parseOptionsFromJSON(content: string): Result<Partial<ValidatedCLIOptions>> {
  try {
    const parsedJSON = JSON.parse(content) as unknown;
    if (typeof parsedJSON !== 'object' || Array.isArray(parsedJSON) || parsedJSON === null) {
      return { success: false, message: 'Invalid JSON: must be an object' };
    }
    return validateJSONOptions(parsedJSON);
  } catch (error) {
    return { success: false, message: `Invalid JSON: ${(error as Error).message}` };
  }
}
