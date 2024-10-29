import { describe, expect, test } from '@jest/globals';

import { SUPPORTED_FILE_TYPES } from '../src/constants.js';
import { SupportedFileTypes } from '../src/types/types.js';
import { exec } from 'child_process';
import fs from 'fs';
import fsPromise from 'fs/promises';
import path from 'path';
import util from 'util';

const execAsync = util.promisify(exec);
const fixturesDir = path.join(__dirname, 'fixtures');

const fileCache: Record<string, string> = {};
const cliResultCache = new Map<string, CLIResult>();

interface ExecError extends Error {
  readonly stdout: string;
  readonly stderr: string;
  readonly code: number;
}

interface CLIResult {
  readonly success: boolean;
  readonly message: string;
}

function isExecError(error: unknown): error is ExecError {
  return (
    typeof error === 'object' && error !== null && 'stderr' in error && 'stdout' in error && 'code' in error
  );
}

async function readFileContent(filePath: string): Promise<string> {
  if (!fileCache[filePath]) {
    // eslint-disable-next-line functional/immutable-data
    fileCache[filePath] = await fsPromise.readFile(filePath, 'utf-8');
  }
  return fileCache[filePath];
}

async function runCLI(args: string): Promise<CLIResult> {
  const cacheKey = `args:${args}`;
  const cliResult = cliResultCache.get(cacheKey);
  if (cliResult) {
    return cliResult;
  }

  try {
    const { stdout, stderr } = await execAsync(`node dist/index.js ${args}`);
    const result = { success: stderr === '', message: stdout };

    cliResultCache.set(cacheKey, result);
    return result;
  } catch (error) {
    if (isExecError(error)) {
      const result = { success: false, message: error.stderr };
      cliResultCache.set(cacheKey, result);
      return result;
    }
    throw error;
  }
}

function validateCLIResult({
  result,
  isErrorCase,
}: {
  readonly result: CLIResult;
  readonly isErrorCase: boolean;
}): void {
  // print the output for unexpected errors
  if (result.success === isErrorCase) {
    console.log(result.message);
  }
  expect(result.success).toBe(!isErrorCase);
  expect(result).toMatchSnapshot();
}

describe('Integration Tests', () => {
  // Filter for only our test files, excluding hidden files and system files
  const fixtures = fs
    .readdirSync(fixturesDir)
    .filter(
      (file) =>
        !file.startsWith('.') &&
        (SUPPORTED_FILE_TYPES.includes(path.extname(file) as SupportedFileTypes) ||
          path.extname(file) === '.txt')
    );

  test.each(fixtures)('CLI Output - %s', async (fixture) => {
    const ext = path.extname(fixture);
    const fixturePath = path.join(fixturesDir, fixture);
    const isErrorCase = fixture.startsWith('invalid-');

    // text files contain arguments to be run directly in the CLI
    if (ext === '.txt') {
      const input = await readFileContent(fixturePath);
      const result = await runCLI(input);
      validateCLIResult({ result, isErrorCase });
      // JSON or CSV files are expected to be provided as a file argument
    } else if (SUPPORTED_FILE_TYPES.includes(ext as SupportedFileTypes)) {
      const result = await runCLI(`--file ${fixturePath}`);
      validateCLIResult({ result, isErrorCase });

      // Compare file input with direct CLI args if both exist
      const txtPath = fixturePath.replace(ext, '.txt');
      if (fixtures.includes(path.basename(txtPath))) {
        const inputWithArgs = await readFileContent(txtPath);
        const resultWithArgs = await runCLI(inputWithArgs);
        expect(result).toEqual(resultWithArgs);
      }
    } else {
      throw new Error(`Unsupported file type: ${ext}`);
    }
  });
});
