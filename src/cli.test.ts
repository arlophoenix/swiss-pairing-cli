import * as swissPairing from './swissPairing';

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { buildPlayedMatches, createCLI, generateSwissPairings, handleCLIAction } from './cli';

import { Command } from 'commander';
import type { SpyInstance } from 'jest-mock';

jest.mock('./swissPairing');

describe('Swiss Pairing CLI', () => {
  let mockValidateInput: SpyInstance<typeof swissPairing.validateInput>;
  let mockGeneratePairings: SpyInstance<typeof swissPairing.generatePairings>;
  let mockConsoleLog: SpyInstance;
  let mockConsoleError: SpyInstance;
  // eslint-disable-next-line no-unused-vars
  let mockProcessExit: SpyInstance;

  beforeEach(() => {
    mockValidateInput = jest.spyOn(swissPairing, 'validateInput').mockReturnValue(true);
    mockGeneratePairings = jest.spyOn(swissPairing, 'generatePairings').mockReturnValue([]);
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockProcessExit = jest.spyOn(process, 'exit').mockImplementation((code?) => {
      throw new Error(`Process exited with code ${code}`);
    }) as SpyInstance;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generateSwissPairings', () => {
    it('should generate pairings when given valid input', () => {
      const input = {
        players: ['Player1', 'Player2', 'Player3', 'Player4'],
        rounds: 2,
        playedMatches: {},
      };
      const expectedPairings = [
        ['Player1', 'Player2'],
        ['Player3', 'Player4'],
      ];
      mockGeneratePairings.mockReturnValue(expectedPairings);

      const result = generateSwissPairings(input);

      expect(mockValidateInput).toHaveBeenCalledWith(input);
      expect(mockGeneratePairings).toHaveBeenCalledWith(input);
      expect(result).toEqual(expectedPairings);
    });

    it('should throw an error when given invalid input', () => {
      mockValidateInput.mockReturnValue(false);

      expect(() => {
        generateSwissPairings({
          players: ['Player1'],
          rounds: 1,
          playedMatches: {},
        });
      }).toThrow('Invalid input. Please check your player list and number of rounds.');
    });
  });

  describe('createCLI', () => {
    let program: Command;

    beforeEach(() => {
      program = createCLI();
      program.exitOverride;
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
        '--rounds',
        '2',
        '--matches',
        'Alice,Bob',
      ]);
      const options = program.opts();

      expect(options.players).toEqual(['Alice', 'Bob', 'Charlie']);
      expect(options.rounds).toBe(2);
      expect(options.matches).toEqual(['Alice,Bob']);
    });

    it('should parse command line arguments without rounds', () => {
      program.parse(['node', 'swiss-pairing', '--players', 'Alice', 'Bob', 'Charlie', '--matches', 'Alice,Bob']);
      const options = program.opts();

      expect(options.players).toEqual(['Alice', 'Bob', 'Charlie']);
      expect(options.rounds).toBe(1);
      expect(options.matches).toEqual(['Alice,Bob']);
    });

    it('should parse command line arguments without matches', () => {
      program.parse(['node', 'swiss-pairing', '--players', 'Alice', 'Bob', 'Charlie', '--rounds', '2']);
      const options = program.opts();

      expect(options.players).toEqual(['Alice', 'Bob', 'Charlie']);
      expect(options.rounds).toBe(2);
      expect(options.matches).toBeUndefined();
    });

    it('should parse command line arguments without players', () => {
      program.parse(['node', 'swiss-pairing', '--rounds', '2', '--matches', 'Alice,Bob']);
      const options = program.opts();

      expect(options.players).toBeUndefined();
      expect(options.rounds).toBe(2);
      expect(options.matches).toEqual(['Alice,Bob']);
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
        '--rounds',
        '3',
        '--matches',
        'Alice,Bob',
        'Charlie,David',
        'Alice,Charlie',
      ]);
      const options = program.opts();

      expect(options.players).toEqual(['Alice', 'Bob', 'Charlie', 'David']);
      expect(options.rounds).toBe(3);
      expect(options.matches).toEqual(['Alice,Bob', 'Charlie,David', 'Alice,Charlie']);
    });
  });

  describe('handleCLIAction', () => {
    it('should process input and generate pairings', () => {
      const options = {
        players: ['Player1', 'Player2'],
        rounds: 2,
        matches: ['Player1,Player2'],
      };

      handleCLIAction(options);

      expect(mockGeneratePairings).toHaveBeenCalledWith({
        players: ['Player1', 'Player2'],
        rounds: 2,
        playedMatches: { Player1: ['Player2'], Player2: ['Player1'] },
      });
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should handle errors and exit', () => {
      mockValidateInput.mockReturnValue(false);

      expect(() => {
        handleCLIAction({
          players: ['Player1'],
          rounds: 1,
          matches: [],
        });
      }).toThrow('Process exited with code 1');

      expect(mockConsoleError).toHaveBeenCalled();
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
