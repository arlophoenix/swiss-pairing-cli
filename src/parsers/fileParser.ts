import {
  ARG_FILE,
  SUPPORTED_FILE_TYPES,
  SUPPORTED_FILE_TYPE_CSV,
  SUPPORTED_FILE_TYPE_JSON,
} from '../constants.js';
import { BooleanResult, Result, SupportedFileTypes, ValidatedCLIOptions } from '../types/types.js';
import { ErrorTemplate, createInvalidValueMessage, formatError, parseStringLiteral } from './parserUtils.js';

import { existsSync } from 'fs';
import { extname } from 'path';
import { parseOptionsFromCSV } from './csvParser.js';
import { parseOptionsFromJSON } from './jsonParser.js';
import { readFile } from 'fs/promises';

/**
 * Parses tournament configuration from file.
 * Validates file type before attempting to read.
 *
 * Note: File reading is asynchronous but parsing is synchronous
 * to maintain consistent error handling with CLI validation.
 *
 * @param filePath - Path to configuration file
 * @returns Parsed and validated options or error message
 */
export async function parseFile(filePath: string): Promise<Result<Partial<ValidatedCLIOptions>>> {
  const fileTypeResult = getFileType(filePath);
  if (!fileTypeResult.success) {
    return fileTypeResult;
  }

  try {
    const fileExistsResult = fileExists(filePath);
    if (!fileExistsResult.success) {
      return fileExistsResult;
    }

    const fileContent = await readFile(filePath, 'utf-8');

    // Type-specific parsing based on extension
    switch (fileTypeResult.value) {
      case SUPPORTED_FILE_TYPE_CSV:
        return parseOptionsFromCSV(fileContent);
      case SUPPORTED_FILE_TYPE_JSON:
        return parseOptionsFromJSON(fileContent);
    }
  } catch (error) {
    return {
      success: false,
      message: formatError({
        template: ErrorTemplate.FILE_READ_ERROR,
        values: { error: (error as Error).message },
      }),
    };
  }
}

/**
 * Validates file extension against supported types.
 * Case-insensitive comparison of extensions.
 */
function getFileType(filePath: string): Result<SupportedFileTypes> {
  const ext = extname(filePath).toLowerCase();
  const result = parseStringLiteral({
    input: ext,
    options: SUPPORTED_FILE_TYPES,
  });
  if (!result.success) {
    return {
      success: false,
      message: createInvalidValueMessage({
        origin: 'CLI',
        argName: ARG_FILE,
        inputValue: filePath,
        expectedValue: `extension to be one of ${SUPPORTED_FILE_TYPES.join(', ')}`,
      }),
    };
  }
  return result;
}

/**
 * Checks if file exists before attempting to read.
 * Separate from type check to give specific error message.
 */
function fileExists(filePath: string): BooleanResult {
  if (!existsSync(filePath)) {
    return {
      success: false,
      message: formatError({
        template: ErrorTemplate.FILE_NOT_FOUND,
        values: { path: filePath },
      }),
    };
  }
  return { success: true };
}
