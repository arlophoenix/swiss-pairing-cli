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
  });
});
