import * as validation from './validation.js';

import { describe, expect, it, jest } from '@jest/globals';

import { GenerateRoundMatchesInput } from '../types.js';
import type { SpyInstance } from 'jest-mock';
import { generateRoundMatches } from './swissPairing.js';

describe('index', () => {
  describe('generateRoundMatches', () => {
    let mockValidateInput: SpyInstance<typeof validation.validateRoundMatchesInput>;
    let mockValidateOutput: SpyInstance<typeof validation.validateRoundMatchesOutput>;

    beforeEach(() => {
      mockValidateInput = jest
        .spyOn(validation, 'validateRoundMatchesInput')
        .mockReturnValue({ isValid: true });
      mockValidateOutput = jest
        .spyOn(validation, 'validateRoundMatchesOutput')
        .mockReturnValue({ isValid: true });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return an error if input validation fails', () => {
      mockValidateInput.mockReturnValue({ isValid: false, errorMessage: 'input validation error' });
      const invalidInput: GenerateRoundMatchesInput = {
        players: ['p1'],
        numRounds: 1,
        startRound: 1,
        playedOpponents: new Map(),
      };
      const result = generateRoundMatches(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorType).toBe('InvalidInput');
        expect(result.errorMessage).toBe('input validation error');
      }
    });

    it('should return an error if output validation fails', () => {
      mockValidateOutput.mockReturnValue({ isValid: false, errorMessage: 'output validation error' });
      const validInput: GenerateRoundMatchesInput = {
        players: ['p1', 'p2'],
        numRounds: 1,
        startRound: 1,
        playedOpponents: new Map(),
      };
      const result = generateRoundMatches(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorType).toBe('InvalidOutput');
        expect(result.errorMessage).toBe('output validation error');
      }
    });

    it('should generate correct matches for 4 players, 1 round, and no played matches', () => {
      const input: GenerateRoundMatchesInput = {
        players: ['p1', 'p2', 'p3', 'p4'],
        numRounds: 1,
        startRound: 1,
        playedOpponents: new Map(),
      };
      const roundMatchesResult = generateRoundMatches(input);

      expect(roundMatchesResult.success).toBe(true);
      if (roundMatchesResult.success) {
        expect(roundMatchesResult.roundMatches).toEqual({
          'Round 1': [
            ['p1', 'p2'],
            ['p3', 'p4'],
          ],
        });
      }
    });

    it('should generate correct matches for 4 players and 2 rounds', () => {
      const input: GenerateRoundMatchesInput = {
        players: ['p1', 'p2', 'p3', 'p4'],
        numRounds: 2,
        startRound: 1,
        playedOpponents: new Map(),
      };
      const roundMatchesResult = generateRoundMatches(input);

      expect(roundMatchesResult.success).toBe(true);
      if (roundMatchesResult.success) {
        expect(roundMatchesResult.roundMatches).toEqual({
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

    it('should generate correct matches for 4 players and 3 rounds', () => {
      const input: GenerateRoundMatchesInput = {
        players: ['p1', 'p2', 'p3', 'p4'],
        numRounds: 3,
        startRound: 1,
        playedOpponents: new Map(),
      };
      const roundMatchesResult = generateRoundMatches(input);

      expect(roundMatchesResult.success).toBe(true);
      if (roundMatchesResult.success) {
        expect(roundMatchesResult.roundMatches).toEqual({
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
      const input: GenerateRoundMatchesInput = {
        players: ['p1', 'p2', 'p3', 'p4'],
        numRounds: 4,
        startRound: 1,
        playedOpponents: new Map(),
      };
      const result = generateRoundMatches(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorType).toBe('NoValidSolution');
        expect(result.errorMessage).toBe('unable to generate valid matches for Round 4.');
      }
    });

    it('should generate correct matches for 1 round with existing played matches (p1 vs p2, p3 vs p4)', () => {
      const input: GenerateRoundMatchesInput = {
        players: ['p1', 'p2', 'p3', 'p4'],
        numRounds: 1,
        startRound: 1,
        playedOpponents: new Map([
          ['p1', new Set(['p2'])],
          ['p2', new Set(['p1'])],
          ['p3', new Set(['p4'])],
          ['p4', new Set(['p3'])],
        ]),
      };
      const roundMatchesResult = generateRoundMatches(input);

      expect(roundMatchesResult.success).toBe(true);
      if (roundMatchesResult.success) {
        expect(roundMatchesResult.roundMatches).toEqual({
          'Round 1': [
            ['p1', 'p3'],
            ['p2', 'p4'],
          ],
        });
      }
    });

    it('should generate correct matches for 1 round with existing played matches (p1 vs p3, p2 vs p4)', () => {
      const input: GenerateRoundMatchesInput = {
        players: ['p1', 'p2', 'p3', 'p4'],
        numRounds: 1,
        startRound: 1,
        playedOpponents: new Map([
          ['p1', new Set(['p3'])],
          ['p2', new Set(['p4'])],
          ['p3', new Set(['p1'])],
          ['p4', new Set(['p2'])],
        ]),
      };
      const roundMatchesResult = generateRoundMatches(input);

      expect(roundMatchesResult.success).toBe(true);
      if (roundMatchesResult.success) {
        expect(roundMatchesResult.roundMatches).toEqual({
          'Round 1': [
            ['p1', 'p2'],
            ['p3', 'p4'],
          ],
        });
      }
    });

    it('should generate correct matches for 1 round with existing played matches (p1 vs p2, p1 vs p3)', () => {
      const input: GenerateRoundMatchesInput = {
        players: ['p1', 'p2', 'p3', 'p4'],
        numRounds: 1,
        startRound: 1,
        playedOpponents: new Map([
          ['p1', new Set(['p2', 'p3'])],
          ['p2', new Set(['p1'])],
          ['p3', new Set(['p1'])],
        ]),
      };
      const roundMatchesResult = generateRoundMatches(input);

      expect(roundMatchesResult.success).toBe(true);
      if (roundMatchesResult.success) {
        expect(roundMatchesResult.roundMatches).toEqual({
          'Round 1': [
            ['p1', 'p4'],
            ['p2', 'p3'],
          ],
        });
      }
    });

    it('should return an error when one player has played all others', () => {
      const input: GenerateRoundMatchesInput = {
        players: ['p1', 'p2', 'p3', 'p4'],
        numRounds: 1,
        startRound: 1,
        playedOpponents: new Map([
          ['p1', new Set(['p2', 'p3', 'p4'])],
          ['p2', new Set(['p1'])],
          ['p3', new Set(['p1'])],
          ['p4', new Set(['p1'])],
        ]),
      };
      const result = generateRoundMatches(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorType).toBe('NoValidSolution');
        expect(result.errorMessage).toBe('unable to generate valid matches for Round 1.');
      }
    });

    it('should start labelling rounds from the startRound', () => {
      const input: GenerateRoundMatchesInput = {
        players: ['p1', 'p2', 'p3', 'p4'],
        numRounds: 2,
        startRound: 3,
        playedOpponents: new Map(),
      };
      const roundMatchesResult = generateRoundMatches(input);

      expect(roundMatchesResult.success).toBe(true);
      if (roundMatchesResult.success) {
        expect(roundMatchesResult.roundMatches).toEqual({
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
