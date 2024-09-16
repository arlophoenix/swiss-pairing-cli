import { SwissPairingInput, ValidationResult } from './types.js';
import { describe, expect, it } from '@jest/globals';
import { generatePairings, validateInput, validateResult } from './swissPairing.js';

describe('Swiss Pairing', () => {
  describe('validateInput', () => {
    it('should return valid for valid input', () => {
      const validInput: SwissPairingInput = {
        players: ['Player1', 'Player2', 'Player3', 'Player4'],
        numRounds: 3,
        startRound: 1,
        playedMatches: {
          Player1: ['Player2'],
          Player2: ['Player1'],
        },
      };
      const result: ValidationResult = validateInput(validInput);
      expect(result.isValid).toBe(true);
    });

    it('should return invalid if there are less than two players', () => {
      const invalidInput: SwissPairingInput = {
        players: ['Player1'],
        numRounds: 1,
        startRound: 1,
        playedMatches: {},
      };
      const result: ValidationResult = validateInput(invalidInput);
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errorMessage).toBe('There must be at least two players.');
      }
    });

    it('should return invalid if there are duplicate players', () => {
      const invalidInput: SwissPairingInput = {
        players: ['Player1', 'Player2', 'Player1', 'Player3'],
        numRounds: 2,
        startRound: 1,
        playedMatches: {},
      };
      const result: ValidationResult = validateInput(invalidInput);
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errorMessage).toBe('Duplicate players are not allowed.');
      }
    });

    it('should return invalid if rounds is less than 1', () => {
      const invalidInput: SwissPairingInput = {
        players: ['Player1', 'Player2', 'Player3', 'Player4'],
        numRounds: 0,
        startRound: 1,
        playedMatches: {},
      };
      const result: ValidationResult = validateInput(invalidInput);
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errorMessage).toBe('Number of rounds to generate must be at least 1.');
      }
    });

    it('should return invalid if rounds is greater than players minus 1', () => {
      const invalidInput: SwissPairingInput = {
        players: ['Player1', 'Player2', 'Player3', 'Player4'],
        numRounds: 4,
        startRound: 1,
        playedMatches: {},
      };
      const result: ValidationResult = validateInput(invalidInput);
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errorMessage).toBe(
          'Number of rounds to generate cannot be greater than the number of players minus 1.'
        );
      }
    });

    it('should return invalid if playedMatches contains invalid player names', () => {
      const invalidInput: SwissPairingInput = {
        players: ['Player1', 'Player2', 'Player3', 'Player4'],
        numRounds: 2,
        startRound: 1,
        playedMatches: {
          Player1: ['Player2'],
          Player2: ['Player1'],
          InvalidPlayer: ['Player3'],
        },
      };
      const result: ValidationResult = validateInput(invalidInput);
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errorMessage).toBe('Played matches contain invalid player names.');
      }
    });

    it('should return invalid if playedMatches is not symmetrical', () => {
      const invalidInput: SwissPairingInput = {
        players: ['Player1', 'Player2', 'Player3', 'Player4'],
        numRounds: 2,
        startRound: 1,
        playedMatches: {
          Player1: ['Player2'],
          Player2: ['Player3'], // Should be ['Player1']
        },
      };
      const result: ValidationResult = validateInput(invalidInput);
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errorMessage).toBe('Played matches are not symmetrical.');
      }
    });
  });

  describe('generatePairings', () => {
    it('should return an error if validation fails', () => {
      const invalidInput: SwissPairingInput = {
        players: ['p1'],
        numRounds: 1,
        startRound: 1,
        playedMatches: {},
      };
      const result = generatePairings(invalidInput);
      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe('There must be at least two players.');
    });

    it('should generate correct pairings for 4 players, 1 round, and no played matches', () => {
      const input: SwissPairingInput = {
        players: ['p1', 'p2', 'p3', 'p4'],
        numRounds: 1,
        startRound: 1,
        playedMatches: {},
      };
      const pairings = generatePairings(input);
      expect(pairings).toEqual({
        'Round 1': [
          ['p1', 'p2'],
          ['p3', 'p4'],
        ],
      });
    });

    it('should generate correct pairings for 4 players and 2 rounds', () => {
      const input: SwissPairingInput = {
        players: ['p1', 'p2', 'p3', 'p4'],
        numRounds: 2,
        startRound: 1,
        playedMatches: {},
      };
      const pairings = generatePairings(input);
      expect(pairings).toEqual({
        'Round 1': [
          ['p1', 'p2'],
          ['p3', 'p4'],
        ],
        'Round 2': [
          ['p1', 'p3'],
          ['p2', 'p4'],
        ],
      });
    });

    it('should generate correct pairings for 4 players and 3 rounds', () => {
      const input: SwissPairingInput = {
        players: ['p1', 'p2', 'p3', 'p4'],
        numRounds: 3,
        startRound: 1,
        playedMatches: {},
      };
      const pairings = generatePairings(input);
      expect(pairings).toEqual({
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
    });

    it('should return an error for 4 players and 4 rounds', () => {
      const input: SwissPairingInput = {
        players: ['p1', 'p2', 'p3', 'p4'],
        numRounds: 4,
        startRound: 1,
        playedMatches: {},
      };
      const result = generatePairings(input);
      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe(
        'Number of rounds to generate cannot be greater than the number of players minus 1.'
      );
    });

    it('should generate correct pairings for 1 round with existing played matches (p1 vs p2, p3 vs p4)', () => {
      const input: SwissPairingInput = {
        players: ['p1', 'p2', 'p3', 'p4'],
        numRounds: 1,
        startRound: 1,
        playedMatches: {
          p1: ['p2'],
          p2: ['p1'],
          p3: ['p4'],
          p4: ['p3'],
        },
      };
      const pairings = generatePairings(input);
      expect(pairings).toEqual({
        'Round 1': [
          ['p1', 'p3'],
          ['p2', 'p4'],
        ],
      });
    });

    it('should generate correct pairings for 1 round with existing played matches (p1 vs p3, p2 vs p4)', () => {
      const input: SwissPairingInput = {
        players: ['p1', 'p2', 'p3', 'p4'],
        numRounds: 1,
        startRound: 1,
        playedMatches: {
          p1: ['p3'],
          p2: ['p4'],
          p3: ['p1'],
          p4: ['p2'],
        },
      };
      const pairings = generatePairings(input);
      expect(pairings).toEqual({
        'Round 1': [
          ['p1', 'p2'],
          ['p3', 'p4'],
        ],
      });
    });

    it('should generate correct pairings for 1 round with existing played matches (p1 vs p2, p1 vs p3)', () => {
      const input: SwissPairingInput = {
        players: ['p1', 'p2', 'p3', 'p4'],
        numRounds: 1,
        startRound: 1,
        playedMatches: {
          p1: ['p2', 'p3'],
          p2: ['p1'],
          p3: ['p1'],
        },
      };
      const pairings = generatePairings(input);
      expect(pairings).toEqual({
        'Round 1': [
          ['p1', 'p4'],
          ['p2', 'p3'],
        ],
      });
    });

    it('should return an error when one player has played all others', () => {
      const input: SwissPairingInput = {
        players: ['p1', 'p2', 'p3', 'p4'],
        numRounds: 1,
        startRound: 1,
        playedMatches: {
          p1: ['p2', 'p3', 'p4'],
          p2: ['p1'],
          p3: ['p1'],
          p4: ['p1'],
        },
      };
      const result = generatePairings(input);
      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe('Unable to generate valid pairings for Round 1');
    });
  });

  it('should add a BYE round if provided with an uneven number of players', () => {
    const input: SwissPairingInput = {
      players: ['p1', 'p2', 'p3'],
      numRounds: 1,
      startRound: 1,
      playedMatches: {},
    };
    const pairings = generatePairings(input);
    expect(pairings).toEqual({
      'Round 1': [
        ['p1', 'p2'],
        ['p3', 'BYE'],
      ],
    });
  });

  it('should start labelling rounds from the startRound', () => {
    const input: SwissPairingInput = {
      players: ['p1', 'p2', 'p3', 'p4'],
      numRounds: 2,
      startRound: 3,
      playedMatches: {},
    };
    const pairings = generatePairings(input);
    expect(pairings).toEqual({
      'Round 3': [
        ['p1', 'p2'],
        ['p3', 'p4'],
      ],
      'Round 4': [
        ['p1', 'p3'],
        ['p2', 'p4'],
      ],
    });
  });
});

describe('validateResult', () => {
  let players: string[];
  let numRounds: number;
  let playedMatches: Record<string, string[]>;

  beforeEach(() => {
    players = ['p1', 'p2', 'p3', 'p4'];
    numRounds = 2;
    playedMatches = {};
  });

  it('should return valid for correct pairings', () => {
    const pairings = {
      'Round 1': [
        ['p1', 'p2'],
        ['p3', 'p4'],
      ],
      'Round 2': [
        ['p1', 'p3'],
        ['p2', 'p4'],
      ],
    };
    const result = validateResult({ pairings, players, numRounds, playedMatches });
    expect(result.isValid).toBe(true);
  });

  it('should return invalid if number of rounds is incorrect', () => {
    const pairings = {
      'Round 1': [
        ['p1', 'p2'],
        ['p3', 'p4'],
      ],
    };
    const result = validateResult({ pairings, players, numRounds, playedMatches });
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.errorMessage).toBe('Invalid number of rounds in the result. Expected 2, got 1.');
    }
  });

  it('should return invalid if number of pairings in a round is incorrect', () => {
    const pairings = {
      'Round 1': [
        ['p1', 'p2'],
        ['p3', 'p4'],
      ],
      'Round 2': [['p1', 'p3']],
    };
    const result = validateResult({ pairings, players, numRounds, playedMatches });
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.errorMessage).toBe('Invalid number of pairings in Round 2. Expected 2, got 1.');
    }
  });

  it('should return invalid if a pairing includes players who have already played', () => {
    const pairings = {
      'Round 1': [
        ['p1', 'p2'],
        ['p3', 'p4'],
      ],
    };
    const numRounds = 1;
    const playedMatches = {
      p1: ['p2'],
      p2: ['p1'],
    };
    const result = validateResult({ pairings, players, numRounds, playedMatches });
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.errorMessage).toBe('Invalid pairing in Round 1: p1 and p2 have already played.');
    }
  });

  it('should return invalid if a pairing includes players who have played in a previous round', () => {
    const pairings = {
      'Round 1': [
        ['p1', 'p2'],
        ['p3', 'p4'],
      ],
      'Round 2': [
        ['p1', 'p2'],
        ['p3', 'p4'],
      ],
    };
    const result = validateResult({ pairings, players, numRounds, playedMatches });
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.errorMessage).toBe('Invalid pairing in Round 2: p1 and p2 have already played.');
    }
  });

  it('should return invalid if a player appears more than once in a round', () => {
    const pairings = {
      'Round 1': [
        ['p1', 'p2'],
        ['p3', 'p4'],
      ],
      'Round 2': [
        ['p1', 'p3'],
        ['p1', 'p4'],
      ],
    };
    const result = validateResult({ pairings, players, numRounds, playedMatches });
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.errorMessage).toBe('Invalid pairing in Round 2: p1 or p4 appears more than once.');
    }
  });
});
