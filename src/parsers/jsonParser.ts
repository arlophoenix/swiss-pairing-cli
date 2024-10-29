import { ErrorTemplate, formatError, wrapErrorWithOrigin } from './parserUtils.js';
import { Result, ValidatedCLIOptions } from '../types/types.js';

import { validateJSONOptions } from '../validators/jsonValidator.js';

export function parseOptionsFromJSON(content: string): Result<Partial<ValidatedCLIOptions>> {
  try {
    const parsedJSON = JSON.parse(content) as unknown;
    if (typeof parsedJSON !== 'object' || Array.isArray(parsedJSON) || parsedJSON === null) {
      return {
        success: false,
        message: formatError({
          template: ErrorTemplate.PARSE_JSON_ERROR,
          values: { error: 'must be an object' },
        }),
      };
    }
    const result = validateJSONOptions(parsedJSON);
    if (!result.success) {
      return wrapErrorWithOrigin({
        error: result,
        origin: 'JSON',
      });
    }
    return result;
  } catch (error) {
    return {
      success: false,
      message: formatError({
        template: ErrorTemplate.PARSE_JSON_ERROR,
        values: { error: (error as Error).message },
      }),
    };
  }
}
