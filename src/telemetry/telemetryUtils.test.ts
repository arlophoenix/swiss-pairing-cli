/* eslint-disable functional/immutable-data */
import * as utils from '../utils/utils.js';

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { detectEnvironment, generateInstallId, shouldEnableTelemetry } from './telemetryUtils.js';

import type { SpyInstance } from 'jest-mock';
import fs from 'fs';
import os from 'os';

jest.mock('../utils/utils.js');

describe('telemetryUtils', () => {
  describe('detectEnvironment', () => {
    let originalEnv: NodeJS.ProcessEnv;
    let mockDetectExecutionContext: SpyInstance;

    beforeEach(() => {
      originalEnv = process.env;
      delete process.env.CI;
      delete process.env.NODE_ENV;
      mockDetectExecutionContext = jest.spyOn(utils, 'detectExecutionContext');
    });

    afterEach(() => {
      process.env = originalEnv;
      jest.clearAllMocks();
    });

    it('should return "ci" when CI environment variable is set', () => {
      process.env.CI = 'true';
      expect(detectEnvironment()).toBe('ci');
      expect(mockDetectExecutionContext).not.toHaveBeenCalled();
    });

    it('should return "test" when NODE_ENV is test', () => {
      process.env.NODE_ENV = 'test';
      expect(detectEnvironment()).toBe('test');
      expect(mockDetectExecutionContext).not.toHaveBeenCalled();
    });

    it('should return "development" when NODE_ENV is development', () => {
      process.env.NODE_ENV = 'development';
      expect(detectEnvironment()).toBe('development');
      expect(mockDetectExecutionContext).not.toHaveBeenCalled();
    });

    it('should return "development" for local installs without NODE_ENV', () => {
      mockDetectExecutionContext.mockReturnValue('local');
      expect(detectEnvironment()).toBe('development');
      expect(mockDetectExecutionContext).toHaveBeenCalledTimes(1);
    });

    it('should return "production" for global installs without NODE_ENV', () => {
      mockDetectExecutionContext.mockReturnValue('global');
      expect(detectEnvironment()).toBe('production');
      expect(mockDetectExecutionContext).toHaveBeenCalledTimes(1);
    });

    it('should return "production" for npx executions without NODE_ENV', () => {
      mockDetectExecutionContext.mockReturnValue('npx');
      expect(detectEnvironment()).toBe('production');
      expect(mockDetectExecutionContext).toHaveBeenCalledTimes(1);
    });
  });

  describe('shouldEnableTelemetry', () => {
    const originalEnv = process.env;

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    describe('environment based rules', () => {
      it('should disable telemetry in CI', () => {
        const result = shouldEnableTelemetry({
          telemetryOptOut: false,
          shouldShowTelemetryNotice: false,
          apiKeyExists: true,
          environment: 'ci',
        });

        expect(result).toBe(false);
      });
    });

    describe('standard rules', () => {
      it.each(['development', 'test', 'production'] as const)(
        'should follow standard rules in %s',
        (environment) => {
          const result = shouldEnableTelemetry({
            telemetryOptOut: false,
            shouldShowTelemetryNotice: false,
            apiKeyExists: true,
            environment,
          });

          expect(result).toBe(true);
        }
      );

      it('should disable telemetry when opted out', () => {
        const result = shouldEnableTelemetry({
          telemetryOptOut: true,
          shouldShowTelemetryNotice: false,
          apiKeyExists: true,
          environment: 'development',
        });

        expect(result).toBe(false);
      });

      it('should disable telemetry on first run', () => {
        const result = shouldEnableTelemetry({
          telemetryOptOut: false,
          shouldShowTelemetryNotice: true,
          apiKeyExists: true,
          environment: 'development',
        });

        expect(result).toBe(false);
      });

      it('should disable telemetry when API key missing', () => {
        const result = shouldEnableTelemetry({
          telemetryOptOut: false,
          shouldShowTelemetryNotice: false,
          apiKeyExists: false,
          environment: 'development',
        });

        expect(result).toBe(false);
      });
    });
  });

  describe('generateInstallId', () => {
    let originalHomedir: typeof os.homedir;
    let originalPlatform: typeof process.platform;
    let _mockMkdir: SpyInstance<typeof fs.mkdirSync>;
    let mockWriteFile: SpyInstance<typeof fs.writeFileSync>;
    let mockReadFile: SpyInstance<typeof fs.readFileSync>;

    beforeEach(() => {
      originalHomedir = os.homedir;
      originalPlatform = process.platform;
      _mockMkdir = jest.spyOn(fs, 'mkdirSync');
      mockWriteFile = jest.spyOn(fs, 'writeFileSync');
      mockReadFile = jest.spyOn(fs, 'readFileSync') as jest.MockedFunction<typeof fs.readFileSync>;
      os.homedir = jest.fn().mockReturnValue('/home/user') as jest.MockedFunction<typeof os.homedir>;
    });

    afterEach(() => {
      os.homedir = originalHomedir;
      Object.defineProperty(process, 'platform', { value: originalPlatform });
      jest.resetAllMocks();
    });

    it('should generate machine hash for npx context', () => {
      jest.spyOn(utils, 'detectExecutionContext').mockReturnValue('npx');
      jest.spyOn(os, 'hostname').mockReturnValue('test-host');
      jest.spyOn(os, 'platform').mockReturnValue('darwin');
      jest.spyOn(os, 'arch').mockReturnValue('x64');
      jest.spyOn(os, 'userInfo').mockReturnValue({ username: 'testuser' } as os.UserInfo<string>);

      const result = generateInstallId();
      expect(result).toMatch(/^[a-f0-9]{8}$/);
    });

    it('should use existing ID from config file when available', () => {
      jest.spyOn(utils, 'detectExecutionContext').mockReturnValue('global');
      mockReadFile.mockReturnValue('existing-id');

      const result = generateInstallId();
      expect(result).toBe('existing-id');
      expect(mockWriteFile).not.toHaveBeenCalled();
    });
  });
});
