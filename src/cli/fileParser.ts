import {
  ARG_FILE,
  SUPPORTED_FILE_TYPES,
  SUPPORTED_FILE_TYPE_CSV,
  SUPPORTED_FILE_TYPE_JSON,
} from '../constants.js';
import { CLIOptions, Result, SupportedFileTypes } from '../types.js';

import { existsSync } from 'fs';
import { extname } from 'path';
import { parseCSV } from './csvParser.js';
import { parseJSON } from './jsonParser.js';
import { parseStringLiteral } from '../utils.js';
import { readFile } from 'fs/promises';

export async function parseFile(filePath: string): Promise<Partial<CLIOptions>> {
  const isSupportedFileTypeResult = isSupportedFileType(filePath);
  if (!isSupportedFileTypeResult.success) {
    throw new Error(`Unsupported file type: ${extname(filePath)}`);
  }
  const fileContent = await readFile(filePath, 'utf-8');

  switch (isSupportedFileTypeResult.value) {
    case SUPPORTED_FILE_TYPE_CSV:
      return parseCSV(fileContent);
    case SUPPORTED_FILE_TYPE_JSON:
      return parseJSON(fileContent);
  }
}

/**
 * Checks if the given file is of a supported type.
 * @param {string} filePath - The path to the file to check.
 * @returns {Result<undefined>} A Result object indicating success or failure.
 */
export function isSupportedFileType(filePath: string): Result<SupportedFileTypes> {
  // Check if file exists
  if (!existsSync(filePath)) {
    return {
      success: false,
      errorMessage: `${ARG_FILE} "${filePath}" does not exist.`,
    };
  }
  // Check if file extension is supported
  const ext = extname(filePath).toLowerCase();
  return parseStringLiteral<SupportedFileTypes>({
    input: ext,
    options: SUPPORTED_FILE_TYPES,
    errorMessage: `${ARG_FILE} must have extension ${SUPPORTED_FILE_TYPES.join(', ')}.`,
  });
}
