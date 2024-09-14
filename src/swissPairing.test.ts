import { ValidationResult, generatePairings, validateInput } from './swissPairing.js';
import { describe, expect, it } from '@jest/globals';

import { SwissPairingInput } from './types';

describe('Swiss Pairing', () => {
  describe('validateInput', () => {
    it('should return valid for valid input', () => {
      const validInput: SwissPairingInput = {
        players: ['Player1', 'Player2', 'Player3', 'Player4'],
        rounds: 3,
        playedMatches: {
          Player1: ['Player2'],
          Player2: ['Player1'],
        },
      };
      const result: ValidationResult = validateInput(validInput);
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should return invalid if there are less than two players', () => {
      const invalidInput: SwissPairingInput = {
        players: ['Player1'],
        rounds: 1,
        playedMatches: {},
      };
      const result: ValidationResult = validateInput(invalidInput);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('There must be at least two players.');
    });

    it('should return invalid if there are duplicate players', () => {
      const invalidInput: SwissPairingInput = {
        players: ['Player1', 'Player2', 'Player1', 'Player3'],
        rounds: 2,
        playedMatches: {},
      };
      const result: ValidationResult = validateInput(invalidInput);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Duplicate players are not allowed.');
    });

    it('should return invalid if rounds is less than 1', () => {
      const invalidInput: SwissPairingInput = {
        players: ['Player1', 'Player2', 'Player3', 'Player4'],
        rounds: 0,
        playedMatches: {},
      };
      const result: ValidationResult = validateInput(invalidInput);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Number of rounds must be at least 1.');
    });

    it('should return invalid if rounds is greater than players minus 1', () => {
      const invalidInput: SwissPairingInput = {
        players: ['Player1', 'Player2', 'Player3', 'Player4'],
        rounds: 4,
        playedMatches: {},
      };
      const result: ValidationResult = validateInput(invalidInput);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Number of rounds cannot be greater than the number of players minus 1.');
    });

    it('should return invalid if playedMatches contains invalid player names', () => {
      const invalidInput: SwissPairingInput = {
        players: ['Player1', 'Player2', 'Player3', 'Player4'],
        rounds: 2,
        playedMatches: {
          Player1: ['Player2'],
          Player2: ['Player1'],
          InvalidPlayer: ['Player3'],
        },
      };
      const result: ValidationResult = validateInput(invalidInput);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Played matches contain invalid player names.');
    });

    it('should return invalid if playedMatches is not symmetrical', () => {
      const invalidInput: SwissPairingInput = {
        players: ['Player1', 'Player2', 'Player3', 'Player4'],
        rounds: 2,
        playedMatches: {
          Player1: ['Player2'],
          Player2: ['Player3'], // Should be ['Player1']
        },
      };
      const result: ValidationResult = validateInput(invalidInput);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Played matches are not symmetrical.');
    });
  });

  describe('generatePairings', () => {
    it('should generate correct pairings for 4 players, 1 round, and no played matches', () => {
      const input: SwissPairingInput = {
        players: ['p1', 'p2', 'p3', 'p4'],
        rounds: 1,
        playedMatches: {},
      };
      const pairings = generatePairings(input);
      expect(pairings).toEqual({
        1: [
          ['p1', 'p2'],
          ['p3', 'p4'],
        ],
      });
    });

    it('should generate correct pairings for 4 players and 2 rounds', () => {
      const input: SwissPairingInput = {
        players: ['p1', 'p2', 'p3', 'p4'],
        rounds: 2,
        playedMatches: {},
      };
      const pairings = generatePairings(input);
      expect(pairings).toEqual({
        1: [
          ['p1', 'p2'],
          ['p3', 'p4'],
        ],
        2: [
          ['p1', 'p3'],
          ['p2', 'p4'],
        ],
      });
    });

    it('should generate correct pairings for 4 players and 3 rounds', () => {
      const input: SwissPairingInput = {
        players: ['p1', 'p2', 'p3', 'p4'],
        rounds: 3,
        playedMatches: {},
      };
      const pairings = generatePairings(input);
      expect(pairings).toEqual({
        1: [
          ['p1', 'p2'],
          ['p3', 'p4'],
        ],
        2: [
          ['p1', 'p3'],
          ['p2', 'p4'],
        ],
        3: [
          ['p1', 'p4'],
          ['p2', 'p3'],
        ],
      });
    });

    it('should throw an error for 4 players and 4 rounds', () => {
      const input: SwissPairingInput = {
        players: ['p1', 'p2', 'p3', 'p4'],
        rounds: 4,
        playedMatches: {},
      };
      expect(() => generatePairings(input)).toThrow(
        'Number of rounds cannot be greater than the number of players minus 1.'
      );
    });

    it('should generate correct pairings for 1 round with existing played matches (p1 vs p2, p3 vs p4)', () => {
      const input: SwissPairingInput = {
        players: ['p1', 'p2', 'p3', 'p4'],
        rounds: 1,
        playedMatches: {
          p1: ['p2'],
          p2: ['p1'],
          p3: ['p4'],
          p4: ['p3'],
        },
      };
      const pairings = generatePairings(input);
      expect(pairings).toEqual({
        1: [
          ['p1', 'p3'],
          ['p2', 'p4'],
        ],
      });
    });

    it('should generate correct pairings for 1 round with existing played matches (p1 vs p3, p2 vs p4)', () => {
      const input: SwissPairingInput = {
        players: ['p1', 'p2', 'p3', 'p4'],
        rounds: 1,
        playedMatches: {
          p1: ['p3'],
          p2: ['p4'],
          p3: ['p1'],
          p4: ['p2'],
        },
      };
      const pairings = generatePairings(input);
      expect(pairings).toEqual({
        1: [
          ['p1', 'p2'],
          ['p3', 'p4'],
        ],
      });
    });

    it('should generate correct pairings for 1 round with existing played matches (p1 vs p2, p1 vs p3)', () => {
      const input: SwissPairingInput = {
        players: ['p1', 'p2', 'p3', 'p4'],
        rounds: 1,
        playedMatches: {
          p1: ['p2', 'p3'],
          p2: ['p1'],
          p3: ['p1'],
        },
      };
      const pairings = generatePairings(input);
      expect(pairings).toEqual({
        1: [
          ['p1', 'p4'],
          ['p2', 'p3'],
        ],
      });
    });
  });
});
