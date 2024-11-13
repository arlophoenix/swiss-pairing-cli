/* eslint-disable functional/immutable-data */
import { afterEach, describe, expect, it, jest } from '@jest/globals';

import { Config } from './Config.js';
import dotenv from 'dotenv';

jest.mock('dotenv', () => ({
  __esModule: true,
  default: {
    config: jest.fn().mockReturnValue({ parsed: {} }),
  },
}));

describe('Config', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    jest.clearAllMocks();
    process.env = originalEnv;
    Config.resetForTesting({ env: null });
  });

  describe('initialization', () => {
    it('should initialize with test env when NODE_ENV=test', () => {
      process.env.NODE_ENV = 'test';
      Config.getInstance();
      expect(dotenv.config).toHaveBeenCalledWith({
        path: '.env.test',
      });
    });

    it('should initialize with dev env otherwise', () => {
      process.env.NODE_ENV = 'development';
      Config.getInstance();
      expect(dotenv.config).toHaveBeenCalledWith({
        path: '.env',
      });
    });

    it('should initialize only once', () => {
      Config.getInstance();
      Config.getInstance();
      expect(dotenv.config).toHaveBeenCalledTimes(1);
    });
  });

  describe('config values', () => {
    it('should return posthog API key', () => {
      const testKey = 'test-key';

      Config.resetForTesting({
        env: {
          SWISS_PAIRING_POSTHOG_API_KEY: testKey,
        },
      });
      expect(Config.getInstance().getPosthogApiKey()).toBe(testKey);
    });

    it('should return empty string for undefined API key', () => {
      Config.resetForTesting({ env: null });
      expect(Config.getInstance().getPosthogApiKey()).toBe('');
    });

    it('should return telemetry opt out status', () => {
      Config.resetForTesting({
        env: {
          SWISS_PAIRING_TELEMETRY_OPT_OUT: '1',
        },
      });
      expect(Config.getInstance().getTelemetryOptOut()).toBe(true);
    });
  });
});
