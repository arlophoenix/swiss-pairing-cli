import { ReadonlyPlayedOpponents, RoundMatches } from '../types/types.js';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { validateRoundMatchesInput, validateRoundMatchesOutput } from './swissValidator.js';

describe('swissValidator', () => {
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
        expect(result.message).toBe('Must have at least 2 teams');
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
        expect(result.message).toBe('Must have an even number of teams');
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
        expect(result.message).toBe('All team names must be unique');
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
        expect(result.message).toBe('Must generate at least one round');
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
        expect(result.message).toBe('Number of rounds (4) must be less than number of teams (4)');
      }
    });

    it('should reject matches with unknown teams', () => {
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
        expect(result.message).toBe('Unknown team in match history: "InvalidTeam"');
      }
    });

    it('should accept matches with known teams', () => {
      const validInput = {
        teams: ['Team1', 'Team2'],
        numRounds: 1,
        playedOpponents: new Map([
          ['Team1', new Set(['Team2'])],
          ['Team2', new Set(['Team1'])],
        ]),
        squadMap: new Map(),
      };
      const result = validateRoundMatchesInput(validInput);

      expect(result.success).toBe(true);
    });

    it('should return invalid if match history contains self-play', () => {
      const result = validateRoundMatchesInput({
        teams: ['Team1', 'Team2', 'Team3', 'Team4'],
        numRounds: 2,
        playedOpponents: new Map([
          ['Team1', new Set(['Team1'])], // Self-play
          ['Team2', new Set(['Team3'])],
          ['Team3', new Set(['Team2'])],
        ]),
        squadMap: new Map(),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toBe('Team1 cannot play against itself');
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
        expect(result.message).toBe(
          'Match history must be symmetrical - found Team1 vs Team2 but not Team2 vs Team1'
        );
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
        expect(result.message).toBe('Unknown team in squad assignments: "InvalidTeam"');
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
        expect(result.message).toBe('Generated 1 rounds but expected 2');
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
        expect(result.message).toBe('Round 2 has 1 matches but expected 2');
      }
    });

    it('should return invalid if a match includes teams who have already played', () => {
      const roundMatches: RoundMatches = {
        'Round 1': [
          ['p1', 'p2'],
          ['p3', 'p4'],
        ],
      };
      const existingMatches = new Map([
        ['p1', new Set(['p2'])],
        ['p2', new Set(['p1'])],
      ]);
      const result = validateRoundMatchesOutput({
        roundMatches,
        teams,
        numRounds: 1,
        playedOpponents: existingMatches,
        squadMap,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toBe('Duplicate match found in history: p1 vs p2');
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
        expect(result.message).toBe('p1 or p4 is scheduled multiple times in Round 2');
      }
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
        expect(result.message).toBe('p1 and p2 cannot play each other - they are in the same squad');
      }
    });

    it('should return invalid if a team plays against itself', () => {
      const roundMatches: RoundMatches = {
        'Round 1': [
          ['p1', 'p1'], // Self-play
          ['p3', 'p4'],
        ],
      };
      const result = validateRoundMatchesOutput({
        roundMatches,
        teams,
        numRounds: 1,
        playedOpponents,
        squadMap,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toBe('p1 cannot play against itself');
      }
    });
  });
});
