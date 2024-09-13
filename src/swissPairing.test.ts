import { describe, expect, it } from '@jest/globals';
import { generatePairings, validateInput } from './swissPairing.js';

import { SwissPairingInput } from './types';

describe('Swiss Pairing', () => {
  const validInput: SwissPairingInput = {
    players: ['Player1', 'Player2', 'Player3', 'Player4'],
    rounds: 2,
    playedMatches: {},
  };

  const invalidInput1: SwissPairingInput = {
    players: ['Player1'],
    rounds: 1,
    playedMatches: {},
  };

  const invalidInput2: SwissPairingInput = {
    players: ['Player1'],
    rounds: 0,
    playedMatches: {},
  };

  describe('validateInput', () => {
    // it('should return true for valid input', () => {
    //   expect(validateInput(validInput)).toBe(true);
    // });

    it('should return false for invalid input', () => {
      expect(validateInput(invalidInput1)).toBe(false);
    });
  });

  describe('generatePairings', () => {
    it('should generate correct pairings', () => {
      const pairings = generatePairings(validInput);
      expect(pairings).toEqual([]);

      // expect(pairings.length).toBe(validInput.rounds);
      // expect(pairings[0].length).toBe(2); // Two pairs in each round
      // Add more specific assertions based on your pairing logic
    });
  });
});
