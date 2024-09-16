import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const runCLI = (args: string) =>
  execSync(`node dist/index.js ${args}`, {
    encoding: 'utf-8',
  });

describe('Fixtures', () => {
  const fixturesDir = path.join(__dirname, 'fixtures');

  fs.readdirSync(fixturesDir).forEach((fixture) => {
    test(`CLI Output - ${fixture}`, () => {
      const input = fs.readFileSync(path.join(fixturesDir, fixture), 'utf-8');
      const output = runCLI(input);
      expect(output).toMatchSnapshot();
    });
  });
});
