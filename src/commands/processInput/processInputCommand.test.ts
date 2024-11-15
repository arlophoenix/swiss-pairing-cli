import * as processInputUtils from './processInputUtils.js';
import * as validator from '../../validators/cliValidator.js';

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { ValidatedCLIOptions } from '../../types/types.js';
import { handleProcessInput } from './processInputCommand.js';

jest.mock('../../validators/cliValidator.js');
jest.mock('./processInputUtils.js');

describe('handleProcessInput', () => {
  let defaultValidatedOptions: ValidatedCLIOptions;

  beforeEach(() => {
    defaultValidatedOptions = {
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

    jest.spyOn(validator, 'validateCLIOptions').mockReturnValue({
      success: true,
      value: defaultValidatedOptions,
    });

    jest.spyOn(processInputUtils, 'validateFileOptions').mockResolvedValue({
      success: true,
      value: {},
    });

    jest.spyOn(processInputUtils, 'mergeOptions').mockReturnValue(defaultValidatedOptions);
    jest.spyOn(processInputUtils, 'prepareTeams').mockReturnValue(['Alice', 'Bob']);
    jest.spyOn(processInputUtils, 'createSquadMap').mockReturnValue(
      new Map([
        ['Alice', 'A'],
        ['Bob', 'B'],
      ])
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should process input successfully', async () => {
    const result = await handleProcessInput({
      teams: ['Alice [A]', 'Bob [B]'],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual({
        teams: ['Alice', 'Bob'],
        numRounds: 1,
        startRound: 1,
        matches: [],
        squadMap: new Map([
          ['Alice', 'A'],
          ['Bob', 'B'],
        ]),
        format: 'text-markdown',
      });
    }

    expect(validator.validateCLIOptions).toHaveBeenCalled();
    expect(processInputUtils.validateFileOptions).toHaveBeenCalled();
    expect(processInputUtils.mergeOptions).toHaveBeenCalled();
  });

  it('should fail on invalid CLI options', async () => {
    jest.spyOn(validator, 'validateCLIOptions').mockReturnValue({
      success: false,
      message: 'Invalid teams',
    });

    const result = await handleProcessInput({
      teams: ['Alice'],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toBe('Invalid teams');
    }

    expect(processInputUtils.validateFileOptions).not.toHaveBeenCalled();
    expect(processInputUtils.mergeOptions).not.toHaveBeenCalled();
  });

  it('should fail on invalid file options', async () => {
    jest.spyOn(processInputUtils, 'validateFileOptions').mockResolvedValue({
      success: false,
      message: 'Invalid file',
    });

    const result = await handleProcessInput({
      teams: ['Alice', 'Bob'],
      file: 'invalid.csv',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toBe('Invalid file');
    }

    expect(processInputUtils.mergeOptions).not.toHaveBeenCalled();
  });

  it('should transform team ordering', async () => {
    jest.spyOn(processInputUtils, 'mergeOptions').mockReturnValue({
      ...defaultValidatedOptions,
      order: 'random',
    });

    await handleProcessInput({
      teams: ['Alice', 'Bob'],
      order: 'random',
    });

    expect(processInputUtils.prepareTeams).toHaveBeenCalledWith(
      expect.objectContaining({
        order: 'random',
      })
    );
  });

  it('should pass custom round configuration', async () => {
    jest.spyOn(processInputUtils, 'mergeOptions').mockReturnValue({
      ...defaultValidatedOptions,
      numRounds: 3,
      startRound: 2,
    });

    const result = await handleProcessInput({
      teams: ['Alice', 'Bob'],
      numRounds: '3',
      startRound: '2',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.numRounds).toBe(3);
      expect(result.value.startRound).toBe(2);
    }
  });
});
