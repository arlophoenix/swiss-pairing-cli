import {
  ARG_FILE,
  SUPPORTED_FILE_TYPES,
  SUPPORTED_FILE_TYPE_CSV,
  SUPPORTED_FILE_TYPE_JSON,
} from '../constants.js';
import { Result, SupportedFileTypes, ValidatedCLIOptions } from '../types/types.js';

import { createInvalidValueErrorMessage } from '../utils/errorUtils.js';
import { existsSync } from 'fs';
import { extname } from 'path';
import { parseOptionsFromCSV } from './csvParser.js';
import { parseOptionsFromJSON } from './jsonParser.js';
import { parseStringLiteral } from '../utils/utils.js';
import { readFile } from 'fs/promises';

export async function parseFile(filePath: string): Promise<Result<Partial<ValidatedCLIOptions>>> {
  const fileTypeResult = getFileType(filePath);
  if (!fileTypeResult.success) return fileTypeResult;

  try {
    if (!existsSync(filePath)) {
      return {
        success: false,
        error: {
          type: 'InvalidInput',
          message: `File not found: ${filePath}`,
        },
      };
    }
    const fileContent = await readFile(filePath, 'utf-8');
    switch (fileTypeResult.value) {
      case SUPPORTED_FILE_TYPE_CSV:
        return parseOptionsFromCSV(fileContent);
      case SUPPORTED_FILE_TYPE_JSON:
        return parseOptionsFromJSON(fileContent);
    }
  } catch (error) {
    return {
      success: false,
      error: {
        type: 'InvalidInput',
        message: `Error reading file: ${(error as Error).message}`,
      },
    };
  }
}

function getFileType(filePath: string): Result<SupportedFileTypes> {
  const ext = extname(filePath).toLowerCase();
  return parseStringLiteral<SupportedFileTypes>({
    input: ext,
    options: SUPPORTED_FILE_TYPES,
    error: {
      type: 'InvalidInput',
      message: createInvalidValueErrorMessage({
        origin: 'CLI',
        argName: ARG_FILE,
        expectedValue: SUPPORTED_FILE_TYPES,
        inputValue: ext,
      }),
    },
  });
}
