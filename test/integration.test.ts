import { afterEach, beforeEach, describe, expect, it, test } from '@jest/globals';

import { SUPPORTED_FILE_TYPES } from '../src/constants.js';
import { SupportedFileTypes } from '../src/types/types.js';
import { TelemetryClient } from '../src/telemetry/TelemetryClient.js';
import { exec } from 'child_process';
import fs from 'fs';
import fsPromise from 'fs/promises';
import os from 'os';
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

async function runCLI({
  args,
  env = process.env,
  useCache = false,
}: {
  readonly args: string;
  readonly env?: NodeJS.ProcessEnv;
  readonly useCache?: boolean;
}): Promise<CLIResult> {
  const cacheKey = `args:${args}`;
  const cliResult = cliResultCache.get(cacheKey);
  if (useCache && cliResult) {
    return cliResult;
  }

  try {
    const { stdout, stderr } = await execAsync(`node dist/index.js ${args}`, { env });
    const success = stderr === '';
    const result = { success: success, message: success ? stdout : `Error: ${stderr}\n${stdout}` };
    if (useCache) {
      cliResultCache.set(cacheKey, result);
    }
    return result;
  } catch (error) {
    if (isExecError(error)) {
      const result = { success: false, message: error.stderr };
      if (useCache) {
        cliResultCache.set(cacheKey, result);
      }
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

async function validateFixture({
  fileName,
  isErrorCase,
  allFixtures,
}: {
  readonly fileName: string;
  readonly isErrorCase: boolean;
  readonly allFixtures: readonly string[];
}): Promise<void> {
  const ext = path.extname(fileName);
  const fixturePath = path.join(fixturesDir, fileName);

  // text files contain arguments to be run directly in the CLI
  if (ext === '.txt') {
    const input = await readFileContent(fixturePath);
    const result = await runCLI({ args: input, useCache: true });
    validateCLIResult({ result, isErrorCase });
    // JSON or CSV files are expected to be provided as a file argument
  } else if (SUPPORTED_FILE_TYPES.includes(ext as SupportedFileTypes)) {
    const result = await runCLI({ args: `--file ${fixturePath}`, useCache: true });
    validateCLIResult({ result, isErrorCase });

    // Compare file input with direct CLI args if both exist
    const correspondingTxtFixtureName = fileName.replace(ext, '.txt');
    if (allFixtures.includes(correspondingTxtFixtureName)) {
      const correspondingTxtFixturePath = path.join(fixturesDir, correspondingTxtFixtureName);
      const inputWithArgs = await readFileContent(correspondingTxtFixturePath);
      const resultWithArgs = await runCLI({ args: inputWithArgs, useCache: true });
      expect(result).toEqual(resultWithArgs);
    }
  } else {
    throw new Error(`Unsupported file type: ${ext}`);
  }
}

describe('Integration Tests', () => {
  // Filter for only our test files, excluding hidden files and system files
  const allFixtures = fs
    .readdirSync(fixturesDir)
    .filter(
      (file) =>
        !file.startsWith('.') &&
        (SUPPORTED_FILE_TYPES.includes(path.extname(file) as SupportedFileTypes) ||
          path.extname(file) === '.txt')
    );
  const successFixtures = allFixtures.filter((file) => !file.startsWith('invalid-'));
  const failureFixtures = allFixtures.filter((file) => file.startsWith('invalid-'));

  test.each(successFixtures)('CLI Output: Success Case - %s', async (fixtureName) => {
    await validateFixture({ fileName: fixtureName, isErrorCase: false, allFixtures });
  });
  test.each(failureFixtures)('CLI Output: Failure Case - %s', async (fixtureName) => {
    await validateFixture({ fileName: fixtureName, isErrorCase: true, allFixtures });
  });

  describe('Telemetry Notice Integration', () => {
    let configDir: string;
    const originalEnv = { ...process.env };

    beforeEach(() => {
      // Set up temp directory for config files
      configDir = path.join(os.tmpdir(), `swiss-pairing-test-${String(Date.now())}`);
    });

    afterEach(() => {
      // eslint-disable-next-line functional/immutable-data
      process.env = originalEnv;
      if (fs.existsSync(configDir)) {
        fs.rmSync(configDir, { recursive: true });
      }
      TelemetryClient.resetForTesting();
    });

    it('should show notice on first run and create notice file', async () => {
      const env = {
        ...process.env,
        XDG_CONFIG_HOME: configDir,
        SWISS_PAIRING_TELEMETRY_OPT_OUT: '',
      };
      // First run
      const result1 = await runCLI({
        args: '--teams Alice Bob',
        env,
      });
      expect(result1.success).toBe(true);
      expect(result1.message).toContain('Telemetry Notice');

      // Second run
      const result2 = await runCLI({
        args: '--teams Alice Bob',
        env,
      });
      expect(result2.success).toBe(true);
      expect(result2.message).not.toContain('Telemetry Notice');
    });

    it('should respect telemetry opt out', async () => {
      const env = {
        ...process.env,
        XDG_CONFIG_HOME: configDir,
        SWISS_PAIRING_TELEMETRY_OPT_OUT: '1',
      };
      const result = await runCLI({ args: '--teams Alice Bob', env });
      expect(result.success).toBe(true);
      expect(result.message).not.toContain('Telemetry Notice');
    });
  });
});
