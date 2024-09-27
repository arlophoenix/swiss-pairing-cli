import { describe, expect, it } from '@jest/globals';

import { validateJSONOptions } from './jsonValidator.js';

describe('jsonValidator', () => {
  describe('validateJSONOptions', () => {
    it('should return success for valid JSON record', () => {
      const jsonRecord = {
        players: ['Alice', 'Bob'],
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
          players: ['Alice', 'Bob'],
          numRounds: 3,
          startRound: 1,
          order: 'random',
          format: 'text',
          matches: [['Alice', 'Bob']],
        });
      }
    });

    it('should return failure for invalid JSON record', () => {
      const jsonRecord = {
        players: ['Alice'],
        'num-rounds': -1,
        'start-round': 0,
        order: 'invalid',
        format: 'invalid',
        matches: [['Alice']],
      };
      const result = validateJSONOptions(jsonRecord);
      expect(result.success).toBe(false);
    });

    it('should handle partial JSON record', () => {
      const jsonRecord = {
        players: ['Alice', 'Bob'],
        'num-rounds': 3,
      };
      const result = validateJSONOptions(jsonRecord);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual({
          players: ['Alice', 'Bob'],
          numRounds: 3,
        });
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
  });
});
