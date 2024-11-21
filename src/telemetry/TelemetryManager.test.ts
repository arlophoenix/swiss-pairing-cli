import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { SpyInstance } from 'jest-mock';
import { TelemetryClient } from './TelemetryClient.js';
import { TelemetryManager } from './TelemetryManager.js';

describe('TelemetryManager', () => {
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
    it('should initialize telemetry when shouldShowTelemetryNotice is false', () => {
      const command = new TelemetryManager({
        shouldShowTelemetryNotice: false,
      });

      const options = {
        teams: ['Alice [A]', 'Bob [B]', 'Charlie'],
        numRounds: '3',
        format: 'text-markdown',
      };
      command.recordInvocation(options);
      expect(mockRecord).toHaveBeenCalled();
    });

    it('should disable telemetry when shouldShowTelemetryNotice is true', () => {
      const command = new TelemetryManager({
        shouldShowTelemetryNotice: true,
      });

      const options = {
        teams: ['Alice [A]', 'Bob [B]', 'Charlie'],
        numRounds: '3',
        format: 'text-markdown',
      };
      command.recordInvocation(options);
      expect(mockRecord).not.toHaveBeenCalled();
    });
  });

  describe('recordInvocation', () => {
    it('should record command invocation with parsed options', () => {
      const command = new TelemetryManager({ shouldShowTelemetryNotice: false });
      const options = {
        teams: ['Alice [A]', 'Bob [B]', 'Charlie'],
        numRounds: '3',
        format: 'text-markdown',
      };

      command.recordInvocation(options);

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
      const command = new TelemetryManager({
        shouldShowTelemetryNotice: false,
      });

      const laterTime = 1500;
      // eslint-disable-next-line functional/immutable-data
      global.Date.now = jest.fn(() => laterTime);

      command.recordSuccess();

      expect(mockRecord).toHaveBeenCalledWith({
        name: 'command_succeeded',
        properties: {
          duration_ms: 500,
        },
      });
    });
  });

  describe('recordValidationFailure', () => {
    it('should record validation failure with duration', () => {
      const command = new TelemetryManager({
        shouldShowTelemetryNotice: false,
      });

      const laterTime = 2000;
      // eslint-disable-next-line functional/immutable-data
      global.Date.now = jest.fn(() => laterTime);

      command.recordValidationFailure();

      expect(mockRecord).toHaveBeenCalledWith({
        name: 'command_failed',
        properties: {
          error_name: 'validation_failed',
          duration_ms: 1000,
        },
      });
    });
  });

  describe('recordError', () => {
    it('should record unexpected error with details and duration', () => {
      const command = new TelemetryManager({
        shouldShowTelemetryNotice: false,
      });

      const laterTime = 3000;
      // eslint-disable-next-line functional/immutable-data
      global.Date.now = jest.fn(() => laterTime);

      const error = new Error('Unexpected error');
      // eslint-disable-next-line functional/immutable-data
      error.name = 'TypeError';

      command.recordError(error);

      expect(mockRecord).toHaveBeenCalledWith({
        name: 'command_errored',
        properties: {
          error_name: 'TypeError',
          error_message: 'Unexpected error',
          duration_ms: 2000,
        },
      });
    });
  });

  describe('shutdown', () => {
    it('should call telemetry shutdown', async () => {
      const command = new TelemetryManager({
        shouldShowTelemetryNotice: false,
      });

      await command.shutdown();
      expect(mockShutdown).toHaveBeenCalled();
    });

    it('should not call shutdown when telemetry is disabled', async () => {
      const command = new TelemetryManager({
        shouldShowTelemetryNotice: true,
      });

      await command.shutdown();
      expect(mockShutdown).not.toHaveBeenCalled();
    });
  });
});
