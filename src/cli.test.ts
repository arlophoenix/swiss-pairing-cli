import * as cli from './cli.js';
import * as cliAction from './cliAction.js';

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { Command } from 'commander';
import type { SpyInstance } from 'jest-mock';

describe('Swiss Pairing CLI', () => {
  let mockConsoleLog: SpyInstance;
  let mockConsoleError: SpyInstance;
  // used in order to throw if the process.exit() is called
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let mockProcessExit: SpyInstance;

  beforeEach(() => {
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {
      // do nothing
    });
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {
      // do nothing
    });
    mockProcessExit = jest.spyOn(process, 'exit').mockImplementation((code?) => {
      throw new Error(`Process exited with code ${String(code)}`);
    }) as SpyInstance;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createCLI', () => {
    let program: Command;
    let mockHandleCLIAction: SpyInstance<typeof cliAction.handleCLIAction>;

    beforeEach(() => {
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
        program.parse([
          'node',
          'swiss-pairing',
          '--num-rounds',
          '2',
          '--start-round',
          '0',
          '--matches',
          'Alice,Bob',
        ]);
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
        program.parse([
          'node',
          'swiss-pairing',
          '--players',
          'Alice',
          'Bob',
          'Charlie',
          '--matches',
          'Alice',
        ]);
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
});
