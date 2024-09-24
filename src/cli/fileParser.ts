import {
  ARG_FILE,
  ARG_FORMAT,
  ARG_MATCHES,
  ARG_NUM_ROUNDS,
  ARG_ORDER,
  ARG_PLAYERS,
  ARG_START_ROUND,
  CLI_OPTION_FORMAT,
  CLI_OPTION_ORDER,
  SUPPORTED_FILE_TYPES,
  SUPPORTED_FILE_TYPE_CSV,
  SUPPORTED_FILE_TYPE_JSON,
} from '../constants.js';
import {
  CLIOptionFormat,
  CLIOptionOrder,
  CLIOptions,
  ReadonlyMatch,
  Result,
  SupportedFileTypes,
} from '../types.js';
import { parseStringLiteralSilently, removeNullOrUndefinedValues } from '../utils.js';

import { existsSync } from 'fs';
import { extname } from 'path';
import papa from 'papaparse';
import { readFile } from 'fs/promises';

interface CSVRecord {
  readonly format?: string;
  readonly matches1?: string;
  readonly matches2?: string;
  readonly 'num-rounds'?: string;
  readonly order?: string;
  readonly players?: string;
  readonly 'start-round'?: string;
  readonly [key: string]: string | undefined;
}

interface JSONRecord {
  readonly format?: CLIOptionFormat;
  readonly matches?: readonly ReadonlyMatch[];
  readonly 'num-rounds'?: number;
  readonly order?: CLIOptionOrder;
  readonly players?: readonly string[];
  readonly 'start-round'?: number;
}

/**
 * Parses a file and extracts CLI options.
 * @param {string} filePath - The path to the file to be parsed.
 * @returns {Promise<Partial<CLIOptions>>} A promise that resolves to a partial CLIOptions object.
 * @throws {Error} If the file type is unsupported.
 */
export async function parseFile(filePath: string): Promise<Partial<CLIOptions>> {
  const fileContent = await readFile(filePath, 'utf-8');
  const fileExtension = extname(filePath).toLowerCase();

  switch (fileExtension) {
    case SUPPORTED_FILE_TYPE_CSV:
      return parseCSV(fileContent);
    case SUPPORTED_FILE_TYPE_JSON:
      return parseJSON(fileContent);
    default:
      throw new Error(`Unsupported file type: ${fileExtension}`);
  }
}

/**
 * Parses CSV content and extracts CLI options.
 * @param {string} content - The CSV content to parse.
 * @returns {Partial<CLIOptions>} A partial CLIOptions object.
 * @throws {Error} If there's an error parsing the CSV.
 */
function parseCSV(content: string): Partial<CLIOptions> {
  const parseResult = papa.parse<CSVRecord>(content, {
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

function extractFormatFromCSV(records: readonly CSVRecord[]): CLIOptionFormat | undefined {
  const firstRecord = records[0];
  if (!(ARG_FORMAT in firstRecord)) {
    return undefined;
  }
  return parseStringLiteralSilently({ input: firstRecord.format, options: CLI_OPTION_FORMAT });
}

function extractNumRoundsFromCSV(records: readonly CSVRecord[]): number | undefined {
  const firstRecord = records[0];
  if (!(ARG_NUM_ROUNDS in firstRecord)) {
    return undefined;
  }
  return parseIntegerOption(firstRecord['num-rounds']);
}

function extractOrderFromCSV(records: readonly CSVRecord[]): CLIOptionOrder | undefined {
  const firstRecord = records[0];
  if (!(ARG_ORDER in firstRecord)) {
    return undefined;
  }
  return parseStringLiteralSilently({ input: firstRecord.order, options: CLI_OPTION_ORDER });
}

function extractPlayersFromCSV(records: readonly CSVRecord[]): readonly string[] | undefined {
  if (!(ARG_PLAYERS in records[0])) {
    return undefined;
  }
  return records.map((record) => record.players).filter((player): player is string => !!player);
}

function extractStartRoundsFromCSV(records: readonly CSVRecord[]): number | undefined {
  const firstRecord = records[0];
  if (!(ARG_START_ROUND in firstRecord)) {
    return undefined;
  }
  return parseIntegerOption(firstRecord['start-round']);
}

function parseIntegerOption(value: string | undefined): number | undefined {
  return value ? parseInt(value, 10) : undefined;
}

/**
 * Parses JSON content and extracts CLI options.
 * @param {string} content - The JSON content to parse.
 * @returns {Partial<CLIOptions>} A partial CLIOptions object.
 */
function parseJSON(content: string): Partial<CLIOptions> {
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
    throw new Error(`Invalid JSON: ${ARG_PLAYERS} must be an array`);
  }
  if (ARG_NUM_ROUNDS in record) {
    const numRounds = record[ARG_NUM_ROUNDS];
    if (typeof numRounds !== 'number' || numRounds < 1) {
      throw new Error(`Invalid JSON: ${ARG_NUM_ROUNDS} must be a number >= 1`);
    }
  }
  if (ARG_START_ROUND in record) {
    const startRound = record[ARG_START_ROUND];
    if (typeof startRound !== 'number' || startRound < 1) {
      throw new Error(`Invalid JSON: ${ARG_START_ROUND} must be a number >= 1`);
    }
  }
  if (ARG_ORDER in record) {
    if (
      typeof record[ARG_ORDER] !== 'string' ||
      !CLI_OPTION_ORDER.includes(record[ARG_ORDER] as CLIOptionOrder)
    ) {
      throw new Error(`Invalid JSON: ${ARG_ORDER} must be one of ${CLI_OPTION_ORDER.join(', ')}`);
    }
  }
  if (ARG_FORMAT in record) {
    if (
      typeof record[ARG_FORMAT] !== 'string' ||
      !CLI_OPTION_FORMAT.includes(record[ARG_FORMAT] as CLIOptionFormat)
    ) {
      throw new Error(`Invalid JSON: ${ARG_FORMAT} must be one of ${CLI_OPTION_FORMAT.join(', ')}`);
    }
  }
  if (ARG_MATCHES in record) {
    if (!Array.isArray(record[ARG_MATCHES]) || !record[ARG_MATCHES].every(isValidMatch)) {
      throw new Error(`Invalid JSON: ${ARG_MATCHES} must be an array of valid matches`);
    }
  }
}

function isValidMatch(match: unknown): match is ReadonlyMatch {
  return (
    Array.isArray(match) && match.length === 2 && typeof match[0] === 'string' && typeof match[1] === 'string'
  );
}

/**
 * Checks if the given file is of a supported type.
 * @param {string} filePath - The path to the file to check.
 * @returns {Result<undefined>} A Result object indicating success or failure.
 */
export function isSupportedFileType(filePath: string): Result<undefined> {
  // Check if file exists
  if (!existsSync(filePath)) {
    return {
      success: false,
      errorMessage: `${ARG_FILE} "${filePath}" does not exist.`,
    };
  }
  // Check if file extension is supported
  const ext = extname(filePath).toLowerCase();
  if (!SUPPORTED_FILE_TYPES.includes(ext as SupportedFileTypes)) {
    return {
      success: false,
      errorMessage: `${ARG_FILE} must have extension ${SUPPORTED_FILE_TYPES.join(', ')}.`,
    };
  }
  return { success: true, value: undefined };
}
