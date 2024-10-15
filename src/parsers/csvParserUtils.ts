import { ARG_FORMAT, ARG_NUM_ROUNDS, ARG_ORDER, ARG_START_ROUND, ARG_TEAMS } from '../constants.js';

import { Result } from '../types/types.js';
import papa from 'papaparse';

// TODO: rename this type to something more explanatory
export interface CSVRecord {
  readonly [ARG_TEAMS]?: string;
  readonly [ARG_NUM_ROUNDS]?: string;
  readonly [ARG_START_ROUND]?: string;
  readonly [ARG_ORDER]?: string;
  readonly [ARG_FORMAT]?: string;
  readonly 'matches-home'?: string;
  readonly 'matches-away'?: string;
}

export function parseCSV(csv: string): Result<readonly CSVRecord[]> {
  const parseResult = papa.parse<CSVRecord>(csv, {
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
