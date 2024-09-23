import { SUPPORTED_FILE_TYPES } from '../src/constants.js';
import { SupportedFileTypes } from '../src/types.js';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const runCLIWithArgs = (args: string) =>
  execSync(`node dist/index.js ${args}`, {
    encoding: 'utf-8',
  });

const runCLIWithFile = (filePath: string) =>
  execSync(`node dist/index.js --file ${filePath}`, {
    encoding: 'utf-8',
  });

describe('Fixtures', () => {
  const fixturesDir = path.join(__dirname, 'fixtures');

  fs.readdirSync(fixturesDir).forEach((fixture) => {
    const ext = path.extname(fixture);
    const fixturePath = path.join(fixturesDir, fixture);

    if (ext === '.txt') {
      // Load arguments directly for .txt files
      const input = fs.readFileSync(fixturePath, 'utf-8');
      test(`CLI Output (txt) - ${fixture}`, () => {
        const output = runCLIWithArgs(input);
        expect(output).toMatchSnapshot();
      });
    } else if (SUPPORTED_FILE_TYPES.includes(ext as SupportedFileTypes)) {
      // Use --file for .csv and .json files
      test(`CLI Output (file) - ${fixture}`, () => {
        const output = runCLIWithFile(fixturePath);
        expect(output).toMatchSnapshot();
      });
    }
  });
});
