import * as cliAction from './cliAction.js';

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { SpyInstance } from 'jest-mock';
import { createCLI } from './cli.js';

jest.mock('./cliAction.js');

describe('Swiss Pairing CLI', () => {
  let mockHandleCLIAction: SpyInstance<typeof cliAction.handleCLIAction>;
  let mockConsoleLog: SpyInstance;
  let mockConsoleError: SpyInstance;
  let _mockProcessExit: SpyInstance<typeof process.exit>;

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
    _mockProcessExit = jest.spyOn(process, 'exit').mockImplementation((code?) => {
      throw new Error(`Process exited with code ${String(code)}`);
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should handle valid input correctly', async () => {
    const program = createCLI();
    await program.parseAsync(['node', 'swiss-pairing', '--teams', 'Alice', 'Bob', '--num-rounds', '3']);

    expect(mockHandleCLIAction).toHaveBeenCalledWith({ teams: ['Alice', 'Bob'], numRounds: '3' });
    expect(mockConsoleLog).toHaveBeenCalledWith('Matches generated successfully');
  });

  it('should handle CLI action errors', async () => {
    mockHandleCLIAction.mockResolvedValue({
      success: false,
      error: { type: 'NoValidSolution', message: 'Unable to generate valid matches' },
    });

    const program = createCLI();
    await expect(program.parseAsync(['node', 'swiss-pairing', '--teams', 'Alice', 'Bob'])).rejects.toThrow();
    expect(mockConsoleError).toHaveBeenCalledWith('NoValidSolution: Unable to generate valid matches');
  });

  it('should pass all options to validateCLIOptions', async () => {
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
      'tournament-data.csv',
    ]);

    expect(mockHandleCLIAction).toHaveBeenCalledWith({
      teams: ['Alice', 'Bob'],
      numRounds: '3',
      startRound: '2',
      order: 'random',
      format: 'json-pretty',
      matches: [['Alice', 'Bob']],
      file: 'tournament-data.csv',
    });
  });
});
