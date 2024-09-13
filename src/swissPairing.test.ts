import { describe, expect, it } from '@jest/globals';
import { generatePairings, validateInput } from './swissPairing.js';

describe('Swiss Pairing', () => {
  describe('validateInput', () => {
    it('should return true for valid input', () => {
      expect(validateInput({players: ['Player1', 'Player2', 'Player3', 'Player4'], rounds: 2})).toBe(true);
    });

    it('should return false for invalid input', () => {
      expect(validateInput({players: ['Player1'], rounds: 1})).toBe(false);
    });
  });

  describe('generatePairings', () => {
    it('should generate correct pairings', () => {
      const players = ['Player1', 'Player2', 'Player3', 'Player4'];
      const rounds = 2;
      const pairings = generatePairings({players, rounds});
      
      expect(pairings.length).toBe(rounds);
      expect(pairings[0].length).toBe(2); // Two pairs in each round
      // Add more specific assertions based on your pairing logic
    });
  });
});
