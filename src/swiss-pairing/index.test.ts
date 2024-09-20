import * as validation from './validation.js';

import { describe, expect, it, jest } from '@jest/globals';

import { GenerateRoundPairingsInput } from '../types.js';
import type { SpyInstance } from 'jest-mock';
import { generateRoundPairings } from './index.js';

describe('Swiss Pairing', () => {
  describe('generatePairings', () => {
    let mockValidateInput: SpyInstance<typeof validation.validateRoundPairingsInput>;
    let mockValidateResult: SpyInstance<typeof validation.validateResult>;

    beforeEach(() => {
      mockValidateInput = jest
        .spyOn(validation, 'validateRoundPairingsInput')
        .mockReturnValue({ isValid: true });
      mockValidateResult = jest.spyOn(validation, 'validateResult').mockReturnValue({ isValid: true });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return an error if input validation fails', () => {
      mockValidateInput.mockReturnValue({ isValid: false, errorMessage: 'input validation error' });
      const invalidInput: GenerateRoundPairingsInput = {
        players: ['p1'],
        numRounds: 1,
        startRound: 1,
        playedMatches: new Map(),
      };
      const result = generateRoundPairings(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorType).toBe('InvalidInput');
        expect(result.errorMessage).toBe('input validation error');
      }
    });

    it('should return an error if output validation fails', () => {
      mockValidateResult.mockReturnValue({ isValid: false, errorMessage: 'output validation error' });
      const invalidInput: GenerateRoundPairingsInput = {
        players: ['p1'],
        numRounds: 1,
        startRound: 1,
        playedMatches: new Map(),
      };
      const result = generateRoundPairings(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorType).toBe('InvalidOutput');
        expect(result.errorMessage).toBe('output validation error');
      }
    });

    it('should generate correct pairings for 4 players, 1 round, and no played matches', () => {
      const input: GenerateRoundPairingsInput = {
        players: ['p1', 'p2', 'p3', 'p4'],
        numRounds: 1,
        startRound: 1,
        playedMatches: new Map(),
      };
      const pairingResult = generateRoundPairings(input);

      expect(pairingResult.success).toBe(true);
      if (pairingResult.success) {
        expect(pairingResult.roundPairings).toEqual({
          'Round 1': [
            ['p1', 'p2'],
            ['p3', 'p4'],
          ],
        });
      }
    });

    it('should generate correct pairings for 4 players and 2 rounds', () => {
      const input: GenerateRoundPairingsInput = {
        players: ['p1', 'p2', 'p3', 'p4'],
        numRounds: 2,
        startRound: 1,
        playedMatches: new Map(),
      };
      const pairingResult = generateRoundPairings(input);

      expect(pairingResult.success).toBe(true);
      if (pairingResult.success) {
        expect(pairingResult.roundPairings).toEqual({
          'Round 1': [
            ['p1', 'p2'],
            ['p3', 'p4'],
          ],
          'Round 2': [
            ['p1', 'p3'],
            ['p2', 'p4'],
          ],
        });
      }
    });

    it('should generate correct pairings for 4 players and 3 rounds', () => {
      const input: GenerateRoundPairingsInput = {
        players: ['p1', 'p2', 'p3', 'p4'],
        numRounds: 3,
        startRound: 1,
        playedMatches: new Map(),
      };
      const pairingResult = generateRoundPairings(input);

      expect(pairingResult.success).toBe(true);
      if (pairingResult.success) {
        expect(pairingResult.roundPairings).toEqual({
          'Round 1': [
            ['p1', 'p2'],
            ['p3', 'p4'],
          ],
          'Round 2': [
            ['p1', 'p3'],
            ['p2', 'p4'],
          ],
          'Round 3': [
            ['p1', 'p4'],
            ['p2', 'p3'],
          ],
        });
      }
    });

    it('should return an error for 4 players and 4 rounds', () => {
      // input validation would normally catch this but its also an example of an impossible solution
      // without players needing to play multiple times
      const input: GenerateRoundPairingsInput = {
        players: ['p1', 'p2', 'p3', 'p4'],
        numRounds: 4,
        startRound: 1,
        playedMatches: new Map(),
      };
      const result = generateRoundPairings(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorType).toBe('NoValidSolution');
        expect(result.errorMessage).toBe('unable to generate valid pairings for Round 4.');
      }
    });

    it('should generate correct pairings for 1 round with existing played matches (p1 vs p2, p3 vs p4)', () => {
      const input: GenerateRoundPairingsInput = {
        players: ['p1', 'p2', 'p3', 'p4'],
        numRounds: 1,
        startRound: 1,
        playedMatches: new Map([
          ['p1', new Set(['p2'])],
          ['p2', new Set(['p1'])],
          ['p3', new Set(['p4'])],
          ['p4', new Set(['p3'])],
        ]),
      };
      const pairingResult = generateRoundPairings(input);

      expect(pairingResult.success).toBe(true);
      if (pairingResult.success) {
        expect(pairingResult.roundPairings).toEqual({
          'Round 1': [
            ['p1', 'p3'],
            ['p2', 'p4'],
          ],
        });
      }
    });

    it('should generate correct pairings for 1 round with existing played matches (p1 vs p3, p2 vs p4)', () => {
      const input: GenerateRoundPairingsInput = {
        players: ['p1', 'p2', 'p3', 'p4'],
        numRounds: 1,
        startRound: 1,
        playedMatches: new Map([
          ['p1', new Set(['p3'])],
          ['p2', new Set(['p4'])],
          ['p3', new Set(['p1'])],
          ['p4', new Set(['p2'])],
        ]),
      };
      const pairingResult = generateRoundPairings(input);

      expect(pairingResult.success).toBe(true);
      if (pairingResult.success) {
        expect(pairingResult.roundPairings).toEqual({
          'Round 1': [
            ['p1', 'p2'],
            ['p3', 'p4'],
          ],
        });
      }
    });

    it('should generate correct pairings for 1 round with existing played matches (p1 vs p2, p1 vs p3)', () => {
      const input: GenerateRoundPairingsInput = {
        players: ['p1', 'p2', 'p3', 'p4'],
        numRounds: 1,
        startRound: 1,
        playedMatches: new Map([
          ['p1', new Set(['p2', 'p3'])],
          ['p2', new Set(['p1'])],
          ['p3', new Set(['p1'])],
        ]),
      };
      const pairingResult = generateRoundPairings(input);

      expect(pairingResult.success).toBe(true);
      if (pairingResult.success) {
        expect(pairingResult.roundPairings).toEqual({
          'Round 1': [
            ['p1', 'p4'],
            ['p2', 'p3'],
          ],
        });
      }
    });

    it('should return an error when one player has played all others', () => {
      const input: GenerateRoundPairingsInput = {
        players: ['p1', 'p2', 'p3', 'p4'],
        numRounds: 1,
        startRound: 1,
        playedMatches: new Map([
          ['p1', new Set(['p2', 'p3', 'p4'])],
          ['p2', new Set(['p1'])],
          ['p3', new Set(['p1'])],
          ['p4', new Set(['p1'])],
        ]),
      };
      const result = generateRoundPairings(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorType).toBe('NoValidSolution');
        expect(result.errorMessage).toBe('unable to generate valid pairings for Round 1.');
      }
    });

    it('should add a BYE round if provided with an uneven number of players', () => {
      const input: GenerateRoundPairingsInput = {
        players: ['p1', 'p2', 'p3'],
        numRounds: 1,
        startRound: 1,
        playedMatches: new Map(),
      };
      const pairingResult = generateRoundPairings(input);

      expect(pairingResult.success).toBe(true);
      if (pairingResult.success) {
        expect(pairingResult.roundPairings).toEqual({
          'Round 1': [
            ['p1', 'p2'],
            ['p3', 'BYE'],
          ],
        });
      }
    });

    it('should start labelling rounds from the startRound', () => {
      const input: GenerateRoundPairingsInput = {
        players: ['p1', 'p2', 'p3', 'p4'],
        numRounds: 2,
        startRound: 3,
        playedMatches: new Map(),
      };
      const pairingResult = generateRoundPairings(input);

      expect(pairingResult.success).toBe(true);
      if (pairingResult.success) {
        expect(pairingResult.roundPairings).toEqual({
          'Round 3': [
            ['p1', 'p2'],
            ['p3', 'p4'],
          ],
          'Round 4': [
            ['p1', 'p3'],
            ['p2', 'p4'],
          ],
        });
      }
    });
  });
});
