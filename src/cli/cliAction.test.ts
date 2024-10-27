import * as cliUtils from './cliUtils.js';
import * as cliValidator from '../validators/cliValidator.js';
import * as outputFormatter from './outputFormatter.js';
import * as swissPairing from '../swiss-pairing/swissPairing.js';

import {
  ReadonlyPlayedOpponents,
  ReadonlyRoundMatches,
  Result,
  UnvalidatedCLIOptions,
  ValidatedCLIOptions,
} from '../types/types.js';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { SpyInstance } from 'jest-mock';
import { handleCLIAction } from './cliAction.js';

jest.mock('../validators/cliValidator.js');
jest.mock('./cliUtils.js');
jest.mock('../swiss-pairing/swissPairing.js');
jest.mock('./outputFormatter.js');

describe('handleCLIAction', () => {
  let mockValidateCLIOptions: SpyInstance<typeof cliValidator.validateCLIOptions>;
  let mockValidateFileOptions: SpyInstance<typeof cliUtils.validateFileOptions>;
  let mockMergeOptions: SpyInstance<typeof cliUtils.mergeOptions>;
  let mockPrepareTeams: SpyInstance<typeof cliUtils.prepareTeams>;
  let mockCreateBidirectionalMap: jest.MockedFunction<typeof cliUtils.createBidirectionalMap>;
  let mockCreateSquadMap: SpyInstance<typeof cliUtils.createSquadMap>;
  let mockGenerateRoundMatches: SpyInstance<typeof swissPairing.generateRoundMatches>;
  let mockFormatOutput: SpyInstance<typeof outputFormatter.formatOutput>;

  beforeEach(() => {
    mockValidateCLIOptions = jest.spyOn(cliValidator, 'validateCLIOptions');
    mockValidateFileOptions = jest.spyOn(cliUtils, 'validateFileOptions');
    mockMergeOptions = jest.spyOn(cliUtils, 'mergeOptions');
    mockPrepareTeams = jest.spyOn(cliUtils, 'prepareTeams');
    mockCreateBidirectionalMap = cliUtils.createBidirectionalMap as jest.MockedFunction<
      typeof cliUtils.createBidirectionalMap
    >;
    mockCreateSquadMap = jest.spyOn(cliUtils, 'createSquadMap');
    mockGenerateRoundMatches = jest.spyOn(swissPairing, 'generateRoundMatches');
    mockFormatOutput = jest.spyOn(outputFormatter, 'formatOutput');

    // Default mock implementations with typed return values
    mockValidateCLIOptions.mockReturnValue({ success: true, value: {} } as Result<
      Partial<ValidatedCLIOptions>
    >);
    mockValidateFileOptions.mockResolvedValue({ success: true, value: {} } as Result<
      Partial<ValidatedCLIOptions>
    >);
    mockMergeOptions.mockReturnValue({
      teams: [
        { name: 'Alice', squad: undefined },
        { name: 'Bob', squad: undefined },
      ],
      numRounds: 1,
      startRound: 1,
      order: 'top-down',
      matches: [],
      format: 'text-markdown',
      file: 'input.txt',
    } as ValidatedCLIOptions);
    mockPrepareTeams.mockReturnValue(['Alice', 'Bob']);
    mockCreateBidirectionalMap.mockReturnValue(new Map() as ReadonlyPlayedOpponents);
    mockCreateSquadMap.mockReturnValue(new Map());
    mockGenerateRoundMatches.mockReturnValue({
      success: true,
      value: { 'Round 1': [['Alice', 'Bob']] },
    } as Result<ReadonlyRoundMatches>);
    mockFormatOutput.mockReturnValue('Formatted output');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should process valid input and generate matches', async () => {
    const options: UnvalidatedCLIOptions = {
      teams: ['Alice', 'Bob'],
      numRounds: '1',
    };

    const result = await handleCLIAction(options);

    expect(result).toEqual({ success: true, value: 'Formatted output' });
    expect(mockValidateCLIOptions).toHaveBeenCalledWith(options);
    expect(mockValidateFileOptions).toHaveBeenCalled();
    expect(mockMergeOptions).toHaveBeenCalled();
    expect(mockPrepareTeams).toHaveBeenCalled();
    expect(mockCreateBidirectionalMap).toHaveBeenCalled();
    expect(mockCreateSquadMap).toHaveBeenCalled();
    expect(mockGenerateRoundMatches).toHaveBeenCalled();
    expect(mockFormatOutput).toHaveBeenCalled();
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
      teams: [
        { name: 'Alice', squad: undefined },
        { name: 'Bob', squad: undefined },
      ],
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

  it('should create squadMap and pass it to generateRoundMatches', async () => {
    const options: UnvalidatedCLIOptions = {
      teams: ['Alice [A]', 'Bob [B]', 'Charlie [A]', 'David [B]'],
      numRounds: '2',
    };

    mockValidateCLIOptions.mockReturnValue({
      success: true,
      value: {
        teams: [
          { name: 'Alice', squad: 'A' },
          { name: 'Bob', squad: 'B' },
          { name: 'Charlie', squad: 'A' },
          { name: 'David', squad: 'B' },
        ],
        numRounds: 2,
      },
    });
    mockValidateFileOptions.mockResolvedValue({ success: true, value: {} });
    mockMergeOptions.mockReturnValue({
      teams: [
        { name: 'Alice', squad: 'A' },
        { name: 'Bob', squad: 'B' },
        { name: 'Charlie', squad: 'A' },
        { name: 'David', squad: 'B' },
      ],
      numRounds: 2,
      startRound: 1,
      order: 'top-down',
      matches: [],
      format: 'text-markdown',
      file: '',
    } as ValidatedCLIOptions);
    mockPrepareTeams.mockReturnValue(['Alice', 'Bob', 'Charlie', 'David']);
    mockCreateSquadMap.mockReturnValue(
      new Map([
        ['Alice', 'A'],
        ['Bob', 'B'],
        ['Charlie', 'A'],
        ['David', 'B'],
      ])
    );

    await handleCLIAction(options);

    expect(mockGenerateRoundMatches).toHaveBeenCalledWith(
      expect.objectContaining({
        squadMap: new Map([
          ['Alice', 'A'],
          ['Bob', 'B'],
          ['Charlie', 'A'],
          ['David', 'B'],
        ]),
      })
    );

    expect(mockCreateSquadMap).toHaveBeenCalledWith([
      { name: 'Alice', squad: 'A' },
      { name: 'Bob', squad: 'B' },
      { name: 'Charlie', squad: 'A' },
      { name: 'David', squad: 'B' },
    ]);
  });
});
