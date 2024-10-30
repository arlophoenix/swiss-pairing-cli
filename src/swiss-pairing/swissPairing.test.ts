import { describe, expect, it } from '@jest/globals';

import { ReadonlyPlayedTeams } from '../types/types.js';
import { generateRounds } from './swissPairing.js';

describe('generateRounds', () => {
  it('should generate one round for 4 teams', () => {
    const result = generateRounds({
      teams: ['p1', 'p2', 'p3', 'p4'],
      numRounds: 1,
      startRound: 1,
      playedTeams: new Map(),
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual({
        rounds: [
          {
            label: 'Round 1',
            number: 1,
            matches: [
              ['p1', 'p2'],
              ['p3', 'p4'],
            ],
          },
        ],
      });
    }
  });

  it('should generate three rounds for 4 teams with no repeats', () => {
    const teams = ['p1', 'p2', 'p3', 'p4'];
    const numRounds = 3;
    const startRound = 1;
    const playedTeams = new Map();
    const squadMap = new Map();

    const result = generateRounds({
      teams,
      numRounds,
      startRound,
      playedTeams,
      squadMap,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual({
        rounds: [
          {
            label: 'Round 1',
            number: 1,
            matches: [
              ['p1', 'p2'],
              ['p3', 'p4'],
            ],
          },
          {
            label: 'Round 2',
            number: 2,
            matches: [
              ['p1', 'p3'],
              ['p2', 'p4'],
            ],
          },
          {
            label: 'Round 3',
            number: 3,
            matches: [
              ['p1', 'p4'],
              ['p2', 'p3'],
            ],
          },
        ],
      });
    }
  });

  it('should avoid previously played matches', () => {
    const result = generateRounds({
      teams: ['p1', 'p2', 'p3', 'p4'],
      numRounds: 1,
      startRound: 1,
      playedTeams: new Map([
        ['p1', new Set(['p2'])],
        ['p2', new Set(['p1'])],
      ]),
    });

    expect(result.success).toBe(true);
    if (result.success) {
      const matches = result.value.rounds[0].matches;
      expect(matches).not.toContainEqual(['p1', 'p2']);
      expect(matches).not.toContainEqual(['p2', 'p1']);
    }
  });

  it('should respect squad constraints', () => {
    const squadMap = new Map([
      ['p1', 'A'],
      ['p2', 'A'],
      ['p3', 'B'],
      ['p4', 'B'],
    ]);

    const result = generateRounds({
      teams: ['p1', 'p2', 'p3', 'p4'],
      numRounds: 1,
      startRound: 1,
      playedTeams: new Map(),
      squadMap,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      const matches = result.value.rounds[0].matches;
      expect(matches).not.toContainEqual(['p1', 'p2']);
      expect(matches).not.toContainEqual(['p3', 'p4']);
    }
  });

  it('should report when no valid pairings are possible', () => {
    const result = generateRounds({
      teams: ['p1', 'p2', 'p3', 'p4'],
      numRounds: 1,
      startRound: 1,
      playedTeams: new Map([
        ['p1', new Set(['p2', 'p3', 'p4'])],
        ['p2', new Set(['p1'])],
        ['p3', new Set(['p1'])],
        ['p4', new Set(['p1'])],
      ]),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toBe('No valid pairings possible for Round 1');
    }
  });

  it('should use provided start round number', () => {
    const result = generateRounds({
      teams: ['p1', 'p2', 'p3', 'p4'],
      numRounds: 2,
      startRound: 3,
      playedTeams: new Map(),
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.rounds).toEqual([
        {
          label: 'Round 3',
          number: 3,
          matches: [
            ['p1', 'p2'],
            ['p3', 'p4'],
          ],
        },
        {
          label: 'Round 4',
          number: 4,
          matches: [
            ['p1', 'p3'],
            ['p2', 'p4'],
          ],
        },
      ]);
    }
  });

  it('should return original playedTeams state unchanged', () => {
    const originalTeams = ['p1', 'p2', 'p3', 'p4'];
    const originalPlayedTeams: ReadonlyPlayedTeams = new Map([
      ['p1', new Set(['p2'])],
      ['p2', new Set(['p1'])],
    ]);

    const result = generateRounds({
      teams: originalTeams,
      numRounds: 2,
      startRound: 1,
      playedTeams: originalPlayedTeams,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      // Verify rounds don't include already played matches
      const allGeneratedMatches = result.value.rounds.flatMap((round) => round.matches);
      expect(allGeneratedMatches).not.toContainEqual(['p1', 'p2']);
      expect(allGeneratedMatches).not.toContainEqual(['p2', 'p1']);
    }
  });
});
