import * as generateRoundsCommand from '../generateRounds/generateRoundsCommand.js';
import * as outputFormatter from '../../formatters/outputFormatter.js';
import * as processInputCommand from '../processInput/processInputCommand.js';

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { ProcessInputCommandOutputSuccess } from '../commandTypes.js';
import { Round } from '../../types/types.js';
import { handleCorePipelineCommand } from './corePipelineCommand.js';

jest.mock('../processInput/processInputCommand.js');
jest.mock('../generateRounds/generateRoundsCommand.js');
jest.mock('../../formatters/outputFormatter.js');

describe('handleCorePipelineCommand', () => {
  let mockProcessOutput: ProcessInputCommandOutputSuccess;
  let mockRounds: { readonly rounds: readonly Round[] };

  beforeEach(() => {
    mockProcessOutput = {
      teams: ['Alice', 'Bob'],
      numRounds: 1,
      startRound: 1,
      matches: [],
      squadMap: new Map([
        ['Alice', 'A'],
        ['Bob', 'B'],
      ]),
      format: 'text-markdown',
      order: 'top-down',
    };

    mockRounds = {
      rounds: [
        {
          label: 'Round 1',
          number: 1,
          matches: [['Alice', 'Bob']],
        },
      ],
    };

    jest.spyOn(processInputCommand, 'handleProcessInput').mockResolvedValue({
      success: true,
      value: mockProcessOutput,
    });

    jest.spyOn(generateRoundsCommand, 'handleGenerateRounds').mockReturnValue({
      success: true,
      value: mockRounds,
    });

    jest.spyOn(outputFormatter, 'formatOutput').mockReturnValue('Round 1:\nAlice vs Bob');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should handle command successfully', async () => {
    const result = await handleCorePipelineCommand({
      teams: ['Alice [A]', 'Bob [B]'],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBe('Round 1:\nAlice vs Bob');
    }

    expect(processInputCommand.handleProcessInput).toHaveBeenCalledWith({
      teams: ['Alice [A]', 'Bob [B]'],
    });

    expect(generateRoundsCommand.handleGenerateRounds).toHaveBeenCalledWith({
      teams: ['Alice', 'Bob'],
      numRounds: 1,
      startRound: 1,
      matches: [],
      squadMap: new Map([
        ['Alice', 'A'],
        ['Bob', 'B'],
      ]),
    });

    expect(outputFormatter.formatOutput).toHaveBeenCalledWith({
      results: mockRounds,
      format: 'text-markdown',
    });
  });

  describe('bottom-up match sorting', () => {
    it('sorts matches highest-rank-first when order is bottom-up', async () => {
      // teams in bottom-up order (reversed): orderedTeams = [...teams].reverse() = ['A', 'B', 'C', 'D']
      // algorithm returns bottom-first: [C,D], [A,B] → sorted: [A,B], [C,D]
      jest.spyOn(processInputCommand, 'handleProcessInput').mockResolvedValue({
        success: true,
        value: {
          ...mockProcessOutput,
          teams: ['D', 'C', 'B', 'A'],
          order: 'bottom-up',
        },
      });

      jest.spyOn(generateRoundsCommand, 'handleGenerateRounds').mockReturnValue({
        success: true,
        value: {
          rounds: [
            {
              label: 'Round 1',
              number: 1,
              matches: [
                ['C', 'D'],
                ['A', 'B'],
              ] as readonly (readonly [string, string])[],
            },
          ],
        },
      });

      await handleCorePipelineCommand({});

      expect(outputFormatter.formatOutput).toHaveBeenCalledWith({
        results: {
          rounds: [
            {
              label: 'Round 1',
              number: 1,
              matches: [
                ['A', 'B'],
                ['C', 'D'],
              ],
            },
          ],
        },
        format: 'text-markdown',
      });
    });

    it('passes rounds through unchanged for top-down order', async () => {
      jest.spyOn(processInputCommand, 'handleProcessInput').mockResolvedValue({
        success: true,
        value: { ...mockProcessOutput, order: 'top-down' },
      });

      jest.spyOn(generateRoundsCommand, 'handleGenerateRounds').mockReturnValue({
        success: true,
        value: mockRounds,
      });

      await handleCorePipelineCommand({});

      expect(outputFormatter.formatOutput).toHaveBeenCalledWith({
        results: mockRounds,
        format: 'text-markdown',
      });
    });

    it('passes rounds through unchanged for random order', async () => {
      jest.spyOn(processInputCommand, 'handleProcessInput').mockResolvedValue({
        success: true,
        value: { ...mockProcessOutput, order: 'random' },
      });

      jest.spyOn(generateRoundsCommand, 'handleGenerateRounds').mockReturnValue({
        success: true,
        value: mockRounds,
      });

      await handleCorePipelineCommand({});

      expect(outputFormatter.formatOutput).toHaveBeenCalledWith({
        results: mockRounds,
        format: 'text-markdown',
      });
    });
  });

  it('should fail when process input fails', async () => {
    jest.spyOn(processInputCommand, 'handleProcessInput').mockResolvedValue({
      success: false,
      message: 'Process input failed',
    });

    const result = await handleCorePipelineCommand({
      teams: ['Alice'],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toBe('Process input failed');
    }

    expect(generateRoundsCommand.handleGenerateRounds).not.toHaveBeenCalled();
    expect(outputFormatter.formatOutput).not.toHaveBeenCalled();
  });

  it('should fail when round generation fails', async () => {
    jest.spyOn(generateRoundsCommand, 'handleGenerateRounds').mockReturnValue({
      success: false,
      message: 'Cannot generate rounds',
    });

    const result = await handleCorePipelineCommand({
      teams: ['Alice', 'Bob'],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toBe('Cannot generate rounds');
    }

    expect(outputFormatter.formatOutput).not.toHaveBeenCalled();
  });
});
