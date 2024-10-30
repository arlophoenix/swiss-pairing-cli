import * as cliUtils from './cliUtils.js';
import * as tournamentCommands from '../commands/generateRounds.js';
import * as validator from '../validators/cliValidator.js';

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { ValidatedCLIOptions } from '../types/types.js';
import { handleCLIAction } from './cliAction.js';

jest.mock('../validators/cliValidator.js');
jest.mock('./cliUtils.js');
jest.mock('../commands/generateRounds.js');

describe('handleCLIAction', () => {
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

    jest.spyOn(tournamentCommands, 'handleGenerateRounds').mockReturnValue({
      success: true,
      value: 'Round 1:\nAlice vs Bob',
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should prepare and execute generate rounds command', async () => {
    const result = await handleCLIAction({
      teams: ['Alice [A]', 'Bob [B]'],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBe('Round 1:\nAlice vs Bob');
    }

    expect(validator.validateCLIOptions).toHaveBeenCalled();
    expect(cliUtils.validateFileOptions).toHaveBeenCalled();
    expect(cliUtils.mergeOptions).toHaveBeenCalled();
    expect(tournamentCommands.handleGenerateRounds).toHaveBeenCalledWith({
      teams: ['Alice', 'Bob'],
      numRounds: 1,
      startRound: 1,
      matches: [],
      format: 'text-markdown',
      squadMap: new Map([
        ['Alice', 'A'],
        ['Bob', 'B'],
      ]),
    });
  });

  it('should fail on invalid CLI options', async () => {
    jest.spyOn(validator, 'validateCLIOptions').mockReturnValue({
      success: false,
      message: 'Invalid teams',
    });

    const result = await handleCLIAction({
      teams: ['Alice'],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toBe('Invalid teams');
    }

    expect(cliUtils.validateFileOptions).not.toHaveBeenCalled();
    expect(tournamentCommands.handleGenerateRounds).not.toHaveBeenCalled();
  });

  it('should fail on invalid file options', async () => {
    jest.spyOn(cliUtils, 'validateFileOptions').mockResolvedValue({
      success: false,
      message: 'Invalid file',
    });

    const result = await handleCLIAction({
      teams: ['Alice', 'Bob'],
      file: 'invalid.csv',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toBe('Invalid file');
    }

    expect(cliUtils.mergeOptions).not.toHaveBeenCalled();
    expect(tournamentCommands.handleGenerateRounds).not.toHaveBeenCalled();
  });

  it('should transform team ordering to command', async () => {
    jest.spyOn(cliUtils, 'mergeOptions').mockReturnValue({
      ...defaultValidatedOptions,
      order: 'random',
    });

    await handleCLIAction({
      teams: ['Alice', 'Bob'],
      order: 'random',
    });

    expect(cliUtils.prepareTeams).toHaveBeenCalledWith(
      expect.objectContaining({
        order: 'random',
      })
    );
  });

  it('should pass custom round configuration to command', async () => {
    jest.spyOn(cliUtils, 'mergeOptions').mockReturnValue({
      ...defaultValidatedOptions,
      numRounds: 3,
      startRound: 2,
    });

    await handleCLIAction({
      teams: ['Alice', 'Bob'],
      numRounds: '3',
      startRound: '2',
    });

    expect(tournamentCommands.handleGenerateRounds).toHaveBeenCalledWith(
      expect.objectContaining({
        numRounds: 3,
        startRound: 2,
      })
    );
  });
});
