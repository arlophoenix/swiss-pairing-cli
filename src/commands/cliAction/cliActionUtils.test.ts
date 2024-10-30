import * as fileParser from '../../parsers/fileParser.js';
import * as utils from '../../utils/utils.js';

import { BYE_TEAM, CLI_OPTION_DEFAULTS } from '../../constants.js';
import { Result, Team, ValidatedCLIOptions } from '../../types/types.js';
import {
  addByeTeamIfNecessary,
  createSquadMap,
  mergeOptions,
  prepareTeams,
  validateFileOptions,
} from './cliActionUtils.js';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { SpyInstance } from 'jest-mock';

describe('cliUtils', () => {
  describe('validateFileOptions', () => {
    let mockParseFile: SpyInstance<typeof fileParser.parseFile>;

    beforeEach(() => {
      const result: Result<Partial<ValidatedCLIOptions>> = {
        success: true,
        value: {
          teams: [
            { name: 'Alice', squad: undefined },
            { name: 'Bob', squad: undefined },
          ],
        },
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
      mockParseFile.mockResolvedValue({
        success: true,
        value: {
          teams: [
            { name: 'Alice', squad: undefined },
            { name: 'Bob', squad: undefined },
          ],
        },
      });
      const result = await validateFileOptions('test.csv');
      expect(result).toEqual({
        success: true,
        value: {
          teams: [
            { name: 'Alice', squad: undefined },
            { name: 'Bob', squad: undefined },
          ],
        },
      });
      expect(mockParseFile).toHaveBeenCalledWith('test.csv');
    });

    it('should return failure when file parsing fails', async () => {
      jest.spyOn(fileParser, 'parseFile').mockResolvedValue({
        success: false,
        message: 'File not found',
      });

      const result = await validateFileOptions('nonexistent.csv');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toBe('File not found');
      }
    });
  });

  describe('mergeOptions', () => {
    it('should merge CLI options, file options, and defaults correctly', () => {
      const cliOptions = {
        teams: [
          { name: 'Alice', squad: undefined },
          { name: 'Bob', squad: undefined },
        ],
        numRounds: 3,
      };
      const fileOptions = { startRound: 2, order: 'random' as const };
      const result = mergeOptions({ cliOptions, fileOptions });
      expect(result).toEqual({
        ...CLI_OPTION_DEFAULTS,
        ...fileOptions,
        ...cliOptions,
      });
    });

    it('should prioritize CLI options over file options and defaults', () => {
      const cliOptions = {
        teams: [
          { name: 'Alice', squad: undefined },
          { name: 'Bob', squad: undefined },
        ],
        numRounds: 3,
      };
      const fileOptions = {
        teams: [
          { name: 'Charlie', squad: undefined },
          { name: 'David', squad: undefined },
        ],
        startRound: 2,
      };
      const result = mergeOptions({ cliOptions, fileOptions });
      expect(result.teams).toEqual([
        { name: 'Alice', squad: undefined },
        { name: 'Bob', squad: undefined },
      ]);
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

  describe('createSquadMap', () => {
    it('should create a map of team names to squad names', () => {
      const teams = [
        { name: 'Alice', squad: 'A' },
        { name: 'Bob', squad: 'B' },
        { name: 'Charlie', squad: 'A' },
        { name: 'David', squad: 'B' },
      ];
      const result = createSquadMap(teams);
      expect(result).toEqual(
        new Map([
          ['Alice', 'A'],
          ['Bob', 'B'],
          ['Charlie', 'A'],
          ['David', 'B'],
        ])
      );
    });

    it('should handle teams without squad information', () => {
      const teams = [
        { name: 'Alice', squad: 'A' },
        { name: 'Bob', squad: undefined },
        { name: 'Charlie', squad: 'C' },
        { name: 'David', squad: undefined },
      ];
      const result = createSquadMap(teams);
      expect(result).toEqual(
        new Map([
          ['Alice', 'A'],
          ['Charlie', 'C'],
        ])
      );
    });

    it('should return an empty map for empty input', () => {
      const teams: readonly Team[] = [];
      const result = createSquadMap(teams);
      expect(result).toEqual(new Map());
    });
  });
});
