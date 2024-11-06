import * as utils from './utils/utils.js';

import {
  __resetConfigForTesting,
  getEnvironmentContext,
  getPosthogApiKey,
  getTelemetryOptOut,
  initConfig,
} from './config.js';
/* eslint-disable functional/immutable-data */
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { SpyInstance } from 'jest-mock';
import dotenv from 'dotenv';

jest.mock('dotenv', () => ({
  __esModule: true,
  default: {
    config: jest.fn().mockReturnValue({ parsed: {} }),
  },
}));
jest.mock('./utils/utils.js');

describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    __resetConfigForTesting();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('initConfig', () => {
    it('should call dotenv.config with test path when NODE_ENV=test', () => {
      process.env.NODE_ENV = 'test';
      initConfig();
      expect(dotenv.config).toHaveBeenCalledWith({
        path: '.env.test',
      });
    });

    it('should call dotenv.config with default path otherwise', () => {
      process.env.NODE_ENV = 'development';
      initConfig();
      expect(dotenv.config).toHaveBeenCalledWith({
        path: '.env',
      });
    });
  });

  describe('getters', () => {
    it('should throw if config not initialized', () => {
      expect(() => getPosthogApiKey()).toThrow('Config not initialized');
      expect(() => getTelemetryOptOut()).toThrow('Config not initialized');
    });

    it('should return empty string for undefined env vars after init', () => {
      delete process.env.SWISS_PAIRING_POSTHOG_API_KEY;
      delete process.env.SWISS_PAIRING_TELEMETRY_OPT_OUT;
      initConfig();
      expect(getPosthogApiKey()).toBe('');
      expect(getTelemetryOptOut()).toBe(false);
    });

    it('should return env var values after init', () => {
      process.env.SWISS_PAIRING_POSTHOG_API_KEY = 'test-key';
      process.env.SWISS_PAIRING_TELEMETRY_OPT_OUT = 'test-1';

      initConfig();

      expect(getPosthogApiKey()).toBe('test-key');
      expect(getTelemetryOptOut()).toBe(true);
    });
  });

  describe('getEnvironmentContext', () => {
    let originalEnv: NodeJS.ProcessEnv;
    let mockDetectExecutionContext: SpyInstance;

    beforeEach(() => {
      originalEnv = process.env;
      delete process.env.CI;
      delete process.env.NODE_ENV;
      __resetConfigForTesting();
      mockDetectExecutionContext = jest.spyOn(utils, 'detectExecutionContext');
    });

    afterEach(() => {
      process.env = originalEnv;
      jest.clearAllMocks();
    });

    it('should return "ci" when CI environment variable is set', () => {
      process.env.CI = 'true';
      expect(getEnvironmentContext()).toBe('ci');
      expect(mockDetectExecutionContext).not.toHaveBeenCalled();
    });

    it('should return "test" when NODE_ENV is test', () => {
      process.env.NODE_ENV = 'test';
      expect(getEnvironmentContext()).toBe('test');
      expect(mockDetectExecutionContext).not.toHaveBeenCalled();
    });

    it('should return "development" when NODE_ENV is development', () => {
      process.env.NODE_ENV = 'development';
      expect(getEnvironmentContext()).toBe('development');
      expect(mockDetectExecutionContext).not.toHaveBeenCalled();
    });

    it('should return "development" for local installs without NODE_ENV', () => {
      mockDetectExecutionContext.mockReturnValue('local');
      expect(getEnvironmentContext()).toBe('development');
      expect(mockDetectExecutionContext).toHaveBeenCalledTimes(1);
    });

    it('should return "production" for global installs without NODE_ENV', () => {
      mockDetectExecutionContext.mockReturnValue('global');
      expect(getEnvironmentContext()).toBe('production');
      expect(mockDetectExecutionContext).toHaveBeenCalledTimes(1);
    });

    it('should return "production" for npx executions without NODE_ENV', () => {
      mockDetectExecutionContext.mockReturnValue('npx');
      expect(getEnvironmentContext()).toBe('production');
      expect(mockDetectExecutionContext).toHaveBeenCalledTimes(1);
    });
  });
});
