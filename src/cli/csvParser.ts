import {
  ARG_FORMAT,
  ARG_NUM_ROUNDS,
  ARG_ORDER,
  ARG_PLAYERS,
  ARG_START_ROUND,
  CLI_OPTION_FORMAT,
  CLI_OPTION_ORDER,
} from '../constants.js';
import { CLIOptions, ReadonlyMatch } from '../types.js';
import { parseStringLiteralSilently, removeNullOrUndefinedValues } from '../utils.js';

import { parse } from 'papaparse';
import { throwInvalidValueError } from './errorUtils.js';

interface CSVRecord {
  readonly [ARG_FORMAT]?: string;
  readonly matches1?: string;
  readonly matches2?: string;
  readonly [ARG_NUM_ROUNDS]?: string;
  readonly [ARG_ORDER]?: string;
  readonly [ARG_PLAYERS]?: string;
  readonly [ARG_START_ROUND]?: string;
}

export function parseCSV(content: string): Partial<CLIOptions> {
  const parseResult = parse<CSVRecord>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  if (parseResult.errors.length > 0) {
    throw new Error(`CSV parsing error: ${parseResult.errors[0].message}`);
  }

  const records = parseResult.data;

  if (records.length === 0) return {};

  // Extract and transform CSV data into CLIOptions
  const result = {
    format: extractFormatFromCSV(records),
    matches: extractMatchesFromRecords(records),
    numRounds: extractNumRoundsFromCSV(records),
    order: extractOrderFromCSV(records),
    players: extractPlayersFromCSV(records),
    startRound: extractStartRoundsFromCSV(records),
  } as Partial<CLIOptions>;

  return removeNullOrUndefinedValues(result);
}

function extractMatchesFromRecords(records: readonly CSVRecord[]): readonly ReadonlyMatch[] | undefined {
  const firstRecord = records[0];
  if (!('matches1' in firstRecord && 'matches2' in firstRecord)) {
    return undefined;
  }
  return records
    .map((record): ReadonlyMatch => [record.matches1 ?? '', record.matches2 ?? ''])
    .filter((match): match is ReadonlyMatch => !!match[0] && !!match[1]);
}

function extractFormatFromCSV(records: readonly CSVRecord[]): CLIOptions['format'] {
  const firstRecord = records[0];
  if (!(ARG_FORMAT in firstRecord)) {
    return undefined;
  }
  const format = parseStringLiteralSilently({ input: firstRecord[ARG_FORMAT], options: CLI_OPTION_FORMAT });
  if (firstRecord[ARG_FORMAT] && !format) {
    throwInvalidCSVValueError({ argName: ARG_FORMAT, record: firstRecord, expectedValue: CLI_OPTION_FORMAT });
  }
  return format;
}

function extractNumRoundsFromCSV(records: readonly CSVRecord[]): CLIOptions['numRounds'] {
  const firstRecord = records[0];
  if (!(ARG_NUM_ROUNDS in firstRecord)) {
    return undefined;
  }
  const numRounds = parseIntegerOption(firstRecord[ARG_NUM_ROUNDS]);
  if (firstRecord[ARG_NUM_ROUNDS] && (numRounds === undefined || numRounds < 1)) {
    throwInvalidCSVValueError({
      argName: ARG_NUM_ROUNDS,
      record: firstRecord,
      expectedValue: 'a positive integer',
    });
  }
  return numRounds;
}

function extractOrderFromCSV(records: readonly CSVRecord[]): CLIOptions['order'] {
  const firstRecord = records[0];
  if (!(ARG_ORDER in firstRecord)) {
    return undefined;
  }
  const order = parseStringLiteralSilently({ input: firstRecord[ARG_ORDER], options: CLI_OPTION_ORDER });
  if (firstRecord[ARG_ORDER] && !order) {
    throwInvalidCSVValueError({ argName: ARG_ORDER, record: firstRecord, expectedValue: CLI_OPTION_ORDER });
  }
  return order;
}

function extractPlayersFromCSV(records: readonly CSVRecord[]): CLIOptions['players'] {
  if (!(ARG_PLAYERS in records[0])) {
    return undefined;
  }
  return records.map((record) => record[ARG_PLAYERS]).filter((player): player is string => !!player);
}

function extractStartRoundsFromCSV(records: readonly CSVRecord[]): CLIOptions['startRound'] {
  const firstRecord = records[0];
  if (!(ARG_START_ROUND in firstRecord)) {
    return undefined;
  }
  const startRound = parseIntegerOption(firstRecord[ARG_START_ROUND]);
  if (firstRecord[ARG_START_ROUND] && (startRound === undefined || startRound < 1)) {
    throwInvalidCSVValueError({
      argName: ARG_START_ROUND,
      record: firstRecord,
      expectedValue: 'a positive integer',
    });
  }
  return startRound;
}

function parseIntegerOption(value: string | undefined): number | undefined {
  return value ? parseInt(value, 10) : undefined;
}

function throwInvalidCSVValueError({
  argName,
  record,
  expectedValue,
}: {
  readonly argName: Exclude<keyof CSVRecord, 'matches1' | 'matches2'>;
  readonly record: CSVRecord;
  readonly expectedValue: string | readonly string[];
}): never {
  throwInvalidValueError({
    errorType: 'CSV',
    argName,
    inputValue: record[argName] ?? '',
    expectedValue,
  });
}
