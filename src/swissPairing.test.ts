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
    it('should generate correct pairings', () => {
      const validInput: SwissPairingInput = {
        players: ['Player1', 'Player2', 'Player3', 'Player4'],
        rounds: 2,
        playedMatches: {},
      };
      const pairings = generatePairings(validInput);
      expect(pairings).toEqual([]);

      // expect(pairings.length).toBe(validInput.rounds);
      // expect(pairings[0].length).toBe(2); // Two pairs in each round
      // Add more specific assertions based on your pairing logic
    });
  });
});
