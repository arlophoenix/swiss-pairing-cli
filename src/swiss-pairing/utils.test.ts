import { PlayedOpponents, ReadonlyPlayedOpponents } from '../types/types.js';
import { describe, expect, it } from '@jest/globals';

import { mutableClonePlayedOpponents } from './utils.js';

describe('mutableClonePlayedOpponents', () => {
  it('should create a new Map instance', () => {
    const original: ReadonlyPlayedOpponents = new Map();
    const clone: PlayedOpponents = mutableClonePlayedOpponents(original);
    expect(clone).not.toBe(original);
    expect(clone).toBeInstanceOf(Map);
  });

  it('should create a deep clone of the map', () => {
    const original: ReadonlyPlayedOpponents = new Map([
      ['team1', new Set(['opponent1', 'opponent2'])],
      ['team2', new Set(['opponent3'])],
    ]);
    const clone: PlayedOpponents = mutableClonePlayedOpponents(original);

    expect(clone).toEqual(original);
    expect(clone.get('team1')).not.toBe(original.get('team1'));
    expect(clone.get('team2')).not.toBe(original.get('team2'));
  });

  it('should allow mutations on the cloned map', () => {
    const original: ReadonlyPlayedOpponents = new Map([['team1', new Set(['opponent1'])]]);
    const clone = mutableClonePlayedOpponents(original);

    clone.set('team2', new Set(['opponent2']));
    clone.get('team1')?.add('opponent3');

    expect(clone.has('team2')).toBe(true);
    expect(clone.get('team1')?.has('opponent3')).toBe(true);
    expect(original.has('team2')).toBe(false);
    expect(original.get('team1')?.has('opponent3')).toBe(false);
  });

  it('should handle an empty map', () => {
    const original: ReadonlyPlayedOpponents = new Map();
    const clone = mutableClonePlayedOpponents(original);
    expect(clone.size).toBe(0);
  });
});
