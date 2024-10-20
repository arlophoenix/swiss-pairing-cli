import * as jsonValidator from '../validators/jsonValidator.js';

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { SpyInstance } from 'jest-mock';
import { parseOptionsFromJSON } from './jsonParser.js';

jest.mock('../validators/jsonValidator.js');

describe('jsonParser', () => {
  let mockValidateJSONOptions: SpyInstance<typeof jsonValidator.validateJSONOptions>;

  beforeEach(() => {
    mockValidateJSONOptions = jest.spyOn(jsonValidator, 'validateJSONOptions');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should parse valid JSON content correctly', () => {
    const mockContent = JSON.stringify({
      teams: ['Alice', 'Bob'],
      'num-rounds': 3,
      'start-round': 1,
      order: 'random',
      format: 'text',
      matches: [['Alice', 'Bob']],
    });

    mockValidateJSONOptions.mockReturnValue({
      success: true,
      value: {
        teams: [
          { name: 'Alice', squad: undefined },
          { name: 'Bob', squad: undefined },
        ],
        numRounds: 3,
        startRound: 1,
        order: 'random',
        format: 'text',
        matches: [['Alice', 'Bob']],
      },
    });

    const result = parseOptionsFromJSON(mockContent);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual({
        teams: [
          { name: 'Alice', squad: undefined },
          { name: 'Bob', squad: undefined },
        ],
        numRounds: 3,
        startRound: 1,
        order: 'random',
        format: 'text',
        matches: [['Alice', 'Bob']],
      });
    }
    expect(mockValidateJSONOptions).toHaveBeenCalledWith(JSON.parse(mockContent));
  });

  it('should handle invalid JSON syntax', () => {
    const result = parseOptionsFromJSON('{ invalid json }');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('InvalidInput');
      expect(result.error.message).toContain('Invalid JSON');
    }
    expect(mockValidateJSONOptions).not.toHaveBeenCalled();
  });

  it('should handle non-object JSON', () => {
    const result = parseOptionsFromJSON(JSON.stringify(['Alice', 'Bob']));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('InvalidInput');
      expect(result.error.message).toBe('Invalid JSON: not an object');
    }
    expect(mockValidateJSONOptions).not.toHaveBeenCalled();
  });

  it('should handle validation errors', () => {
    const mockContent = JSON.stringify({ teams: ['Alice', 'Bob'] });
    mockValidateJSONOptions.mockReturnValue({
      success: false,
      error: { type: 'InvalidInput', message: 'Invalid number of teams' },
    });

    const result = parseOptionsFromJSON(mockContent);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('InvalidInput');
      expect(result.error.message).toBe('Invalid number of teams');
    }
    expect(mockValidateJSONOptions).toHaveBeenCalledWith(JSON.parse(mockContent));
  });

  it('should handle empty object', () => {
    const mockContent = '{}';
    mockValidateJSONOptions.mockReturnValue({ success: true, value: {} });

    const result = parseOptionsFromJSON(mockContent);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual({});
    }
    expect(mockValidateJSONOptions).toHaveBeenCalledWith({});
  });

  it('should handle partial valid data', () => {
    const mockContent = JSON.stringify({ teams: ['Alice', 'Bob'] });
    mockValidateJSONOptions.mockReturnValue({
      success: true,
      value: {
        teams: [
          { name: 'Alice', squad: undefined },
          { name: 'Bob', squad: undefined },
        ],
      },
    });

    const result = parseOptionsFromJSON(mockContent);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual({
        teams: [
          { name: 'Alice', squad: undefined },
          { name: 'Bob', squad: undefined },
        ],
      });
    }
    expect(mockValidateJSONOptions).toHaveBeenCalledWith(JSON.parse(mockContent));
  });
});
