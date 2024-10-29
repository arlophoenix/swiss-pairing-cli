import * as cliUtils from './cliUtils.js';
import * as outputFormatter from './outputFormatter.js';
import * as swissPairing from '../swiss-pairing/swissPairing.js';
import * as swissValidator from '../swiss-pairing/swissValidator.js';
import * as utils from '../utils/utils.js';
import * as validator from '../validators/cliValidator.js';

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { ReadonlyPlayedOpponents } from '../types/types.js';
import { handleCLIAction } from './cliAction.js';

describe('handleCLIAction', () => {
  // Setup mocks
  beforeEach(() => {
    // Default success responses
    jest.spyOn(validator, 'validateCLIOptions').mockReturnValue({
      success: true,
      value: {
        teams: [
          { name: 'Alice', squad: undefined },
          { name: 'Bob', squad: undefined },
        ],
        numRounds: 1,
        startRound: 1,
      },
    });

    jest.spyOn(cliUtils, 'validateFileOptions').mockResolvedValue({
      success: true,
      value: {},
    });

    jest.spyOn(cliUtils, 'mergeOptions').mockReturnValue({
      teams: [
        { name: 'Alice', squad: undefined },
        { name: 'Bob', squad: undefined },
      ],
      numRounds: 1,
      startRound: 1,
      order: 'top-down',
      matches: [],
      format: 'text-markdown',
      file: '',
    });

    jest.spyOn(cliUtils, 'prepareTeams').mockReturnValue(['Alice', 'Bob']);
    jest.spyOn(utils, 'createBidirectionalMap').mockReturnValue(new Map() as ReadonlyPlayedOpponents);
    jest.spyOn(cliUtils, 'createSquadMap').mockReturnValue(new Map());

    jest.spyOn(swissValidator, 'validateRoundMatchesInput').mockReturnValue({
      success: true,
    });

    jest.spyOn(swissPairing, 'generateRoundMatches').mockReturnValue({
      success: true,
      value: { 'Round 1': [['Alice', 'Bob']] },
    });

    jest.spyOn(swissValidator, 'validateRoundMatchesOutput').mockReturnValue({
      success: true,
    });

    jest.spyOn(outputFormatter, 'formatOutput').mockReturnValue('Round 1:\nAlice vs Bob');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should successfully generate matches', async () => {
    const result = await handleCLIAction({
      teams: ['Alice', 'Bob'],
      numRounds: '1',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBe('Round 1:\nAlice vs Bob');
    }
  });

  describe('input validation', () => {
    it('should fail on invalid CLI options', async () => {
      jest.spyOn(validator, 'validateCLIOptions').mockReturnValue({
        success: false,
        message: 'Invalid number of teams',
      });

      const result = await handleCLIAction({ teams: ['Alice'] });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toBe('Invalid number of teams');
      }
    });

    it('should fail on invalid file input', async () => {
      jest.spyOn(cliUtils, 'validateFileOptions').mockResolvedValue({
        success: false,
        message: 'Invalid file format',
      });

      const result = await handleCLIAction({ file: 'invalid.txt' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toBe('Invalid file format');
      }
    });

    it('should fail on invalid input', async () => {
      jest.spyOn(swissValidator, 'validateRoundMatchesInput').mockReturnValue({
        success: false,
        message: 'Must have an even number of teams',
      });

      const result = await handleCLIAction({
        teams: ['Alice', 'Bob', 'Charlie'],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toBe('Invalid input: Must have an even number of teams');
      }
    });
  });

  describe('match generation', () => {
    it('should fail when no valid pairings possible', async () => {
      jest.spyOn(swissPairing, 'generateRoundMatches').mockReturnValue({
        success: false,
        message: 'No valid pairings possible for Round 1',
      });

      const result = await handleCLIAction({
        teams: ['Alice', 'Bob'],
        numRounds: '1',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toBe('Failed to generate matches: No valid pairings possible for Round 1');
      }
    });

    it('should fail if generated matches are invalid', async () => {
      jest.spyOn(swissValidator, 'validateRoundMatchesOutput').mockReturnValue({
        success: false,
        message: 'Alice and Bob have already played each other',
      });

      const result = await handleCLIAction({
        teams: ['Alice', 'Bob'],
        numRounds: '1',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toBe(
          'Failed to generate matches: Alice and Bob have already played each other'
        );
      }
    });
  });

  describe('squad constraints', () => {
    it('should handle team squads correctly', async () => {
      // Override default mocks with squad-specific data
      jest.spyOn(validator, 'validateCLIOptions').mockReturnValue({
        success: true,
        value: {
          teams: [
            { name: 'Alice', squad: 'A' },
            { name: 'Bob', squad: 'B' },
          ],
        },
      });

      jest.spyOn(cliUtils, 'mergeOptions').mockReturnValue({
        teams: [
          { name: 'Alice', squad: 'A' },
          { name: 'Bob', squad: 'B' },
        ],
        numRounds: 1,
        startRound: 1,
        order: 'top-down',
        matches: [],
        format: 'text-markdown',
        file: '',
      });

      const squadMap = new Map([
        ['Alice', 'A'],
        ['Bob', 'B'],
      ]);
      jest.spyOn(cliUtils, 'createSquadMap').mockReturnValue(squadMap);

      await handleCLIAction({
        teams: ['Alice [A]', 'Bob [B]'],
      });

      expect(cliUtils.createSquadMap).toHaveBeenCalledWith([
        { name: 'Alice', squad: 'A' },
        { name: 'Bob', squad: 'B' },
      ]);

      expect(swissPairing.generateRoundMatches).toHaveBeenCalledWith(
        expect.objectContaining({
          squadMap,
        })
      );
    });
  });

  describe('previous matches', () => {
    it('should handle previously played matches', async () => {
      // Override mocks with match-specific data
      jest.spyOn(validator, 'validateCLIOptions').mockReturnValue({
        success: true,
        value: {
          teams: [
            { name: 'Alice', squad: undefined },
            { name: 'Bob', squad: undefined },
            { name: 'Charlie', squad: undefined },
            { name: 'David', squad: undefined },
          ],
          matches: [['Alice', 'Bob']],
        },
      });

      jest.spyOn(cliUtils, 'mergeOptions').mockReturnValue({
        teams: [
          { name: 'Alice', squad: undefined },
          { name: 'Bob', squad: undefined },
          { name: 'Charlie', squad: undefined },
          { name: 'David', squad: undefined },
        ],
        numRounds: 1,
        startRound: 1,
        order: 'top-down',
        matches: [['Alice', 'Bob']],
        format: 'text-markdown',
        file: '',
      });

      const playedOpponents = new Map([
        ['Alice', new Set(['Bob'])],
        ['Bob', new Set(['Alice'])],
      ]);
      jest.spyOn(utils, 'createBidirectionalMap').mockReturnValue(playedOpponents);

      await handleCLIAction({
        teams: ['Alice', 'Bob', 'Charlie', 'David'],
        matches: [['Alice', 'Bob']],
      });

      // Verify played matches were created correctly
      expect(utils.createBidirectionalMap).toHaveBeenCalledWith([['Alice', 'Bob']]);
      expect(swissPairing.generateRoundMatches).toHaveBeenCalledWith(
        expect.objectContaining({
          playedOpponents,
        })
      );
    });
  });
});
