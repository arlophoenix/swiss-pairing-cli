import {
  ErrorTemplate,
  createInvalidValueMessage,
  formatError,
  normalizeError,
  wrapErrorWithOrigin,
} from './errorUtils.js';
import { describe, expect, it } from '@jest/globals';

import { FailureResult } from '../types/errors.js';

describe('errorUtils', () => {
  describe('formatError', () => {
    it('should substitute single variable', () => {
      const result = formatError({
        template: ErrorTemplate.NO_DATA,
        values: { source: 'CSV' },
      });
      expect(result).toBe('No data found in CSV');
    });

    it('should substitute multiple variables', () => {
      const result = formatError({
        template: ErrorTemplate.ASYMMETRIC_MATCH,
        values: { team1: 'Alice', team2: 'Bob' },
      });
      expect(result).toBe('Match history must be symmetrical - found Alice vs Bob but not Bob vs Alice');
    });

    it('should handle string values', () => {
      const result = formatError({
        template: ErrorTemplate.FILE_NOT_FOUND,
        values: { path: 'test.csv' },
      });
      expect(result).toBe('File not found: "test.csv"');
    });

    it('should handle number values', () => {
      const result = formatError({
        template: ErrorTemplate.MAX_ROUNDS,
        values: { rounds: 5, teams: 3 },
      });
      expect(result).toBe('Number of rounds (5) must be less than number of teams (3)');
    });

    it('should handle templates without variables', () => {
      const result = formatError({
        template: ErrorTemplate.MIN_TEAMS,
        values: {},
      });
      expect(result).toBe('Must have at least 2 teams');
    });
  });

  describe('createInvalidValueMessage', () => {
    it('should format message with string expected value', () => {
      const result = createInvalidValueMessage({
        origin: 'CLI',
        argName: 'teams',
        inputValue: 'Alice',
        expectedValue: 'at least two teams',
      });
      expect(result).toBe('Invalid CLI argument "teams": "Alice". Expected at least two teams');
    });

    it('should format message with array of expected values', () => {
      const result = createInvalidValueMessage({
        origin: 'CLI',
        argName: 'format',
        inputValue: 'yaml',
        expectedValue: ['json', 'csv'],
      });
      expect(result).toBe('Invalid CLI argument "format": "yaml". Expected one of "json, csv"');
    });

    it('should handle different origins', () => {
      const result = createInvalidValueMessage({
        origin: 'JSON',
        argName: 'teams',
        inputValue: 'Alice',
        expectedValue: 'at least two teams',
      });
      expect(result).toBe('Invalid JSON argument "teams": "Alice". Expected at least two teams');
    });
  });

  describe('wrapErrorWithOrigin', () => {
    it('should wrap string error with origin', () => {
      const result = wrapErrorWithOrigin({
        error: 'Invalid team name',
        origin: 'CLI',
      });
      expect(result).toEqual({
        success: false,
        message: 'Invalid CLI data: Invalid team name',
      });
    });

    it('should wrap failure result with origin', () => {
      const error: FailureResult = {
        success: false,
        message: 'Missing required field',
      };
      const result = wrapErrorWithOrigin({
        error,
        origin: 'CSV',
      });
      expect(result).toEqual({
        success: false,
        message: 'Invalid CSV data: Missing required field',
      });
    });

    it('should maintain return type FailureResult', () => {
      const result = wrapErrorWithOrigin({
        error: 'test error',
        origin: 'JSON',
      });
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('message');
    });

    // Test helper to verify TypeScript type checking
    it('should be type-safe', () => {
      const validError: FailureResult = {
        success: false,
        message: 'error message',
      };

      // These should compile
      wrapErrorWithOrigin({ error: 'string message', origin: 'CLI' });
      wrapErrorWithOrigin({ error: validError, origin: 'CSV' });

      const invalidInput = { success: true, value: 'test' };
      // @ts-expect-error - success: true should not be accepted
      wrapErrorWithOrigin({ error: invalidInput, origin: 'JSON' });
    });
  });
  describe('normalizeError', () => {
    it('handles Error objects', () => {
      const error = new Error('test message');
      // eslint-disable-next-line functional/immutable-data
      error.name = 'TestError';

      expect(normalizeError(error)).toEqual({
        name: 'TestError',
        message: 'test message',
      });
    });

    it('handles string errors', () => {
      expect(normalizeError('test error')).toEqual({
        name: 'UnknownError',
        message: 'test error',
      });
    });

    it('handles non-standard error objects', () => {
      const error = { foo: 'bar' };
      expect(normalizeError(error)).toEqual({
        name: 'UnknownError',
        message: '[object Object]',
      });
    });

    it('handles null/undefined', () => {
      expect(normalizeError(null)).toEqual({
        name: 'UnknownError',
        message: 'null',
      });

      expect(normalizeError(undefined)).toEqual({
        name: 'UnknownError',
        message: 'undefined',
      });
    });
  });
});
