import * as papa from 'papaparse';

import { isSupportedFileType, parseFile } from './fileParser.js';

import { existsSync } from 'fs';
import { readFile } from 'fs/promises';

jest.mock('fs/promises');
jest.mock('fs');
jest.mock('papaparse');

describe('fileParser', () => {
  describe('parseFile', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    describe('CSV', () => {
      it('should parse CSV file correctly', async () => {
        const mockContent =
          'players,num-rounds,start-round,order,matches1,matches2\nAlice,3,1,random,Bob,Charlie\nBob,,,,,\nCharlie,,,,,';
        (readFile as jest.Mock).mockResolvedValue(mockContent);
        (papa.parse as jest.Mock).mockReturnValue({
          data: [
            {
              players: 'Alice',
              'num-rounds': '3',
              'start-round': '1',
              order: 'random',
              matches1: 'Bob',
              matches2: 'Charlie',
            },
            { players: 'Bob' },
            { players: 'Charlie' },
          ],
          errors: [],
        });

        const result = await parseFile('test.csv');

        expect(result).toEqual({
          players: ['Alice', 'Bob', 'Charlie'],
          numRounds: 3,
          startRound: 1,
          order: 'random',
          matches: [['Bob', 'Charlie']],
        });
      });

      it('should handle CSV parsing errors', async () => {
        (readFile as jest.Mock).mockResolvedValue('invalid,csv,content');
        (papa.parse as jest.Mock).mockReturnValue({
          data: [],
          errors: [{ message: 'CSV parsing error' }],
        });

        await expect(parseFile('test.csv')).rejects.toThrow('CSV parsing error: CSV parsing error');
      });

      it('should parse CSV file with only players field', async () => {
        const mockContent = 'players\nAlice\nBob\nCharlie';
        (readFile as jest.Mock).mockResolvedValue(mockContent);
        (papa.parse as jest.Mock).mockReturnValue({
          data: [{ players: 'Alice' }, { players: 'Bob' }, { players: 'Charlie' }],
          errors: [],
        });

        const result = await parseFile('test.csv');

        expect(result).toEqual({
          players: ['Alice', 'Bob', 'Charlie'],
        });
      });

      it('should parse CSV file with some optional fields missing', async () => {
        const mockContent = 'players,num-rounds,start-round\nAlice,3,\nBob,3,\nCharlie,3,';
        (readFile as jest.Mock).mockResolvedValue(mockContent);
        (papa.parse as jest.Mock).mockReturnValue({
          data: [
            { players: 'Alice', 'num-rounds': '3', 'start-round': '' },
            { players: 'Bob', 'num-rounds': '3', 'start-round': '' },
            { players: 'Charlie', 'num-rounds': '3', 'start-round': '' },
          ],
          errors: [],
        });

        const result = await parseFile('test.csv');

        expect(result).toEqual({
          players: ['Alice', 'Bob', 'Charlie'],
          numRounds: 3,
        });
      });

      it('should parse CSV file with some optional fields missing', async () => {
        const mockContent = 'players,num-rounds,start-round\nAlice,3,\nBob,3,\nCharlie,3,';
        (readFile as jest.Mock).mockResolvedValue(mockContent);
        (papa.parse as jest.Mock).mockReturnValue({
          data: [
            { players: 'Alice', 'num-rounds': '3', 'start-round': '' },
            { players: 'Bob', 'num-rounds': '3', 'start-round': '' },
            { players: 'Charlie', 'num-rounds': '3', 'start-round': '' },
          ],
          errors: [],
        });

        const result = await parseFile('test.csv');

        expect(result).toEqual({
          players: ['Alice', 'Bob', 'Charlie'],
          numRounds: 3,
        });
      });
    });

    describe('JSON', () => {
      it('should parse JSON file correctly', async () => {
        const mockContent = JSON.stringify({
          players: ['Alice', 'Bob', 'Charlie'],
          numRounds: 3,
          startRound: 1,
          order: 'random',
          matches: [['Bob', 'Charlie']],
        });
        (readFile as jest.Mock).mockResolvedValue(mockContent);

        const result = await parseFile('test.json');

        expect(result).toEqual({
          players: ['Alice', 'Bob', 'Charlie'],
          numRounds: 3,
          startRound: 1,
          order: 'random',
          matches: [['Bob', 'Charlie']],
        });
      });

      it('should parse JSON file with only players field', async () => {
        const mockContent = JSON.stringify({
          players: ['Alice', 'Bob', 'Charlie'],
        });
        (readFile as jest.Mock).mockResolvedValue(mockContent);

        const result = await parseFile('test.json');

        expect(result).toEqual({
          players: ['Alice', 'Bob', 'Charlie'],
        });
      });

      it('should parse JSON file with some optional fields missing', async () => {
        const mockContent = JSON.stringify({
          players: ['Alice', 'Bob', 'Charlie'],
          numRounds: 3,
        });
        (readFile as jest.Mock).mockResolvedValue(mockContent);

        const result = await parseFile('test.json');

        expect(result).toEqual({
          players: ['Alice', 'Bob', 'Charlie'],
          numRounds: 3,
        });
      });

      it('should handle JSON file with null optional fields', async () => {
        const mockContent = JSON.stringify({
          players: ['Alice', 'Bob', 'Charlie'],
          numRounds: null,
          startRound: null,
          order: null,
          matches: null,
        });
        (readFile as jest.Mock).mockResolvedValue(mockContent);

        const result = await parseFile('test.json');

        expect(result).toEqual({
          players: ['Alice', 'Bob', 'Charlie'],
        });
      });
    });

    it('should throw error for unsupported file type', async () => {
      await expect(parseFile('test.txt')).rejects.toThrow('Unsupported file type: .txt');
    });
  });

  describe('isSupportedFileType', () => {
    it('should return success for supported file types', () => {
      (existsSync as jest.Mock).mockReturnValue(true);
      expect(isSupportedFileType('test.csv')).toEqual({ success: true, value: undefined });
      expect(isSupportedFileType('test.json')).toEqual({ success: true, value: undefined });
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
