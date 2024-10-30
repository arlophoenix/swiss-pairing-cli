/**
 * CSV parsing utilities using Papa Parse.
 * Handles CSV-specific parsing challenges:
 * - Header case sensitivity
 * - Empty lines
 * - Column mapping
 * - Type detection
 *
 * @module csvParserUtils
 */

import { ErrorTemplate, formatError } from '../utils/errorUtils.js';

import { Result } from '../types/types.js';
import papa from 'papaparse';

/**
 * Raw CSV row after header mapping but before validation.
 * Optional fields map to CLI option names where possible.
 * Matches must split into home/away columns.
 */
export interface UnvalidatedCSVRow {
  readonly teams?: string;
  readonly squads?: string;
  readonly 'num-rounds'?: string;
  readonly 'start-round'?: string;
  readonly order?: string;
  readonly format?: string;
  readonly 'matches-home'?: string;
  readonly 'matches-away'?: string;
}

/**
 * Parses CSV content to row objects.
 * Automatically handles common CSV issues:
 * - Trims whitespace from headers
 * - Converts headers to lowercase
 * - Skips empty lines
 * - Ignores delimiter detection warnings
 *
 * @param csv - Raw CSV content
 * @returns Parsed rows or error message
 */
export function parseCSV(csv: string): Result<readonly UnvalidatedCSVRow[]> {
  const parseResult = papa.parse<UnvalidatedCSVRow>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  // Ignore delimiter warnings - Papa Parse handles these cases correctly
  const errors = parseResult.errors.filter((error) => error.code !== 'UndetectableDelimiter');

  if (errors.length > 0) {
    return {
      success: false,
      message: formatError({
        template: ErrorTemplate.PARSE_CSV_ERROR,
        values: { error: parseResult.errors[0].message },
      }),
    };
  }

  return { success: true, value: parseResult.data };
}
