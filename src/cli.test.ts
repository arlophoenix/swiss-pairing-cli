import * as swissPairing from './swissPairing.js';

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { buildPlayedMatches, createCLI, handleCLIAction } from './cli.js';

import { Command } from 'commander';
import type { SpyInstance } from 'jest-mock';

jest.mock('./swissPairing');

describe('Swiss Pairing CLI', () => {
  let mockGeneratePairings: SpyInstance<typeof swissPairing.generatePairings>;
  let mockConsoleLog: SpyInstance;
  let mockConsoleError: SpyInstance;
  let mockProcessExit: SpyInstance;

  beforeEach(() => {
    mockGeneratePairings = jest.spyOn(swissPairing, 'generatePairings').mockReturnValue({});
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

    beforeEach(() => {
      program = createCLI();
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
      expect(options.matches).toEqual(['Alice,Bob']);
    });

    it('should parse command line arguments without players', () => {
      program.parse(['node', 'swiss-pairing', '--num-rounds', '2', '--start-round', '0', '--matches', 'Alice,Bob']);
      const options = program.opts();

      expect(options.players).toBeUndefined();
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
      expect(options.matches).toEqual(['Alice,Bob', 'Charlie,David', 'Alice,Charlie']);
    });

    it('should handle successful result', () => {
      mockGeneratePairings.mockReturnValue({ 1: [['Player1', 'Player2']] });
      program.parse(['node', 'swiss-pairing', '--players', 'Player1', 'Player2']);

      expect(mockConsoleLog).toHaveBeenCalledWith('Pairings generated successfully: {"1":[["Player1","Player2"]]}');
      expect(mockProcessExit).not.toHaveBeenCalled();
    });

    it('should handle failure result', () => {
      const errorMessage = 'Invalid input';
      mockGeneratePairings.mockReturnValue(new Error(errorMessage));

      expect(() => {
        program.parse(['node', 'swiss-pairing', '--players', 'Player1']);
      }).toThrow('Process exited with code 1');

      expect(mockConsoleError).toHaveBeenCalledWith(errorMessage);
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });
  });

  describe('handleCLIAction', () => {
    it('should process input and generate pairings', () => {
      const players = ['Player1', 'Player2', 'Player 3'];
      const numRounds = 2;
      const startRound = 0;
      const options = {
        players,
        numRounds,
        startRound,
        matches: ['Player1,Player2'],
      };

      const generatePairingsResult = {
        'Round 0': [
          ['Player1', 'Player3'],
          ['Player2', 'BYE'],
        ],
      };
      mockGeneratePairings.mockReturnValue(generatePairingsResult);

      const result = handleCLIAction(options);

      expect(mockGeneratePairings).toHaveBeenCalledWith({
        players,
        numRounds,
        startRound,
        playedMatches: { Player1: ['Player2'], Player2: ['Player1'] },
      });
      expect(result).toEqual({
        type: 'success',
        message: `Pairings generated successfully: ${JSON.stringify(generatePairingsResult)}`,
      });
    });

    it('should process default the missing values correctly', () => {
      const options = {
        players: ['Player1', 'Player2'],
      };

      const generatePairingsResult = { 'Round 1': [['Player1', 'Player2']] };
      mockGeneratePairings.mockReturnValue(generatePairingsResult);

      const result = handleCLIAction(options);

      expect(mockGeneratePairings).toHaveBeenCalledWith({
        players: options.players,
        numRounds: 1,
        startRound: 1,
        playedMatches: {},
      });
      expect(result).toEqual({
        type: 'success',
        message: `Pairings generated successfully: ${JSON.stringify(generatePairingsResult)}`,
      });
    });

    it('should handle invalid input', () => {
      const errorMessage = 'Invalid input';
      mockGeneratePairings.mockReturnValue(new Error(errorMessage));

      const result = handleCLIAction({
        players: ['Player1'],
        numRounds: 1,
        startRound: 1,
        matches: [],
      });

      expect(result).toEqual({
        type: 'failure',
        message: errorMessage,
      });
    });
  });
});

describe('buildPlayedMatches', () => {
  it('should correctly build played matches object', () => {
    const matches: [string, string][] = [
      ['Player1', 'Player2'],
      ['Player3', 'Player4'],
      ['Player1', 'Player3'],
    ];

    const result = buildPlayedMatches(matches);

    expect(result).toEqual({
      Player1: ['Player2', 'Player3'],
      Player2: ['Player1'],
      Player3: ['Player4', 'Player1'],
      Player4: ['Player3'],
    });
  });

  it('should return an empty object for no matches', () => {
    const matches: [string, string][] = [];
    const result = buildPlayedMatches(matches);
    expect(result).toEqual({});
  });
});
