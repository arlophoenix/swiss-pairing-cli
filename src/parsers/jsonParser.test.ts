import * as jsonValidator from '../validators/jsonValidator.js';

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { parseOptionsFromJSON } from './jsonParser.js';

jest.mock('../validators/jsonValidator.js');

describe('jsonParser', () => {
  beforeEach(() => {
    jest.spyOn(jsonValidator, 'validateJSONOptions').mockReturnValue({
      success: true,
      value: { teams: [{ name: 'Alice', squad: undefined }] },
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should parse valid JSON', () => {
    const content = JSON.stringify({
      teams: ['Alice', 'Bob'],
      'num-rounds': 3,
    });

    const result = parseOptionsFromJSON(content);

    expect(result.success).toBe(true);
    expect(jsonValidator.validateJSONOptions).toHaveBeenCalledWith({
      teams: ['Alice', 'Bob'],
      'num-rounds': 3,
    });
  });

  it('should reject invalid JSON syntax', () => {
    const result = parseOptionsFromJSON('{ bad json }');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toContain('Invalid JSON:');
    }
    expect(jsonValidator.validateJSONOptions).not.toHaveBeenCalled();
  });

  it('should reject non-object JSON', () => {
    const result = parseOptionsFromJSON(JSON.stringify(['Alice', 'Bob']));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toBe('Invalid JSON: must be an object');
    }
    expect(jsonValidator.validateJSONOptions).not.toHaveBeenCalled();
  });

  it('should pass validation errors through', () => {
    jest.spyOn(jsonValidator, 'validateJSONOptions').mockReturnValue({
      success: false,
      message: 'Invalid teams',
    });

    const result = parseOptionsFromJSON('{"teams": ["Alice"]}');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toBe('Invalid teams');
    }
  });
});
