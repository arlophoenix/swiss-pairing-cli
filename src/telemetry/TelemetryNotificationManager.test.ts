import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { SpyInstance } from 'jest-mock';
import { TelemetryNotificationManager } from './TelemetryNotificationManager.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

jest.mock('fs');
jest.mock('os');
jest.mock('path');

describe('TelemetryNotificationManager', () => {
  let manager: TelemetryNotificationManager;
  let mockHomedir: string;
  const originalPlatform = process.platform;
  const originalEnv = { ...process.env };
  const mockAppName = 'test-app';
  let expectedConfigPath: string;
  let expectedNoticePath: string;
  let mockPathJoin: SpyInstance<typeof path.join>;

  beforeEach(() => {
    mockHomedir = '/mock/home';
    (os.homedir as jest.Mock).mockReturnValue(mockHomedir);
    mockPathJoin = jest.spyOn(path, 'join').mockImplementation((...args) => args.join('/'));

    // For Unix systems
    // eslint-disable-next-line functional/immutable-data
    Object.defineProperty(process, 'platform', { value: 'darwin' });
    expectedConfigPath = `${mockHomedir}/.config/${mockAppName}`;
    expectedNoticePath = `${expectedConfigPath}/.telemetry-notice-shown`;

    manager = new TelemetryNotificationManager(mockAppName);
  });

  afterEach(() => {
    jest.resetAllMocks();
    // eslint-disable-next-line functional/immutable-data
    Object.defineProperty(process, 'platform', { value: originalPlatform });
    // eslint-disable-next-line functional/immutable-data
    process.env = originalEnv;
  });

  describe('constructor', () => {
    it('should use XDG_CONFIG_HOME if set on Unix', () => {
      const mockXdgConfig = '/custom/config';
      // eslint-disable-next-line functional/immutable-data
      process.env.XDG_CONFIG_HOME = mockXdgConfig;

      new TelemetryNotificationManager(mockAppName);

      expect(mockPathJoin).toHaveBeenCalledWith(mockXdgConfig, mockAppName);
    });

    it('should use APPDATA if set on Windows', () => {
      const mockAppData = 'C:\\Users\\Test\\AppData\\Roaming';
      // eslint-disable-next-line functional/immutable-data
      Object.defineProperty(process, 'platform', { value: 'win32' });
      // eslint-disable-next-line functional/immutable-data
      process.env.APPDATA = mockAppData;

      new TelemetryNotificationManager(mockAppName);

      expect(mockPathJoin).toHaveBeenCalledWith(mockAppData, mockAppName);
    });
  });

  describe('shouldShowTelemetryNotice', () => {
    it('should return true if notice file does not exist', () => {
      (fs.accessSync as jest.Mock).mockImplementation(() => {
        throw new Error('File not found');
      });

      expect(manager.shouldShowTelemetryNotice()).toBe(true);
      expect(fs.accessSync).toHaveBeenCalledWith(expectedNoticePath);
    });

    it('should return false if notice file exists', () => {
      (fs.accessSync as jest.Mock).mockImplementation(() => undefined);

      expect(manager.shouldShowTelemetryNotice()).toBe(false);
      expect(fs.accessSync).toHaveBeenCalledWith(expectedNoticePath);
    });
  });

  describe('markTelemetryNoticeShown', () => {
    it('should create config directory and write notice file', () => {
      manager.markTelemetryNoticeShown();

      expect(fs.mkdirSync).toHaveBeenCalledWith(expectedConfigPath, { recursive: true });
      expect(fs.writeFileSync).toHaveBeenCalledWith(expectedNoticePath, expect.any(String));
    });

    it('should handle filesystem errors silently', () => {
      (fs.mkdirSync as jest.Mock).mockImplementation(() => {
        throw new Error('Permission denied');
      });

      expect(() => {
        manager.markTelemetryNoticeShown();
      }).not.toThrow();
    });
  });

  describe('getTelemetryNotice', () => {
    it('should return notice text with opt-out instructions', () => {
      const notice = TelemetryNotificationManager.getTelemetryNotice();
      expect(notice).toContain('Telemetry Notice');
      expect(notice).toContain('SWISS_PAIRING_TELEMETRY_OPT_OUT');
    });
  });
});
