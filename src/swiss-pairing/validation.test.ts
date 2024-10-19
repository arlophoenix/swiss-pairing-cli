import { ReadonlyPlayedOpponents, RoundMatches } from '../types/types.js';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { validateRoundMatchesInput, validateRoundMatchesOutput } from './validation.js';

describe('Validation', () => {
  describe('validateRoundMatchesInput', () => {
    it('should return valid for valid input', () => {
      const validInput = {
        teams: ['Team1', 'Team2', 'Team3', 'Team4'],
        numRounds: 3,
        startRound: 1,
        playedOpponents: new Map([
          ['Team1', new Set(['Team2'])],
          ['Team2', new Set(['Team1'])],
        ]),
        squadMap: new Map(),
      };
      const result = validateRoundMatchesInput(validInput);

      expect(result.success).toBe(true);
    });

    it('should return invalid if there are less than two teams', () => {
      const invalidInput = {
        teams: ['Team1'],
        numRounds: 1,
        startRound: 1,
        playedOpponents: new Map(),
        squadMap: new Map(),
      };
      const result = validateRoundMatchesInput(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('there must be at least two teams.');
      }
    });

    it('should return invalid if there is an odd number of teams', () => {
      const invalidInput = {
        teams: ['Team1', 'Team2', 'Team3'],
        numRounds: 1,
        startRound: 1,
        playedOpponents: new Map(),
        squadMap: new Map(),
      };
      const result = validateRoundMatchesInput(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('there must be an even number of teams.');
      }
    });

    it('should return invalid if there are duplicate teams', () => {
      const invalidInput = {
        teams: ['Team1', 'Team2', 'Team1', 'Team3'],
        numRounds: 2,
        startRound: 1,
        playedOpponents: new Map(),
        squadMap: new Map(),
      };
      const result = validateRoundMatchesInput(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('duplicate teams are not allowed.');
      }
    });

    it('should return invalid if rounds is less than 1', () => {
      const invalidInput = {
        teams: ['Team1', 'Team2', 'Team3', 'Team4'],
        numRounds: 0,
        startRound: 1,
        playedOpponents: new Map(),
        squadMap: new Map(),
      };
      const result = validateRoundMatchesInput(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('num-rounds to generate must be at least 1.');
      }
    });

    it('should return invalid if rounds is greater than teams minus 1', () => {
      const invalidInput = {
        teams: ['Team1', 'Team2', 'Team3', 'Team4'],
        numRounds: 4,
        startRound: 1,
        playedOpponents: new Map(),
        squadMap: new Map(),
      };
      const result = validateRoundMatchesInput(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('num-rounds to generate must be fewer than the number of teams.');
      }
    });

    it('should return invalid if playedMatches contains invalid team names', () => {
      const invalidInput = {
        teams: ['Team1', 'Team2', 'Team3', 'Team4'],
        numRounds: 2,
        startRound: 1,
        playedOpponents: new Map([
          ['Team1', new Set(['Team2'])],
          ['Team2', new Set(['Team1'])],
          ['InvalidTeam', new Set(['Team3'])],
        ]),
        squadMap: new Map(),
      };
      const result = validateRoundMatchesInput(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('matches contains invalid team names.');
      }
    });

    it('should return invalid if playedMatches is not symmetrical', () => {
      const invalidInput = {
        teams: ['Team1', 'Team2', 'Team3', 'Team4'],
        numRounds: 2,
        startRound: 1,
        playedOpponents: new Map([
          ['Team1', new Set(['Team2'])],
          ['Team2', new Set(['Team3'])], // Should be ['Team1']
        ]),
        squadMap: new Map(),
      };
      const result = validateRoundMatchesInput(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('matches are not symmetrical.');
      }
    });

    it('should return invalid if squadMap contains invalid team names', () => {
      const invalidInput = {
        teams: ['Team1', 'Team2', 'Team3', 'Team4'],
        numRounds: 2,
        startRound: 1,
        playedOpponents: new Map() as ReadonlyPlayedOpponents,
        squadMap: new Map([
          ['Team1', 'SquadA'],
          ['InvalidTeam', 'SquadB'],
        ]),
      };
      const result = validateRoundMatchesInput(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('squadMap contains invalid team name: InvalidTeam.');
      }
    });
  });

  describe('validateRoundMatchesOutput', () => {
    let teams: readonly string[];
    let numRounds: number;
    let playedOpponents: ReadonlyPlayedOpponents;
    let squadMap: ReadonlyMap<string, string>;

    beforeEach(() => {
      teams = ['p1', 'p2', 'p3', 'p4'];
      numRounds = 2;
      playedOpponents = new Map();
      squadMap = new Map();
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
        teams,
        numRounds,
        playedOpponents,
        squadMap,
      });

      expect(result.success).toBe(true);
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
        teams,
        numRounds,
        playedOpponents,
        squadMap,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('invalid number of rounds in the result. Expected 2, got 1.');
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
        teams,
        numRounds,
        playedOpponents,
        squadMap,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('invalid number of matches in Round 2. Expected 2, got 1.');
      }
    });

    it('should return invalid if a match includes teams who have already played', () => {
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
        teams,
        numRounds,
        playedOpponents,
        squadMap,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('invalid match in Round 1: p1 and p2 have already played.');
      }
    });

    it('should return invalid if a match includes teams who have played in a previous round', () => {
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
        teams,
        numRounds,
        playedOpponents,
        squadMap,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('invalid match in Round 2: p1 and p2 have already played.');
      }
    });

    it('should return invalid if a team appears more than once in a round', () => {
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
        teams,
        numRounds,
        playedOpponents,
        squadMap,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('invalid match in Round 2: p1 or p4 appears more than once.');
      }
    });

    it('should return valid for correct matches respecting squad constraints', () => {
      const roundMatches: RoundMatches = {
        'Round 1': [
          ['p1', 'p3'],
          ['p2', 'p4'],
        ],
        'Round 2': [
          ['p1', 'p4'],
          ['p2', 'p3'],
        ],
      };
      const result = validateRoundMatchesOutput({
        roundMatches,
        teams,
        numRounds,
        playedOpponents,
        squadMap: new Map([
          ['p1', 'A'],
          ['p2', 'A'],
          ['p3', 'B'],
          ['p4', 'B'],
        ]),
      });

      expect(result.success).toBe(true);
    });

    it('should return invalid if teams from the same squad are paired', () => {
      const roundMatches: RoundMatches = {
        'Round 1': [
          ['p1', 'p2'],
          ['p3', 'p4'],
        ],
      };
      const result = validateRoundMatchesOutput({
        roundMatches,
        teams,
        numRounds: 1,
        playedOpponents,
        squadMap: new Map([
          ['p1', 'A'],
          ['p2', 'A'],
          ['p3', 'B'],
          ['p4', 'B'],
        ]),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('invalid match in Round 1: p1 and p2 are from the same squad.');
      }
    });

    it('should work correctly when squadMap is empty', () => {
      const roundMatches: RoundMatches = {
        'Round 1': [
          ['p1', 'p2'],
          ['p3', 'p4'],
        ],
      };
      const result = validateRoundMatchesOutput({
        roundMatches,
        teams,
        numRounds: 1,
        playedOpponents,
        squadMap: new Map(),
      });

      expect(result.success).toBe(true);
    });
  });
});
