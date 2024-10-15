import { describe, expect, it } from '@jest/globals';

import { UnvalidatedCLIOptions } from '../types/types.js';
import { validateCLIOptions } from './cliValidator.js';

describe('cliValidator', () => {
  describe('validateCLIOptions', () => {
    it('should return success for valid options', () => {
      const options: UnvalidatedCLIOptions = {
        teams: ['Alice', 'Bob'],
        numRounds: '3',
        startRound: '1',
        order: 'random',
        format: 'text',
        matches: [['Alice', 'Bob']],
      };
      const result = validateCLIOptions(options);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual({
          teams: ['Alice', 'Bob'],
          numRounds: 3,
          startRound: 1,
          order: 'random',
          format: 'text',
          matches: [['Alice', 'Bob']],
        });
      }
    });

    it('should return failure for invalid options', () => {
      const options: UnvalidatedCLIOptions = {
        teams: ['Alice'],
        numRounds: '-1',
        startRound: '0',
        order: 'invalid',
        format: 'invalid',
        matches: [['Alice']],
      };
      const result = validateCLIOptions(options);
      expect(result.success).toBe(false);
    });

    it('should handle partial options', () => {
      const options: UnvalidatedCLIOptions = {
        teams: ['Alice', 'Bob'],
        numRounds: '3',
      };
      const result = validateCLIOptions(options);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual({
          teams: ['Alice', 'Bob'],
          numRounds: 3,
        });
      }
    });

    it('should handle empty options', () => {
      const options: UnvalidatedCLIOptions = {};
      const result = validateCLIOptions(options);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual({});
      }
    });
  });
});
