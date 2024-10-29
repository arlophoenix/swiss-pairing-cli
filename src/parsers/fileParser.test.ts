import * as csvParser from './csvParser.js';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as jsonParser from './jsonParser.js';

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { parseFile } from './fileParser.js';

jest.mock('fs/promises');
jest.mock('fs');
jest.mock('./csvParser.js');
jest.mock('./jsonParser.js');

describe('fileParser', () => {
  beforeEach(() => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fsPromises, 'readFile').mockResolvedValue('mock content');
    jest.spyOn(csvParser, 'parseOptionsFromCSV').mockReturnValue({
      success: true,
      value: { teams: [{ name: 'Alice', squad: undefined }] },
    });
    jest.spyOn(jsonParser, 'parseOptionsFromJSON').mockReturnValue({
      success: true,
      value: { teams: [{ name: 'Bob', squad: undefined }] },
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should reject non-existent files', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);

    const result = await parseFile('missing.csv');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toBe('Invalid CLI argument "--file": "missing.csv". Expected file not found.');
    }
  });

  it('should reject unsupported file types', async () => {
    const result = await parseFile('data.txt');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toContain('Expected extension to be one of .csv, .json');
    }
  });

  it('should parse CSV files', async () => {
    const result = await parseFile('data.csv');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual({ teams: [{ name: 'Alice' }] });
    }
    expect(csvParser.parseOptionsFromCSV).toHaveBeenCalledWith('mock content');
  });

  it('should parse JSON files', async () => {
    const result = await parseFile('data.json');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual({ teams: [{ name: 'Bob' }] });
    }
    expect(jsonParser.parseOptionsFromJSON).toHaveBeenCalledWith('mock content');
  });

  it('should handle file read errors', async () => {
    jest.spyOn(fsPromises, 'readFile').mockRejectedValue(new Error('Read failed'));

    const result = await parseFile('data.csv');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toBe('Error reading file: Read failed');
    }
  });
});
