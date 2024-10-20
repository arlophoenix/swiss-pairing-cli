import { CLI_OPTION_FORMAT, CLI_OPTION_ORDER } from '../constants.js';
import { describe, expect, it } from '@jest/globals';
import {
  validateAllOptions,
  validateFormat,
  validateMatches,
  validateNumRounds,
  validateOrder,
  validateStartRound,
  validateTeams,
} from './validatorUtils.js';

describe('validatorUtils', () => {
  describe('validateAllOptions', () => {
    it('should return success for valid complete input', () => {
      const input = {
        teams: ['Alice', 'Bob'],
        numRounds: '3',
        startRound: '1',
        order: 'random',
        format: 'text',
        matches: [['Alice', 'Bob']],
      };
      const result = validateAllOptions({ input, origin: 'CLI' });
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

    it('should return success with partial object for partial valid input', () => {
      const input = {
        teams: ['Alice', 'Bob'],
        numRounds: '3',
      };
      const result = validateAllOptions({ input, origin: 'CLI' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual({
          teams: [
            { name: 'Alice', squad: undefined },
            { name: 'Bob', squad: undefined },
          ],
          numRounds: 3,
        });
        expect(result.value).not.toHaveProperty('startRound');
        expect(result.value).not.toHaveProperty('order');
        expect(result.value).not.toHaveProperty('format');
        expect(result.value).not.toHaveProperty('matches');
      }
    });

    it('should handle undefined values', () => {
      const input = {
        teams: ['Alice', 'Bob'],
        numRounds: undefined,
        startRound: undefined,
        order: undefined,
        format: undefined,
        matches: undefined,
      };
      const result = validateAllOptions({ input, origin: 'CLI' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual({
          teams: [
            { name: 'Alice', squad: undefined },
            { name: 'Bob', squad: undefined },
          ],
        });
      }
    });

    it('should return success with empty object for empty input', () => {
      const input = {};
      const result = validateAllOptions({ input, origin: 'CLI' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual({});
      }
    });

    it('should return failure for invalid input', () => {
      const input = {
        teams: ['Alice'],
        numRounds: '-1',
        startRound: '0',
        order: 'invalid',
        format: 'invalid',
        matches: [['Alice']],
      };
      const result = validateAllOptions({ input, origin: 'CLI' });
      expect(result.success).toBe(false);
    });
  });

  describe('validateTeams', () => {
    it('should return success for valid teams', () => {
      const result = validateTeams({ teams: ['Alice', 'Bob'], origin: 'CLI' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual([
          { name: 'Alice', squad: undefined },
          { name: 'Bob', squad: undefined },
        ]);
      }
    });

    it('should handle teams with squads', () => {
      const result = validateTeams({ teams: ['Alice [A]', 'Bob [B]'], origin: 'CLI' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual([
          { name: 'Alice', squad: 'A' },
          { name: 'Bob', squad: 'B' },
        ]);
      }
    });

    it('should return failure for less than two teams', () => {
      const result = validateTeams({ teams: ['Alice'], origin: 'CLI' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('at least two teams');
      }
    });

    it('should return failure for invalid team names', () => {
      const result = validateTeams({ teams: ['Alice', 'Bob [C] [D]'], origin: 'CLI' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('valid team name');
      }
    });

    it('should return failure for duplicate team names', () => {
      const result = validateTeams({ teams: ['Alice', 'Bob', 'Alice [A]'], origin: 'CLI' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('unique team names');
      }
    });

    it('should return undefined for undefined input', () => {
      const result = validateTeams({ teams: undefined, origin: 'CLI' });
      expect(result).toEqual({ success: true, value: undefined });
    });
  });

  describe('validateNumRounds', () => {
    it('should return success for valid number of rounds', () => {
      const result = validateNumRounds({ numRounds: '3', origin: 'CLI' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(3);
      }
    });

    it('should return failure for negative number of rounds', () => {
      const result = validateNumRounds({ numRounds: '-1', origin: 'CLI' });
      expect(result.success).toBe(false);
    });

    it('should return success and floor for non-integer number of rounds', () => {
      const result = validateNumRounds({ numRounds: '3.7', origin: 'CLI' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(3);
      }
    });
  });

  describe('validateStartRound', () => {
    it('should return success for valid start round', () => {
      const result = validateStartRound({ startRound: '1', origin: 'CLI' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(1);
      }
    });

    it('should return failure for negative start round', () => {
      const result = validateStartRound({ startRound: '-1', origin: 'CLI' });
      expect(result.success).toBe(false);
    });

    it('should return success and floor for non-integer start round', () => {
      const result = validateStartRound({ startRound: '1.7', origin: 'CLI' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(1);
      }
    });
  });

  describe('validateOrder', () => {
    it('should return success for valid order', () => {
      const result = validateOrder({ order: 'random', origin: 'CLI' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe('random');
      }
    });

    it('should return failure for invalid order', () => {
      const result = validateOrder({ order: 'invalid', origin: 'CLI' });
      expect(result.success).toBe(false);
    });

    it('should accept all valid order options', () => {
      CLI_OPTION_ORDER.forEach((order) => {
        const result = validateOrder({ order, origin: 'CLI' });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value).toBe(order);
        }
      });
    });
  });

  describe('validateFormat', () => {
    it('should return success for valid format', () => {
      const result = validateFormat({ format: 'text', origin: 'CLI' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe('text');
      }
    });

    it('should return failure for invalid format', () => {
      const result = validateFormat({ format: 'invalid', origin: 'CLI' });
      expect(result.success).toBe(false);
    });

    it('should accept all valid format options', () => {
      CLI_OPTION_FORMAT.forEach((format) => {
        const result = validateFormat({ format, origin: 'CLI' });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value).toBe(format);
        }
      });
    });
  });

  describe('validateMatches', () => {
    it('should return success for valid matches', () => {
      const result = validateMatches({
        matches: [
          ['Alice', 'Bob'],
          ['Charlie', 'David'],
        ],
        origin: 'CLI',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual([
          ['Alice', 'Bob'],
          ['Charlie', 'David'],
        ]);
      }
    });

    it('should return failure for invalid match format', () => {
      const result = validateMatches({ matches: [['Alice', 'Bob'], ['Charlie']], origin: 'CLI' });
      expect(result.success).toBe(false);
    });

    it('should return failure for non-string team names', () => {
      const result = validateMatches({
        matches: [['Alice', 'Bob'], [1, 2] as unknown as readonly [string, string]],
        origin: 'CLI',
      });
      expect(result.success).toBe(false);
    });
  });
});
