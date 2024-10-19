// utils/utils.test.ts

import { PlayedOpponents, ReadonlyMatch, ReadonlyPlayedOpponents, Team } from '../types/types.js';
import {
  createBidirectionalMap,
  mutableCloneBidirectionalMap,
  parseStringLiteral,
  reverse,
  shuffle,
  stringToTeam,
  teamToString,
} from './utils.js';
import { describe, expect, it } from '@jest/globals';

import { ARG_FORMAT } from '../constants.js';

describe('utils', () => {
  describe('createBidirectionalMap', () => {
    it('should correctly build played matches Map', () => {
      const matches: readonly (readonly [string, string])[] = [
        ['Team1', 'Team2'],
        ['Team3', 'Team4'],
        ['Team1', 'Team3'],
      ];

      const result = createBidirectionalMap(matches);

      expect(result).toBeInstanceOf(Map);
      if (result instanceof Map) {
        expect(result.size).toBe(4);
        expect(result.get('Team1')).toEqual(new Set(['Team2', 'Team3']));
        expect(result.get('Team2')).toEqual(new Set(['Team1']));
        expect(result.get('Team3')).toEqual(new Set(['Team4', 'Team1']));
        expect(result.get('Team4')).toEqual(new Set(['Team3']));
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

  describe('mutableCloneBidirectionalMap', () => {
    it('should create a new Map instance', () => {
      const original: ReadonlyPlayedOpponents = new Map();
      const clone: PlayedOpponents = mutableCloneBidirectionalMap(original);
      expect(clone).not.toBe(original);
      expect(clone).toBeInstanceOf(Map);
    });

    it('should create a deep clone of the map', () => {
      const original: ReadonlyPlayedOpponents = new Map([
        ['team1', new Set(['opponent1', 'opponent2'])],
        ['team2', new Set(['opponent3'])],
      ]);
      const clone: PlayedOpponents = mutableCloneBidirectionalMap(original);

      expect(clone).toEqual(original);
      expect(clone.get('team1')).not.toBe(original.get('team1'));
      expect(clone.get('team2')).not.toBe(original.get('team2'));
    });

    it('should allow mutations on the cloned map', () => {
      const original: ReadonlyPlayedOpponents = new Map([['team1', new Set(['opponent1'])]]);
      const clone = mutableCloneBidirectionalMap(original);

      clone.set('team2', new Set(['opponent2']));
      clone.get('team1')?.add('opponent3');

      expect(clone.has('team2')).toBe(true);
      expect(clone.get('team1')?.has('opponent3')).toBe(true);
      expect(original.has('team2')).toBe(false);
      expect(original.get('team1')?.has('opponent3')).toBe(false);
    });

    it('should handle an empty map', () => {
      const original: ReadonlyPlayedOpponents = new Map();
      const clone = mutableCloneBidirectionalMap(original);
      expect(clone.size).toBe(0);
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
      const result = parseStringLiteral({
        input: 'green',
        options: colors,
      });
      expect(result).toEqual({ success: true, value: 'green' });
    });

    it('should return failure for an invalid option', () => {
      const result = parseStringLiteral({ input: 'yellow', options: colors });
      expect(result).toEqual({
        success: false,
        error: {
          message: 'Invalid value: "yellow". Expected one of "red,green,blue".',
          type: 'InvalidInput',
        },
      });
    });

    it('should use a custom error message when provided', () => {
      const result = parseStringLiteral({
        input: 'yellow',
        options: colors,
        errorInfo: { origin: 'CLI', argName: ARG_FORMAT },
      });
      expect(result).toEqual({
        success: false,
        error: {
          type: 'InvalidInput',
          message: 'Invalid CLI value "--format": "yellow". Expected one of "red, green, blue".',
        },
      });
    });

    it('should be case-sensitive', () => {
      const result = parseStringLiteral({ input: 'RED', options: colors });
      expect(result.success).toBe(false);
    });
  });
});
