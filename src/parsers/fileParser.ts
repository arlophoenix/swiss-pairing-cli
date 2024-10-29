import {
  ARG_FILE,
  SUPPORTED_FILE_TYPES,
  SUPPORTED_FILE_TYPE_CSV,
  SUPPORTED_FILE_TYPE_JSON,
} from '../constants.js';
import { BooleanResult, Result, SupportedFileTypes, ValidatedCLIOptions } from '../types/types.js';
import { createInvalidValueMessage, parseStringLiteral } from './parserUtils.js';

import { existsSync } from 'fs';
import { extname } from 'path';
import { parseOptionsFromCSV } from './csvParser.js';
import { parseOptionsFromJSON } from './jsonParser.js';
import { readFile } from 'fs/promises';

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
    switch (fileTypeResult.value) {
      case SUPPORTED_FILE_TYPE_CSV:
        return parseOptionsFromCSV(fileContent);
      case SUPPORTED_FILE_TYPE_JSON:
        return parseOptionsFromJSON(fileContent);
    }
  } catch (error) {
    const errorMessage = (error as Error).message;
    return {
      success: false,
      message: `Error reading file: ${errorMessage}`,
    };
  }
}

function getFileType(filePath: string): Result<SupportedFileTypes> {
  const ext = extname(filePath).toLowerCase();
  const result = parseStringLiteral<SupportedFileTypes>({
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

function fileExists(filePath: string): BooleanResult {
  if (!existsSync(filePath)) {
    return {
      success: false,
      message: createInvalidValueMessage({
        origin: 'CLI',
        argName: ARG_FILE,
        inputValue: filePath,
        expectedValue: `file not found.`,
      }),
    };
  }
  return { success: true };
}
