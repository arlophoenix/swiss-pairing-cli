import { describe, expect, it } from '@jest/globals';

import { validateJSONOptions } from './jsonValidator.js';

describe('jsonValidator', () => {
  it('should handle empty object', () => {
    const result = validateJSONOptions({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual({});
    }
  });

  it('should validate complete tournament config', () => {
    const result = validateJSONOptions({
      teams: ['Alice', 'Bob'],
      'num-rounds': 3,
      'start-round': 1,
      order: 'random',
      format: 'text-markdown',
      matches: [['Alice', 'Bob']],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual({
        teams: [
          { name: 'Alice', squad: undefined },
          { name: 'Bob', squad: undefined },
        ],
        numRounds: 3,
        startRound: 1,
        order: 'random',
        format: 'text-markdown',
        matches: [['Alice', 'Bob']],
      });
    }
  });

  describe('team formats', () => {
    it('should handle string array without squads', () => {
      const result = validateJSONOptions({
        teams: ['Alice', 'Bob', 'Charlie'],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.teams).toEqual([
          { name: 'Alice', squad: undefined },
          { name: 'Bob', squad: undefined },
          { name: 'Charlie', squad: undefined },
        ]);
      }
    });

    it('should handle string array with squad notation', () => {
      const result = validateJSONOptions({
        teams: ['Alice [A]', 'Bob [B]', 'Charlie'],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.teams).toEqual([
          { name: 'Alice', squad: 'A' },
          { name: 'Bob', squad: 'B' },
          { name: 'Charlie', squad: undefined },
        ]);
      }
    });

    it('should handle team objects', () => {
      const result = validateJSONOptions({
        teams: [
          { name: 'Alice', squad: 'A' },
          { name: 'Bob', squad: 'B' },
          { name: 'Charlie', squad: undefined },
        ],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.teams).toEqual([
          { name: 'Alice', squad: 'A' },
          { name: 'Bob', squad: 'B' },
          { name: 'Charlie', squad: undefined },
        ]);
      }
    });

    it('should reject duplicate team names', () => {
      const result = validateJSONOptions({
        teams: [
          { name: 'Alice', squad: 'A' },
          { name: 'Alice', squad: 'B' },
        ],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toContain('Invalid JSON data:');
      }
    });
  });

  describe('validation', () => {
    it('should reject invalid round count', () => {
      const result = validateJSONOptions({
        teams: ['Alice', 'Bob'],
        'num-rounds': -1,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toContain('Invalid JSON data:');
      }
    });

    it('should reject invalid order value', () => {
      const result = validateJSONOptions({
        teams: ['Alice', 'Bob'],
        order: 'invalid',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toContain('Invalid JSON data:');
      }
    });

    it('should reject invalid match format', () => {
      const result = validateJSONOptions({
        teams: ['Alice', 'Bob'],
        matches: [['Alice']], // Missing second team
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toContain('Invalid JSON data:');
      }
    });

    it('should reject too few teams', () => {
      const result = validateJSONOptions({
        teams: ['Alice'],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toContain('Invalid JSON data:');
      }
    });
  });
});
