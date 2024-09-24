import * as papa from 'papaparse';

import { isSupportedFileType, parseFile } from './fileParser.js';

import { existsSync } from 'fs';
import { readFile } from 'fs/promises';

jest.mock('fs/promises');
jest.mock('fs');
jest.mock('papaparse');

describe('fileParser', () => {
  beforeEach(() => {
    (existsSync as jest.Mock).mockReturnValue(true);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('parseFile', () => {
    describe('CSV', () => {
      it('should parse CSV file correctly', async () => {
        const mockContent =
          'players,num-rounds,start-round,order,matches1,matches2\nAlice,3,2,random,Bob,Charlie\nBob,,,,,\nCharlie,,,,,';
        (readFile as jest.Mock).mockResolvedValue(mockContent);
        (papa.parse as jest.Mock).mockReturnValue({
          data: [
            {
              players: 'Alice',
              'num-rounds': '3',
              'start-round': '2',
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
          startRound: 2,
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

      it('should parse CSV file with format field', async () => {
        const mockContent = 'players,num-rounds,start-round,order,format\nAlice,3,2,random,json-pretty';
        (readFile as jest.Mock).mockResolvedValue(mockContent);
        (papa.parse as jest.Mock).mockReturnValue({
          data: [
            {
              players: 'Alice',
              'num-rounds': '3',
              'start-round': '2',
              order: 'random',
              format: 'json-pretty',
            },
          ],
          errors: [],
        });

        const result = await parseFile('test.csv');

        expect(result).toEqual({
          players: ['Alice'],
          numRounds: 3,
          startRound: 2,
          order: 'random',
          format: 'json-pretty',
        });
      });

      it('should parse CSV file with invalid format field', async () => {
        const mockContent = 'players,num-rounds,start-round,order,format\nAlice,3,2,random,invalid-format';
        (readFile as jest.Mock).mockResolvedValue(mockContent);
        (papa.parse as jest.Mock).mockReturnValue({
          data: [
            {
              players: 'Alice',
              'num-rounds': '3',
              'start-round': '2',
              order: 'random',
              format: 'invalid-format',
            },
          ],
          errors: [],
        });

        await expect(parseFile('test.csv')).rejects.toThrow(
          'Invalid CSV value "format": "invalid-format". Expected one of "text, json-plain, json-pretty".'
        );
      });

      it('should parse CSV file with invalid order field', async () => {
        const mockContent = 'players,num-rounds,start-round,order\nAlice,3,2,invalid-order';
        (readFile as jest.Mock).mockResolvedValue(mockContent);
        (papa.parse as jest.Mock).mockReturnValue({
          data: [
            {
              players: 'Alice',
              'num-rounds': '3',
              'start-round': '2',
              order: 'invalid-order',
            },
          ],
          errors: [],
        });

        await expect(parseFile('test.csv')).rejects.toThrow(
          'Invalid CSV value "order": "invalid-order". Expected one of "top-down, bottom-up, random".'
        );
      });
    });

    describe('JSON', () => {
      it('should parse JSON file correctly', async () => {
        const mockContent = JSON.stringify({
          players: ['Alice', 'Bob', 'Charlie'],
          'num-rounds': 3,
          'start-round': 1,
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
          'num-rounds': 3,
        });
        (readFile as jest.Mock).mockResolvedValue(mockContent);

        const result = await parseFile('test.json');

        expect(result).toEqual({
          players: ['Alice', 'Bob', 'Charlie'],
          numRounds: 3,
        });
      });

      it('should parse JSON file with format field', async () => {
        const mockContent = JSON.stringify({
          players: ['Alice', 'Bob'],
          'num-rounds': 3,
          'start-round': 1,
          order: 'random',
          matches: [['Alice', 'Bob']],
          format: 'json-plain',
        });
        (readFile as jest.Mock).mockResolvedValue(mockContent);

        const result = await parseFile('test.json');

        expect(result).toEqual({
          players: ['Alice', 'Bob'],
          numRounds: 3,
          startRound: 1,
          order: 'random',
          matches: [['Alice', 'Bob']],
          format: 'json-plain',
        });
      });

      it('should handle JSON file with invalid format field', async () => {
        const mockContent = JSON.stringify({
          players: ['Alice', 'Bob'],
          format: 'invalid-format',
        });
        (readFile as jest.Mock).mockResolvedValue(mockContent);

        await expect(parseFile('test.json')).rejects.toThrow(
          'Invalid JSON value "format": ""invalid-format"". Expected one of "text, json-plain, json-pretty".'
        );
      });

      it('should handle JSON file with invalid order field', async () => {
        const mockContent = JSON.stringify({
          players: ['Alice', 'Bob'],
          order: 'invalid-order',
        });
        (readFile as jest.Mock).mockResolvedValue(mockContent);

        await expect(parseFile('test.json')).rejects.toThrow(
          'Invalid JSON value "order": ""invalid-order"". Expected one of "top-down, bottom-up, random".'
        );
      });
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
