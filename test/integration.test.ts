import { DEBUG_PREFIX, SUPPORTED_FILE_TYPES } from '../src/constants.js';
import { afterEach, beforeEach, describe, expect, it, test } from '@jest/globals';

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

async function runCLI(args: string): Promise<CLIResult> {
  const cacheKey = `args:${args}`;
  const cliResult = cliResultCache.get(cacheKey);
  if (cliResult) {
    return cliResult;
  }

  try {
    const { stdout, stderr } = await execAsync(`node dist/index.js ${args}`);
    const result = { success: stderr === '', message: stderr === '' ? stderr : stdout };
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

  describe('Telemetry Notice Integration', () => {
    let configDir: string;
    let noticePath: string;

    beforeEach(() => {
      // Set up temp directory for config files
      configDir = path.join(os.tmpdir(), `swiss-pairing-test-${String(Date.now())}`);
      noticePath = path.join(configDir, '.telemetry-notice-shown');

      cliResultCache.clear(); // Clear CLI result cache
    });

    afterEach(() => {
      if (fs.existsSync(configDir)) {
        fs.rmSync(configDir, { recursive: true });
      }
      TelemetryClient.resetForTesting();
    });

    it('should show notice on first run and create notice file', async () => {
      // First run
      const result1 = await runCLI('--teams Alice Bob');
      expect(result1.success).toBe(true);
      expect(result1.message).toContain('Telemetry Notice');
      expect(fs.existsSync(noticePath)).toBe(true);

      // Second run
      const result2 = await runCLI('--teams Alice Bob');
      expect(result2.success).toBe(true);
      expect(result2.message).not.toContain('Telemetry Notice');
    });

    it('should respect telemetry opt out', async () => {
      // eslint-disable-next-line functional/immutable-data
      process.env.SWISS_PAIRING_TELEMETRY_OPT_OUT = '1';
      const result = await runCLI('--teams Alice Bob');
      expect(result.success).toBe(true);
      expect(result.message).not.toContain('Telemetry Notice');
    });
  });
});
