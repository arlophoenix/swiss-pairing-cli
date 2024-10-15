import * as fileParser from '../parsers/fileParser.js';
import * as utils from '../utils/utils.js';

import { BYE_TEAM, CLI_OPTION_DEFAULTS } from '../constants.js';
import { Result, ValidatedCLIOptions } from '../types/types.js';
import { addByeTeamIfNecessary, mergeOptions, prepareTeams, validateFileOptions } from './cliActionUtils.js';
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
        value: { teams: ['Alice', 'Bob'] },
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
      mockParseFile.mockResolvedValue({ success: true, value: { teams: ['Alice', 'Bob'] } });
      const result = await validateFileOptions('test.csv');
      expect(result).toEqual({ success: true, value: { teams: ['Alice', 'Bob'] } });
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
      const cliOptions = { teams: ['Alice', 'Bob'], numRounds: 3 };
      const fileOptions = { startRound: 2, order: 'random' as const };
      const result = mergeOptions({ cliOptions, fileOptions });
      expect(result).toEqual({
        ...CLI_OPTION_DEFAULTS,
        ...fileOptions,
        ...cliOptions,
      });
    });

    it('should prioritize CLI options over file options and defaults', () => {
      const cliOptions = { teams: ['Alice', 'Bob'], numRounds: 3 };
      const fileOptions = { teams: ['Charlie', 'David'], startRound: 2 };
      const result = mergeOptions({ cliOptions, fileOptions });
      expect(result.teams).toEqual(['Alice', 'Bob']);
      expect(result.numRounds).toBe(3);
      expect(result.startRound).toBe(2);
    });
  });

  describe('prepareTeams', () => {
    beforeEach(() => {
      jest.spyOn(utils, 'shuffle').mockImplementation((arr) => arr.slice().reverse());
      jest.spyOn(utils, 'reverse').mockImplementation((arr) => arr.slice().reverse());
    });

    it('should return teams in original order for top-down', () => {
      const teams = ['Alice', 'Bob', 'Charlie', 'David'];
      const result = prepareTeams({ teams, order: 'top-down' });
      expect(result).toEqual(teams);
    });

    it('should return teams in reverse order for bottom-up', () => {
      const teams = ['Alice', 'Bob', 'Charlie', 'David'];
      const result = prepareTeams({ teams, order: 'bottom-up' });
      expect(result).toEqual(['David', 'Charlie', 'Bob', 'Alice']);
    });

    it('should shuffle teams for random order', () => {
      const teams = ['Alice', 'Bob', 'Charlie', 'David'];
      const result = prepareTeams({ teams, order: 'random' });
      expect(result).toEqual(['David', 'Charlie', 'Bob', 'Alice']);
      expect(utils.shuffle).toHaveBeenCalledWith(teams);
    });

    it('should add BYE team for odd number of teams', () => {
      const teams = ['Alice', 'Bob', 'Charlie'];
      const result = prepareTeams({ teams, order: 'top-down' });
      expect(result).toEqual(['Alice', 'Bob', 'Charlie', BYE_TEAM]);
    });
  });

  describe('addByeTeamIfNecessary', () => {
    it('should add BYE team for odd number of teams', () => {
      const teams = ['Alice', 'Bob', 'Charlie'];
      const result = addByeTeamIfNecessary(teams);
      expect(result).toEqual(['Alice', 'Bob', 'Charlie', BYE_TEAM]);
    });

    it('should not add BYE team for even number of teams', () => {
      const teams = ['Alice', 'Bob', 'Charlie', 'David'];
      const result = addByeTeamIfNecessary(teams);
      expect(result).toEqual(teams);
    });

    it('should handle empty array', () => {
      const teams: readonly string[] = [];
      const result = addByeTeamIfNecessary(teams);
      expect(result).toEqual([]);
    });
  });
});
