import * as fileParser from '../parsers/fileParser.js';
import * as utils from '../utils/utils.js';

import { BYE_TEAM, CLI_OPTION_DEFAULTS } from '../constants.js';
import { Result, ValidatedCLIOptions } from '../types/types.js';
import {
  addByeTeamIfNecessary,
  createSquadMap,
  mergeOptions,
  prepareTeams,
  validateFileOptions,
} from './cliUtils.js';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { SpyInstance } from 'jest-mock';

describe('cliUtils', () => {
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

  describe('createSquadMap', () => {
    beforeEach(() => {
      jest.unmock('@jest/globals');
    });

    it('should create a map of team names to squad names', () => {
      const teams = ['Alice [A]', 'Bob [B]', 'Charlie [A]', 'David [B]'];
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
      const teams = ['Alice [A]', 'Bob', 'Charlie [C]', 'David'];
      const result = createSquadMap(teams);
      expect(result).toEqual(
        new Map([
          ['Alice', 'A'],
          ['Charlie', 'C'],
        ])
      );
    });

    it('should return an empty map for empty input', () => {
      const teams: readonly string[] = [];
      const result = createSquadMap(teams);
      expect(result).toEqual(new Map());
    });

    it('should handle mixed case in team and squad names', () => {
      const teams = ['Alice [TeamA]', 'BOB [teamB]', 'Charlie [TEAMC]'];
      const result = createSquadMap(teams);
      expect(result).toEqual(
        new Map([
          ['Alice', 'TeamA'],
          ['BOB', 'teamB'],
          ['Charlie', 'TEAMC'],
        ])
      );
    });

    it('should handle squad names with spaces', () => {
      const teams = ['Alice [Team A]', 'Bob [Team B]'];
      const result = createSquadMap(teams);
      expect(result).toEqual(
        new Map([
          ['Alice', 'Team A'],
          ['Bob', 'Team B'],
        ])
      );
    });

    it('should ignore malformed team inputs', () => {
      const teams = ['Alice [A]', 'Bob [B', 'Charlie] [C]', 'David []'];
      const result = createSquadMap(teams);
      expect(result).toEqual(new Map([['Alice', 'A']]));
    });
  });
});
