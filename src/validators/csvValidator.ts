/**
 * CSV input validation for tournament configuration.
 * Handles the specific complexities of CSV parsing:
 * - Headers are case insensitive
 * - Empty fields are treated as undefined
 * - First row provides default values for subsequent rows
 * - Match history requires two columns (home/away)
 *
 * @module csvValidator
 */

import { ErrorTemplate, formatError, teamToString, validateAllOptions } from './validatorUtils.js';
import { Result, UnvalidatedCLIOptions, ValidatedCLIOptions } from '../types/types.js';

import { UnvalidatedCSVRow } from '../parsers/csvParserUtils.js';

/**
 * Validates tournament configuration from CSV rows.
 * Takes values from first row for tournament-wide settings.
 * Subsequent rows only used for additional teams.
 *
 * Note: Squad assignments must be in separate column from team names
 * unlike CLI input where they're part of the team string.
 *
 * @param csvRows - Parsed CSV data with header-mapped fields
 * @returns Validated options or error message
 */
export function validateCSVOptions(
  csvRows: readonly UnvalidatedCSVRow[]
): Result<Partial<ValidatedCLIOptions>> {
  if (csvRows.length === 0) {
    return {
      success: false,
      message: formatError({
        template: ErrorTemplate.NO_DATA,
        values: { source: 'CSV' },
      }),
    };
  }

  // Build team strings combining name and squad columns
  const teams = csvRows
    .map((record) => {
      const name = record.teams;
      const squad = record.squads;
      return name ? teamToString({ name, squad }) : undefined;
    })
    .filter((team): team is string => team !== undefined);

  // Combine matches from home/away columns
  const matches = csvRows
    .map((record) => [record['matches-home'], record['matches-away']])
    .filter(
      // eslint-disable-next-line functional/prefer-readonly-type
      (match): match is [string, string] =>
        match[0] != null && match[1] != null && match[0].trim() !== '' && match[1].trim() !== ''
    );

  // Options only used from first row
  const input: UnvalidatedCLIOptions = {
    teams: teams.length > 0 ? teams : undefined,
    numRounds: csvRows[0]['num-rounds'],
    startRound: csvRows[0]['start-round'],
    order: csvRows[0].order,
    format: csvRows[0].format,
    matches: matches.length > 0 ? matches : undefined,
  };

  return validateAllOptions({ input, origin: 'CSV' });
}
