import { ErrorTemplate, formatError, teamToString, validateAllOptions } from './validatorUtils.js';
import { Result, UnvalidatedCLIOptions, ValidatedCLIOptions } from '../types/types.js';

import { UnvalidatedCSVRow } from '../parsers/csvParserUtils.js';

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

  const teams = csvRows
    .map((record) => {
      const name = record.teams;
      const squad = record.squads;
      return name ? teamToString({ name, squad }) : undefined;
    })
    .filter((team): team is string => team !== undefined);

  const matches = csvRows
    .map((record) => [record['matches-home'], record['matches-away']])
    .filter(
      // eslint-disable-next-line functional/prefer-readonly-type
      (match): match is [string, string] =>
        match[0] != null && match[1] != null && match[0].trim() !== '' && match[1].trim() !== ''
    );

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
