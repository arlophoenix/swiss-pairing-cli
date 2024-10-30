/**
 * JSON configuration file parser.
 * Handles both team formats:
 * - Strings with squad in brackets: ["Team1 [A]"]
 * - Objects: [{ name: "Team1", squad: "A" }]
 *
 * @module jsonParser
 */

import { ErrorTemplate, formatError, wrapErrorWithOrigin } from './parserUtils.js';
import { Result, ValidatedCLIOptions } from '../types/types.js';

import { validateJSONOptions } from '../validators/jsonValidator.js';

/**
 * Parses tournament configuration from JSON string.
 * Wraps JSON-specific errors in standard format.
 *
 * Note: JSON input must be an object, not an array,
 * even when only providing team list.
 *
 * @example
 * // Valid inputs:
 * // { "teams": ["Team1 [A]", "Team2 [B]"] }
 * // { "teams": [{"name": "Team1", "squad": "A"}] }
 */
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
