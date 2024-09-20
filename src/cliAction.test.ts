import * as cliAction from './cliAction.js';
import * as swissPairing from './swiss-pairing/index.js';

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { ReadonlyRoundPairings } from './types.js';
import type { SpyInstance } from 'jest-mock';

describe('handleCLIAction', () => {
  let mockGenerateRoundPairings: SpyInstance<typeof swissPairing.generateRoundPairings>;

  beforeEach(() => {
    mockGenerateRoundPairings = jest
      .spyOn(swissPairing, 'generateRoundPairings')
      .mockReturnValue({ success: true, roundPairings: {} });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should process valid input and generate pairings', () => {
    const players = ['Player1', 'Player2', 'Player 3'];
    const numRounds = 2;
    const startRound = 0;
    const options: {
      readonly players?: readonly string[];
      readonly numRounds?: number;
      readonly startRound?: number;
      readonly matches?: readonly (readonly [string, string])[];
    } = {
      players,
      numRounds,
      startRound,
      matches: [['Player1', 'Player2']],
    };

    const roundPairings: ReadonlyRoundPairings = {
      'Round 0': [
        ['Player1', 'Player3'],
        ['Player2', 'BYE'],
      ],
    };

    mockGenerateRoundPairings.mockReturnValue({ success: true, roundPairings });

    const result = cliAction.handleCLIAction(options);

    expect(mockGenerateRoundPairings).toHaveBeenCalledWith({
      players,
      numRounds,
      startRound,
      playedMatches: new Map([
        ['Player1', new Set(['Player2'])],
        ['Player2', new Set(['Player1'])],
      ]),
    });
    expect(result).toEqual({
      success: true,
      value: `Pairings generated successfully: ${JSON.stringify(roundPairings)}`,
    });
  });

  it('should default the missing values correctly', () => {
    const options = {
      players: ['Player1', 'Player2'],
    };

    const roundPairings: ReadonlyRoundPairings = { 'Round 1': [['Player1', 'Player2']] };

    mockGenerateRoundPairings.mockReturnValue({ success: true, roundPairings });

    const result = cliAction.handleCLIAction(options);

    expect(mockGenerateRoundPairings).toHaveBeenCalledWith({
      players: options.players,
      numRounds: 1,
      startRound: 1,
      playedMatches: new Map(),
    });
    expect(result).toEqual({
      success: true,
      value: `Pairings generated successfully: ${JSON.stringify(roundPairings)}`,
    });
  });

  it('should handle failed input validation result', () => {
    const errorMessage = 'test error message';

    mockGenerateRoundPairings.mockReturnValue({ success: false, errorType: 'InvalidInput', errorMessage });

    const result = cliAction.handleCLIAction({
      players: ['Player1', 'Player2'],
      numRounds: 1,
      startRound: 1,
      matches: [['Player1', 'Player3']],
    });

    expect(result).toEqual({
      success: false,
      errorMessage: 'Invalid input: ' + errorMessage,
    });
  });

  it('should handle failure due to invalid output', () => {
    const errorMessage = 'test error message';

    mockGenerateRoundPairings.mockReturnValue({ success: false, errorType: 'InvalidOutput', errorMessage });

    // valid input, but invalid output (though how it went wrong we don't know)
    const result = cliAction.handleCLIAction({
      players: ['Player1', 'Player2'],
      numRounds: 1,
      startRound: 1,
      matches: [],
    });

    expect(result).toEqual({
      success: false,
      errorMessage: 'Pairing failed: ' + errorMessage,
    });
  });

  it('should handle failure due to no valid solution', () => {
    const errorMessage = 'test error message';

    mockGenerateRoundPairings.mockReturnValue({ success: false, errorType: 'NoValidSolution', errorMessage });

    // valid input, but no solution
    const result = cliAction.handleCLIAction({
      players: ['Player1', 'Player2'],
      numRounds: 1,
      startRound: 1,
      matches: [['Player1', 'Player2']],
    });

    expect(result).toEqual({
      success: false,
      errorMessage: 'Pairing failed: ' + errorMessage,
    });
  });
});
