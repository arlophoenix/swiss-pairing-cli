import { describe, expect, it } from '@jest/globals';

import { validateCLIOptions } from './cliValidator.js';

describe('validateCLIOptions', () => {
  it('should validate an empty options object', () => {
    const result = validateCLIOptions({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual({});
    }
  });

  it('should validate complete tournament configuration', () => {
    const result = validateCLIOptions({
      teams: ['Alice', 'Bob'],
      numRounds: '3',
      startRound: '1',
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

  describe('teams validation', () => {
    it('should handle teams without squads', () => {
      const result = validateCLIOptions({
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

    it('should handle teams with squads', () => {
      const result = validateCLIOptions({
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

    it('should reject invalid team string format', () => {
      const result = validateCLIOptions({
        teams: ['Alice [A] [B]', 'Bob'],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toContain('Invalid CLI argument');
      }
    });

    it('should reject duplicate team names', () => {
      const result = validateCLIOptions({
        teams: ['Alice [A]', 'Alice [B]'],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toContain('Invalid CLI argument');
      }
    });

    it('should reject single team', () => {
      const result = validateCLIOptions({
        teams: ['Alice'],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toContain('Invalid CLI argument');
      }
    });
  });

  describe('rounds validation', () => {
    it('should reject negative round count', () => {
      const result = validateCLIOptions({
        teams: ['Alice', 'Bob'],
        numRounds: '-1',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toContain('Invalid CLI argument');
      }
    });

    it('should reject zero round count', () => {
      const result = validateCLIOptions({
        teams: ['Alice', 'Bob'],
        numRounds: '0',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toContain('Invalid CLI argument');
      }
    });

    it('should reject non-numeric round count', () => {
      const result = validateCLIOptions({
        teams: ['Alice', 'Bob'],
        numRounds: 'abc',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toContain('Invalid CLI argument');
      }
    });
  });

  describe('matches validation', () => {
    it('should reject invalid match format', () => {
      const result = validateCLIOptions({
        teams: ['Alice', 'Bob', 'Charlie', 'David'],
        matches: [['Alice']], // Missing second team
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toContain('Invalid CLI argument');
      }
    });

    it('should accept valid match format', () => {
      const result = validateCLIOptions({
        teams: ['Alice', 'Bob', 'Charlie', 'David'],
        matches: [
          ['Alice', 'Bob'],
          ['Charlie', 'David'],
        ],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.matches).toEqual([
          ['Alice', 'Bob'],
          ['Charlie', 'David'],
        ]);
      }
    });
  });

  describe('formatting options', () => {
    it('should reject invalid order value', () => {
      const result = validateCLIOptions({
        teams: ['Alice', 'Bob'],
        order: 'invalid',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toContain('Invalid CLI argument');
      }
    });

    it('should reject invalid format value', () => {
      const result = validateCLIOptions({
        teams: ['Alice', 'Bob'],
        format: 'invalid',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toContain('Invalid CLI argument');
      }
    });
  });
});
