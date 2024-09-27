import * as csvParser from './csvParser.js';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as jsonParser from './jsonParser.js';

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { SpyInstance } from 'jest-mock';
import { parseFile } from './fileParser.js';

jest.mock('fs/promises');
jest.mock('fs');
jest.mock('./csvParser.js');
jest.mock('./jsonParser.js');

describe('fileParser', () => {
  let mockExistsSync: SpyInstance<typeof fs.existsSync>;
  // unable to get the types of SpyInstance to work for this one
  let mockReadFile: jest.MockedFunction<typeof fsPromises.readFile>;
  let mockParseCSV: SpyInstance<typeof csvParser.parseOptionsFromCSV>;
  let mockParseJSON: SpyInstance<typeof jsonParser.parseOptionsFromJSON>;

  beforeEach(() => {
    mockExistsSync = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    mockReadFile = fsPromises.readFile as jest.MockedFunction<typeof fsPromises.readFile>;
    mockParseCSV = jest.spyOn(csvParser, 'parseOptionsFromCSV');
    mockParseJSON = jest.spyOn(jsonParser, 'parseOptionsFromJSON');
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.resetAllMocks();
  });

  it('should parse CSV file correctly', async () => {
    const mockContent = 'mock,csv,content';
    mockReadFile.mockResolvedValue(mockContent);
    mockParseCSV.mockReturnValue({
      success: true,
      value: { players: ['Alice', 'Bob'] },
    });

    const result = await parseFile('test.csv');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual({ players: ['Alice', 'Bob'] });
    }
    expect(mockParseCSV).toHaveBeenCalledWith(mockContent);
  });

  it('should parse JSON file correctly', async () => {
    const mockContent = '{"players": ["Alice", "Bob"]}';
    mockReadFile.mockResolvedValue(mockContent);
    mockParseJSON.mockReturnValue({
      success: true,
      value: { players: ['Alice', 'Bob'] },
    });

    const result = await parseFile('test.json');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual({ players: ['Alice', 'Bob'] });
    }
    expect(mockParseJSON).toHaveBeenCalledWith(mockContent);
  });

  it('should handle unsupported file types', async () => {
    const result = await parseFile('test.txt');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('InvalidInput');
      expect(result.error.message).toContain(
        'Invalid CLI value "--file": ".txt". Expected one of ".csv, .json".'
      );
    }
  });

  it('should handle file reading errors', async () => {
    mockReadFile.mockRejectedValue(new Error('File read error'));

    const result = await parseFile('test.csv');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('InvalidInput');
      expect(result.error.message).toContain('Error reading file: File read error');
    }
  });

  it('should handle non-existent files', async () => {
    mockExistsSync.mockReturnValue(false);

    const result = await parseFile('nonexistent.csv');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('InvalidInput');
      expect(result.error.message).toContain('File not found: nonexistent.csv');
    }
  });
});
