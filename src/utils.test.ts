import { createBidirectionalMap } from './utils';

describe('createBidirectionalMap', () => {
  it('should correctly build played matches object', () => {
    const matches: [string, string][] = [
      ['Player1', 'Player2'],
      ['Player3', 'Player4'],
      ['Player1', 'Player3'],
    ];

    const result = createBidirectionalMap(matches);

    expect(result).toEqual({
      Player1: ['Player2', 'Player3'],
      Player2: ['Player1'],
      Player3: ['Player4', 'Player1'],
      Player4: ['Player3'],
    });
  });

  it('should return an empty object for no matches', () => {
    const matches: [string, string][] = [];
    const result = createBidirectionalMap(matches);
    expect(result).toEqual({});
  });
});
