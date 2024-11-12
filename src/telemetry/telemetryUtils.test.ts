/* eslint-disable functional/immutable-data */
import * as utils from '../utils/utils.js';

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { SpyInstance } from 'jest-mock';
import { detectEnvironment } from './telemetryUtils.js';

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
});
