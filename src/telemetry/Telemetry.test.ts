import * as telemetryUtils from './telemetryUtils.js';
import * as utils from '../utils/utils.js';

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { Config } from '../Config.js';
import type { SpyInstance } from 'jest-mock';
import { Telemetry } from './Telemetry.js';
import { TelemetryEvent } from './telemetryTypes.js';

jest.mock('posthog-node');
jest.mock('process');

describe('Telemetry', () => {
  const mockConfig = {
    getPosthogApiKey: jest.fn<() => string>().mockReturnValue('test-api-key'),
    getTelemetryOptOut: jest.fn<() => boolean>().mockReturnValue(false),
  } as unknown as Config;

  let mockDetectExecutionContext: SpyInstance<typeof utils.detectExecutionContext>;
  let mockGetEnvironmentContext: SpyInstance<typeof telemetryUtils.getEnvironmentContext>;

  beforeEach(() => {
    // Reset singleton between tests
    // @ts-expect-error accessing private for tests
    // eslint-disable-next-line functional/immutable-data
    Telemetry.instance = null;

    // Mock config to enable telemetry
    jest.spyOn(Config, 'getInstance').mockReturnValue(mockConfig);

    // Mock FirstRunManager to not show notice
    jest.mock('./FirstRunManager.js', () => ({
      FirstRunManager: jest.fn().mockImplementation(() => ({
        shouldShowTelemetryNotice: () => false,
      })),
    }));

    // eslint-disable-next-line max-params
    jest.spyOn(process, 'on').mockImplementation((_event, _listener) => process);

    mockDetectExecutionContext = jest.spyOn(utils, 'detectExecutionContext');
    mockGetEnvironmentContext = jest.spyOn(telemetryUtils, 'getEnvironmentContext');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getInstance', () => {
    it('should create a new instance when first called', () => {
      const instance = Telemetry.getInstance();
      expect(instance).toBeInstanceOf(Telemetry);
    });

    it('should return the same instance on subsequent calls', () => {
      const instance1 = Telemetry.getInstance();
      const instance2 = Telemetry.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should register process exit handler only once', () => {
      const processOnSpy = jest.spyOn(process, 'on');

      Telemetry.getInstance(); // First call
      expect(processOnSpy).toHaveBeenCalledTimes(1);
      expect(processOnSpy).toHaveBeenCalledWith('exit', expect.any(Function));

      Telemetry.getInstance(); // Second call
      expect(processOnSpy).toHaveBeenCalledTimes(1); // Still only called once
    });
  });

  describe('record', () => {
    const commandInvokedEvent: TelemetryEvent = {
      name: 'command_invoked',
      properties: {
        command_name: 'generate',
        args_provided: {
          file: true,
          format: true,
          matches: false,
          numRounds: true,
          order: true,
          startRound: false,
          teams: true,
        },
        teams_count: 4,
        squad_count: 2,
        rounds_count: 3,
        start_round: 1,
        order: 'random',
        format: 'text-markdown',
      },
    };

    const commandSucceededEvent: TelemetryEvent = {
      name: 'command_succeeded',
      properties: {
        command_name: 'generate',
        duration_ms: 123,
      },
    };

    const commandFailedEvent: TelemetryEvent = {
      name: 'command_failed',
      properties: {
        command_name: 'generate',
        error_name: 'ValidationError',
        error_message: 'Invalid team count',
        duration_ms: 45,
      },
    };

    beforeEach(() => {
      // Mock setTimeout to execute immediately
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should queue command invoked event', () => {
      const instance = Telemetry.getInstance();
      instance.record(commandInvokedEvent);

      // @ts-expect-error accessing private for tests
      expect(instance.eventQueue).toContainEqual(
        expect.objectContaining({
          name: 'command_invoked',
          properties: expect.objectContaining({
            command_name: 'generate',
            teams_count: 4,
            squad_count: 2,
          }),
        })
      );
    });

    it('should queue command succeeded event', () => {
      const instance = Telemetry.getInstance();
      instance.record(commandSucceededEvent);

      // @ts-expect-error accessing private for tests
      expect(instance.eventQueue).toContainEqual(
        expect.objectContaining({
          name: 'command_succeeded',
          properties: expect.objectContaining({
            command_name: 'generate',
            duration_ms: 123,
          }),
        })
      );
    });

    it('should queue command failed event', () => {
      const instance = Telemetry.getInstance();
      instance.record(commandFailedEvent);

      // @ts-expect-error accessing private for tests
      expect(instance.eventQueue).toContainEqual(
        expect.objectContaining({
          name: 'command_failed',
          properties: expect.objectContaining({
            command_name: 'generate',
            error_name: 'ValidationError',
            error_message: 'Invalid team count',
          }),
        })
      );
    });

    it('should augment events with system context', () => {
      const executionContext = 'npx';
      const environment = 'production';
      mockDetectExecutionContext.mockReturnValue(executionContext);
      mockGetEnvironmentContext.mockReturnValue(environment);

      const instance = Telemetry.getInstance();
      instance.record(commandInvokedEvent);

      expect(mockDetectExecutionContext).toHaveBeenCalled();
      expect(mockGetEnvironmentContext).toHaveBeenCalled();

      // @ts-expect-error accessing private for tests
      expect(instance.eventQueue[0].properties).toEqual(
        expect.objectContaining({
          node_version: expect.any(String),
          os_name: expect.any(String),
          cli_version: expect.any(String),
          execution_context: executionContext,
          environment: environment,
        })
      );
    });
  });

  describe('shutdown', () => {
    it('should flush queued events and close client', async () => {
      const mockShutdown = jest.fn<() => Promise<void>>();
      const mockCapture = jest.fn<() => Promise<void>>().mockResolvedValue();
      const instance = Telemetry.getInstance();

      // Ensure clean state and mock setup before test
      // @ts-expect-error accessing private for tests
      // eslint-disable-next-line functional/immutable-data
      instance.eventQueue = [];
      // @ts-expect-error accessing private for tests
      // eslint-disable-next-line functional/immutable-data
      instance.initialized = true;
      // @ts-expect-error accessing private for tests
      // eslint-disable-next-line functional/immutable-data
      instance.client = {
        shutdown: mockShutdown,
        capture: mockCapture,
      };

      const event: TelemetryEvent = {
        name: 'command_succeeded',
        properties: {
          command_name: 'generate',
          duration_ms: 123,
        },
      };

      instance.record(event);
      await instance.shutdown();

      // Verify the event was captured
      expect(mockCapture).toHaveBeenCalledWith({
        distinctId: expect.any(String),
        event: 'command_succeeded',
        properties: expect.objectContaining({
          command_name: 'generate',
          duration_ms: 123,
        }),
      });
      // @ts-expect-error accessing private for tests
      expect(instance.eventQueue).toHaveLength(0);
      expect(mockShutdown).toHaveBeenCalled();
    });

    it('should handle shutdown errors gracefully', async () => {
      const mockShutdown = jest.fn<() => Promise<void>>().mockRejectedValueOnce(new Error('Shutdown failed'));
      const instance = Telemetry.getInstance();
      // @ts-expect-error accessing private for tests
      // eslint-disable-next-line functional/immutable-data
      instance.client = { shutdown: mockShutdown };

      // Should not throw
      await expect(instance.shutdown()).resolves.toBeUndefined();
    });
  });
});
