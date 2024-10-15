import { describe, expect, it } from '@jest/globals';

import { CSVRecord } from '../parsers/csvParserUtils.js';
import { validateCSVOptions } from './csvValidator.js';

describe('csvValidator', () => {
  describe('validateCSVOptions', () => {
    it('should return success for valid CSV records', () => {
      const csvRecords: readonly CSVRecord[] = [
        {
          teams: 'Alice',
          'num-rounds': '3',
          'start-round': '1',
          order: 'random',
          format: 'text',
          matches1: 'Alice',
          matches2: 'Bob',
        },
        { teams: 'Bob' },
      ];
      const result = validateCSVOptions(csvRecords);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual({
          teams: ['Alice', 'Bob'],
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
          teams: 'Alice',
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
      const csvRecords: readonly CSVRecord[] = [{ teams: 'Alice', 'num-rounds': '3' }, { teams: 'Bob' }];
      const result = validateCSVOptions(csvRecords);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual({
          numRounds: 3,
          teams: ['Alice', 'Bob'],
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
