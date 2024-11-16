import * as telemetryUtils from './telemetryUtils.js';
import * as utils from '../utils/utils.js';

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { Config } from '../Config.js';
import { PostHog } from 'posthog-node';
import type { SpyInstance } from 'jest-mock';
import { TelemetryClient } from './TelemetryClient.js';
import { TelemetryEvent } from './telemetryTypes.js';

jest.mock('posthog-node');
jest.mock('process');

describe('Telemetry', () => {
  let mockshouldEnableTelemetryClient: SpyInstance<typeof telemetryUtils.shouldEnableTelemetryClient>;
  let mockDetectExecutionContext: SpyInstance<typeof utils.detectExecutionContext>;
  let mockDetectEnvironment: SpyInstance<typeof telemetryUtils.detectEnvironment>;
  let mockProcessOn: SpyInstance<typeof process.on>;

  beforeEach(() => {
    // Mock config to enable telemetry
    jest.spyOn(Config.prototype, 'getPosthogApiKey').mockReturnValue('test-api-key');
    jest.spyOn(Config.prototype, 'getTelemetryOptOut').mockReturnValue(false);

    // eslint-disable-next-line max-params
    mockProcessOn = jest.spyOn(process, 'on').mockImplementation((_event, _listener) => process);

    mockDetectExecutionContext = jest.spyOn(utils, 'detectExecutionContext');
    mockshouldEnableTelemetryClient = jest
      .spyOn(telemetryUtils, 'shouldEnableTelemetryClient')
      .mockReturnValue(true);
    mockDetectEnvironment = jest.spyOn(telemetryUtils, 'detectEnvironment').mockReturnValue('development');
  });

  afterEach(() => {
    TelemetryClient.resetForTesting();
    jest.resetAllMocks();
  });

  describe('getInstance', () => {
    it('should create a new instance when first called', () => {
      const instance = TelemetryClient.getInstance();
      expect(instance).toBeInstanceOf(TelemetryClient);
    });

    it('should return the same instance on subsequent calls', () => {
      const instance1 = TelemetryClient.getInstance();
      const instance2 = TelemetryClient.getInstance();
      expect(instance1).toBe(instance2);
    });

    it.each([true, false])(
      'should use shouldEnableTelemetryClient result: %s',
      (shouldEnableTelemetryClient) => {
        mockshouldEnableTelemetryClient.mockReturnValue(shouldEnableTelemetryClient);
        const instance = TelemetryClient.getInstance();

        // expect(mockConfig.getTelemetryOptOut).toHaveBeenCalled();
        expect(mockshouldEnableTelemetryClient).toHaveBeenCalledWith({
          telemetryOptOut: false,
          apiKeyExists: true,
          environment: 'development',
        });

        // @ts-expect-error accessing private for test
        expect(instance.enabled).toBe(shouldEnableTelemetryClient);
      }
    );

    it('should register process exit handler only once', () => {
      const processOnSpy = jest.spyOn(process, 'on');

      TelemetryClient.getInstance(); // First call
      expect(processOnSpy).toHaveBeenCalledTimes(1);
      expect(processOnSpy).toHaveBeenCalledWith('exit', expect.any(Function));

      TelemetryClient.getInstance(); // Second call
      expect(processOnSpy).toHaveBeenCalledTimes(1); // Still only called once
    });

    it('should handle process exit without error', () => {
      const instance = TelemetryClient.getInstance();
      const shutdownSpy = jest
        .spyOn(instance, 'shutdown')
        .mockRejectedValueOnce(new Error('Shutdown failed'));

      // Get the exit handler that was registered
      const exitCall = mockProcessOn.mock.calls.find((call) => call[0] === 'exit');
      if (!exitCall) {
        throw new Error('Exit handler was not registered');
      }
      const exitHandler = exitCall[1];

      // Call the exit handler
      exitHandler();

      // Verify shutdown was called
      expect(shutdownSpy).toHaveBeenCalled();
      // Verify error was caught silently
      expect(exitHandler).not.toThrow();
    });
  });

  describe('constructor', () => {
    it('should handle PostHog initialization failure', () => {
      const mockPostHogConstructor = PostHog.prototype.constructor as jest.Mock;
      mockPostHogConstructor.mockImplementation(() => {
        throw new Error('PostHog initialization failed');
      });

      const client = TelemetryClient.getInstance();

      // Should disable telemetry on error
      // @ts-expect-error accessing private for test
      expect(client.enabled).toBe(false);
      // @ts-expect-error accessing private for test
      expect(client.postHogClient).toBeNull();

      TelemetryClient.resetForTesting();
    });
  });

  describe('record', () => {
    let commandInvokedEvent: TelemetryEvent;
    let commandSucceededEvent: TelemetryEvent;
    let commandFailedEvent: TelemetryEvent;

    beforeEach(() => {
      // Mock setTimeout to execute immediately
      jest.useFakeTimers();

      commandInvokedEvent = {
        name: 'command_invoked',
        properties: {
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

      commandSucceededEvent = {
        name: 'command_succeeded',
        properties: {
          duration_ms: 123,
        },
      };

      commandFailedEvent = {
        name: 'command_failed',
        properties: {
          error_name: 'ValidationError',
          duration_ms: 45,
        },
      };
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should queue command invoked event', () => {
      const instance = TelemetryClient.getInstance();
      instance.record(commandInvokedEvent);

      // @ts-expect-error accessing private for tests
      expect(instance.eventQueue).toContainEqual(
        expect.objectContaining({
          name: 'command_invoked',
          properties: expect.objectContaining({
            teams_count: 4,
            squad_count: 2,
          }),
        })
      );
    });

    it('should queue command succeeded event', () => {
      const instance = TelemetryClient.getInstance();
      instance.record(commandSucceededEvent);

      // @ts-expect-error accessing private for tests
      expect(instance.eventQueue).toContainEqual(
        expect.objectContaining({
          name: 'command_succeeded',
          properties: expect.objectContaining({
            duration_ms: 123,
          }),
        })
      );
    });

    it('should queue command failed event', () => {
      const instance = TelemetryClient.getInstance();
      instance.record(commandFailedEvent);

      // @ts-expect-error accessing private for tests
      expect(instance.eventQueue).toContainEqual(
        expect.objectContaining({
          name: 'command_failed',
          properties: expect.objectContaining({
            error_name: 'ValidationError',
          }),
        })
      );
    });

    it('should augment events with system context', () => {
      const executionContext = 'npx';
      const environment = 'production';
      mockDetectExecutionContext.mockReturnValue(executionContext);
      mockDetectEnvironment.mockReturnValue(environment);

      const instance = TelemetryClient.getInstance();
      instance.record(commandInvokedEvent);

      expect(mockDetectExecutionContext).toHaveBeenCalled();
      expect(mockDetectEnvironment).toHaveBeenCalled();

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

    it('should debounce flushes', () => {
      const instance = TelemetryClient.getInstance();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockFlush = jest.spyOn(instance as any, 'flush').mockResolvedValue(undefined);

      // Record multiple events in quick succession
      instance.record({
        name: 'command_succeeded',
        properties: { duration_ms: 100 },
      });
      instance.record({
        name: 'command_succeeded',
        properties: { duration_ms: 200 },
      });

      // Only one flush should be scheduled
      expect(mockFlush).not.toHaveBeenCalled();

      // Fast forward timers
      jest.advanceTimersByTime(100);

      expect(mockFlush).toHaveBeenCalledTimes(1);
      // @ts-expect-error accessing private for tests
      expect(instance.eventQueue).toHaveLength(2);
    });

    it('should clear flush timeout on shutdown', async () => {
      const instance = TelemetryClient.getInstance();
      const mockClearTimeout = jest.spyOn(global, 'clearTimeout');

      instance.record({
        name: 'command_succeeded',
        properties: { duration_ms: 100 },
      });

      await instance.shutdown();

      expect(mockClearTimeout).toHaveBeenCalled();
    });

    it('should not queue events when telemetry is disabled', () => {
      // Setup client with telemetry disabled
      mockshouldEnableTelemetryClient.mockReturnValue(false);
      const instance = TelemetryClient.getInstance();

      const event: TelemetryEvent = {
        name: 'command_succeeded',
        properties: { duration_ms: 100 },
      };

      instance.record(event);

      // Verify no events were queued
      // @ts-expect-error accessing private for tests
      expect(instance.eventQueue).toHaveLength(0);
      // @ts-expect-error accessing private for tests
      expect(instance.postHogClient).toBeNull();
    });
  });

  describe('shutdown', () => {
    beforeEach(() => {
      // Use fake timers but make them run immediately
      jest.useFakeTimers({ legacyFakeTimers: true });
      jest.runAllTimers();
    });

    afterEach(() => {
      jest.clearAllTimers();
    });

    it('should flush queued events and close client', async () => {
      const mockShutdown = jest.fn<() => Promise<void>>();
      const mockCapture = jest.fn<() => Promise<void>>().mockResolvedValue();
      const instance = TelemetryClient.getInstance();

      // Ensure clean state and mock setup before test
      // @ts-expect-error accessing private for tests
      // eslint-disable-next-line functional/immutable-data
      instance.eventQueue = [];
      // @ts-expect-error accessing private for tests
      // eslint-disable-next-line functional/immutable-data
      instance.initialized = true;
      // @ts-expect-error accessing private for tests
      // eslint-disable-next-line functional/immutable-data
      instance.postHogClient = {
        shutdown: mockShutdown,
        capture: mockCapture,
      };

      const event: TelemetryEvent = {
        name: 'command_succeeded',
        properties: {
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
          duration_ms: 123,
        }),
      });
      // @ts-expect-error accessing private for tests
      expect(instance.eventQueue).toHaveLength(0);
      expect(mockShutdown).toHaveBeenCalled();
    });

    it('should handle shutdown errors gracefully', async () => {
      const mockShutdown = jest.fn<() => Promise<void>>().mockRejectedValueOnce(new Error('Shutdown failed'));
      const instance = TelemetryClient.getInstance();
      // @ts-expect-error accessing private for tests
      // eslint-disable-next-line functional/immutable-data
      instance.postHogClient = { shutdown: mockShutdown };

      // Should not throw
      await expect(instance.shutdown()).resolves.toBeUndefined();
    });

    it('should handle errors during flush', async () => {
      const mockCapture = jest.fn<() => Promise<void>>().mockRejectedValue(new Error('Flush failed'));
      const instance = TelemetryClient.getInstance();

      // Set up mock client
      // @ts-expect-error accessing private for tests
      // eslint-disable-next-line functional/immutable-data
      instance.postHogClient = {
        capture: mockCapture,
        shutdown: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      };

      instance.record({
        name: 'command_succeeded',
        properties: {
          duration_ms: 123,
        },
      });

      await instance.shutdown();

      expect(mockCapture).toHaveBeenCalled();
      // @ts-expect-error accessing private for tests
      expect(instance.eventQueue).toHaveLength(0);
    });
  });
});
