import * as cliAction from './cliAction.js';

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { SpyInstance } from 'jest-mock';
import { createCLI } from './cli.js';

jest.mock('./cliAction.js');

describe('CLI', () => {
  let mockHandleCLIAction: SpyInstance<typeof cliAction.handleCLIAction>;
  let mockConsoleLog: SpyInstance;
  let mockConsoleError: SpyInstance;
  let mockProcessExit: SpyInstance<typeof process.exit>;

  beforeEach(() => {
    mockHandleCLIAction = jest
      .spyOn(cliAction, 'handleCLIAction')
      .mockResolvedValue({ success: true, value: 'Matches generated successfully' });
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {
      // do nothing
    });
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {
      // do nothing
    });
    mockProcessExit = jest.spyOn(process, 'exit').mockImplementation((code?) => {
      throw new Error(`Process exited with code ${String(code)}`);
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should handle successful case', async () => {
    const program = createCLI();
    await program.parseAsync(['node', 'swiss-pairing', '--teams', 'Alice', 'Bob']);

    expect(cliAction.handleCLIAction).toHaveBeenCalledWith(
      expect.objectContaining({ teams: ['Alice', 'Bob'] })
    );
    expect(mockConsoleLog).toHaveBeenCalledWith('Matches generated successfully');
    expect(mockConsoleError).not.toHaveBeenCalled();
    expect(mockProcessExit).not.toHaveBeenCalled();
  });

  it('should handle errors', async () => {
    jest.spyOn(cliAction, 'handleCLIAction').mockResolvedValue({
      success: false,
      message: 'Invalid input',
    });

    const program = createCLI();
    await expect(program.parseAsync(['node', 'swiss-pairing', '--teams', 'Alice'])).rejects.toThrow(
      'Process exited with code 1'
    );

    expect(mockConsoleError).toHaveBeenCalledWith('Invalid input');
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  it('should pass through all options', async () => {
    const program = createCLI();
    await program.parseAsync([
      'node',
      'swiss-pairing',
      '--teams',
      'Alice',
      'Bob',
      '--num-rounds',
      '3',
      '--start-round',
      '2',
      '--order',
      'random',
      '--format',
      'json-pretty',
      '--matches',
      'Alice,Bob',
      '--file',
      'data.csv',
    ]);

    expect(mockHandleCLIAction).toHaveBeenCalledWith({
      teams: ['Alice', 'Bob'],
      numRounds: '3',
      startRound: '2',
      order: 'random',
      format: 'json-pretty',
      matches: [['Alice', 'Bob']],
      file: 'data.csv',
    });
  });
});
