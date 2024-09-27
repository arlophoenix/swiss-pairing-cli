import {
  ARG_FORMAT,
  ARG_MATCHES,
  ARG_NUM_ROUNDS,
  ARG_ORDER,
  ARG_PLAYERS,
  ARG_START_ROUND,
} from '../constants.js';
import {
  CLIOptionFormat,
  CLIOptionOrder,
  ReadonlyMatch,
  Result,
  ValidatedCLIOptions,
} from '../types/types.js';
import {
  validateFormat,
  validateMatches,
  validateNumRounds,
  validateOrder,
  validatePlayers,
  validateStartRound,
} from './cliValidator.js';

import { CSVRecord } from '../parsers/csvParserUtils.js';
import { createInvalidValueErrorMessage } from '../utils/errorUtils.js';

export function validateCSVOptions(csvRecords: readonly CSVRecord[]): Result<Partial<ValidatedCLIOptions>> {
  const results: readonly [
    Result<'text' | 'json-plain' | 'json-pretty' | undefined>,
    Result<readonly ReadonlyMatch[] | undefined>,
    Result<number | undefined>,
    Result<'top-down' | 'bottom-up' | 'random' | undefined>,
    Result<readonly string[] | undefined>,
    Result<number | undefined>,
  ] = [
    validateCSVFormat(csvRecords[0]),
    validateCSVMatches(csvRecords),
    validateCSVNumRounds(csvRecords[0]),
    validateCSVOrder(csvRecords[0]),
    validateCSVPlayers(csvRecords),
    validateCSVStartRound(csvRecords[0]),
  ];
  const firstFailureResult = results.find((result) => !result.success);
  if (firstFailureResult) {
    return firstFailureResult;
  }
  const [format, matches, numRounds, order, players, startRound] = results;

  return {
    success: true,
    value: {
      format: format.success ? format.value : undefined,
      matches: matches.success ? matches.value : undefined,
      numRounds: numRounds.success ? numRounds.value : undefined,
      order: order.success ? order.value : undefined,
      players: players.success ? players.value : undefined,
      startRound: startRound.success ? startRound.value : undefined,
    },
  };
}

export function validateCSVPlayers(records: readonly CSVRecord[]): Result<readonly string[] | undefined> {
  const players = records.map((record) => record[ARG_PLAYERS]).filter((player): player is string => !!player);
  return validatePlayers(players);
}

export function validateCSVNumRounds(record: CSVRecord): Result<number | undefined> {
  return validateNumRounds(record[ARG_NUM_ROUNDS]);
}

export function validateCSVStartRound(record: CSVRecord): Result<number | undefined> {
  return validateStartRound(record[ARG_START_ROUND]);
}

export function validateCSVOrder(record: CSVRecord): Result<CLIOptionOrder | undefined> {
  return validateOrder(record[ARG_ORDER]);
}

export function validateCSVFormat(record: CSVRecord): Result<CLIOptionFormat | undefined> {
  return validateFormat(record[ARG_FORMAT]);
}

export function validateCSVMatches(
  records: readonly CSVRecord[]
): Result<readonly ReadonlyMatch[] | undefined> {
  const partialMatches = records.some(
    (record) => (record.matches1 && !record.matches2) ?? (!record.matches1 && record.matches2)
  );

  if (partialMatches) {
    return {
      success: false,
      error: {
        type: 'InvalidInput',
        message: createInvalidValueErrorMessage({
          origin: 'CSV',
          argName: ARG_MATCHES,
          inputValue: '',
          expectedValue: 'matches1 & matches2 should include the same number of players',
        }),
      },
    };
  }
  const matches = records
    .map((record) => [record.matches1, record.matches2])
    // eslint-disable-next-line functional/prefer-readonly-type
    .filter((match): match is [string, string] => !!match[0] && !!match[1]);

  if (matches.length === 0) return { success: true, value: undefined };
  return validateMatches(matches);
}
