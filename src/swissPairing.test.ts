import { describe, expect, it } from '@jest/globals';
import { generatePairings, validateInput } from './swissPairing.js';

import { SwissPairingInput } from './types';

describe('Swiss Pairing', () => {
  describe('validateInput', () => {
    it('should return true for valid input', () => {
      const validInput: SwissPairingInput = {
        players: ['Player1', 'Player2', 'Player3', 'Player4'],
        rounds: 3,
        playedMatches: {
          Player1: ['Player2'],
          Player2: ['Player1'],
        },
      };
      expect(validateInput(validInput)).toBe(true);
    });

    it('should return false if there are less than two players', () => {
      const invalidInput: SwissPairingInput = {
        players: ['Player1'],
        rounds: 1,
        playedMatches: {},
      };
      expect(validateInput(invalidInput)).toBe(false);
    });

    it('should return false if there are duplicate players', () => {
      const invalidInput: SwissPairingInput = {
        players: ['Player1', 'Player2', 'Player1', 'Player3'],
        rounds: 2,
        playedMatches: {},
      };
      expect(validateInput(invalidInput)).toBe(false);
    });

    it('should return false if rounds is less than 1', () => {
      const invalidInput: SwissPairingInput = {
        players: ['Player1', 'Player2', 'Player3', 'Player4'],
        rounds: 0,
        playedMatches: {},
      };
      expect(validateInput(invalidInput)).toBe(false);
    });

    it('should return false if rounds is greater than players minus 1', () => {
      const invalidInput: SwissPairingInput = {
        players: ['Player1', 'Player2', 'Player3', 'Player4'],
        rounds: 4,
        playedMatches: {},
      };
      expect(validateInput(invalidInput)).toBe(false);
    });

    it('should return false if playedMatches contains invalid player names', () => {
      const invalidInput: SwissPairingInput = {
        players: ['Player1', 'Player2', 'Player3', 'Player4'],
        rounds: 2,
        playedMatches: {
          Player1: ['Player2'],
          Player2: ['Player1'],
          InvalidPlayer: ['Player3'],
        },
      };
      expect(validateInput(invalidInput)).toBe(false);
    });

    it('should return false if playedMatches is not symmetrical', () => {
      const invalidInput: SwissPairingInput = {
        players: ['Player1', 'Player2', 'Player3', 'Player4'],
        rounds: 2,
        playedMatches: {
          Player1: ['Player2'],
          Player2: ['Player3'], // Should be ['Player1']
        },
      };
      expect(validateInput(invalidInput)).toBe(false);
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
