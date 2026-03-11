import { describe, expect, it } from '@jest/globals';

import { sortRoundsHighestRankFirst } from './corePipelineUtils.js';

describe('sortRoundsHighestRankFirst', () => {
  it('sorts matches highest-rank-first across a round', () => {
    const rounds = [
      {
        label: 'Round 1',
        number: 1,
        matches: [
          ['C', 'D'],
          ['A', 'B'],
        ] as readonly (readonly [string, string])[],
      },
    ];

    const result = sortRoundsHighestRankFirst({
      rounds,
      orderedTeams: ['A', 'B', 'C', 'D'],
    });

    expect(result[0].matches).toEqual([
      ['A', 'B'],
      ['C', 'D'],
    ]);
  });

  it('puts higher-ranked team first within a match', () => {
    const rounds = [
      { label: 'Round 1', number: 1, matches: [['B', 'A']] as readonly (readonly [string, string])[] },
    ];

    const result = sortRoundsHighestRankFirst({
      rounds,
      orderedTeams: ['A', 'B'],
    });

    expect(result[0].matches).toEqual([['A', 'B']]);
  });

  it('sorts unknown teams (e.g. BYE) last', () => {
    const rounds = [
      { label: 'Round 1', number: 1, matches: [['BYE', 'A']] as readonly (readonly [string, string])[] },
    ];

    const result = sortRoundsHighestRankFirst({
      rounds,
      orderedTeams: ['A', 'B', 'C'],
    });

    expect(result[0].matches).toEqual([['A', 'BYE']]);
  });

  it('sorts each round independently for multi-round output', () => {
    const rounds = [
      {
        label: 'Round 1',
        number: 1,
        matches: [
          ['C', 'D'],
          ['A', 'B'],
        ] as readonly (readonly [string, string])[],
      },
      {
        label: 'Round 2',
        number: 2,
        matches: [
          ['D', 'A'],
          ['B', 'C'],
        ] as readonly (readonly [string, string])[],
      },
    ];

    const result = sortRoundsHighestRankFirst({
      rounds,
      orderedTeams: ['A', 'B', 'C', 'D'],
    });

    expect(result[0].matches).toEqual([
      ['A', 'B'],
      ['C', 'D'],
    ]);
    expect(result[1].matches).toEqual([
      ['A', 'D'],
      ['B', 'C'],
    ]);
  });
});
