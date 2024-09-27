import * as cliActionUtils from './cliActionUtils.js';
import * as cliValidator from '../validators/cliValidator.js';
import * as outputFormatter from './outputFormatter.js';
import * as swissPairing from '../swiss-pairing/swissPairing.js';
import * as utils from '../utils.js';

import {
  ReadonlyPlayedOpponents,
  ReadonlyRoundMatches,
  Result,
  UnvalidatedCLIOptions,
  ValidatedCLIOptions,
} from '../types.js';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { SpyInstance } from 'jest-mock';
import { handleCLIAction } from './cliAction.js';

jest.mock('../validators/cliValidator.js');
jest.mock('./cliActionUtils.js');
jest.mock('../swiss-pairing/swissPairing.js');
jest.mock('./outputFormatter.js');
jest.mock('../utils.js');

describe('handleCLIAction', () => {
  let mockValidateCLIOptions: SpyInstance<typeof cliValidator.validateCLIOptions>;
  let mockValidateFileOptions: SpyInstance<typeof cliActionUtils.validateFileOptions>;
  let mockMergeOptions: SpyInstance<typeof cliActionUtils.mergeOptions>;
  let mockPreparePlayers: SpyInstance<typeof cliActionUtils.preparePlayers>;
  let mockGenerateRoundMatches: SpyInstance<typeof swissPairing.generateRoundMatches>;
  let mockFormatOutput: SpyInstance<typeof outputFormatter.formatOutput>;
  let mockCreateBidirectionalMap: jest.MockedFunction<typeof utils.createBidirectionalMap>;

  beforeEach(() => {
    mockValidateCLIOptions = jest.spyOn(cliValidator, 'validateCLIOptions');
    mockValidateFileOptions = jest.spyOn(cliActionUtils, 'validateFileOptions');
    mockMergeOptions = jest.spyOn(cliActionUtils, 'mergeOptions');
    mockPreparePlayers = jest.spyOn(cliActionUtils, 'preparePlayers');
    mockGenerateRoundMatches = jest.spyOn(swissPairing, 'generateRoundMatches');
    mockFormatOutput = jest.spyOn(outputFormatter, 'formatOutput');
    mockCreateBidirectionalMap = utils.createBidirectionalMap as jest.MockedFunction<
      typeof utils.createBidirectionalMap
    >;

    // Default mock implementations with typed return values
    mockValidateCLIOptions.mockReturnValue({ success: true, value: {} } as Result<
      Partial<ValidatedCLIOptions>
    >);
    mockValidateFileOptions.mockResolvedValue({ success: true, value: {} } as Result<
      Partial<ValidatedCLIOptions>
    >);
    mockMergeOptions.mockReturnValue({
      players: ['Alice', 'Bob'],
      numRounds: 1,
      startRound: 1,
      order: 'top-down',
      matches: [],
      format: 'text',
      file: 'input.txt',
    } as ValidatedCLIOptions);
    mockPreparePlayers.mockReturnValue(['Alice', 'Bob']);
    mockGenerateRoundMatches.mockReturnValue({
      success: true,
      value: { 'Round 1': [['Alice', 'Bob']] },
    } as Result<ReadonlyRoundMatches>);
    mockFormatOutput.mockReturnValue('Formatted output');
    mockCreateBidirectionalMap.mockReturnValue(new Map() as ReadonlyPlayedOpponents);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should process valid input and generate matches', async () => {
    const options: UnvalidatedCLIOptions = {
      players: ['Alice', 'Bob'],
      numRounds: '1',
    };

    const result = await handleCLIAction(options);

    expect(result).toEqual({ success: true, value: 'Formatted output' });
    expect(mockValidateCLIOptions).toHaveBeenCalledWith(options);
    expect(mockValidateFileOptions).toHaveBeenCalled();
    expect(mockMergeOptions).toHaveBeenCalled();
    expect(mockPreparePlayers).toHaveBeenCalled();
    expect(mockGenerateRoundMatches).toHaveBeenCalled();
    expect(mockFormatOutput).toHaveBeenCalled();
    expect(mockCreateBidirectionalMap).toHaveBeenCalled();
  });

  it('should return error if CLI options validation fails', async () => {
    mockValidateCLIOptions.mockReturnValue({
      success: false,
      error: { type: 'InvalidInput', message: 'Invalid CLI options' },
    } as Result<Partial<ValidatedCLIOptions>>);

    const result = await handleCLIAction({});

    expect(result).toEqual({
      success: false,
      error: { type: 'InvalidInput', message: 'Invalid CLI options' },
    });
    expect(mockValidateFileOptions).not.toHaveBeenCalled();
  });

  it('should return error if file options validation fails', async () => {
    mockValidateFileOptions.mockResolvedValue({
      success: false,
      error: { type: 'InvalidInput', message: 'Invalid file options' },
    } as Result<Partial<ValidatedCLIOptions>>);

    const result = await handleCLIAction({ file: 'invalid.csv' });

    expect(result).toEqual({
      success: false,
      error: { type: 'InvalidInput', message: 'Invalid file options' },
    });
    expect(mockMergeOptions).not.toHaveBeenCalled();
  });

  it('should return error if generateRoundMatches fails', async () => {
    mockGenerateRoundMatches.mockReturnValue({
      success: false,
      error: { type: 'NoValidSolution', message: 'Unable to generate valid matches' },
    } as Result<ReadonlyRoundMatches>);

    const result = await handleCLIAction({});

    expect(result).toEqual({
      success: false,
      error: { type: 'NoValidSolution', message: 'Unable to generate valid matches' },
    });
    expect(mockFormatOutput).not.toHaveBeenCalled();
  });

  it('should handle different output formats', async () => {
    mockMergeOptions.mockReturnValue({
      players: ['Alice', 'Bob'],
      numRounds: 1,
      startRound: 1,
      order: 'top-down',
      matches: [],
      format: 'json-pretty',
      file: 'input.txt',
    } as ValidatedCLIOptions);

    await handleCLIAction({});

    expect(mockFormatOutput).toHaveBeenCalledWith(expect.objectContaining({ format: 'json-pretty' }));
  });

  it('should handle file input', async () => {
    const options: UnvalidatedCLIOptions = { file: 'input.csv' };

    await handleCLIAction(options);

    expect(mockValidateFileOptions).toHaveBeenCalledWith('input.csv');
  });
});
