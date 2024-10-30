import * as cliUtils from './cliUtils.js';
import * as outputFormatter from './outputFormatter.js';
import * as swissPairing from '../swiss-pairing/swissPairing.js';
import * as swissValidator from '../swiss-pairing/swissValidator.js';
import * as utils from '../utils/utils.js';
import * as validator from '../validators/cliValidator.js';

import { ReadonlyPlayedTeams, SwissPairingResult } from '../types/types.js';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { handleCLIAction } from './cliAction.js';

describe('handleCLIAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mockResult
    const mockResult: SwissPairingResult = {
      rounds: [
        {
          label: 'Round 1',
          number: 1,
          matches: [['Alice', 'Bob']],
        },
      ],
    };

    // Default mocks
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
    jest.spyOn(utils, 'createBidirectionalMap').mockReturnValue(new Map());
    jest.spyOn(cliUtils, 'createSquadMap').mockReturnValue(new Map());

    jest.spyOn(swissPairing, 'generateRounds').mockReturnValue({
      success: true,
      value: mockResult,
    });

    jest.spyOn(swissValidator, 'validateGenerateRoundsOutput').mockReturnValue({
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

  describe('squad constraints', () => {
    it('should handle team squads correctly', async () => {
      const squadMap = new Map([
        ['Alice', 'A'],
        ['Bob', 'B'],
      ]);

      // Override specific mocks for this test
      jest.spyOn(validator, 'validateCLIOptions').mockReturnValue({
        success: true,
        value: {
          teams: [
            { name: 'Alice', squad: 'A' },
            { name: 'Bob', squad: 'B' },
          ],
        },
      });

      jest.spyOn(cliUtils, 'createSquadMap').mockReturnValue(squadMap);

      const mockSquadResult: SwissPairingResult = {
        rounds: [
          {
            label: 'Round 1',
            number: 1,
            matches: [['Alice', 'Bob']],
          },
        ],
      };

      jest.spyOn(swissPairing, 'generateRounds').mockReturnValue({
        success: true,
        value: mockSquadResult,
      });

      await handleCLIAction({
        teams: ['Alice [A]', 'Bob [B]'],
      });

      expect(swissPairing.generateRounds).toHaveBeenCalledWith(
        expect.objectContaining({
          squadMap,
        })
      );

      expect(swissValidator.validateGenerateRoundsOutput).toHaveBeenCalledWith({
        rounds: mockSquadResult.rounds,
        teams: ['Alice', 'Bob'],
        numRounds: 1,
        startRound: 1,
        playedTeams: new Map(),
        squadMap,
      });
    });
  });

  describe('previous matches', () => {
    it('should handle previously played matches', async () => {
      const matches = [['Alice', 'Bob']] as const;

      jest.spyOn(validator, 'validateCLIOptions').mockReturnValue({
        success: true,
        value: {
          teams: [
            { name: 'Alice', squad: undefined },
            { name: 'Bob', squad: undefined },
            { name: 'Charlie', squad: undefined },
            { name: 'David', squad: undefined },
          ],
          matches,
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
        matches,
        format: 'text-markdown',
        file: '',
      });

      const playedTeams = new Map([
        ['Alice', new Set(['Bob'])],
        ['Bob', new Set(['Alice'])],
      ]) as ReadonlyPlayedTeams;

      jest.spyOn(cliUtils, 'prepareTeams').mockReturnValue(['Alice', 'Bob', 'Charlie', 'David']);

      jest.spyOn(utils, 'createBidirectionalMap').mockReturnValue(playedTeams);

      const mockWithPlayedResult: SwissPairingResult = {
        rounds: [
          {
            label: 'Round 1',
            number: 1,
            matches: [
              ['Alice', 'Charlie'],
              ['Bob', 'David'],
            ],
          },
        ],
      };

      jest.spyOn(swissPairing, 'generateRounds').mockReturnValue({
        success: true,
        value: mockWithPlayedResult,
      });

      await handleCLIAction({
        teams: ['Alice', 'Bob', 'Charlie', 'David'],
        matches: [['Alice', 'Bob']],
      });

      expect(utils.createBidirectionalMap).toHaveBeenCalledWith(matches);

      expect(swissPairing.generateRounds).toHaveBeenCalledWith(
        expect.objectContaining({
          playedTeams,
        })
      );

      expect(swissValidator.validateGenerateRoundsOutput).toHaveBeenCalledWith({
        rounds: mockWithPlayedResult.rounds,
        teams: ['Alice', 'Bob', 'Charlie', 'David'],
        numRounds: 1,
        startRound: 1,
        playedTeams,
        squadMap: new Map(),
      });
    });
  });

  describe('error cases', () => {
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

    it('should fail on invalid input validation', async () => {
      jest.spyOn(swissValidator, 'validateGenerateRoundsInput').mockReturnValue({
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

    it('should fail on invalid output validation', async () => {
      jest.spyOn(swissValidator, 'validateGenerateRoundsInput').mockReturnValue({
        success: true,
      });

      jest.spyOn(swissValidator, 'validateGenerateRoundsOutput').mockReturnValue({
        success: false,
        message: 'Teams from same squad paired',
      });

      const result = await handleCLIAction({
        teams: ['Alice [A]', 'Bob [A]'],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toBe('Failed to generate matches: Teams from same squad paired');
      }
    });
  });
});
