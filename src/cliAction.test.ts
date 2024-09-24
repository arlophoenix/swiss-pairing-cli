import * as cliAction from './cliAction.js';
import * as swissPairing from './swiss-pairing/index.js';
import * as utils from './utils.js';

import { CLIOptions, ReadonlyRoundMatches } from './types.js';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { BYE_PLAYER } from './constants.js';
import type { SpyInstance } from 'jest-mock';

function mockShuffleImplementation<T>(arr: readonly T[]): readonly T[] {
  return [...arr].reverse();
}

describe('handleCLIAction', () => {
  let mockGenerateRoundMatches: SpyInstance<typeof swissPairing.generateRoundMatches>;
  // not using SpyInstance here because the generic type signatures didn't work
  let mockShuffle: jest.MockedFunction<typeof utils.shuffle>;

  beforeEach(() => {
    mockGenerateRoundMatches = jest
      .spyOn(swissPairing, 'generateRoundMatches')
      .mockReturnValue({ success: true, roundMatches: {} });
    mockShuffle = jest.fn(utils.shuffle) as jest.MockedFunction<typeof utils.shuffle>;
    mockShuffle.mockImplementation(mockShuffleImplementation);
    jest.spyOn(utils, 'shuffle').mockImplementation(mockShuffle);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should process valid input and generate matches', () => {
    const players = ['Player1', 'Player2', 'Player3', 'Player4'];
    const numRounds = 1;
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
        ['Player2', 'Player4'],
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
      value: `**Round 0**

1. Player1 vs Player3
2. Player2 vs Player4`,
    });
    expect(mockShuffle).not.toHaveBeenCalled();
  });

  describe('order', () => {
    it('should randomize the player order before generating matches if order is random', () => {
      const players = ['Player1', 'Player2', 'Player3', 'Player4'];
      const options: CLIOptions = {
        players,
        order: 'random',
      };

      cliAction.handleCLIAction(options);

      expect(mockGenerateRoundMatches).toHaveBeenCalledWith({
        players: mockShuffleImplementation(players),
        numRounds: 1,
        startRound: 1,
        playedOpponents: new Map(),
      });
      expect(mockShuffle).toHaveBeenCalledWith(players);
    });

    it('should reverse the player order before generating matches if order is bottom-up', () => {
      const players = ['Player1', 'Player2', 'Player3', 'Player4'];
      const options: CLIOptions = {
        players,
        order: 'bottom-up',
      };

      cliAction.handleCLIAction(options);

      expect(mockGenerateRoundMatches).toHaveBeenCalledWith({
        players: ['Player4', 'Player3', 'Player2', 'Player1'],
        numRounds: 1,
        startRound: 1,
        playedOpponents: new Map(),
      });
      expect(mockShuffle).not.toHaveBeenCalled();
    });

    it('should reverse the player order after adding a BYE if order is bottom-up', () => {
      const players = ['Player1', 'Player2', 'Player3'];
      const options: CLIOptions = {
        players,
        order: 'bottom-up',
      };

      cliAction.handleCLIAction(options);

      expect(mockGenerateRoundMatches).toHaveBeenCalledWith({
        players: [BYE_PLAYER, 'Player3', 'Player2', 'Player1'],
        numRounds: 1,
        startRound: 1,
        playedOpponents: new Map(),
      });
      expect(mockShuffle).not.toHaveBeenCalled();
    });
  });

  describe('format', () => {
    const roundMatches: ReadonlyRoundMatches = {
      'Round 0': [
        ['Player1', 'Player3'],
        ['Player2', 'Player4'],
      ],
    };

    beforeEach(() => {
      mockGenerateRoundMatches.mockReturnValue({ success: true, roundMatches });
    });

    it('should format output as text when format is text', () => {
      const options: CLIOptions = {
        players: ['Player1', 'Player2'],
        format: 'text',
      };

      const result = cliAction.handleCLIAction(options);

      expect(result).toEqual({
        success: true,
        value: `**Round 0**

1. Player1 vs Player3
2. Player2 vs Player4`,
      });
    });

    it('should format multiple rounds correctly', () => {
      const roundMatches: ReadonlyRoundMatches = {
        'Round 1': [
          ['Player1', 'Player2'],
          ['Player3', 'Player4'],
        ],
        'Round 2': [
          ['Player1', 'Player3'],
          ['Player2', 'Player4'],
        ],
      };
      mockGenerateRoundMatches.mockReturnValue({ success: true, roundMatches });

      const options: CLIOptions = {
        players: ['Player1', 'Player2', 'Player3', 'Player4'],
        numRounds: 2,
        format: 'text',
      };

      const result = cliAction.handleCLIAction(options);

      expect(result).toEqual({
        success: true,
        value: `# Matches

**Round 1**

1. Player1 vs Player2
2. Player3 vs Player4

**Round 2**

1. Player1 vs Player3
2. Player2 vs Player4`,
      });
    });

    it('should format output as plain JSON when format is json-plain', () => {
      const options: CLIOptions = {
        players: ['Player1', 'Player2'],
        format: 'json-plain',
      };

      const result = cliAction.handleCLIAction(options);

      expect(result).toEqual({
        success: true,
        value: JSON.stringify(roundMatches),
      });
    });

    it('should format output as pretty JSON when format is json-pretty', () => {
      const options: CLIOptions = {
        players: ['Player1', 'Player2'],
        format: 'json-pretty',
      };

      const result = cliAction.handleCLIAction(options);

      expect(result).toEqual({
        success: true,
        value: JSON.stringify(roundMatches, null, 2),
      });
    });

    it('should default to text format when format is not specified', () => {
      const options: CLIOptions = {
        players: ['Player1', 'Player2'],
      };

      const result = cliAction.handleCLIAction(options);

      expect(result).toEqual({
        success: true,
        value: `**Round 0**

1. Player1 vs Player3
2. Player2 vs Player4`,
      });
    });
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
      value: `**Round 1**

1. Player1 vs Player2`,
    });
  });

  it('should add a BYE round if provided with an uneven number of players', () => {
    const options: CLIOptions = {
      players: ['Player1', 'Player2', 'Player3'],
    };
    cliAction.handleCLIAction(options);
    expect(mockGenerateRoundMatches).toHaveBeenCalledWith({
      players: ['Player1', 'Player2', 'Player3', BYE_PLAYER],
      numRounds: 1,
      startRound: 1,
      playedOpponents: new Map(),
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
