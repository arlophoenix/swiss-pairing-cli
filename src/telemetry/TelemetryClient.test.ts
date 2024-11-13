import * as telemetryUtils from './telemetryUtils.js';
import * as utils from '../utils/utils.js';

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { Config } from '../Config.js';
import type { SpyInstance } from 'jest-mock';
import { TelemetryClient } from './TelemetryClient.js';
import { TelemetryEvent } from './telemetryTypes.js';

jest.mock('posthog-node');
jest.mock('process');

describe('Telemetry', () => {
  let mockShouldEnableTelemetry: SpyInstance<typeof telemetryUtils.shouldEnableTelemetry>;
  let mockDetectExecutionContext: SpyInstance<typeof utils.detectExecutionContext>;
  let mockDetectEnvironment: SpyInstance<typeof telemetryUtils.detectEnvironment>;

  beforeEach(() => {
    // Mock config to enable telemetry
    jest.spyOn(Config.prototype, 'getPosthogApiKey').mockReturnValue('test-api-key');
    jest.spyOn(Config.prototype, 'getTelemetryOptOut').mockReturnValue(false);

    // Mock TelemetryNotificationManager to not show notice
    jest.mock('./TelemetryNotificationManager.js', () => ({
      TelemetryNotificationManager: jest.fn().mockImplementation(() => ({
        shouldShowTelemetryNotice: () => false,
      })),
    }));

    // eslint-disable-next-line max-params
    jest.spyOn(process, 'on').mockImplementation((_event, _listener) => process);

    mockDetectExecutionContext = jest.spyOn(utils, 'detectExecutionContext');
    mockShouldEnableTelemetry = jest.spyOn(telemetryUtils, 'shouldEnableTelemetry').mockReturnValue(true);
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

    it.each([true, false])('should use shouldEnableTelemetry result: %s', (shouldEnableTelemetry) => {
      mockShouldEnableTelemetry.mockReturnValue(shouldEnableTelemetry);
      const instance = TelemetryClient.getInstance();

      // expect(mockConfig.getTelemetryOptOut).toHaveBeenCalled();
      expect(mockShouldEnableTelemetry).toHaveBeenCalledWith({
        telemetryOptOut: false,
        shouldShowTelemetryNotice: false,
        apiKeyExists: true,
        environment: 'development',
      });

      // @ts-expect-error accessing private for test
      expect(instance.enabled).toBe(shouldEnableTelemetry);
    });

    it('should register process exit handler only once', () => {
      const processOnSpy = jest.spyOn(process, 'on');

      TelemetryClient.getInstance(); // First call
      expect(processOnSpy).toHaveBeenCalledTimes(1);
      expect(processOnSpy).toHaveBeenCalledWith('exit', expect.any(Function));

      TelemetryClient.getInstance(); // Second call
      expect(processOnSpy).toHaveBeenCalledTimes(1); // Still only called once
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
          error_message: 'Invalid team count',
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
            error_message: 'Invalid team count',
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
  });

  describe('shutdown', () => {
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
      instance.client = {
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
      instance.client = { shutdown: mockShutdown };

      // Should not throw
      await expect(instance.shutdown()).resolves.toBeUndefined();
    });
  });
});
