import { Result, UnvalidatedCLIOptions, ValidatedCLIOptions } from '../types/types.js';

import { CSVRecord } from '../parsers/csvParserUtils.js';
import { validateAllOptions } from './validatorUtils.js';

export function validateCSVOptions(csvRecords: readonly CSVRecord[]): Result<Partial<ValidatedCLIOptions>> {
  if (csvRecords.length === 0) {
    return { success: true, value: {} };
  }

  const players = csvRecords
    .map((record) => record.players)
    .filter((player): player is string => player !== undefined && player.trim() !== '');

  const matches = csvRecords
    .map((record) => [record.matches1, record.matches2])
    .filter(
      // eslint-disable-next-line functional/prefer-readonly-type
      (match): match is [string, string] =>
        match[0] != null && match[1] != null && match[0].trim() !== '' && match[1].trim() !== ''
    );

  const input: UnvalidatedCLIOptions = {
    players: players.length > 0 ? players : undefined,
    numRounds: csvRecords[0]['num-rounds'],
    startRound: csvRecords[0]['start-round'],
    order: csvRecords[0].order,
    format: csvRecords[0].format,
    matches: matches.length > 0 ? matches : undefined,
  };

  return validateAllOptions({ input, origin: 'CSV' });
}
