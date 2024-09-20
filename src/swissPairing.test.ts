import { GenerateRoundPairingsInput, RoundPairings, ValidationResult } from './types.js';
import { describe, expect, it } from '@jest/globals';
import { generateRoundPairings, validateInput, validateResult } from './swissPairing.js';

describe('Swiss Pairing', () => {
  describe('validateInput', () => {
    it('should return valid for valid input', () => {
      const validInput: GenerateRoundPairingsInput = {
        players: ['Player1', 'Player2', 'Player3', 'Player4'],
        numRounds: 3,
        startRound: 1,
        playedMatches: new Map([
          ['Player1', new Set(['Player2'])],
          ['Player2', new Set(['Player1'])],
        ]),
      };
      const result: ValidationResult = validateInput(validInput);

      expect(result.isValid).toBe(true);
    });

    it('should return invalid if there are less than two players', () => {
      const invalidInput: GenerateRoundPairingsInput = {
        players: ['Player1'],
        numRounds: 1,
        startRound: 1,
        playedMatches: new Map(),
      };
      const result: ValidationResult = validateInput(invalidInput);

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errorMessage).toBe('there must be at least two players.');
      }
    });

    it('should return invalid if there are duplicate players', () => {
      const invalidInput: GenerateRoundPairingsInput = {
        players: ['Player1', 'Player2', 'Player1', 'Player3'],
        numRounds: 2,
        startRound: 1,
        playedMatches: new Map(),
      };
      const result: ValidationResult = validateInput(invalidInput);

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errorMessage).toBe('duplicate players are not allowed.');
      }
    });

    it('should return invalid if rounds is less than 1', () => {
      const invalidInput: GenerateRoundPairingsInput = {
        players: ['Player1', 'Player2', 'Player3', 'Player4'],
        numRounds: 0,
        startRound: 1,
        playedMatches: new Map(),
      };
      const result: ValidationResult = validateInput(invalidInput);

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errorMessage).toBe('num-rounds to generate must be at least 1.');
      }
    });

    it('should return invalid if rounds is greater than players minus 1', () => {
      const invalidInput: GenerateRoundPairingsInput = {
        players: ['Player1', 'Player2', 'Player3', 'Player4'],
        numRounds: 4,
        startRound: 1,
        playedMatches: new Map(),
      };
      const result: ValidationResult = validateInput(invalidInput);

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errorMessage).toBe(
          'num-rounds to generate cannot be greater than the number of players minus 1.'
        );
      }
    });

    it('should return invalid if playedMatches contains invalid player names', () => {
      const invalidInput: GenerateRoundPairingsInput = {
        players: ['Player1', 'Player2', 'Player3', 'Player4'],
        numRounds: 2,
        startRound: 1,
        playedMatches: new Map([
          ['Player1', new Set(['Player2'])],
          ['Player2', new Set(['Player1'])],
          ['InvalidPlayer', new Set(['Player3'])],
        ]),
      };
      const result: ValidationResult = validateInput(invalidInput);

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errorMessage).toBe('matches contains invalid player names.');
      }
    });

    it('should return invalid if playedMatches is not symmetrical', () => {
      const invalidInput: GenerateRoundPairingsInput = {
        players: ['Player1', 'Player2', 'Player3', 'Player4'],
        numRounds: 2,
        startRound: 1,
        playedMatches: new Map([
          ['Player1', new Set(['Player2'])],
          ['Player2', new Set(['Player3'])], // Should be ['Player1']
        ]),
      };
      const result: ValidationResult = validateInput(invalidInput);

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errorMessage).toBe('matches are not symmetrical.');
      }
    });
  });

  describe('generatePairings', () => {
    it('should return an error if validation fails', () => {
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
        expect(result.errorMessage).toBe('there must be at least two players.');
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
      const input: GenerateRoundPairingsInput = {
        players: ['p1', 'p2', 'p3', 'p4'],
        numRounds: 4,
        startRound: 1,
        playedMatches: new Map(),
      };
      const result = generateRoundPairings(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorType).toBe('InvalidInput');
        expect(result.errorMessage).toBe(
          'num-rounds to generate cannot be greater than the number of players minus 1.'
        );
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
        expect(result.errorMessage).toBe('unable to generate valid pairings for Round 1');
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

  describe('validateResult', () => {
    let players: readonly string[];
    let numRounds: number;
    let playedMatches: ReadonlyMap<string, ReadonlySet<string>>;

    beforeEach(() => {
      players = ['p1', 'p2', 'p3', 'p4'];
      numRounds = 2;
      playedMatches = new Map();
    });

    it('should return valid for correct pairings', () => {
      const roundPairings: RoundPairings = {
        'Round 1': [
          ['p1', 'p2'],
          ['p3', 'p4'],
        ],
        'Round 2': [
          ['p1', 'p3'],
          ['p2', 'p4'],
        ],
      };
      const result = validateResult({ roundPairings, players, numRounds, playedMatches });

      expect(result.isValid).toBe(true);
    });

    it('should return invalid if number of rounds is incorrect', () => {
      const roundPairings: RoundPairings = {
        'Round 1': [
          ['p1', 'p2'],
          ['p3', 'p4'],
        ],
      };
      const result = validateResult({ roundPairings, players, numRounds, playedMatches });

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errorMessage).toBe('invalid number of rounds in the result. Expected 2, got 1.');
      }
    });

    it('should return invalid if number of pairings in a round is incorrect', () => {
      const roundPairings: RoundPairings = {
        'Round 1': [
          ['p1', 'p2'],
          ['p3', 'p4'],
        ],
        'Round 2': [['p1', 'p3']],
      };
      const result = validateResult({ roundPairings, players, numRounds, playedMatches });

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errorMessage).toBe('invalid number of pairings in Round 2. Expected 2, got 1.');
      }
    });

    it('should return invalid if a pairing includes players who have already played', () => {
      const roundPairings: RoundPairings = {
        'Round 1': [
          ['p1', 'p2'],
          ['p3', 'p4'],
        ],
      };
      const numRounds = 1;
      playedMatches = new Map([
        ['p1', new Set(['p2'])],
        ['p2', new Set(['p1'])],
      ]);
      const result = validateResult({ roundPairings, players, numRounds, playedMatches });

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errorMessage).toBe('invalid pairing in Round 1: p1 and p2 have already played.');
      }
    });

    it('should return invalid if a pairing includes players who have played in a previous round', () => {
      const roundPairings: RoundPairings = {
        'Round 1': [
          ['p1', 'p2'],
          ['p3', 'p4'],
        ],
        'Round 2': [
          ['p1', 'p2'],
          ['p3', 'p4'],
        ],
      };
      const result = validateResult({ roundPairings, players, numRounds, playedMatches });

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errorMessage).toBe('invalid pairing in Round 2: p1 and p2 have already played.');
      }
    });

    it('should return invalid if a player appears more than once in a round', () => {
      const roundPairings: RoundPairings = {
        'Round 1': [
          ['p1', 'p2'],
          ['p3', 'p4'],
        ],
        'Round 2': [
          ['p1', 'p3'],
          ['p1', 'p4'],
        ],
      };
      const result = validateResult({ roundPairings, players, numRounds, playedMatches });

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errorMessage).toBe('invalid pairing in Round 2: p1 or p4 appears more than once.');
      }
    });
  });
});
