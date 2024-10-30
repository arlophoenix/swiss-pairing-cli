import * as cliUtils from '../../cli/cliUtils.js';
import * as generateRoundsCommand from '../generateRounds/generateRoundsCommand.js';
import * as outputFormatter from '../../formatters/outputFormatter.js';
import * as validator from '../../validators/cliValidator.js';

import { Round, ValidatedCLIOptions } from '../../types/types.js';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { handleCLIActionCommand } from './cliActionCommand.js';

jest.mock('../../validators/cliValidator.js');
jest.mock('../../cli/cliUtils.js');
jest.mock('../generateRounds/generateRoundsCommand.js');
jest.mock('../../formatters/outputFormatter.js');

describe('handleCLIActionCommand', () => {
  const defaultValidatedOptions: ValidatedCLIOptions = {
    teams: [
      { name: 'Alice', squad: 'A' },
      { name: 'Bob', squad: 'B' },
    ],
    numRounds: 1,
    startRound: 1,
    matches: [],
    format: 'text-markdown',
    file: '',
    order: 'top-down',
  };

  const mockRounds: { readonly rounds: readonly Round[] } = {
    rounds: [
      {
        label: 'Round 1',
        number: 1,
        matches: [['Alice', 'Bob']],
      },
    ],
  };

  beforeEach(() => {
    jest.spyOn(validator, 'validateCLIOptions').mockReturnValue({
      success: true,
      value: defaultValidatedOptions,
    });

    jest.spyOn(cliUtils, 'validateFileOptions').mockResolvedValue({
      success: true,
      value: {},
    });

    jest.spyOn(cliUtils, 'mergeOptions').mockReturnValue(defaultValidatedOptions);
    jest.spyOn(cliUtils, 'prepareTeams').mockReturnValue(['Alice', 'Bob']);
    jest.spyOn(cliUtils, 'createSquadMap').mockReturnValue(
      new Map([
        ['Alice', 'A'],
        ['Bob', 'B'],
      ])
    );

    jest.spyOn(generateRoundsCommand, 'handleGenerateRounds').mockReturnValue({
      success: true,
      value: mockRounds,
    });

    jest.spyOn(outputFormatter, 'formatOutput').mockReturnValue('Round 1:\nAlice vs Bob');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should handle command successfully', async () => {
    const result = await handleCLIActionCommand({
      teams: ['Alice [A]', 'Bob [B]'],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBe('Round 1:\nAlice vs Bob');
    }

    // Verify core flow
    expect(validator.validateCLIOptions).toHaveBeenCalled();
    expect(cliUtils.validateFileOptions).toHaveBeenCalled();
    expect(cliUtils.mergeOptions).toHaveBeenCalled();

    // Verify tournament command preparation
    expect(generateRoundsCommand.handleGenerateRounds).toHaveBeenCalledWith({
      teams: ['Alice', 'Bob'],
      numRounds: 1,
      startRound: 1,
      matches: [],
      squadMap: new Map([
        ['Alice', 'A'],
        ['Bob', 'B'],
      ]),
    });

    // Verify output formatting
    expect(outputFormatter.formatOutput).toHaveBeenCalledWith({
      results: mockRounds,
      format: 'text-markdown',
    });
  });

  it('should fail on invalid CLI options', async () => {
    jest.spyOn(validator, 'validateCLIOptions').mockReturnValue({
      success: false,
      message: 'Invalid teams',
    });

    const result = await handleCLIActionCommand({
      teams: ['Alice'],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toBe('Invalid teams');
    }

    expect(cliUtils.validateFileOptions).not.toHaveBeenCalled();
    expect(generateRoundsCommand.handleGenerateRounds).not.toHaveBeenCalled();
    expect(outputFormatter.formatOutput).not.toHaveBeenCalled();
  });

  it('should fail on invalid file options', async () => {
    jest.spyOn(cliUtils, 'validateFileOptions').mockResolvedValue({
      success: false,
      message: 'Invalid file',
    });

    const result = await handleCLIActionCommand({
      teams: ['Alice', 'Bob'],
      file: 'invalid.csv',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toBe('Invalid file');
    }

    expect(cliUtils.mergeOptions).not.toHaveBeenCalled();
    expect(generateRoundsCommand.handleGenerateRounds).not.toHaveBeenCalled();
    expect(outputFormatter.formatOutput).not.toHaveBeenCalled();
  });

  it('should pass tournament generation failure through', async () => {
    jest.spyOn(generateRoundsCommand, 'handleGenerateRounds').mockReturnValue({
      success: false,
      message: 'Cannot generate rounds',
    });

    const result = await handleCLIActionCommand({
      teams: ['Alice', 'Bob'],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toBe('Cannot generate rounds');
    }

    expect(outputFormatter.formatOutput).not.toHaveBeenCalled();
  });

  it('should transform team ordering', async () => {
    jest.spyOn(cliUtils, 'mergeOptions').mockReturnValue({
      ...defaultValidatedOptions,
      order: 'random',
    });

    await handleCLIActionCommand({
      teams: ['Alice', 'Bob'],
      order: 'random',
    });

    expect(cliUtils.prepareTeams).toHaveBeenCalledWith(
      expect.objectContaining({
        order: 'random',
      })
    );
  });

  it('should pass custom round configuration', async () => {
    jest.spyOn(cliUtils, 'mergeOptions').mockReturnValue({
      ...defaultValidatedOptions,
      numRounds: 3,
      startRound: 2,
    });

    await handleCLIActionCommand({
      teams: ['Alice', 'Bob'],
      numRounds: '3',
      startRound: '2',
    });

    expect(generateRoundsCommand.handleGenerateRounds).toHaveBeenCalledWith(
      expect.objectContaining({
        numRounds: 3,
        startRound: 2,
      })
    );
  });
});
