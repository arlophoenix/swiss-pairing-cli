import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { SpyInstance } from 'jest-mock';
import { TelemetryClient } from '../../telemetry/TelemetryClient.js';
import { TelemetryCommand } from './TelemetryCommand.js';

describe('TelemetryCommand', () => {
  let mockRecord: SpyInstance<typeof TelemetryClient.prototype.record>;
  let mockShutdown: SpyInstance<typeof TelemetryClient.prototype.shutdown>;
  let realDateNow: () => number;

  beforeEach(() => {
    mockRecord = jest.spyOn(TelemetryClient.prototype, 'record').mockReturnValue();
    mockShutdown = jest.spyOn(TelemetryClient.prototype, 'shutdown').mockResolvedValue();

    // Mock Date.now() for consistent timestamps
    realDateNow = Date.now;
    const mockNow = 1000;
    // eslint-disable-next-line functional/immutable-data
    global.Date.now = jest.fn(() => mockNow);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // eslint-disable-next-line functional/immutable-data
    global.Date.now = realDateNow;
  });

  describe('constructor', () => {
    it('should initialize with parsed options', () => {
      const options = {
        teams: ['Alice [A]', 'Bob [B]', 'Charlie'],
        numRounds: '3',
        format: 'text-markdown',
      };

      const command = new TelemetryCommand(options);
      expect(command).toBeDefined();
    });
  });

  describe('recordInvocation', () => {
    it('should record command invocation with parsed options', () => {
      const options = {
        teams: ['Alice [A]', 'Bob [B]', 'Charlie'],
        numRounds: '3',
        format: 'text-markdown',
      };

      const command = new TelemetryCommand(options);
      command.recordInvocation();

      expect(mockRecord).toHaveBeenCalledWith({
        name: 'command_invoked',
        properties: {
          args_provided: {
            file: false,
            format: true,
            matches: false,
            numRounds: true,
            order: false,
            startRound: false,
            teams: true,
          },
          teams_count: 3,
          squad_count: 2,
          rounds_count: 3,
          start_round: NaN, // undefined converted to number
          order: undefined,
          format: 'text-markdown',
        },
      });
    });
  });

  describe('recordSuccess', () => {
    it('should record successful command completion with duration', () => {
      const command = new TelemetryCommand({});
      const laterTime = 1500;
      // eslint-disable-next-line functional/immutable-data
      global.Date.now = jest.fn(() => laterTime);

      command.recordSuccess();

      expect(mockRecord).toHaveBeenCalledWith({
        name: 'command_succeeded',
        properties: {
          duration_ms: 500, // 1500 - 1000
        },
      });
    });
  });

  describe('recordValidationFailure', () => {
    it('should record validation failure with error message and duration', () => {
      const command = new TelemetryCommand({});
      const laterTime = 2000;
      // eslint-disable-next-line functional/immutable-data
      global.Date.now = jest.fn(() => laterTime);

      command.recordValidationFailure('Invalid input');

      expect(mockRecord).toHaveBeenCalledWith({
        name: 'command_failed',
        properties: {
          error_name: 'validation_failed',
          error_message: 'Invalid input',
          duration_ms: 1000, // 2000 - 1000
        },
      });
    });
  });

  describe('recordError', () => {
    it('should record unexpected error with error details and duration', () => {
      const command = new TelemetryCommand({});
      const laterTime = 3000;
      // eslint-disable-next-line functional/immutable-data
      global.Date.now = jest.fn(() => laterTime);

      const error = new Error('Unexpected error');
      // eslint-disable-next-line functional/immutable-data
      error.name = 'TypeError';

      command.recordError(error);

      expect(mockRecord).toHaveBeenCalledWith({
        name: 'command_error',
        properties: {
          error_name: 'TypeError',
          error_message: 'Unexpected error',
          duration_ms: 2000, // 3000 - 1000
        },
      });
    });
  });

  describe('shutdown', () => {
    it('should call telemetry shutdown', async () => {
      const command = new TelemetryCommand({});
      await command.shutdown();

      expect(mockShutdown).toHaveBeenCalled();
    });
  });
});
