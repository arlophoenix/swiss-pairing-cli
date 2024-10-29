import { Result } from '../types/types.js';
import papa from 'papaparse';

/**
 * Represents a single unvalidated row from a CSV file containing Swiss pairing data.
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
 * Parses a CSV string into an array of unvalidated rows.
 */
export function parseCSV(csv: string): Result<readonly UnvalidatedCSVRow[]> {
  const parseResult = papa.parse<UnvalidatedCSVRow>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  // Filter out UndetectableDelimiter warnings as PapaParse handles these cases correctly
  const errors = parseResult.errors.filter((error) => error.code !== 'UndetectableDelimiter');

  if (errors.length > 0) {
    return {
      success: false,
      message: `CSV parsing error: ${parseResult.errors[0].message}`,
    };
  }

  return { success: true, value: parseResult.data };
}
