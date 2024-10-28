import { ARG_FORMAT, ARG_NUM_ROUNDS, ARG_ORDER, ARG_START_ROUND, ARG_TEAMS } from '../constants.js';

import { Result } from '../types/types.js';
import papa from 'papaparse';

/**
 * Represents a single unvalidated row from a CSV file containing Swiss pairing data.
 * Maps to CLI arguments but uses a different structure for matches (home/away columns) and squads.
 */
export interface UnvalidatedCSVRow {
  readonly [ARG_TEAMS]?: string;
  readonly squads?: string;
  readonly [ARG_NUM_ROUNDS]?: string;
  readonly [ARG_START_ROUND]?: string;
  readonly [ARG_ORDER]?: string;
  readonly [ARG_FORMAT]?: string;
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

  if (parseResult.errors.length > 0) {
    return {
      success: false,
      error: { type: 'InvalidInput', message: `CSV parsing error: ${parseResult.errors[0].message}` },
    };
  }
  return { success: true, value: parseResult.data };
}
