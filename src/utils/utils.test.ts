import { PlayedTeams, ReadonlyPlayedTeams, Team } from '../types/types.js';
import {
  createBidirectionalMap,
  isValidTeamString,
  mutableCloneBidirectionalMap,
  parseStringLiteral,
  reverse,
  shuffle,
  stringToTeam,
  teamToString,
} from './utils.js';
import { describe, expect, it } from '@jest/globals';

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
      const original: ReadonlyPlayedTeams = new Map();
      const clone: PlayedTeams = mutableCloneBidirectionalMap(original);
      expect(clone).not.toBe(original);
      expect(clone).toBeInstanceOf(Map);
    });

    it('should create a deep clone of the map', () => {
      const original: ReadonlyPlayedTeams = new Map([
        ['team1', new Set(['opponent1', 'opponent2'])],
        ['team2', new Set(['opponent3'])],
      ]);
      const clone: PlayedTeams = mutableCloneBidirectionalMap(original);

      expect(clone).toEqual(original);
      expect(clone.get('team1')).not.toBe(original.get('team1'));
      expect(clone.get('team2')).not.toBe(original.get('team2'));
    });

    it('should allow mutations on the cloned map', () => {
      const original: ReadonlyPlayedTeams = new Map([['team1', new Set(['opponent1'])]]);
      const clone = mutableCloneBidirectionalMap(original);

      clone.set('team2', new Set(['opponent2']));
      clone.get('team1')?.add('opponent3');

      expect(clone.has('team2')).toBe(true);
      expect(clone.get('team1')?.has('opponent3')).toBe(true);
      expect(original.has('team2')).toBe(false);
      expect(original.get('team1')?.has('opponent3')).toBe(false);
    });

    it('should handle an empty map', () => {
      const original: ReadonlyPlayedTeams = new Map();
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
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toBe('Invalid value: "yellow". Expected one of "red, green, blue"');
      }
    });

    it('should be case-sensitive', () => {
      const result = parseStringLiteral({ input: 'RED', options: colors });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toBe('Invalid value: "RED". Expected one of "red, green, blue"');
      }
    });
  });

  describe('Team string utilities', () => {
    const validCases: readonly (readonly [string, Team])[] = [
      ['Alice', { name: 'Alice', squad: undefined }],
      ['Bob [B]', { name: 'Bob', squad: 'B' }],
      ['Charlie [Team C]', { name: 'Charlie', squad: 'Team C' }],
      ['David [D ]', { name: 'David', squad: 'D' }],
      ['Eve [ E]', { name: 'Eve', squad: 'E' }],
      ['Frank [F F]', { name: 'Frank', squad: 'F F' }],
      ['  George   [G]  ', { name: 'George', squad: 'G' }],
      ['Harry [H] ', { name: 'Harry', squad: 'H' }],
      ['Ivy   [Team I]   ', { name: 'Ivy', squad: 'Team I' }],
      ['John Doe [Team A]', { name: 'John Doe', squad: 'Team A' }],
      ['Rachel Parker [Team R]', { name: 'Rachel Parker', squad: 'Team R' }],
      ['Uma [Team U V]', { name: 'Uma', squad: 'Team U V' }],
      ['Victor [ Team V ]', { name: 'Victor', squad: 'Team V' }],
      ['Team1', { name: 'Team1', squad: undefined }],
      ['Team2 [Squad1]', { name: 'Team2', squad: 'Squad1' }],
    ];

    const invalidCases = [
      'Jack [J] [Team J]',
      'Kelly [K] [L] [M]',
      'Liam [L',
      'Mary] [M]',
      '[N] Noah',
      'Olivia [O] extra',
      'Peter []',
      'Quinn [ ]',
      'Sam [S] Parker',
      '[]',
      '[Team]',
      ' [Team]',
      'Tina [ ]',
      ' ',
    ];

    describe('stringToTeam', () => {
      // eslint-disable-next-line max-params
      it.each(validCases)('should correctly parse "%s"', (input, expected) => {
        expect(stringToTeam(input)).toEqual(expected);
      });

      it.each(invalidCases)('should handle invalid input "%s"', (input) => {
        const result = stringToTeam(input);
        expect(result).toEqual({ name: input.trim(), squad: undefined });
      });

      it('should handle team string without squad', () => {
        expect(stringToTeam('Bob')).toEqual({ name: 'Bob', squad: undefined });
      });
    });

    describe('isValidTeamString', () => {
      it.each(validCases)('should return true for valid input "%s"', (input) => {
        expect(isValidTeamString(input)).toBe(true);
      });

      it.each(invalidCases)('should return false for invalid input "%s"', (input) => {
        expect(isValidTeamString(input)).toBe(false);
      });

      it('should return true for valid team string without squad', () => {
        expect(isValidTeamString('Bob')).toBe(true);
      });
    });

    describe('teamToString', () => {
      it.each(validCases)(
        'should correctly convert team object to string and back again for "%s"',
        // eslint-disable-next-line max-params
        (_expected, input) => {
          expect(stringToTeam(teamToString(input))).toEqual(input);
        }
      );

      it('should handle team without squad', () => {
        expect(teamToString({ name: 'Alice', squad: undefined })).toBe('Alice');
      });

      it('should handle team with empty squad', () => {
        expect(teamToString({ name: 'Bob', squad: '' })).toBe('Bob');
      });

      it('should handle team with whitespace-only squad', () => {
        expect(teamToString({ name: 'Charlie', squad: '  ' })).toBe('Charlie');
      });

      it('should handle team name with spaces', () => {
        expect(teamToString({ name: 'John Doe', squad: 'A' })).toBe('John Doe [A]');
      });

      it('should handle squad with spaces', () => {
        expect(teamToString({ name: 'Jane', squad: 'Team B' })).toBe('Jane [Team B]');
      });

      it('should not add extra spaces around squad', () => {
        expect(teamToString({ name: 'David', squad: 'D' })).toBe('David [D]');
      });
    });
  });
});
