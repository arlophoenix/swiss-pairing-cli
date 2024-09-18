import * as cli from './cli.js';
import * as cliAction from './cliAction.js';
import * as swissPairing from './swissPairing.js';

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { Command } from 'commander';
import type { SpyInstance } from 'jest-mock';

jest.mock('./swissPairing');

describe('Swiss Pairing CLI', () => {
  let mockConsoleLog: SpyInstance;
  let mockConsoleError: SpyInstance;
  let mockProcessExit: SpyInstance;

  beforeEach(() => {
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockProcessExit = jest.spyOn(process, 'exit').mockImplementation((code?) => {
      throw new Error(`Process exited with code ${code}`);
    }) as SpyInstance;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createCLI', () => {
    let program: Command;
    let mockHandleCLIAction: SpyInstance<typeof cliAction.handleCLIAction>;

    beforeEach(async () => {
      mockHandleCLIAction = jest
        .spyOn(cliAction, 'handleCLIAction')
        .mockImplementation(() => ({ success: true, value: '' }));
      program = cli.createCLI();
      program.exitOverride();
    });

    it('should create a Command with the correct name and description', () => {
      expect(program.name()).toBe('swiss-pairing');
      expect(program.description()).toBe('A CLI tool for generating Swiss-style tournament pairings');
    });

    it('should parse command line arguments correctly', () => {
      program.parse([
        'node',
        'swiss-pairing',
        '--players',
        'Alice',
        'Bob',
        'Charlie',
        '--num-rounds',
        '2',
        '--start-round',
        '0',
        '--matches',
        'Alice,Bob',
      ]);
      const options = program.opts();

      expect(options.players).toEqual(['Alice', 'Bob', 'Charlie']);
      expect(options.numRounds).toBe(2);
      expect(options.startRound).toBe(0);
      expect(options.matches).toEqual([['Alice', 'Bob']]);
    });

    it('should fail to parse command line arguments without players', () => {
      expect(() => {
        program.parse(['node', 'swiss-pairing', '--num-rounds', '2', '--start-round', '0', '--matches', 'Alice,Bob']);
      }).toThrow("required option '-p, --players <names...>' not specified");
    });

    it('should parse command line arguments without num-rounds', () => {
      program.parse([
        'node',
        'swiss-pairing',
        '--players',
        'Alice',
        'Bob',
        'Charlie',
        '--start-round',
        '0',
        '--matches',
        'Alice,Bob',
      ]);
      const options = program.opts();

      expect(options.numRounds).toBe(1);
    });

    it('should exit for invalid num-rounds', () => {
      expect(() => {
        program.parse([
          'node',
          'swiss-pairing',
          '--players',
          'Alice',
          'Bob',
          'Charlie',
          '--num-rounds',
          'a',
          '--matches',
          'Alice,Bob',
        ]);
      }).toThrow('Process exited with code 1');
    });

    it('should parse command line arguments without start-rounds', () => {
      program.parse([
        'node',
        'swiss-pairing',
        '--players',
        'Alice',
        'Bob',
        'Charlie',
        '--num-rounds',
        '2',
        '--matches',
        'Alice,Bob',
      ]);
      const options = program.opts();

      expect(options.startRound).toBe(1);
    });

    it('should exit for invalid start-rounds', () => {
      expect(() => {
        program.parse([
          'node',
          'swiss-pairing',
          '--players',
          'Alice',
          'Bob',
          'Charlie',
          '--start-round',
          'a',
          '--matches',
          'Alice,Bob',
        ]);
      }).toThrow('Process exited with code 1');
    });

    it('should parse command line arguments without matches', () => {
      program.parse([
        'node',
        'swiss-pairing',
        '--players',
        'Alice',
        'Bob',
        'Charlie',
        '--num-rounds',
        '2',
        '--start-round',
        '0',
      ]);
      const options = program.opts();

      expect(options.matches).toBeUndefined();
    });

    it('should exit for invalid matches', () => {
      expect(() => {
        program.parse(['node', 'swiss-pairing', '--players', 'Alice', 'Bob', 'Charlie', '--matches', 'Alice']);
      }).toThrow('Process exited with code 1');
    });

    it('should parse command line arguments with multiple matches', () => {
      program.parse([
        'node',
        'swiss-pairing',
        '--players',
        'Alice',
        'Bob',
        'Charlie',
        'David',
        '--num-rounds',
        '3',
        '--start-round',
        '0',
        '--matches',
        'Alice,Bob',
        'Charlie,David',
        'Alice,Charlie',
      ]);
      const options = program.opts();

      expect(options.players).toEqual(['Alice', 'Bob', 'Charlie', 'David']);
      expect(options.numRounds).toBe(3);
      expect(options.startRound).toBe(0);
      expect(options.matches).toEqual([
        ['Alice', 'Bob'],
        ['Charlie', 'David'],
        ['Alice', 'Charlie'],
      ]);
    });

    it('should log the result of handleCLIAction on success', () => {
      const message = 'test';
      mockHandleCLIAction.mockReturnValue({ success: true, value: message });
      program.parse(['node', 'swiss-pairing', '--players', 'Alice', 'Bob']);
      expect(mockConsoleLog).toHaveBeenCalledWith(message);
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    it('should error the result of handleCLIAction on failure', () => {
      const message = 'test';
      mockHandleCLIAction.mockReturnValue({ success: false, errorMessage: message });
      expect(() => program.parse(['node', 'swiss-pairing', '--players', 'Alice', 'Bob'])).toThrow(
        'Process exited with code 1'
      );
      expect(mockConsoleError).toHaveBeenCalledWith(message);
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });
  });

  describe('handleCLIAction', () => {
    let mockGeneratePairings: SpyInstance<typeof swissPairing.generatePairings>;
    beforeEach(() => {
      mockGeneratePairings = jest
        .spyOn(swissPairing, 'generatePairings')
        .mockReturnValue({ success: true, roundPairings: {} });
    });
    it('should process valid input and generate pairings', () => {
      const players = ['Player1', 'Player2', 'Player 3'];
      const numRounds = 2;
      const startRound = 0;
      const options: {
        players?: string[];
        numRounds?: number;
        startRound?: number;
        matches?: [string, string][];
      } = {
        players,
        numRounds,
        startRound,
        matches: [['Player1', 'Player2']],
      };

      const roundPairings = {
        'Round 0': [
          ['Player1', 'Player3'],
          ['Player2', 'BYE'],
        ],
      };
      mockGeneratePairings.mockReturnValue({ success: true, roundPairings });

      const result = cliAction.handleCLIAction(options);

      expect(mockGeneratePairings).toHaveBeenCalledWith({
        players,
        numRounds,
        startRound,
        playedMatches: { Player1: ['Player2'], Player2: ['Player1'] },
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

      const roundPairings = { 'Round 1': [['Player1', 'Player2']] };
      mockGeneratePairings.mockReturnValue({ success: true, roundPairings });

      const result = cliAction.handleCLIAction(options);

      expect(mockGeneratePairings).toHaveBeenCalledWith({
        players: options.players,
        numRounds: 1,
        startRound: 1,
        playedMatches: {},
      });
      expect(result).toEqual({
        success: true,
        value: `Pairings generated successfully: ${JSON.stringify(roundPairings)}`,
      });
    });

    it('should handle failed input validation result', () => {
      const errorMessage = 'test error message';
      mockGeneratePairings.mockReturnValue({ success: false, errorType: 'InvalidInput', errorMessage });

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
      mockGeneratePairings.mockReturnValue({ success: false, errorType: 'InvalidOutput', errorMessage });

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
      mockGeneratePairings.mockReturnValue({ success: false, errorType: 'NoValidSolution', errorMessage });

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
});
