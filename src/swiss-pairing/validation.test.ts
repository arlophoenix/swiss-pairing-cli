import {
  GenerateRoundMatchesInput,
  ReadonlyPlayedOpponents,
  RoundMatches,
  ValidationResult,
} from '../types.js';
import { describe, expect, it } from '@jest/globals';
import { validateRoundMatchesInput, validateRoundMatchesOutput } from './validation.js';

describe('Validation', () => {
  describe('validateRoundMatchesInput', () => {
    it('should return valid for valid input', () => {
      const validInput: GenerateRoundMatchesInput = {
        players: ['Player1', 'Player2', 'Player3', 'Player4'],
        numRounds: 3,
        startRound: 1,
        playedOpponents: new Map([
          ['Player1', new Set(['Player2'])],
          ['Player2', new Set(['Player1'])],
        ]),
      };
      const result: ValidationResult = validateRoundMatchesInput(validInput);

      expect(result.isValid).toBe(true);
    });

    it('should return invalid if there are less than two players', () => {
      const invalidInput: GenerateRoundMatchesInput = {
        players: ['Player1'],
        numRounds: 1,
        startRound: 1,
        playedOpponents: new Map(),
      };
      const result: ValidationResult = validateRoundMatchesInput(invalidInput);

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errorMessage).toBe('there must be at least two players.');
      }
    });

    it('should return invalid if there is an odd number of players', () => {
      const invalidInput: GenerateRoundMatchesInput = {
        players: ['Player1', 'Player2', 'Player3'],
        numRounds: 1,
        startRound: 1,
        playedOpponents: new Map(),
      };
      const result: ValidationResult = validateRoundMatchesInput(invalidInput);

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errorMessage).toBe('there must be an even number of players.');
      }
    });

    it('should return invalid if there are duplicate players', () => {
      const invalidInput: GenerateRoundMatchesInput = {
        players: ['Player1', 'Player2', 'Player1', 'Player3'],
        numRounds: 2,
        startRound: 1,
        playedOpponents: new Map(),
      };
      const result: ValidationResult = validateRoundMatchesInput(invalidInput);

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errorMessage).toBe('duplicate players are not allowed.');
      }
    });

    it('should return invalid if rounds is less than 1', () => {
      const invalidInput: GenerateRoundMatchesInput = {
        players: ['Player1', 'Player2', 'Player3', 'Player4'],
        numRounds: 0,
        startRound: 1,
        playedOpponents: new Map(),
      };
      const result: ValidationResult = validateRoundMatchesInput(invalidInput);

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errorMessage).toBe('num-rounds to generate must be at least 1.');
      }
    });

    it('should return invalid if rounds is greater than players minus 1', () => {
      const invalidInput: GenerateRoundMatchesInput = {
        players: ['Player1', 'Player2', 'Player3', 'Player4'],
        numRounds: 4,
        startRound: 1,
        playedOpponents: new Map(),
      };
      const result: ValidationResult = validateRoundMatchesInput(invalidInput);

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errorMessage).toBe('num-rounds to generate must be fewer than the number of players.');
      }
    });

    it('should return invalid if playedMatches contains invalid player names', () => {
      const invalidInput: GenerateRoundMatchesInput = {
        players: ['Player1', 'Player2', 'Player3', 'Player4'],
        numRounds: 2,
        startRound: 1,
        playedOpponents: new Map([
          ['Player1', new Set(['Player2'])],
          ['Player2', new Set(['Player1'])],
          ['InvalidPlayer', new Set(['Player3'])],
        ]),
      };
      const result: ValidationResult = validateRoundMatchesInput(invalidInput);

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errorMessage).toBe('matches contains invalid player names.');
      }
    });

    it('should return invalid if playedMatches is not symmetrical', () => {
      const invalidInput: GenerateRoundMatchesInput = {
        players: ['Player1', 'Player2', 'Player3', 'Player4'],
        numRounds: 2,
        startRound: 1,
        playedOpponents: new Map([
          ['Player1', new Set(['Player2'])],
          ['Player2', new Set(['Player3'])], // Should be ['Player1']
        ]),
      };
      const result: ValidationResult = validateRoundMatchesInput(invalidInput);

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errorMessage).toBe('matches are not symmetrical.');
      }
    });
  });

  describe('validateResult', () => {
    let players: readonly string[];
    let numRounds: number;
    let playedOpponents: ReadonlyPlayedOpponents;

    beforeEach(() => {
      players = ['p1', 'p2', 'p3', 'p4'];
      numRounds = 2;
      playedOpponents = new Map();
    });

    it('should return valid for correct matches', () => {
      const roundMatches: RoundMatches = {
        'Round 1': [
          ['p1', 'p2'],
          ['p3', 'p4'],
        ],
        'Round 2': [
          ['p1', 'p3'],
          ['p2', 'p4'],
        ],
      };
      const result = validateRoundMatchesOutput({
        roundMatches,
        players,
        numRounds,
        playedOpponents,
      });

      expect(result.isValid).toBe(true);
    });

    it('should return invalid if number of rounds is incorrect', () => {
      const roundMatches: RoundMatches = {
        'Round 1': [
          ['p1', 'p2'],
          ['p3', 'p4'],
        ],
      };
      const result = validateRoundMatchesOutput({
        roundMatches,
        players,
        numRounds,
        playedOpponents,
      });

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errorMessage).toBe('invalid number of rounds in the result. Expected 2, got 1.');
      }
    });

    it('should return invalid if number of matches in a round is incorrect', () => {
      const roundMatches: RoundMatches = {
        'Round 1': [
          ['p1', 'p2'],
          ['p3', 'p4'],
        ],
        'Round 2': [['p1', 'p3']],
      };
      const result = validateRoundMatchesOutput({
        roundMatches,
        players,
        numRounds,
        playedOpponents,
      });

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errorMessage).toBe('invalid number of matches in Round 2. Expected 2, got 1.');
      }
    });

    it('should return invalid if a match includes players who have already played', () => {
      const roundMatches: RoundMatches = {
        'Round 1': [
          ['p1', 'p2'],
          ['p3', 'p4'],
        ],
      };
      const numRounds = 1;
      playedOpponents = new Map([
        ['p1', new Set(['p2'])],
        ['p2', new Set(['p1'])],
      ]);
      const result = validateRoundMatchesOutput({
        roundMatches,
        players,
        numRounds,
        playedOpponents,
      });

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errorMessage).toBe('invalid match in Round 1: p1 and p2 have already played.');
      }
    });

    it('should return invalid if a match includes players who have played in a previous round', () => {
      const roundMatches: RoundMatches = {
        'Round 1': [
          ['p1', 'p2'],
          ['p3', 'p4'],
        ],
        'Round 2': [
          ['p1', 'p2'],
          ['p3', 'p4'],
        ],
      };
      const result = validateRoundMatchesOutput({
        roundMatches,
        players,
        numRounds,
        playedOpponents,
      });

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errorMessage).toBe('invalid match in Round 2: p1 and p2 have already played.');
      }
    });

    it('should return invalid if a player appears more than once in a round', () => {
      const roundMatches: RoundMatches = {
        'Round 1': [
          ['p1', 'p2'],
          ['p3', 'p4'],
        ],
        'Round 2': [
          ['p1', 'p3'],
          ['p1', 'p4'],
        ],
      };
      const result = validateRoundMatchesOutput({
        roundMatches,
        players,
        numRounds,
        playedOpponents,
      });

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errorMessage).toBe('invalid match in Round 2: p1 or p4 appears more than once.');
      }
    });
  });
});
