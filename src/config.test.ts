import { __resetConfigForTesting, getPosthogApiKey, getTelemetryOptOut, initConfig } from './config.js';
/* eslint-disable functional/immutable-data */
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import dotenv from 'dotenv';

jest.mock('dotenv', () => ({
  __esModule: true,
  default: {
    config: jest.fn().mockReturnValue({ parsed: {} }),
  },
}));

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
});
