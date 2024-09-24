import * as cli from './cli.js';
import * as cliAction from './cliAction.js';
import * as fileParser from './fileParser.js';

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { Command } from 'commander';
import type { SpyInstance } from 'jest-mock';
import { start } from 'repl';

describe('Swiss Pairing CLI', () => {
  let mockConsoleLog: SpyInstance;
  let mockConsoleError: SpyInstance;
  // used in order to throw if the process.exit() is called
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let mockProcessExit: SpyInstance;
  let mockIsSupportedFileType: SpyInstance<typeof fileParser.isSupportedFileType>;
  let mockParseFile: SpyInstance<typeof fileParser.parseFile>;

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
    mockIsSupportedFileType = jest
      .spyOn(fileParser, 'isSupportedFileType')
      .mockReturnValue({ success: true, value: undefined });
    mockParseFile = jest.spyOn(fileParser, 'parseFile').mockResolvedValue({});
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

    it('should provide useful help information and examples', () => {
      expect(cli.helpWithExamples()).toEqual(`Usage: swiss-pairing [options]

A CLI tool for generating Swiss-style tournament pairings

Options:
  -p, --players <names...>                     List of player names in order from top standing to bottom
  e.g. Alice Bob Charlie David
  -m, --matches <matches...>                   List of pairs of player names that have already played against each other
  e.g. "Alice,Bob" "Charlie,David"
  -n, --num-rounds <number>                    Number of rounds to generate (default: 1)
  -s, --start-round <number>                   Name the generated rounds starting with this number (default: 1)
  -o, --order <top-down | bottom-up | random>  The sequence in which players should be paired (default: top-down)
  --file <path>                                Path to input file (CSV or JSON). Options provided via cli override file contents
  --format <text | json-plain | json-pretty>   Output format (default: text)
  -h, --help                                   Display this help information

Examples:

1. Generate random pairings for 4 players:

  swiss-pairing --players Alice Bob Charlie David --order random

2. Generate pairings for 4 players, on round 2, with some matches already played:

  swiss-pairing --players Alice Bob Charlie David --start-round 2 --matches "Alice,Bob" "Charlie,David"

3. Generate pairings using a CSV file:

  swiss-pairing --file tournament_data.csv

4. Generate pairings using a JSON file, overriding the pairing order:

  swiss-pairing --file tournament_data.json --order bottom-up

5. Generate multiple rounds of pairings:

  swiss-pairing --players Alice Bob Charlie David --num-rounds 3`);
    });

    it('should parse command line arguments correctly', async () => {
      await program.parseAsync([
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
        '--order',
        'bottom-up',
        '--file',
        'tmp/test.txt',
      ]);
      const options = program.opts();

      expect(options.players).toEqual(['Alice', 'Bob', 'Charlie']);
      expect(options.numRounds).toBe(2);
      expect(options.startRound).toBe(0);
      expect(options.matches).toEqual([['Alice', 'Bob']]);
      expect(options.order).toBe('bottom-up');
      expect(options.file).toBe('tmp/test.txt');
    });

    it('should fail to parse command line arguments without --players or --file', async () => {
      await expect(() =>
        program.parseAsync([
          'node',
          'swiss-pairing',
          '--num-rounds',
          '2',
          '--start-round',
          '0',
          '--matches',
          'Alice,Bob',
        ])
      ).rejects.toThrow('Process exited with code 1');
      expect(mockConsoleError).toHaveBeenCalledWith('Invalid input: either --players or --file is required.');
    });

    describe('--num-rounds', () => {
      it('should parse command line arguments without num-rounds', async () => {
        await program.parseAsync(['node', 'swiss-pairing', '--players', 'Alice', 'Bob', 'Charlie']);
        const options = program.opts();

        expect(options.numRounds).toBe(undefined);
      });

      it('should exit for invalid num-rounds', async () => {
        await expect(() =>
          program.parseAsync([
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
          ])
        ).rejects.toThrow('Process exited with code 1');
        expect(mockConsoleError).toHaveBeenCalledWith(
          'Invalid input: num-rounds must be a positive whole number.'
        );
      });
    });

    describe('--start-rounds', () => {
      it('should parse command line arguments without start-rounds', async () => {
        await program.parseAsync(['node', 'swiss-pairing', '--players', 'Alice', 'Bob', 'Charlie']);
        const options = program.opts();

        expect(options.startRound).toBe(undefined);
      });

      it('should exit for invalid start-rounds', async () => {
        await expect(() =>
          program.parseAsync([
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
          ])
        ).rejects.toThrow('Process exited with code 1');
        expect(mockConsoleError).toHaveBeenCalledWith(
          'Invalid input: start-round must be a positive whole number.'
        );
      });
    });

    describe('--matches', () => {
      it('should parse command line arguments without matches', async () => {
        await program.parseAsync([
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

      it('should exit for invalid matches', async () => {
        await expect(() =>
          program.parseAsync([
            'node',
            'swiss-pairing',
            '--players',
            'Alice',
            'Bob',
            'Charlie',
            '--matches',
            'Alice',
          ])
        ).rejects.toThrow('Process exited with code 1');
        expect(mockConsoleError).toHaveBeenCalledWith(
          'Invalid input: matches "Alice" is formatted incorrectly; expected "player1,player2".'
        );
      });

      it('should parse command line arguments with multiple matches', async () => {
        await program.parseAsync([
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
    });

    describe('--order', () => {
      it('should exit for invalid order', async () => {
        await expect(() =>
          program.parseAsync([
            'node',
            'swiss-pairing',
            '--players',
            'Alice',
            'Bob',
            'Charlie',
            '--order',
            'foo',
          ])
        ).rejects.toThrow('Process exited with code 1');
        expect(mockConsoleError).toHaveBeenCalledWith(
          'Invalid input: order must be one of: top-down, bottom-up, random.'
        );
      });

      it('should default order to undefined', async () => {
        await program.parseAsync(['node', 'swiss-pairing', '--players', 'Alice', 'Bob', 'Charlie']);
        const options = program.opts();

        expect(options.order).toBe(undefined);
      });
    });

    describe('--file', () => {
      it('should parse command line arguments with file option', async () => {
        mockParseFile.mockResolvedValue({
          players: ['Alice', 'Bob', 'Charlie'],
          numRounds: 2,
          startRound: 1,
          order: 'random',
        });

        await program.parseAsync(['node', 'swiss-pairing', '--file', 'input.json']);
        const options = program.opts();

        expect(options.file).toBe('input.json');
        expect(mockParseFile).toHaveBeenCalledWith('input.json');
        expect(mockHandleCLIAction).toHaveBeenCalledWith(
          expect.objectContaining({
            players: ['Alice', 'Bob', 'Charlie'],
            numRounds: 2,
            startRound: 1,
            order: 'random',
            file: 'input.json',
          })
        );
      });

      it('should exit for unsupported file type', async () => {
        mockIsSupportedFileType.mockReturnValue({
          success: false,
          errorMessage: 'Unsupported file type',
        });

        await expect(() =>
          program.parseAsync(['node', 'swiss-pairing', '--file', 'input.txt'])
        ).rejects.toThrow('Process exited with code 1');
        expect(mockConsoleError).toHaveBeenCalledWith('Invalid input: Unsupported file type');
      });

      it('should exit for file parsing errors', async () => {
        mockParseFile.mockRejectedValue(new Error('File parsing error'));

        await expect(() =>
          program.parseAsync(['node', 'swiss-pairing', '--file', 'input.json'])
        ).rejects.toThrow('Process exited with code 1');
        expect(mockConsoleError).toHaveBeenCalledWith(
          'Invalid input: error parsing file - File parsing error'
        );
      });

      it('should prioritize CLI options over file contents', async () => {
        mockParseFile.mockResolvedValue({
          players: ['Alice', 'Bob'],
          numRounds: 2,
          startRound: 1,
          order: 'random',
        });

        await program.parseAsync([
          'node',
          'swiss-pairing',
          '--file',
          'input.json',
          '--players',
          'Charlie',
          'David',
          '--num-rounds',
          '3',
          '--start-round',
          '0',
          '--order',
          'bottom-up',
        ]);

        expect(mockHandleCLIAction).toHaveBeenCalledWith(
          expect.objectContaining({
            players: ['Charlie', 'David'],
            numRounds: 3,
            startRound: 0,
            order: 'bottom-up',
            file: 'input.json',
          })
        );
      });
    });

    describe('handleCLIAction', () => {
      it('should log the result of handleCLIAction on success', async () => {
        const message = 'test';

        mockHandleCLIAction.mockReturnValue({ success: true, value: message });
        await program.parseAsync(['node', 'swiss-pairing', '--players', 'Alice', 'Bob']);
        expect(mockConsoleLog).toHaveBeenCalledWith(message);
        expect(mockConsoleError).not.toHaveBeenCalled();
      });

      it('should error the result of handleCLIAction on failure', async () => {
        const message = 'test';

        mockHandleCLIAction.mockReturnValue({ success: false, errorMessage: message });
        await expect(() =>
          program.parseAsync(['node', 'swiss-pairing', '--players', 'Alice', 'Bob'])
        ).rejects.toThrow('Process exited with code 1');
        expect(mockConsoleError).toHaveBeenCalledWith(message);
        expect(mockConsoleLog).not.toHaveBeenCalled();
      });
    });
  });
});
