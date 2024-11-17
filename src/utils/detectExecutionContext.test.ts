import { afterEach, describe, expect, it } from '@jest/globals';

import { detectExecutionContext } from './detectExecutionContext.js';

describe('detectExecutionContext', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    // eslint-disable-next-line functional/immutable-data
    process.env = { ...originalEnv };
  });

  it('should detect npx execution', () => {
    // eslint-disable-next-line functional/immutable-data
    process.env.npm_execpath = '/path/to/npx/executable';
    expect(detectExecutionContext()).toBe('npx');
  });

  it('should detect global installation', () => {
    // eslint-disable-next-line functional/immutable-data
    process.env.npm_execpath = '/usr/local/lib/node_modules/npm/bin/npm-cli.js';
    expect(detectExecutionContext()).toBe('global');
  });

  it('should detect local installation', () => {
    // eslint-disable-next-line functional/immutable-data
    process.env.npm_execpath = '/path/to/project/node_modules/.bin/cli';
    expect(detectExecutionContext()).toBe('local');
  });

  it('should default to local when npm_execpath is undefined', () => {
    // eslint-disable-next-line functional/immutable-data
    delete process.env.npm_execpath;
    expect(detectExecutionContext()).toBe('local');
  });
});
