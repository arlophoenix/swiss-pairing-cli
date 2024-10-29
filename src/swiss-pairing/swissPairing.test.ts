import { describe, expect, it } from '@jest/globals';

import { generateRoundMatches } from './swissPairing.js';

describe('generateRoundMatches', () => {
  it('should generate one round for 4 teams', () => {
    const result = generateRoundMatches({
      teams: ['p1', 'p2', 'p3', 'p4'],
      numRounds: 1,
      startRound: 1,
      playedTeams: new Map(),
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual({
        'Round 1': [
          ['p1', 'p2'],
          ['p3', 'p4'],
        ],
      });
    }
  });

  it('should generate three rounds for 4 teams with no repeats', () => {
    const result = generateRoundMatches({
      teams: ['p1', 'p2', 'p3', 'p4'],
      numRounds: 3,
      startRound: 1,
      playedTeams: new Map(),
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual({
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

  it('should avoid previously played matches', () => {
    const result = generateRoundMatches({
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
      const matches = result.value['Round 1'];
      expect(matches).not.toContainEqual(['p1', 'p2']);
      expect(matches).not.toContainEqual(['p2', 'p1']);
    }
  });

  it('should respect squad constraints', () => {
    const result = generateRoundMatches({
      teams: ['p1', 'p2', 'p3', 'p4'],
      numRounds: 1,
      startRound: 1,
      playedTeams: new Map(),
      squadMap: new Map([
        ['p1', 'A'],
        ['p2', 'A'],
        ['p3', 'B'],
        ['p4', 'B'],
      ]),
    });

    expect(result.success).toBe(true);
    if (result.success) {
      const matches = result.value['Round 1'];
      expect(matches).not.toContainEqual(['p1', 'p2']);
      expect(matches).not.toContainEqual(['p3', 'p4']);
    }
  });

  it('should report when no valid pairings are possible', () => {
    const result = generateRoundMatches({
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
    const result = generateRoundMatches({
      teams: ['p1', 'p2', 'p3', 'p4'],
      numRounds: 2,
      startRound: 3,
      playedTeams: new Map(),
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(Object.keys(result.value)).toEqual(['Round 3', 'Round 4']);
    }
  });
});
