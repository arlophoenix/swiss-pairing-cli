import { afterEach, describe, expect, it, jest } from '@jest/globals';

import { Config } from './Config.js';
import { POSTHOG_API_KEY } from './constants.js';
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
    // eslint-disable-next-line functional/immutable-data
    process.env = { ...originalEnv };
    Config.resetForTesting({ env: null });
  });

  describe('initialization', () => {
    it('should initialize with test env when NODE_ENV=test', () => {
      // eslint-disable-next-line functional/immutable-data
      process.env.NODE_ENV = 'test';
      Config.getInstance();
      expect(dotenv.config).toHaveBeenCalledWith({
        path: '.env.test',
      });
    });

    it('should initialize with dev env otherwise', () => {
      // eslint-disable-next-line functional/immutable-data
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

    it('should return default string for undefined env API key', () => {
      Config.resetForTesting({ env: null });
      expect(Config.getInstance().getPosthogApiKey()).toBe(POSTHOG_API_KEY);
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

  describe('getShowTelemetryNoticeOverride', () => {
    it.each(['1', 'true', 'show'])(
      'should return "show" when env var is %s',
      (showTelemetryNoticeEnvValue) => {
        Config.resetForTesting({
          env: {
            SWISS_PAIRING_SHOW_TELEMETRY_NOTICE: showTelemetryNoticeEnvValue,
          },
        });
        expect(Config.getInstance().getShowTelemetryNoticeOverride()).toBe('show');
      }
    );

    it.each(['0', 'false', 'hide'])(
      'should return "hide" when env var is %s',
      (showTelemetryNoticeEnvValue) => {
        Config.resetForTesting({
          env: {
            SWISS_PAIRING_SHOW_TELEMETRY_NOTICE: showTelemetryNoticeEnvValue,
          },
        });
        expect(Config.getInstance().getShowTelemetryNoticeOverride()).toBe('hide');
      }
    );

    it('should return "default" when env var is undefined', () => {
      Config.resetForTesting({
        env: {},
      });
      expect(Config.getInstance().getShowTelemetryNoticeOverride()).toBe('default');
    });

    it('should return "default" when env var is not recognized', () => {
      Config.resetForTesting({
        env: {
          SWISS_PAIRING_SHOW_TELEMETRY_NOTICE: 'foo',
        },
      });
      expect(Config.getInstance().getShowTelemetryNoticeOverride()).toBe('default');
    });
  });
});
