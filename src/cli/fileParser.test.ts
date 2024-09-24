import * as csvParser from './csvParser.js';
import * as jsonParser from './jsonParser.js';

import { isSupportedFileType, parseFile } from './fileParser.js';

import { existsSync } from 'fs';
import { readFile } from 'fs/promises';

jest.mock('fs/promises');
jest.mock('fs');
jest.mock('./csvParser.js');
jest.mock('./jsonParser.js');

describe('fileParser', () => {
  beforeEach(() => {
    (existsSync as jest.Mock).mockReturnValue(true);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('parseFile', () => {
    it('should parse CSV file correctly', async () => {
      const mockContent = 'mock,csv,content';
      (readFile as jest.Mock).mockResolvedValue(mockContent);
      (csvParser.parseCSV as jest.Mock).mockReturnValue({ players: ['Alice', 'Bob'] });

      const result = await parseFile('test.csv');

      expect(csvParser.parseCSV).toHaveBeenCalledWith(mockContent);
      expect(result).toEqual({ players: ['Alice', 'Bob'] });
    });

    it('should parse JSON file correctly', async () => {
      const mockContent = '{"players": ["Alice", "Bob"]}';
      (readFile as jest.Mock).mockResolvedValue(mockContent);
      (jsonParser.parseJSON as jest.Mock).mockReturnValue({ players: ['Alice', 'Bob'] });

      const result = await parseFile('test.json');

      expect(jsonParser.parseJSON).toHaveBeenCalledWith(mockContent);
      expect(result).toEqual({ players: ['Alice', 'Bob'] });
    });

    it('should throw error for unsupported file type', async () => {
      await expect(parseFile('test.txt')).rejects.toThrow('Unsupported file type: .txt');
    });
  });

  describe('isSupportedFileType', () => {
    it('should return success for supported file types', () => {
      expect(isSupportedFileType('test.csv')).toEqual({ success: true, value: '.csv' });
      expect(isSupportedFileType('test.json')).toEqual({ success: true, value: '.json' });
    });

    it('should return failure for unsupported file types', () => {
      (existsSync as jest.Mock).mockReturnValue(true);
      expect(isSupportedFileType('test.txt')).toEqual({
        success: false,
        errorMessage: 'file must have extension .csv, .json.',
      });
    });

    it('should return failure for non-existent files', () => {
      (existsSync as jest.Mock).mockReturnValue(false);
      expect(isSupportedFileType('nonexistent.csv')).toEqual({
        success: false,
        errorMessage: 'file "nonexistent.csv" does not exist.',
      });
    });
  });
});
