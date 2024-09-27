import * as csvParserUtils from './csvParserUtils.js';
import * as csvValidator from '../validators/csvValidator.js';

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { SpyInstance } from 'jest-mock';
import { ValidationError } from '../types/types.js';
import { parseOptionsFromCSV } from './csvParser.js';

describe('csvParser', () => {
  let mockParseCSV: SpyInstance<typeof csvParserUtils.parseCSV>;
  let mockValidateCSVOptions: SpyInstance<typeof csvValidator.validateCSVOptions>;

  beforeEach(() => {
    mockParseCSV = jest.spyOn(csvParserUtils, 'parseCSV').mockReturnValue({ success: true, value: [] });
    mockValidateCSVOptions = jest
      .spyOn(csvValidator, 'validateCSVOptions')
      .mockReturnValue({ success: true, value: {} });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should call parseCSV with the CSV string', () => {
    const mockContent = `players,num-rounds,start-round,order,format,matches1,matches2
Alice,3,1,random,text,Alice,Bob
Bob,,,,,`;

    parseOptionsFromCSV(mockContent);

    expect(mockParseCSV).toHaveBeenCalledWith(mockContent);
  });

  it('should return failure if parseCSV fails', () => {
    const mockContent = `invalid csv`;
    mockParseCSV.mockReturnValue({
      success: false,
      error: { type: 'InvalidInput', message: 'CSV parsing error' },
    });

    const result = parseOptionsFromCSV(mockContent);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toEqual({ type: 'InvalidInput', message: 'CSV parsing error' });
    }
  });

  it('should return failure if parseCSV returns no records', () => {
    const mockContent = `players,num-rounds,start-round,order,format,matches1,matches2`;
    mockParseCSV.mockReturnValue({ success: true, value: [] });

    const result = parseOptionsFromCSV(mockContent);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toEqual({ type: 'InvalidInput', message: 'No data found in CSV' });
    }
  });

  it('should validate the parsed records', () => {
    const mockContent = `players,num-rounds,start-round,order,format,matches1,matches2
Alice,3,1,random,text,Alice,Bob
Bob,,,,,`;
    const mockRecords = [
      {
        players: 'Alice',
        'num-rounds': '3',
        'start-round': '1',
        order: 'random',
        format: 'text',
        matches1: 'Alice',
        matches2: 'Bob',
      },
      { players: 'Bob' },
    ] as const;
    mockParseCSV.mockReturnValue({
      success: true,
      value: mockRecords,
    });
    mockValidateCSVOptions.mockReturnValue({
      success: true,
      value: {
        players: ['Alice', 'Bob'],
        numRounds: 3,
        startRound: 1,
        order: 'random',
        format: 'text',
        matches: [['Alice', 'Bob']],
      },
    });
    parseOptionsFromCSV(mockContent);

    expect(mockValidateCSVOptions).toHaveBeenCalledWith(mockRecords);
  });

  it('should succeed if the records are valid', () => {
    const mockContent = `players,num-rounds,start-round,order,format,matches1,matches2
Alice,3,1,random,text,Alice,Bob
Bob,,,,,`;
    const mockRecords = [
      {
        players: 'Alice',
        'num-rounds': '3',
        'start-round': '1',
        order: 'random',
        format: 'text',
        matches1: 'Alice',
        matches2: 'Bob',
      },
      { players: 'Bob' },
    ] as const;
    mockParseCSV.mockReturnValue({
      success: true,
      value: mockRecords,
    });
    mockValidateCSVOptions.mockReturnValue({
      success: true,
      value: {
        players: ['Alice', 'Bob'],
        numRounds: 3,
        startRound: 1,
        order: 'random',
        format: 'text',
        matches: [['Alice', 'Bob']],
      },
    });
    const result = parseOptionsFromCSV(mockContent);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual({
        players: ['Alice', 'Bob'],
        numRounds: 3,
        startRound: 1,
        order: 'random',
        format: 'text',
        matches: [['Alice', 'Bob']],
      });
    }
  });

  it('should fail if the records are invalid', () => {
    const mockContent = `players,num-rounds,start-round,order,format,matches1,matches2
Alice,3,1,random,text,Alice,Bob
Bob,,,,,`;
    const mockRecords = [
      {
        players: 'Alice',
        'num-rounds': '3',
        'start-round': '1',
        order: 'random',
        format: 'text',
        matches1: 'Alice',
        matches2: 'Bob',
      },
      { players: 'Bob' },
    ] as const;
    mockParseCSV.mockReturnValue({
      success: true,
      value: mockRecords,
    });
    const mockError: ValidationError = { type: 'InvalidInput', message: 'Invalid number of rounds' };
    mockValidateCSVOptions.mockReturnValue({
      success: false,
      error: mockError,
    });
    const result = parseOptionsFromCSV(mockContent);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toEqual(mockError);
    }
  });
});
