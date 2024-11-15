import * as utils from '../utils/utils.js';

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { Config } from '../Config.js';
import type { SpyInstance } from 'jest-mock';
import { TelemetryNotificationManager } from './TelemetryNotificationManager.js';
import fs from 'fs';
import path from 'path';

jest.mock('fs');

describe('TelemetryNotificationManager', () => {
  const mockConfigPath = '/mock/config/path';
  const expectedNoticePath = `${mockConfigPath}/.telemetry-notice-shown`;

  let mockPathJoin: SpyInstance<typeof path.join>;
  let manager: TelemetryNotificationManager;

  beforeEach(() => {
    jest.spyOn(utils, 'getConfigPath').mockReturnValue(mockConfigPath);
    mockPathJoin = jest.spyOn(path, 'join').mockImplementation((...args) => args.join('/'));
    manager = new TelemetryNotificationManager();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('shouldShowTelemetryNotice', () => {
    let mockGetShowTelemetryNoticeOverride: SpyInstance<
      typeof Config.prototype.getShowTelemetryNoticeOverride
    >;
    let mockGetTelemetryOptOut: SpyInstance<typeof Config.prototype.getTelemetryOptOut>;

    beforeEach(() => {
      mockGetShowTelemetryNoticeOverride = jest
        .spyOn(Config.prototype, 'getShowTelemetryNoticeOverride')
        .mockReturnValue('default');
      mockGetTelemetryOptOut = jest.spyOn(Config.prototype, 'getTelemetryOptOut').mockReturnValue(false);
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should return true when forced via config', () => {
      mockGetShowTelemetryNoticeOverride.mockReturnValue('show');
      expect(manager.shouldShowTelemetryNotice()).toBe(true);
    });

    it('should return false when forced to hide via config', () => {
      mockGetShowTelemetryNoticeOverride.mockReturnValue('hide');
      expect(manager.shouldShowTelemetryNotice()).toBe(false);
    });

    it('should ignore telemetry opt out when override present', () => {
      mockGetShowTelemetryNoticeOverride.mockReturnValue('show');
      mockGetTelemetryOptOut.mockReturnValue(true); // Even when opted out...
      expect(manager.shouldShowTelemetryNotice()).toBe(true); // ...override wins
    });

    it('should return false when telemetry is opted out', () => {
      mockGetShowTelemetryNoticeOverride.mockReturnValue('default');
      mockGetTelemetryOptOut.mockReturnValue(true);
      expect(manager.shouldShowTelemetryNotice()).toBe(false);
    });

    it('should return false when notice file exists', () => {
      mockGetShowTelemetryNoticeOverride.mockReturnValue('default');
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      expect(manager.shouldShowTelemetryNotice()).toBe(false);
    });

    it('should return true when notice file does not exist', () => {
      mockGetShowTelemetryNoticeOverride.mockReturnValue('default');
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      expect(manager.shouldShowTelemetryNotice()).toBe(true);
    });
  });

  describe('markTelemetryNoticeShown', () => {
    it('should create config directory and write notice file', () => {
      manager.markTelemetryNoticeShown();

      expect(fs.mkdirSync).toHaveBeenCalledWith(mockConfigPath, { recursive: true });
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

  describe('getTelemetryNoticePath', () => {
    it('should return the correct notice path', () => {
      expect(TelemetryNotificationManager.getTelemetryNoticePath()).toBe(expectedNoticePath);
      expect(utils.getConfigPath).toHaveBeenCalled();
      expect(mockPathJoin).toHaveBeenCalledWith(mockConfigPath, '.telemetry-notice-shown');
    });
  });
});
