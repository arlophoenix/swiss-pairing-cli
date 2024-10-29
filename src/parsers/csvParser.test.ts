import * as csvParserUtils from './csvParserUtils.js';
import * as csvValidator from '../validators/csvValidator.js';

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { parseOptionsFromCSV } from './csvParser.js';

describe('csvParser', () => {
  beforeEach(() => {
    jest.spyOn(csvParserUtils, 'parseCSV').mockReturnValue({
      success: true,
      value: [],
    });
    jest.spyOn(csvValidator, 'validateCSVOptions').mockReturnValue({
      success: true,
      value: {},
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should handle empty CSV', () => {
    jest.spyOn(csvParserUtils, 'parseCSV').mockReturnValue({
      success: true,
      value: [],
    });

    const result = parseOptionsFromCSV('');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toBe('No data found in CSV');
    }
  });

  it('should parse and validate CSV data', () => {
    const mockRecords = [
      {
        teams: 'Alice',
        'num-rounds': '3',
        'matches-home': 'Alice',
        'matches-away': 'Bob',
      },
    ];

    jest.spyOn(csvParserUtils, 'parseCSV').mockReturnValue({
      success: true,
      value: mockRecords,
    });

    parseOptionsFromCSV('mock,csv,content');

    expect(csvValidator.validateCSVOptions).toHaveBeenCalledWith(mockRecords);
  });

  it('should pass through parsing errors', () => {
    jest.spyOn(csvParserUtils, 'parseCSV').mockReturnValue({
      success: false,
      message: 'CSV parsing error',
    });

    const result = parseOptionsFromCSV('invalid,csv');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toBe('CSV parsing error');
    }
    expect(csvValidator.validateCSVOptions).not.toHaveBeenCalled();
  });

  it('should pass through validation errors', () => {
    jest.spyOn(csvParserUtils, 'parseCSV').mockReturnValue({
      success: true,
      value: [{ teams: 'Alice' }],
    });

    jest.spyOn(csvValidator, 'validateCSVOptions').mockReturnValue({
      success: false,
      message: 'Invalid teams',
    });

    const result = parseOptionsFromCSV('teams\nAlice');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toBe('Invalid teams');
    }
  });
});
