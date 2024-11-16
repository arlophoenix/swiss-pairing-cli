import { describe, expect, it } from '@jest/globals';

import { UnvalidatedCSVRow } from '../parsers/csvParserUtils.js';
import { validateCSVOptions } from './csvValidator.js';

describe('csvValidator', () => {
  describe('validateCSVOptions', () => {
    it('should handle empty CSV records', () => {
      const csvRows: readonly UnvalidatedCSVRow[] = [];
      const result = validateCSVOptions(csvRows);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toEqual('No data found in CSV');
      }
    });

    it('should validate valid complete records', () => {
      const csvRows: readonly UnvalidatedCSVRow[] = [
        {
          teams: 'Alice',
          'num-rounds': '3',
          'start-round': '1',
          order: 'random',
          format: 'text-markdown',
          'matches-home': 'Alice',
          'matches-away': 'Bob',
        },
        { teams: 'Bob' },
      ];
      const result = validateCSVOptions(csvRows);
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
          format: 'text-markdown',
          matches: [['Alice', 'Bob']],
        });
      }
    });

    it('should validate teams with squads', () => {
      const csvRows: readonly UnvalidatedCSVRow[] = [
        {
          teams: 'Alice',
          squads: 'A',
          'matches-home': 'Alice',
          'matches-away': 'Bob',
        },
        { teams: 'Bob', squads: 'B' },
      ];
      const result = validateCSVOptions(csvRows);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.teams).toEqual([
          { name: 'Alice', squad: 'A' },
          { name: 'Bob', squad: 'B' },
        ]);
      }
    });

    it('should handle missing optional fields', () => {
      const csvRows: readonly UnvalidatedCSVRow[] = [{ teams: 'Alice', 'num-rounds': '3' }, { teams: 'Bob' }];
      const result = validateCSVOptions(csvRows);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual({
          teams: [
            { name: 'Alice', squad: undefined },
            { name: 'Bob', squad: undefined },
          ],
          numRounds: 3,
        });
      }
    });

    it('should reject invalid round counts', () => {
      const csvRows: readonly UnvalidatedCSVRow[] = [
        { teams: 'Alice', 'num-rounds': '-1' },
        { teams: 'Bob' },
      ];
      const result = validateCSVOptions(csvRows);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toContain(
          'Invalid CSV argument "num-rounds": "-1". Expected a positive integer'
        );
      }
    });

    it('should reject invalid team names', () => {
      const csvRows: readonly UnvalidatedCSVRow[] = [{ teams: 'Alice [A] [B]' }, { teams: 'Bob' }];
      const result = validateCSVOptions(csvRows);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toContain(
          'Invalid CSV argument "teams": "Alice [A] [B]". Expected valid team name, optionally followed by [squad] e.g."Alice [Home]"'
        );
      }
    });

    it('should reject duplicate team names', () => {
      const csvRows: readonly UnvalidatedCSVRow[] = [
        { teams: 'Alice', squads: 'A' },
        { teams: 'Alice', squads: 'B' },
      ];
      const result = validateCSVOptions(csvRows);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toContain(
          'Invalid CSV argument "teams": "Alice [A],Alice [B]". Expected unique team names'
        );
      }
    });

    it('should handle empty team names', () => {
      const csvRows: readonly UnvalidatedCSVRow[] = [
        { teams: '', squads: 'A' },
        { teams: 'Bob' },
        { teams: 'Charlie' },
      ];
      const result = validateCSVOptions(csvRows);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.teams).toEqual([
          { name: 'Bob', squad: undefined },
          { name: 'Charlie', squad: undefined },
        ]);
      }
    });

    it('should handle no valid teams', () => {
      const csvRows: readonly UnvalidatedCSVRow[] = [{ teams: '', 'num-rounds': '3' }, { teams: '' }];
      const result = validateCSVOptions(csvRows);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.teams).toBeUndefined();
      }
    });
  });
});
