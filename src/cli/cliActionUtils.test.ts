import * as fileParser from '../parsers/fileParser.js';
import * as utils from '../utils/utils.js';

import { BYE_PLAYER, CLI_OPTION_DEFAULTS } from '../constants.js';
import { Result, ValidatedCLIOptions } from '../types/types.js';
import {
  addByePlayerIfNecessary,
  mergeOptions,
  preparePlayers,
  validateFileOptions,
} from './cliActionUtils.js';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { SpyInstance } from 'jest-mock';

jest.mock('../utils/utils.js');
jest.mock('../parsers/fileParser.js');

describe('cliActionUtils', () => {
  describe('validateFileOptions', () => {
    let mockParseFile: SpyInstance<typeof fileParser.parseFile>;

    beforeEach(() => {
      const result: Result<Partial<ValidatedCLIOptions>> = {
        success: true,
        value: { players: ['Alice', 'Bob'] },
      };
      mockParseFile = jest.spyOn(fileParser, 'parseFile').mockResolvedValue(result);
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should return success with empty object when filePath is undefined', async () => {
      const result = await validateFileOptions(undefined);
      expect(result).toEqual({ success: true, value: {} });
      expect(mockParseFile).not.toHaveBeenCalled();
    });

    it('should call parseFile when filePath is defined', async () => {
      mockParseFile.mockResolvedValue({ success: true, value: { players: ['Alice', 'Bob'] } });
      const result = await validateFileOptions('test.csv');
      expect(result).toEqual({ success: true, value: { players: ['Alice', 'Bob'] } });
      expect(mockParseFile).toHaveBeenCalledWith('test.csv');
    });

    it('should return error when parseFile fails', async () => {
      mockParseFile.mockResolvedValue({
        success: false,
        error: { type: 'InvalidInput', message: 'File not found' },
      });
      const result = await validateFileOptions('nonexistent.csv');
      expect(result).toEqual({ success: false, error: { type: 'InvalidInput', message: 'File not found' } });
    });
  });

  describe('mergeOptions', () => {
    it('should merge CLI options, file options, and defaults correctly', () => {
      const cliOptions = { players: ['Alice', 'Bob'], numRounds: 3 };
      const fileOptions = { startRound: 2, order: 'random' as const };
      const result = mergeOptions({ cliOptions, fileOptions });
      expect(result).toEqual({
        ...CLI_OPTION_DEFAULTS,
        ...fileOptions,
        ...cliOptions,
      });
    });

    it('should prioritize CLI options over file options and defaults', () => {
      const cliOptions = { players: ['Alice', 'Bob'], numRounds: 3 };
      const fileOptions = { players: ['Charlie', 'David'], startRound: 2 };
      const result = mergeOptions({ cliOptions, fileOptions });
      expect(result.players).toEqual(['Alice', 'Bob']);
      expect(result.numRounds).toBe(3);
      expect(result.startRound).toBe(2);
    });
  });

  describe('preparePlayers', () => {
    beforeEach(() => {
      jest.spyOn(utils, 'shuffle').mockImplementation((arr) => arr.slice().reverse());
      jest.spyOn(utils, 'reverse').mockImplementation((arr) => arr.slice().reverse());
    });

    it('should return players in original order for top-down', () => {
      const players = ['Alice', 'Bob', 'Charlie', 'David'];
      const result = preparePlayers({ players, order: 'top-down' });
      expect(result).toEqual(players);
    });

    it('should return players in reverse order for bottom-up', () => {
      const players = ['Alice', 'Bob', 'Charlie', 'David'];
      const result = preparePlayers({ players, order: 'bottom-up' });
      expect(result).toEqual(['David', 'Charlie', 'Bob', 'Alice']);
    });

    it('should shuffle players for random order', () => {
      const players = ['Alice', 'Bob', 'Charlie', 'David'];
      const result = preparePlayers({ players, order: 'random' });
      expect(result).toEqual(['David', 'Charlie', 'Bob', 'Alice']);
      expect(utils.shuffle).toHaveBeenCalledWith(players);
    });

    it('should add BYE player for odd number of players', () => {
      const players = ['Alice', 'Bob', 'Charlie'];
      const result = preparePlayers({ players, order: 'top-down' });
      expect(result).toEqual(['Alice', 'Bob', 'Charlie', BYE_PLAYER]);
    });
  });

  describe('addByePlayerIfNecessary', () => {
    it('should add BYE player for odd number of players', () => {
      const players = ['Alice', 'Bob', 'Charlie'];
      const result = addByePlayerIfNecessary(players);
      expect(result).toEqual(['Alice', 'Bob', 'Charlie', BYE_PLAYER]);
    });

    it('should not add BYE player for even number of players', () => {
      const players = ['Alice', 'Bob', 'Charlie', 'David'];
      const result = addByePlayerIfNecessary(players);
      expect(result).toEqual(players);
    });

    it('should handle empty array', () => {
      const players: readonly string[] = [];
      const result = addByePlayerIfNecessary(players);
      expect(result).toEqual([]);
    });
  });
});
