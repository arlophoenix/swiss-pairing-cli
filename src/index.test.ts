import { describe, expect, it } from '@jest/globals';

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('Swiss Pairing CLI', () => {
  it('should display help information when run without arguments', async () => {
    const { stdout } = await execAsync('node dist/index.js --help');
    expect(stdout).toContain('A simple CLI tool for generating Swiss pairings');
    expect(stdout).toContain('-p, --players <names...>');
    expect(stdout).toContain('-r, --rounds <number>');
  });
});
