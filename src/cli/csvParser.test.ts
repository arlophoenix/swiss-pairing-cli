import * as papa from 'papaparse';

import { parseCSV } from './csvParser.js';

jest.mock('papaparse');

describe('csvParser', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('parseCSV', () => {
    it('should parse CSV content correctly', () => {
      const mockContent =
        'players,num-rounds,start-round,order,matches1,matches2\nAlice,3,2,random,Bob,Charlie\nBob,,,,,\nCharlie,,,,,';
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

      const result = parseCSV(mockContent);

      expect(result).toEqual({
        players: ['Alice', 'Bob', 'Charlie'],
        numRounds: 3,
        startRound: 2,
        order: 'random',
        matches: [['Bob', 'Charlie']],
      });
    });

    it('should handle CSV parsing errors', () => {
      (papa.parse as jest.Mock).mockReturnValue({
        data: [],
        errors: [{ message: 'CSV parsing error' }],
      });

      expect(() => parseCSV('invalid,csv,content')).toThrow('CSV parsing error: CSV parsing error');
    });

    it('should parse CSV content with only players field', () => {
      const mockContent = 'players\nAlice\nBob\nCharlie';
      (papa.parse as jest.Mock).mockReturnValue({
        data: [{ players: 'Alice' }, { players: 'Bob' }, { players: 'Charlie' }],
        errors: [],
      });

      const result = parseCSV(mockContent);

      expect(result).toEqual({
        players: ['Alice', 'Bob', 'Charlie'],
      });
    });

    it('should parse CSV content with some optional fields missing', () => {
      const mockContent = 'players,num-rounds,start-round\nAlice,3,\nBob,3,\nCharlie,3,';
      (papa.parse as jest.Mock).mockReturnValue({
        data: [
          { players: 'Alice', 'num-rounds': '3', 'start-round': '' },
          { players: 'Bob', 'num-rounds': '3', 'start-round': '' },
          { players: 'Charlie', 'num-rounds': '3', 'start-round': '' },
        ],
        errors: [],
      });

      const result = parseCSV(mockContent);

      expect(result).toEqual({
        players: ['Alice', 'Bob', 'Charlie'],
        numRounds: 3,
      });
    });

    it('should parse CSV content with format field', () => {
      const mockContent = 'players,num-rounds,start-round,order,format\nAlice,3,2,random,json-pretty';
      (papa.parse as jest.Mock).mockReturnValue({
        data: [
          { players: 'Alice', 'num-rounds': '3', 'start-round': '2', order: 'random', format: 'json-pretty' },
        ],
        errors: [],
      });

      const result = parseCSV(mockContent);

      expect(result).toEqual({
        players: ['Alice'],
        numRounds: 3,
        startRound: 2,
        order: 'random',
        format: 'json-pretty',
      });
    });

    it('should throw error for invalid format field', () => {
      const mockContent = 'players,num-rounds,start-round,order,format\nAlice,3,2,random,invalid-format';
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

      expect(() => parseCSV(mockContent)).toThrow(
        'Invalid CSV value "format": "invalid-format". Expected one of "text, json-plain, json-pretty".'
      );
    });

    it('should throw error for invalid order field', () => {
      const mockContent = 'players,num-rounds,start-round,order\nAlice,3,2,invalid-order';
      (papa.parse as jest.Mock).mockReturnValue({
        data: [{ players: 'Alice', 'num-rounds': '3', 'start-round': '2', order: 'invalid-order' }],
        errors: [],
      });

      expect(() => parseCSV(mockContent)).toThrow(
        'Invalid CSV value "order": "invalid-order". Expected one of "top-down, bottom-up, random".'
      );
    });
  });
});
