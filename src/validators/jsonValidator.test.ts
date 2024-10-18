import { describe, expect, it } from '@jest/globals';

import { validateJSONOptions } from './jsonValidator.js';

describe('jsonValidator', () => {
  describe('validateJSONOptions', () => {
    it('should return success for valid complete JSON record', () => {
      const jsonRecord = {
        teams: ['Alice', 'Bob'],
        'num-rounds': 3,
        'start-round': 1,
        order: 'random',
        format: 'text',
        matches: [['Alice', 'Bob']],
      };
      const result = validateJSONOptions(jsonRecord);
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

    it('should return success with partial object for partial JSON record', () => {
      const jsonRecord = {
        teams: ['Alice', 'Bob'],
        'num-rounds': 3,
      };
      const result = validateJSONOptions(jsonRecord);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual({
          teams: ['Alice', 'Bob'],
          numRounds: 3,
        });
        expect(result.value).not.toHaveProperty('startRound');
        expect(result.value).not.toHaveProperty('order');
        expect(result.value).not.toHaveProperty('format');
        expect(result.value).not.toHaveProperty('matches');
      }
    });

    it('should handle empty JSON record', () => {
      const jsonRecord = {};
      const result = validateJSONOptions(jsonRecord);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual({});
      }
    });

    it('should return failure for invalid JSON record', () => {
      const jsonRecord = {
        teams: ['Alice'],
        'num-rounds': -1,
        'start-round': 0,
        order: 'invalid',
        format: 'invalid',
        matches: [['Alice']],
      };
      const result = validateJSONOptions(jsonRecord);
      expect(result.success).toBe(false);
    });

    it('should handle an array of strings without squads', () => {
      const jsonRecord = {
        teams: ['Alice', 'Bob', 'Charlie'],
        'num-rounds': 3,
        'start-round': 1,
        order: 'random',
        format: 'text',
      };

      const result = validateJSONOptions(jsonRecord);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual({
          teams: ['Alice', 'Bob', 'Charlie'],
          numRounds: 3,
          startRound: 1,
          order: 'random',
          format: 'text',
        });
      }
    });

    it('should handle an array of strings with squad notation', () => {
      const jsonRecord = {
        teams: ['Alice [A]', 'Bob [B]', 'Charlie'],
        'num-rounds': 3,
      };

      const result = validateJSONOptions(jsonRecord);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual({
          teams: ['Alice [A]', 'Bob [B]', 'Charlie'],
          numRounds: 3,
        });
      }
    });

    it('should handle an array of team objects', () => {
      const jsonRecord = {
        teams: [
          { name: 'Alice', squad: 'A' },
          { name: 'Bob', squad: 'B' },
          { name: 'Charlie', squad: undefined },
        ],
        'num-rounds': 3,
      };

      const result = validateJSONOptions(jsonRecord);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual({
          teams: ['Alice [A]', 'Bob [B]', 'Charlie'],
          numRounds: 3,
        });
      }
    });

    it('should reject duplicate team names in string array format', () => {
      const jsonRecord = {
        teams: ['Alice [A]', 'Bob', 'Alice [B]'],
      };

      const result = validateJSONOptions(jsonRecord);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('unique team names');
      }
    });

    it('should reject duplicate team names in object array format', () => {
      const jsonRecord = {
        teams: [
          { name: 'Alice', squad: 'A' },
          { name: 'Bob', squad: 'B' },
          { name: 'Alice', squad: 'B' },
        ],
      };

      const result = validateJSONOptions(jsonRecord);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('unique team names');
      }
    });

    it('should reject empty teams array', () => {
      const jsonRecord = {
        teams: [],
        'num-rounds': 3,
      };

      const result = validateJSONOptions(jsonRecord);
      expect(result.success).toBe(false);
    });

    it('should handle missing teams property', () => {
      const jsonRecord = {
        'num-rounds': 3,
      };

      const result = validateJSONOptions(jsonRecord);
      expect(result.success).toBe(false);
      if (result.success) {
        expect(result.value).toEqual({
          numRounds: 3,
        });
      }
    });

    it('should handle mixed array of strings and team objects', () => {
      const jsonRecord = {
        teams: ['Alice [A]', { name: 'Bob', squad: 'B' }, 'Charlie', { name: 'David', squad: 'D' }],
      };

      const result = validateJSONOptions(jsonRecord);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.teams).toEqual(['Alice [A]', 'Bob [B]', 'Charlie', 'David [D]']);
      }
    });
  });
});
