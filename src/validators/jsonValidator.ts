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

export interface JSONRecord {
  readonly [ARG_PLAYERS]?: readonly string[];
  readonly [ARG_NUM_ROUNDS]?: number;
  readonly [ARG_START_ROUND]?: number;
  readonly [ARG_ORDER]?: string;
  readonly [ARG_FORMAT]?: string;
  readonly [ARG_MATCHES]?: readonly (readonly string[])[];
}

export function validateJSONOptions(jsonRecord: JSONRecord): Result<Partial<ValidatedCLIOptions>> {
  const results: readonly [
    Result<'text' | 'json-plain' | 'json-pretty' | undefined>,
    Result<readonly ReadonlyMatch[] | undefined>,
    Result<number | undefined>,
    Result<'top-down' | 'bottom-up' | 'random' | undefined>,
    Result<readonly string[] | undefined>,
    Result<number | undefined>,
  ] = [
    validateJSONFormat(jsonRecord),
    validateJSONMatches(jsonRecord),
    validateJSONNumRounds(jsonRecord),
    validateJSONOrder(jsonRecord),
    validateJSONPlayers(jsonRecord),
    validateJSONStartRound(jsonRecord),
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

export function validateJSONPlayers(record: JSONRecord): Result<readonly string[] | undefined> {
  return validatePlayers(record[ARG_PLAYERS]);
}

export function validateJSONNumRounds(record: JSONRecord): Result<number | undefined> {
  return validateNumRounds(String(record[ARG_NUM_ROUNDS]));
}

export function validateJSONStartRound(record: JSONRecord): Result<number | undefined> {
  return validateStartRound(String(record[ARG_START_ROUND]));
}

export function validateJSONOrder(record: JSONRecord): Result<CLIOptionOrder | undefined> {
  return validateOrder(record[ARG_ORDER]);
}

export function validateJSONFormat(record: JSONRecord): Result<CLIOptionFormat | undefined> {
  return validateFormat(record[ARG_FORMAT]);
}

export function validateJSONMatches(record: JSONRecord): Result<readonly ReadonlyMatch[] | undefined> {
  return validateMatches(record[ARG_MATCHES]);
}
