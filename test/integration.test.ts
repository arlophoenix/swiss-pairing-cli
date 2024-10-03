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

const runCLIWithArgs = async (args: string) => {
  const { stdout } = await execAsync(`node dist/index.js ${args}`);
  return stdout;
};

const runCLIWithFile = async (filePath: string) => {
  const { stdout } = await execAsync(`node dist/index.js --file ${filePath}`);
  return stdout;
};

const fileCache: Record<string, string> = {};

const readFileContent = async (filePath: string): Promise<string> => {
  if (!fileCache[filePath]) {
    // eslint-disable-next-line functional/immutable-data
    fileCache[filePath] = await fsPromise.readFile(filePath, 'utf-8');
  }
  return fileCache[filePath];
};

describe('Fixtures', () => {
  const fixtures = fs.readdirSync(fixturesDir);

  test.each(fixtures)('CLI Output - %s', async (fixture) => {
    const ext = path.extname(fixture);
    const fixturePath = path.join(fixturesDir, fixture);

    if (ext === '.txt') {
      const input = await readFileContent(fixturePath);
      const output = await runCLIWithArgs(input);
      expect(output).toMatchSnapshot();
    } else if (SUPPORTED_FILE_TYPES.includes(ext as SupportedFileTypes)) {
      const output = await runCLIWithFile(fixturePath);
      expect(output).toMatchSnapshot();

      const txtPath = fixturePath.replace(ext, '.txt');
      if (fixtures.includes(path.basename(txtPath))) {
        const inputWithArgs = await readFileContent(txtPath);
        const outputWithArgs = await runCLIWithArgs(inputWithArgs);
        expect(output).toEqual(outputWithArgs);
      }
    }
  });
});
