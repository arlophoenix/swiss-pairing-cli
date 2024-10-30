import * as swissPairing from '../../swiss-pairing/swissPairing.js';
import * as swissValidator from '../../swiss-pairing/swissValidator.js';

import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { SwissPairingResult } from '../../types/types.js';
import { handleGenerateRounds } from './generateRounds.js';

jest.mock('../../swiss-pairing/swissPairing.js');
jest.mock('../../swiss-pairing/swissValidator.js');

describe('Generate Rounds Command', () => {
  const defaultCommand = {
    teams: ['Alice', 'Bob'],
    numRounds: 1,
    startRound: 1,
    squadMap: new Map(),
  };

  const mockRounds: SwissPairingResult = {
    rounds: [
      {
        label: 'Round 1',
        number: 1,
        matches: [['Alice', 'Bob']],
      },
    ],
  };

  beforeEach(() => {
    jest.spyOn(swissValidator, 'validateGenerateRoundsInput').mockReturnValue({ success: true });

    jest.spyOn(swissPairing, 'generateRounds').mockReturnValue({ success: true, value: mockRounds });

    jest.spyOn(swissValidator, 'validateGenerateRoundsOutput').mockReturnValue({ success: true });
  });

  it('should generate tournament rounds successfully', () => {
    const result = handleGenerateRounds(defaultCommand);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual(mockRounds);
    }
  });

  it('should reject invalid input', () => {
    jest
      .spyOn(swissValidator, 'validateGenerateRoundsInput')
      .mockReturnValue({ success: false, message: 'Invalid team count' });

    const result = handleGenerateRounds(defaultCommand);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toContain('Invalid team count');
    }
  });

  it('should handle swiss pairing failure', () => {
    jest
      .spyOn(swissPairing, 'generateRounds')
      .mockReturnValue({ success: false, message: 'No valid pairings' });

    const result = handleGenerateRounds(defaultCommand);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toContain('No valid pairings');
    }
  });

  it('should reject invalid output', () => {
    jest
      .spyOn(swissValidator, 'validateGenerateRoundsOutput')
      .mockReturnValue({ success: false, message: 'Invalid pairs' });

    const result = handleGenerateRounds(defaultCommand);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toContain('Invalid pairs');
    }
  });

  it('should respect squad constraints', () => {
    const commandWithSquads = {
      ...defaultCommand,
      squadMap: new Map([
        ['Alice', 'Home'],
        ['Bob', 'Away'],
      ]),
    };

    handleGenerateRounds(commandWithSquads);

    expect(swissPairing.generateRounds).toHaveBeenCalledWith(
      expect.objectContaining({
        squadMap: new Map([
          ['Alice', 'Home'],
          ['Bob', 'Away'],
        ]),
      })
    );
  });

  it('should handle previous matches', () => {
    const commandWithMatches = {
      ...defaultCommand,
      matches: [['Alice', 'Charlie']] as const,
    };

    handleGenerateRounds(commandWithMatches);

    expect(swissPairing.generateRounds).toHaveBeenCalledWith(
      expect.objectContaining({
        playedTeams: new Map([
          ['Alice', new Set(['Charlie'])],
          ['Charlie', new Set(['Alice'])],
        ]),
      })
    );
  });
});
