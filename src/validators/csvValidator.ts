import { Result, UnvalidatedCLIOptions, ValidatedCLIOptions } from '../types/types.js';

import { CSVRecord } from '../parsers/csvParserUtils.js';
import { teamToString } from '../utils/utils.js';
import { validateAllOptions } from './validatorUtils.js';

export function validateCSVOptions(csvRecords: readonly CSVRecord[]): Result<Partial<ValidatedCLIOptions>> {
  if (csvRecords.length === 0) {
    return { success: true, value: {} };
  }

  const teams = csvRecords
    .map((record) => {
      const name = record.teams;
      const squad = record.squads;
      return name ? teamToString({ name, squad }) : undefined;
    })
    .filter((team): team is string => team !== undefined);

  const matches = csvRecords
    .map((record) => [record['matches-home'], record['matches-away']])
    .filter(
      // eslint-disable-next-line functional/prefer-readonly-type
      (match): match is [string, string] =>
        match[0] != null && match[1] != null && match[0].trim() !== '' && match[1].trim() !== ''
    );

  const input: UnvalidatedCLIOptions = {
    teams: teams.length > 0 ? teams : undefined,
    numRounds: csvRecords[0]['num-rounds'],
    startRound: csvRecords[0]['start-round'],
    order: csvRecords[0].order,
    format: csvRecords[0].format,
    matches: matches.length > 0 ? matches : undefined,
  };

  return validateAllOptions({ input, origin: 'CSV' });
}
