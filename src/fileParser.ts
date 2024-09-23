import * as papa from 'papaparse';

import {
  ARG_FILE,
  SUPPORTED_FILE_TYPES,
  SUPPORTED_FILE_TYPE_CSV,
  SUPPORTED_FILE_TYPE_JSON,
} from './constants.js';
import { CLIOptionOrder, CLIOptions, ReadonlyMatch, Result, SupportedFileTypes } from './types.js';

import { existsSync } from 'fs';
import { extname } from 'path';
import { readFile } from 'fs/promises';

interface CSVRecord {
  readonly players?: string;
  readonly numRounds?: string;
  readonly startRound?: string;
  readonly order?: string;
  readonly matches1?: string;
  readonly matches2?: string;
  readonly [key: string]: string | undefined;
}

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

  const firstRecord = records[0];

  const result = Object.entries({
    players:
      'players' in firstRecord
        ? records.map((record) => record.players).filter((player): player is string => !!player)
        : undefined,
    numRounds:
      'numRounds' in firstRecord && firstRecord.numRounds ? parseInt(firstRecord.numRounds, 10) : undefined,
    startRound:
      'startRound' in firstRecord && firstRecord.startRound
        ? parseInt(firstRecord.startRound, 10)
        : undefined,
    order: 'order' in firstRecord && firstRecord.order ? (firstRecord.order as CLIOptionOrder) : undefined,
    matches:
      'matches1' in firstRecord && 'matches2' in firstRecord
        ? records
            .map((record): ReadonlyMatch => [record.matches1 ?? '', record.matches2 ?? ''])
            .filter((match): match is ReadonlyMatch => !!match[0] && !!match[1])
        : undefined,
    // eslint-disable-next-line max-params
  }).reduce((acc, [key, value]) => (value !== undefined ? { ...acc, [key]: value } : acc), {});

  return result;
}

function parseJSON(content: string): Partial<CLIOptions> {
  const parsed = JSON.parse(content) as Partial<CLIOptions>;

  const result = Object.entries({
    ...parsed,
    matches: Array.isArray(parsed.matches)
      ? parsed.matches.filter(
          (match): match is readonly [string, string] =>
            Array.isArray(match) &&
            match.length === 2 &&
            typeof match[0] === 'string' &&
            typeof match[1] === 'string'
        )
      : undefined,
    // eslint-disable-next-line max-params
  }).reduce((acc, [key, value]) => (value !== undefined ? { ...acc, [key]: value } : acc), {});
  return result;
}

export function isSupportedFileType(filePath: string): Result<undefined> {
  if (!existsSync(filePath)) {
    return {
      success: false,
      errorMessage: `${ARG_FILE} "${filePath}" does not exist.`,
    };
  }
  const ext = extname(filePath).toLowerCase();
  if (!SUPPORTED_FILE_TYPES.includes(ext as SupportedFileTypes)) {
    return {
      success: false,
      errorMessage: `${ARG_FILE} must have extension ${SUPPORTED_FILE_TYPES.join(', ')}.`,
    };
  }
  return { success: true, value: undefined };
}
