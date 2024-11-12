/* eslint-disable functional/immutable-data */
import * as utils from '../utils/utils.js';

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { SpyInstance } from 'jest-mock';
import { getEnvironmentContext } from './telemetryUtils.js';

jest.mock('../utils/utils.js');

describe('telemetryUtils', () => {
  describe('getEnvironmentContext', () => {
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
