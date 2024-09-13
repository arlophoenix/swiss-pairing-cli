import { describe, expect, it } from '@jest/globals';
import { generatePairings, validateInput } from './swissPairing';

describe('Swiss Pairing', () => {
  describe('validateInput', () => {
    it('should return false for any input', () => {
      expect(validateInput({ players: ['Player1', 'Player2', 'Player3', 'Player4'], rounds: 2 })).toBe(false);
    });

    it('should return false for invalid input', () => {
      expect(validateInput({ players: [], rounds: 0 })).toBe(false);
    });
  });

  describe('generatePairings', () => {
    it('should return an empty array', () => {
      const players = ['Player1', 'Player2', 'Player3', 'Player4'];
      const rounds = 2;
      const pairings = generatePairings({ players, rounds });

      expect(pairings).toEqual([]);
    });
  });
});
