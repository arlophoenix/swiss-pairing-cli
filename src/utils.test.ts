import { createBidirectionalMap } from './utils.js';

describe('createBidirectionalMap', () => {
  it('should correctly build played matches Map', () => {
    const matches: readonly (readonly [string, string])[] = [
      ['Player1', 'Player2'],
      ['Player3', 'Player4'],
      ['Player1', 'Player3'],
    ];

    const result = createBidirectionalMap(matches);

    expect(result).toBeInstanceOf(Map);
    if (result instanceof Map) {
      expect(result.size).toBe(4);
      expect(result.get('Player1')).toEqual(new Set(['Player2', 'Player3']));
      expect(result.get('Player2')).toEqual(new Set(['Player1']));
      expect(result.get('Player3')).toEqual(new Set(['Player4', 'Player1']));
      expect(result.get('Player4')).toEqual(new Set(['Player3']));
    }
  });

  it('should return an empty Map for no matches', () => {
    const result = createBidirectionalMap();

    expect(result).toBeInstanceOf(Map);
    if (result instanceof Map) {
      expect(result.size).toBe(0);
    }
  });
});
