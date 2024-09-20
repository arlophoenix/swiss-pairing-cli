import * as cliAction from './cliAction.js';
import * as swissPairing from './swiss-pairing/index.js';
import * as utils from './utils.js';

import { CLIOptions, ReadonlyRoundMatches } from './types.js';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { SpyInstance } from 'jest-mock';

describe('handleCLIAction', () => {
  let mockGenerateRoundMatches: SpyInstance<typeof swissPairing.generateRoundMatches>;
  let mockShuffle: jest.MockedFunction<typeof utils.shuffle>;

  beforeEach(() => {
    mockGenerateRoundMatches = jest
      .spyOn(swissPairing, 'generateRoundMatches')
      .mockReturnValue({ success: true, roundMatches: {} });
    mockShuffle = jest.fn(utils.shuffle) as jest.MockedFunction<typeof utils.shuffle>;
    mockShuffle.mockImplementation(<T>(arr: readonly T[]): readonly T[] => [...arr].reverse());
    jest.spyOn(utils, 'shuffle').mockImplementation(mockShuffle);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should process valid input and generate matches', () => {
    const players = ['Player1', 'Player2', 'Player3'];
    const numRounds = 2;
    const startRound = 0;
    const options: CLIOptions = {
      players,
      numRounds,
      startRound,
      matches: [['Player1', 'Player2']],
    };

    const roundMatches: ReadonlyRoundMatches = {
      'Round 0': [
        ['Player1', 'Player3'],
        ['Player2', 'BYE'],
      ],
    };

    mockGenerateRoundMatches.mockReturnValue({ success: true, roundMatches: roundMatches });

    const result = cliAction.handleCLIAction(options);

    expect(mockGenerateRoundMatches).toHaveBeenCalledWith({
      players,
      numRounds,
      startRound,
      playedOpponents: new Map([
        ['Player1', new Set(['Player2'])],
        ['Player2', new Set(['Player1'])],
      ]),
    });
    expect(result).toEqual({
      success: true,
      value: `Matches generated successfully: ${JSON.stringify(roundMatches)}`,
    });
    expect(mockShuffle).not.toHaveBeenCalled();
  });

  it('should randomize the player order before match if randomize is true', () => {
    const players = ['Player1', 'Player2', 'Player3', 'Player4'];
    const randomize = true;
    const options: CLIOptions = {
      players,
      randomize,
    };

    const roundMatches: ReadonlyRoundMatches = {
      'Round 0': [
        ['Player1', 'Player3'],
        ['Player2', 'BYE'],
      ],
    };

    mockGenerateRoundMatches.mockReturnValue({ success: true, roundMatches: roundMatches });

    const result = cliAction.handleCLIAction(options);

    expect(mockGenerateRoundMatches).toHaveBeenCalledWith({
      players: players.reverse(),
      numRounds: 1,
      startRound: 1,
      playedOpponents: new Map(),
    });
    expect(result).toEqual({
      success: true,
      value: `Matches generated successfully: ${JSON.stringify(roundMatches)}`,
    });
    expect(mockShuffle).toHaveBeenCalledWith(players);
  });

  it('should default the missing values correctly', () => {
    const options = {
      players: ['Player1', 'Player2'],
    };

    const roundMatches: ReadonlyRoundMatches = { 'Round 1': [['Player1', 'Player2']] };

    mockGenerateRoundMatches.mockReturnValue({ success: true, roundMatches: roundMatches });

    const result = cliAction.handleCLIAction(options);

    expect(mockGenerateRoundMatches).toHaveBeenCalledWith({
      players: options.players,
      numRounds: 1,
      startRound: 1,
      playedOpponents: new Map(),
    });
    expect(result).toEqual({
      success: true,
      value: `Matches generated successfully: ${JSON.stringify(roundMatches)}`,
    });
  });

  it('should handle failed input validation result', () => {
    const errorMessage = 'test error message';

    mockGenerateRoundMatches.mockReturnValue({ success: false, errorType: 'InvalidInput', errorMessage });

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

    mockGenerateRoundMatches.mockReturnValue({ success: false, errorType: 'InvalidOutput', errorMessage });

    // valid input, but invalid output (though how it went wrong we don't know)
    const result = cliAction.handleCLIAction({
      players: ['Player1', 'Player2'],
      numRounds: 1,
      startRound: 1,
      matches: [],
    });

    expect(result).toEqual({
      success: false,
      errorMessage: 'Failed to generate matches: ' + errorMessage,
    });
  });

  it('should handle failure due to no valid solution', () => {
    const errorMessage = 'test error message';

    mockGenerateRoundMatches.mockReturnValue({ success: false, errorType: 'NoValidSolution', errorMessage });

    // valid input, but no solution
    const result = cliAction.handleCLIAction({
      players: ['Player1', 'Player2'],
      numRounds: 1,
      startRound: 1,
      matches: [['Player1', 'Player2']],
    });

    expect(result).toEqual({
      success: false,
      errorMessage: 'Failed to generate matches: ' + errorMessage,
    });
  });
});
