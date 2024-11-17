import * as cliActionCommand from '../commands/cliAction/cliActionCommand.js';

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { BIN_NAME } from '../constants.js';
import type { SpyInstance } from 'jest-mock';
import { createCLI } from './cli.js';

jest.mock('../commands/cliAction/cliActionCommand.js');

describe('CLI', () => {
  let mockHandleCLIAction: SpyInstance<typeof cliActionCommand.handleCLIAction>;
  let mockConsoleLog: SpyInstance;
  let mockConsoleError: SpyInstance;
  let mockProcessExit: SpyInstance<typeof process.exit>;

  beforeEach(() => {
    mockHandleCLIAction = jest
      .spyOn(cliActionCommand, 'handleCLIAction')
      .mockResolvedValue({ output: 'Matches generated successfully', exitCode: 0 });

    mockConsoleLog = jest.spyOn(console, 'log').mockReturnValue();
    mockConsoleError = jest.spyOn(console, 'error').mockReturnValue();
    mockProcessExit = jest.spyOn(process, 'exit').mockImplementation((code?) => {
      throw new Error(`Process exited with code ${String(code)}`);
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should handle successful case', async () => {
    const program = createCLI();
    await program.parseAsync(['node', BIN_NAME, '--teams', 'Alice', 'Bob']);

    expect(cliActionCommand.handleCLIAction).toHaveBeenCalledWith(
      expect.objectContaining({ teams: ['Alice', 'Bob'] })
    );
    expect(mockConsoleLog).toHaveBeenCalledWith('Matches generated successfully');
    expect(mockConsoleError).not.toHaveBeenCalled();
    expect(mockProcessExit).not.toHaveBeenCalled();
  });

  it('should handle errors', async () => {
    mockHandleCLIAction.mockResolvedValue({
      output: 'Invalid input',
      exitCode: 1,
    });

    const program = createCLI();
    await expect(program.parseAsync(['node', BIN_NAME, '--teams', 'Alice'])).rejects.toThrow(
      'Process exited with code 1'
    );

    expect(mockConsoleLog).not.toHaveBeenCalled();
    expect(mockConsoleError).toHaveBeenCalledWith('Invalid input');
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  it('should pass through all options', async () => {
    const program = createCLI();
    await program.parseAsync([
      'node',
      BIN_NAME,
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
