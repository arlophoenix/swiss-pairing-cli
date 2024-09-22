import { createBidirectionalMap, parseStringEnum, parseStringLiteral, reverse, shuffle } from './utils.js';
import { describe, expect, it } from '@jest/globals';

describe('utils', () => {
  describe('createBidirectionalMap', () => {
    it('should correctly build played matches Map', () => {
      const matches: readonly (readonly [string, string])[] = [
        ['Player1', 'Player2'],
        ['Player3', 'Player4'],
        ['Player1', 'Player3'],
      ];

      const result = createBidirectionalMap(matches);

      expect(result).toBeInstanceOf(Map);
      if (result instanceof Map) {
        expect(result.size).toBe(4);
        expect(result.get('Player1')).toEqual(new Set(['Player2', 'Player3']));
        expect(result.get('Player2')).toEqual(new Set(['Player1']));
        expect(result.get('Player3')).toEqual(new Set(['Player4', 'Player1']));
        expect(result.get('Player4')).toEqual(new Set(['Player3']));
      }
    });

    it('should return an empty Map for no matches', () => {
      const result = createBidirectionalMap();

      expect(result).toBeInstanceOf(Map);
      if (result instanceof Map) {
        expect(result.size).toBe(0);
      }
    });
  });

  describe('shuffle', () => {
    it('should return a new array', () => {
      const original = ['a', 'b', 'c'];
      const result = shuffle(original);
      expect(result).not.toBe(original);
      expect(result).toHaveLength(original.length);
    });

    it('should contain all original elements', () => {
      const original = ['a', 'b', 'c', 'd', 'e'];
      const result = shuffle(original);
      expect(new Set(result)).toEqual(new Set(original));
    });

    it('should work with empty arrays', () => {
      expect(shuffle([])).toEqual([]);
    });

    it('should work with single-element arrays', () => {
      expect(shuffle(['a'])).toEqual(['a']);
    });

    it('should produce different orders over multiple shuffles', () => {
      const original = ['a', 'b', 'c', 'd', 'e'];
      const shuffles = new Set();
      for (let i = 0; i < 100; i++) {
        shuffles.add(shuffle(original).join(''));
      }
      // It's extremely unlikely to get less than 2 unique orders in 100 shuffles
      // if the shuffle function is working correctly
      expect(shuffles.size).toBeGreaterThan(1);
    });

    it('should not modify the original array', () => {
      const original = ['a', 'b', 'c', 'd', 'e'];
      const originalCopy = [...original];
      shuffle(original);
      expect(original).toEqual(originalCopy);
    });
  });

  describe('reverse', () => {
    it('should return a new array', () => {
      const original = ['a', 'b', 'c'];
      const result = reverse(original);
      expect(result).not.toBe(original);
      expect(result).toHaveLength(original.length);
      expect(result).toEqual(['c', 'b', 'a']);
    });

    it('should work with empty arrays', () => {
      expect(reverse([])).toEqual([]);
    });

    it('should work with single-element arrays', () => {
      expect(reverse(['a'])).toEqual(['a']);
    });

    it('should not modify the original array', () => {
      const original = ['a', 'b', 'c', 'd', 'e'];
      const originalCopy = [...original];
      reverse(original);
      expect(original).toEqual(originalCopy);
    });
  });

  describe('parseStringLiteral', () => {
    const colors = ['red', 'green', 'blue'] as const;

    it('should return success for a valid option', () => {
      const result = parseStringLiteral({ input: 'green', options: colors });
      expect(result).toEqual({ success: true, value: 'green' });
    });

    it('should return failure for an invalid option', () => {
      const result = parseStringLiteral({ input: 'yellow', options: colors });
      expect(result).toEqual({
        success: false,
        errorMessage: 'Invalid option: yellow. Valid options are: red, green, blue',
      });
    });

    it('should use a custom error message when provided', () => {
      const customError = 'Custom error for invalid color';
      const result = parseStringLiteral({ input: 'yellow', options: colors, errorMessage: customError });
      expect(result).toEqual({
        success: false,
        errorMessage: customError,
      });
    });

    it('should be case-sensitive', () => {
      const result = parseStringLiteral({ input: 'RED', options: colors });
      expect(result.success).toBe(false);
    });
  });

  describe('parseStringEnum', () => {
    enum StringStatus {
      ACTIVE = 'active',
      INACTIVE = 'inactive',
      PENDING = 'pending',
    }

    it('should return success for a valid enum value', () => {
      const result = parseStringEnum({ input: 'active', enumObj: StringStatus });
      expect(result).toEqual({ success: true, value: 'active' });
    });

    it('should return failure for an invalid enum value', () => {
      const result = parseStringEnum({ input: 'completed', enumObj: StringStatus });
      expect(result).toEqual({
        success: false,
        errorMessage: 'Invalid option: completed. Valid options are: active, inactive, pending',
      });
    });

    it('should use a custom error message when provided', () => {
      const customError = 'Custom error for invalid status';
      const result = parseStringEnum({
        input: 'completed',
        enumObj: StringStatus,
        errorMessage: customError,
      });
      expect(result).toEqual({
        success: false,
        errorMessage: customError,
      });
    });

    it('should not accept enum keys as valid inputs', () => {
      const result = parseStringEnum({ input: 'ACTIVE', enumObj: StringStatus });
      expect(result.success).toBe(false);
    });

    it('should be case-sensitive', () => {
      const result = parseStringEnum({ input: 'Active', enumObj: StringStatus });
      expect(result.success).toBe(false);
    });
  });
});
