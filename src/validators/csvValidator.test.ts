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
          'matches-home': 'Alice',
          'matches-away': 'Bob',
        },
        { teams: 'Bob' },
      ];
      const result = validateCSVOptions(csvRecords);
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
    });

    it('should return failure for invalid CSV records', () => {
      const csvRecords: readonly CSVRecord[] = [
        {
          teams: 'Alice',
          'num-rounds': '-1',
          'start-round': '0',
          order: 'invalid',
          format: 'invalid',
          'matches-home': 'Alice',
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
          teams: [
            { name: 'Alice', squad: undefined },
            { name: 'Bob', squad: undefined },
          ],
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

    it('should return success for valid CSV records with teams and squads', () => {
      const csvRecords: readonly CSVRecord[] = [
        {
          teams: 'Alice',
          squads: 'A',
          'num-rounds': '3',
          'start-round': '1',
          order: 'random',
          format: 'text',
          'matches-home': 'Alice',
          'matches-away': 'Bob',
        },
        { teams: 'Bob', squads: 'B' },
        { teams: 'Charlie' }, // Team without squad
      ];
      const result = validateCSVOptions(csvRecords);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual({
          teams: [
            { name: 'Alice', squad: 'A' },
            { name: 'Bob', squad: 'B' },
            { name: 'Charlie', squad: undefined },
          ],
          numRounds: 3,
          startRound: 1,
          order: 'random',
          format: 'text',
          matches: [['Alice', 'Bob']],
        });
      }
    });

    it('should handle teams without squads', () => {
      const csvRecords: readonly CSVRecord[] = [
        { teams: 'Alice', 'num-rounds': '3' },
        { teams: 'Bob', squads: 'B' },
        { teams: 'Charlie' },
      ];
      const result = validateCSVOptions(csvRecords);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.teams).toEqual([
          { name: 'Alice', squad: undefined },
          { name: 'Bob', squad: 'B' },
          { name: 'Charlie', squad: undefined },
        ]);
      }
    });

    it('should return failure for duplicate team names, even with different squads', () => {
      const csvRecords: readonly CSVRecord[] = [
        { teams: 'Alice', squads: 'A' },
        { teams: 'Bob' },
        { teams: 'Alice', squads: 'B' },
      ];
      const result = validateCSVOptions(csvRecords);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('unique team names');
      }
    });
  });
});
