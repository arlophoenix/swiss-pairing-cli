import {
  ARG_FORMAT,
  ARG_MATCHES,
  ARG_NUM_ROUNDS,
  ARG_ORDER,
  ARG_PLAYERS,
  ARG_START_ROUND,
  CLI_OPTION_FORMAT,
  CLI_OPTION_ORDER,
} from '../constants.js';
import { CLIOptionFormat, CLIOptionOrder, CLIOptions, ReadonlyMatch } from '../types.js';

import { removeNullOrUndefinedValues } from '../utils.js';
import { throwInvalidValueError } from './errorUtils.js';

interface JSONRecord {
  readonly [ARG_FORMAT]?: CLIOptionFormat;
  readonly [ARG_MATCHES]?: readonly ReadonlyMatch[];
  readonly [ARG_NUM_ROUNDS]?: number;
  readonly [ARG_ORDER]?: CLIOptionOrder;
  readonly [ARG_PLAYERS]?: readonly string[];
  readonly [ARG_START_ROUND]?: number;
}

export function parseJSON(content: string): Partial<CLIOptions> {
  const parsedJSON = JSON.parse(content) as unknown;

  assertJSONRecord(parsedJSON);

  const result: Partial<CLIOptions> = {
    players: parsedJSON[ARG_PLAYERS],
    numRounds: parsedJSON[ARG_NUM_ROUNDS],
    startRound: parsedJSON[ARG_START_ROUND],
    order: parsedJSON[ARG_ORDER],
    matches: parsedJSON[ARG_MATCHES],
    format: parsedJSON[ARG_FORMAT],
  };

  return removeNullOrUndefinedValues(result);
}

function assertJSONRecord(obj: unknown): asserts obj is JSONRecord {
  if (typeof obj !== 'object' || obj === null) {
    throw new Error('Invalid JSON: not an object');
  }

  const record = obj as Record<string, unknown>;

  if (ARG_PLAYERS in record && !Array.isArray(record[ARG_PLAYERS])) {
    throwInvalidJSONValueError({ argName: ARG_PLAYERS, record, expectedValue: 'an array of strings' });
  }
  if (ARG_NUM_ROUNDS in record) {
    const numRounds = record[ARG_NUM_ROUNDS];
    if (typeof numRounds !== 'number' || numRounds < 1) {
      throwInvalidJSONValueError({ argName: ARG_NUM_ROUNDS, record, expectedValue: 'a positive integer' });
    }
  }
  if (ARG_START_ROUND in record) {
    const startRound = record[ARG_START_ROUND];
    if (typeof startRound !== 'number' || startRound < 1) {
      throwInvalidJSONValueError({ argName: ARG_START_ROUND, record, expectedValue: 'a positive integer' });
    }
  }
  if (ARG_ORDER in record) {
    if (
      typeof record[ARG_ORDER] !== 'string' ||
      !CLI_OPTION_ORDER.includes(record[ARG_ORDER] as CLIOptionOrder)
    ) {
      throwInvalidJSONValueError({ argName: ARG_ORDER, record, expectedValue: CLI_OPTION_ORDER });
    }
  }
  if (ARG_FORMAT in record) {
    if (
      typeof record[ARG_FORMAT] !== 'string' ||
      !CLI_OPTION_FORMAT.includes(record[ARG_FORMAT] as CLIOptionFormat)
    ) {
      throwInvalidJSONValueError({ argName: ARG_FORMAT, record, expectedValue: CLI_OPTION_FORMAT });
    }
  }
  if (ARG_MATCHES in record) {
    if (!Array.isArray(record[ARG_MATCHES]) || !record[ARG_MATCHES].every(isValidMatch)) {
      throwInvalidJSONValueError({ argName: ARG_FORMAT, record, expectedValue: 'an array of valid matches' });
    }
  }
}

function isValidMatch(match: unknown): match is ReadonlyMatch {
  return (
    Array.isArray(match) && match.length === 2 && typeof match[0] === 'string' && typeof match[1] === 'string'
  );
}

function throwInvalidJSONValueError({
  argName,
  record,
  expectedValue,
}: {
  readonly argName: keyof JSONRecord;
  readonly record: JSONRecord;
  readonly expectedValue: string | readonly string[];
}): never {
  throwInvalidValueError({
    errorType: 'JSON',
    argName,
    inputValue: JSON.stringify(record[argName]),
    expectedValue,
  });
}
