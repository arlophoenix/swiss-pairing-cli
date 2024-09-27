import { describe, expect, it } from '@jest/globals';
import {
  validateFormat,
  validateMatches,
  validateNumRounds,
  validateOrder,
  validatePlayers,
  validateStartRound,
} from './cliValidator.js';

describe('Validation', () => {
  describe('validatePlayers', () => {
    it('should return success for valid players', () => {
      const result = validatePlayers(['Alice', 'Bob', 'Charlie', 'David']);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual(['Alice', 'Bob', 'Charlie', 'David']);
      }
    });

    it('should return failure for less than two players', () => {
      const result = validatePlayers(['Alice']);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('at least two players');
      }
    });

    it('should return failure for odd number of players', () => {
      const result = validatePlayers(['Alice', 'Bob', 'Charlie']);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('even number of players');
      }
    });

    it('should return failure for duplicate players', () => {
      const result = validatePlayers(['Alice', 'Bob', 'Alice', 'David']);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Duplicate players');
      }
    });
  });

  describe('validateNumRounds', () => {
    it('should return success for valid number of rounds', () => {
      const result = validateNumRounds('3');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(3);
      }
    });

    it('should return failure for negative number of rounds', () => {
      const result = validateNumRounds('-1');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('positive integer');
      }
    });

    it('should return floor for non-integer number of rounds', () => {
      const result = validateNumRounds('2.5');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(2);
      }
    });
  });

  describe('validateStartRound', () => {
    it('should return success for valid start round', () => {
      const result = validateStartRound('1');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(1);
      }
    });

    it('should return failure for negative start round', () => {
      const result = validateStartRound('-1');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('positive integer');
      }
    });

    it('should return floor for non-integer start round', () => {
      const result = validateStartRound('1.5');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(1);
      }
    });
  });

  describe('validateOrder', () => {
    it('should return success for valid order', () => {
      const result = validateOrder('random');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe('random');
      }
    });

    it('should return failure for invalid order', () => {
      const result = validateOrder('invalid-order');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe(
          'Invalid CLI value "--order": "invalid-order". Expected one of "top-down, bottom-up, random".'
        );
      }
    });
  });

  describe('validateFormat', () => {
    it('should return success for valid format', () => {
      const result = validateFormat('text');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe('text');
      }
    });

    it('should return failure for invalid format', () => {
      const result = validateFormat('invalid-format');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe(
          'Invalid CLI value "--format": "invalid-format". Expected one of "text, json-plain, json-pretty".'
        );
      }
    });
  });

  describe('validateMatches', () => {
    it('should return success for valid matches', () => {
      const result = validateMatches([
        ['Alice', 'Bob'],
        ['Charlie', 'David'],
      ]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual([
          ['Alice', 'Bob'],
          ['Charlie', 'David'],
        ]);
      }
    });

    it('should return failure for invalid match format', () => {
      const result = validateMatches([['Alice', 'Bob'], ['Charlie']]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Invalid match format');
      }
    });

    it('should return failure for non-string player names', () => {
      const result = validateMatches([['Alice', 'Bob'], [1, 2] as unknown as readonly [string, string]]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Invalid match format');
      }
    });
  });
});
