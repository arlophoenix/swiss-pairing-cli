import { ReadonlyPlayedTeams, Round } from '../types/types.js';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { validateGenerateRoundsInput, validateGenerateRoundsOutput } from './swissValidator.js';

describe('swissValidator', () => {
  describe('validateGenerateRoundsInput', () => {
    it('should return valid for valid input', () => {
      const validInput = {
        teams: ['Team1', 'Team2', 'Team3', 'Team4'],
        numRounds: 3,
        startRound: 1,
        playedTeams: new Map([
          ['Team1', new Set(['Team2'])],
          ['Team2', new Set(['Team1'])],
        ]),
        squadMap: new Map(),
      };
      const result = validateGenerateRoundsInput(validInput);

      expect(result.success).toBe(true);
    });

    it('should return invalid if there are less than two teams', () => {
      const invalidInput = {
        teams: ['Team1'],
        numRounds: 1,
        startRound: 1,
        playedTeams: new Map(),
        squadMap: new Map(),
      };
      const result = validateGenerateRoundsInput(invalidInput);

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
        playedTeams: new Map(),
        squadMap: new Map(),
      };
      const result = validateGenerateRoundsInput(invalidInput);

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
        playedTeams: new Map(),
        squadMap: new Map(),
      };
      const result = validateGenerateRoundsInput(invalidInput);

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
        playedTeams: new Map(),
        squadMap: new Map(),
      };
      const result = validateGenerateRoundsInput(invalidInput);

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
        playedTeams: new Map(),
        squadMap: new Map(),
      };
      const result = validateGenerateRoundsInput(invalidInput);

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
        playedTeams: new Map([
          ['Team1', new Set(['Team2'])],
          ['Team2', new Set(['Team1'])],
          ['InvalidTeam', new Set(['Team3'])],
        ]),
        squadMap: new Map(),
      };
      const result = validateGenerateRoundsInput(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toBe('Unknown team in matches: "InvalidTeam"');
      }
    });

    it('should accept matches with known teams', () => {
      const validInput = {
        teams: ['Team1', 'Team2'],
        numRounds: 1,
        playedTeams: new Map([
          ['Team1', new Set(['Team2'])],
          ['Team2', new Set(['Team1'])],
        ]),
        squadMap: new Map(),
      };
      const result = validateGenerateRoundsInput(validInput);

      expect(result.success).toBe(true);
    });

    it('should return invalid if match history contains self-play', () => {
      const result = validateGenerateRoundsInput({
        teams: ['Team1', 'Team2', 'Team3', 'Team4'],
        numRounds: 2,
        playedTeams: new Map([
          ['Team1', new Set(['Team1'])], // Self-play
          ['Team2', new Set(['Team3'])],
          ['Team3', new Set(['Team2'])],
        ]),
        squadMap: new Map(),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toBe('Team "Team1" cannot play against itself');
      }
    });

    it('should return invalid if playedTeams is not symmetrical', () => {
      const invalidInput = {
        teams: ['Team1', 'Team2', 'Team3', 'Team4'],
        numRounds: 2,
        startRound: 1,
        playedTeams: new Map([
          ['Team1', new Set(['Team2'])],
          ['Team2', new Set(['Team3'])], // Should be ['Team1']
        ]),
        squadMap: new Map(),
      };
      const result = validateGenerateRoundsInput(invalidInput);

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
        playedTeams: new Map() as ReadonlyPlayedTeams,
        squadMap: new Map([
          ['Team1', 'SquadA'],
          ['InvalidTeam', 'SquadB'],
        ]),
      };
      const result = validateGenerateRoundsInput(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toBe('Unknown team in squad assignments: "InvalidTeam"');
      }
    });
  });

  describe('validateGenerateRoundsOutput', () => {
    let teams: readonly string[];
    let exampleOutput: {
      readonly rounds: readonly Round[];
      readonly teams: readonly string[];
      readonly numRounds: number;
      readonly startRound: number;
      readonly playedTeams: ReadonlyPlayedTeams;
      readonly squadMap: ReadonlyMap<string, string>;
    };

    beforeEach(() => {
      teams = ['p1', 'p2', 'p3', 'p4'];
      exampleOutput = {
        rounds: [
          {
            label: 'Round 1',
            number: 1,
            matches: [['p1', 'p2'] as const, ['p3', 'p4'] as const],
          },
          {
            label: 'Round 2',
            number: 2,
            matches: [['p1', 'p3'] as const, ['p2', 'p4'] as const],
          },
        ],
        teams,
        numRounds: 2,
        startRound: 1,
        playedTeams: new Map<string, ReadonlySet<string>>(),
        squadMap: new Map<string, string>(),
      };
    });

    it('should return valid for correct matches', () => {
      const result = validateGenerateRoundsOutput(exampleOutput);
      expect(result.success).toBe(true);
    });

    it('should return invalid if number of rounds is incorrect', () => {
      const output = {
        ...exampleOutput,
        rounds: [exampleOutput.rounds[0]], // Only one round
      };

      const result = validateGenerateRoundsOutput(output);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toBe('Generated 1 rounds but expected 2');
      }
    });

    it('should return invalid if number of matches in a round is incorrect', () => {
      const output = {
        ...exampleOutput,
        rounds: [
          {
            label: 'Round 1',
            number: 1,
            matches: [['p1', 'p2'] as const, ['p3', 'p4'] as const],
          },
          {
            label: 'Round 2',
            number: 2,
            matches: [['p1', 'p3'] as const], // Missing a match
          },
        ],
      };

      const result = validateGenerateRoundsOutput(output);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toBe('Round 2 has 1 matches but expected 2');
      }
    });

    it('should return invalid if a match includes teams who have already played', () => {
      const playedTeams = new Map([
        ['p1', new Set(['p2'])],
        ['p2', new Set(['p1'])],
      ]);

      const output = {
        ...exampleOutput,
        playedTeams,
      };

      const result = validateGenerateRoundsOutput(output);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toBe('Duplicate match found: "p1" vs "p2"');
      }
    });

    it('should return invalid if teams from the same squad are paired', () => {
      const squadMap = new Map([
        ['p1', 'A'],
        ['p2', 'A'],
        ['p3', 'B'],
        ['p4', 'B'],
      ]);

      const output = {
        ...exampleOutput,
        squadMap,
      };

      const result = validateGenerateRoundsOutput(output);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toBe(
          'Teams "p1" and "p2" cannot play each other - they are in the same squad'
        );
      }
    });

    it('should return invalid if a team appears more than once in a round', () => {
      const output = {
        ...exampleOutput,
        rounds: [
          {
            label: 'Round 1',
            number: 1,
            matches: [['p1', 'p2'] as const, ['p1', 'p3'] as const], // p1 appears twice
          },
        ],
        numRounds: 1,
      };

      const result = validateGenerateRoundsOutput(output);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toBe('Teams "p1" or "p3" are scheduled multiple times in Round 1');
      }
    });

    it('should return invalid if a team plays against itself', () => {
      const output = {
        ...exampleOutput,
        rounds: [
          {
            label: 'Round 1',
            number: 1,
            matches: [['p1', 'p1'] as const, ['p3', 'p4'] as const],
          },
        ],
        numRounds: 1,
      };

      const result = validateGenerateRoundsOutput(output);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toBe('Team "p1" cannot play against itself');
      }
    });

    it('should return invalid if round numbers are not sequential starting from startRound', () => {
      const output = {
        ...exampleOutput,
        startRound: 2,
        rounds: [
          {
            label: 'Round 2',
            number: 2,
            matches: [['p1', 'p2'] as const, ['p3', 'p4'] as const],
          },
          {
            label: 'Round 4', // Should be Round 3
            number: 4,
            matches: [['p1', 'p3'] as const, ['p2', 'p4'] as const],
          },
        ],
      };

      const result = validateGenerateRoundsOutput(output);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toBe('Round 4 has incorrect number 4 (should be 3)');
      }
    });
  });
});
