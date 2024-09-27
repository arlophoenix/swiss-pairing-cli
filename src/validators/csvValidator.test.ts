import { describe, expect, it } from '@jest/globals';

import { CSVRecord } from '../parsers/csvParserUtils.js';
import { validateCSVOptions } from './csvValidator.js';

describe('csvValidator', () => {
  describe('validateCSVOptions', () => {
    it('should return success for valid CSV records', () => {
      const csvRecords: readonly CSVRecord[] = [
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
      ];
      const result = validateCSVOptions(csvRecords);
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

    it('should return failure for invalid CSV records', () => {
      const csvRecords: readonly CSVRecord[] = [
        {
          players: 'Alice',
          'num-rounds': '-1',
          'start-round': '0',
          order: 'invalid',
          format: 'invalid',
          matches1: 'Alice',
        },
      ];
      const result = validateCSVOptions(csvRecords);
      expect(result.success).toBe(false);
    });

    it('should handle partial CSV records', () => {
      const csvRecords: readonly CSVRecord[] = [{ players: 'Alice', 'num-rounds': '3' }, { players: 'Bob' }];
      const result = validateCSVOptions(csvRecords);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual({
          format: undefined,
          matches: [],
          numRounds: 3,
          order: undefined,
          players: ['Alice', 'Bob'],
          startRound: undefined,
        });
      }
    });

    it('should handle empty CSV records', () => {
      const csvRecords: readonly CSVRecord[] = [];
      const result = validateCSVOptions(csvRecords);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual({});
      }
    });
  });
});
