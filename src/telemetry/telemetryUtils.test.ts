/* eslint-disable functional/immutable-data */
import * as utils from '../utils/utils.js';

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { detectEnvironment, generateDistinctID, shouldEnableTelemetryClient } from './telemetryUtils.js';

import type { SpyInstance } from 'jest-mock';
import fs from 'fs';
import os from 'os';
import path from 'path';

jest.mock('../utils/utils.js');
jest.mock('fs');
jest.mock('os');
jest.mock('path');

describe('telemetryUtils', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = originalEnv;
    jest.resetAllMocks();
  });

  describe('detectEnvironment', () => {
    let mockDetectExecutionContext: SpyInstance;

    beforeEach(() => {
      mockDetectExecutionContext = jest.spyOn(utils, 'detectExecutionContext');
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

    describe('when NODE_ENV is not set', () => {
      beforeEach(() => {
        delete process.env.NODE_ENV;
      });

      it('should return "development" for local installs', () => {
        mockDetectExecutionContext.mockReturnValue('local');
        expect(detectEnvironment()).toBe('development');
        expect(mockDetectExecutionContext).toHaveBeenCalledTimes(1);
      });

      it('should return "production" for global installs', () => {
        mockDetectExecutionContext.mockReturnValue('global');
        expect(detectEnvironment()).toBe('production');
        expect(mockDetectExecutionContext).toHaveBeenCalledTimes(1);
      });

      it('should return "production" for npx executions', () => {
        mockDetectExecutionContext.mockReturnValue('npx');
        expect(detectEnvironment()).toBe('production');
        expect(mockDetectExecutionContext).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('shouldEnableTelemetryClient', () => {
    describe('environment based rules', () => {
      it('should disable telemetry in CI', () => {
        const result = shouldEnableTelemetryClient({
          telemetryOptOut: false,
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
          const result = shouldEnableTelemetryClient({
            telemetryOptOut: false,
            apiKeyExists: true,
            environment,
          });

          expect(result).toBe(true);
        }
      );

      it('should disable telemetry when opted out', () => {
        const result = shouldEnableTelemetryClient({
          telemetryOptOut: true,
          apiKeyExists: true,
          environment: 'development',
        });

        expect(result).toBe(false);
      });

      it('should disable telemetry when API key missing', () => {
        const result = shouldEnableTelemetryClient({
          telemetryOptOut: false,
          apiKeyExists: false,
          environment: 'development',
        });

        expect(result).toBe(false);
      });
    });
  });

  describe('generateDistinctID', () => {
    let originalPlatform: typeof process.platform;
    let _mockMkdir: SpyInstance<typeof fs.mkdirSync>;
    let mockWriteFile: SpyInstance<typeof fs.writeFileSync>;
    let mockReadFile: SpyInstance<typeof fs.readFileSync>;
    let mockHomedir: SpyInstance<typeof os.homedir>;

    beforeEach(() => {
      originalPlatform = process.platform;
      _mockMkdir = jest.spyOn(fs, 'mkdirSync');
      mockWriteFile = jest.spyOn(fs, 'writeFileSync');
      mockReadFile = jest.spyOn(fs, 'readFileSync') as jest.MockedFunction<typeof fs.readFileSync>;
      mockHomedir = jest.spyOn(os, 'homedir').mockReturnValue('/home/user');
    });

    afterEach(() => {
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should generate machine hash for npx context', () => {
      jest.spyOn(utils, 'detectExecutionContext').mockReturnValue('npx');
      jest.spyOn(os, 'hostname').mockReturnValue('test-host');
      jest.spyOn(os, 'platform').mockReturnValue('darwin');
      jest.spyOn(os, 'arch').mockReturnValue('x64');
      jest.spyOn(os, 'userInfo').mockReturnValue({ username: 'testuser' } as os.UserInfo<string>);

      const result = generateDistinctID();
      expect(result).toMatch(/^[a-f0-9]{8}$/);
    });

    it('should use existing ID from config file when available', () => {
      jest.spyOn(utils, 'detectExecutionContext').mockReturnValue('global');
      mockReadFile.mockReturnValue('existing-id');

      const result = generateDistinctID();
      expect(result).toBe('existing-id');
      expect(mockWriteFile).not.toHaveBeenCalled();
    });

    describe('Windows platform', () => {
      let _mockJoin: SpyInstance<typeof path.join>;

      beforeEach(() => {
        _mockJoin = jest.spyOn(path, 'join').mockImplementation((...paths) => paths.join('\\'));

        Object.defineProperty(process, 'platform', { value: 'win32' });
      });

      it('should use APPDATA', () => {
        jest.spyOn(utils, 'detectExecutionContext').mockReturnValue('global');
        process.env.APPDATA = 'C:\\Users\\test\\AppData\\Roaming';
        mockReadFile.mockReturnValue('existing-id');

        const result = generateDistinctID();

        expect(result).toBe('existing-id');
        expect(mockReadFile).toHaveBeenCalledWith(
          expect.stringContaining('C:\\Users\\test\\AppData\\Roaming\\swiss-pairing-cli\\.installation-id'),
          'utf8'
        );
      });

      it('should fallback to homedir/AppData/Roaming when APPDATA not set', () => {
        jest.spyOn(utils, 'detectExecutionContext').mockReturnValue('global');
        delete process.env.APPDATA;
        mockReadFile.mockReturnValue('existing-id');

        const result = generateDistinctID();

        expect(result).toBe('existing-id');
        expect(mockReadFile).toHaveBeenCalledWith(
          expect.stringContaining('/home/user\\AppData\\Roaming\\swiss-pairing-cli\\.installation-id'),
          'utf8'
        );
      });
    });

    it('should fallback to random ID when file operations fail', () => {
      jest.spyOn(utils, 'detectExecutionContext').mockReturnValue('global');
      jest.spyOn(os, 'homedir').mockImplementation(() => {
        throw new Error('homedir failed');
      });

      const result = generateDistinctID();

      expect(result).toMatch(/^[a-zA-Z0-9]{10,}$/); // Random ID format
      expect(mockWriteFile).not.toHaveBeenCalled();
      expect(mockReadFile).not.toHaveBeenCalled();
    });

    it('should generate new ID when reading existing ID fails', () => {
      jest.spyOn(utils, 'detectExecutionContext').mockReturnValue('global');
      mockReadFile.mockImplementation(() => {
        throw new Error('read failed');
      });

      const result = generateDistinctID();

      expect(result).toMatch(/^[a-zA-Z0-9]{10,}$/);
      expect(mockWriteFile).toHaveBeenCalled();
      expect(mockReadFile).toHaveBeenCalled();
    });
  });
});
