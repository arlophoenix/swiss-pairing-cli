/**
 * CSV parsing integration.
 * Coordinates parsing and validation for CSV input:
 * 1. Parse raw CSV to row objects
 * 2. Validate row contents
 * 3. Convert to internal option format
 *
 * @module csvParser
 */

import { ErrorTemplate, formatError, wrapErrorWithOrigin } from './parserUtils.js';
import { Result, ValidatedCLIOptions } from '../types/types.js';

import { parseCSV } from './csvParserUtils.js';
import { validateCSVOptions } from '../validators/csvValidator.js';

/**
 * Parses tournament configuration from CSV content.
 * Empty files and parsing errors are caught before validation.
 *
 * @param content - Raw CSV content
 * @returns Validated tournament options or error message
 */
export function parseOptionsFromCSV(content: string): Result<Partial<ValidatedCLIOptions>> {
  const parseResult = parseCSV(content);
  if (!parseResult.success) {
    return parseResult;
  }

  const records = parseResult.value;
  if (records.length === 0) {
    return {
      success: false,
      message: formatError({
        template: ErrorTemplate.NO_DATA,
        values: { source: 'CSV' },
      }),
    };
  }

  const result = validateCSVOptions(records);
  if (!result.success) {
    return wrapErrorWithOrigin({ error: result, origin: 'CSV' });
  }

  return result;
}
