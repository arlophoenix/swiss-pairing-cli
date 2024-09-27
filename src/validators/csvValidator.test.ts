import { describe, expect, it } from '@jest/globals';
import {
  validateCSVFormat,
  validateCSVMatches,
  validateCSVNumRounds,
  validateCSVOptions,
  validateCSVOrder,
  validateCSVPlayers,
  validateCSVStartRound,
} from './csvValidator.js';

import { CSVRecord } from '../parsers/csvParserUtils.js';

describe('csvValidator', () => {
  describe('validateCSVOptions', () => {
    it('should return success with valid options', () => {
      const csvRecords: readonly CSVRecord[] = [
        {
          players: 'Alice',
          'num-rounds': '3',
          'start-round': '1',
          order: 'random',
          format: 'text',
          matches1: 'Alice',
          matches2: 'Bob',
        },
        { players: 'Bob' },
      ];

      const result = validateCSVOptions(csvRecords);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual({
          players: ['Alice', 'Bob'],
          numRounds: 3,
          startRound: 1,
          order: 'random',
          format: 'text',
          matches: [['Alice', 'Bob']],
        });
      }
    });

    it('should return failure with invalid options', () => {
      const csvRecords: readonly CSVRecord[] = [
        {
          players: 'Alice',
          'num-rounds': 'invalid',
          'start-round': '1',
          order: 'invalid',
          format: 'invalid',
        },
      ];

      const result = validateCSVOptions(csvRecords);

      expect(result.success).toBe(false);
    });
  });

  describe('validateCSVPlayers', () => {
    it('should return success with valid players', () => {
      const records: readonly CSVRecord[] = [{ players: 'Alice' }, { players: 'Bob' }];
      const result = validateCSVPlayers(records);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual(['Alice', 'Bob']);
      }
    });

    it('should return failure with invalid players', () => {
      const records: readonly CSVRecord[] = [{ players: 'Alice' }];
      const result = validateCSVPlayers(records);

      expect(result.success).toBe(false);
    });
  });

  describe('validateCSVNumRounds', () => {
    it('should return success with valid num-rounds', () => {
      const record: CSVRecord = { 'num-rounds': '3' };
      const result = validateCSVNumRounds(record);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(3);
      }
    });

    it('should return failure with invalid num-rounds', () => {
      const record: CSVRecord = { 'num-rounds': 'invalid' };
      const result = validateCSVNumRounds(record);

      expect(result.success).toBe(false);
    });
  });

  describe('validateCSVStartRound', () => {
    it('should return success with valid start-round', () => {
      const record: CSVRecord = { 'start-round': '1' };
      const result = validateCSVStartRound(record);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(1);
      }
    });

    it('should return failure with invalid start-round', () => {
      const record: CSVRecord = { 'start-round': 'invalid' };
      const result = validateCSVStartRound(record);

      expect(result.success).toBe(false);
    });
  });

  describe('validateCSVOrder', () => {
    it('should return success with valid order', () => {
      const record: CSVRecord = { order: 'random' };
      const result = validateCSVOrder(record);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe('random');
      }
    });

    it('should return failure with invalid order', () => {
      const record: CSVRecord = { order: 'invalid' };
      const result = validateCSVOrder(record);

      expect(result.success).toBe(false);
    });
  });

  describe('validateCSVFormat', () => {
    it('should return success with valid format', () => {
      const record: CSVRecord = { format: 'text' };
      const result = validateCSVFormat(record);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe('text');
      }
    });

    it('should return failure with invalid format', () => {
      const record: CSVRecord = { format: 'invalid' };
      const result = validateCSVFormat(record);

      expect(result.success).toBe(false);
    });
  });

  describe('validateCSVMatches', () => {
    it('should return success with valid matches', () => {
      const records: readonly CSVRecord[] = [{ matches1: 'Alice', matches2: 'Bob' }];
      const result = validateCSVMatches(records);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual([['Alice', 'Bob']]);
      }
    });

    it('should return failure with invalid matches', () => {
      const records: readonly CSVRecord[] = [{ matches1: 'Alice' }];
      const result = validateCSVMatches(records);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toEqual({
          type: 'InvalidInput',
          message:
            'Invalid CSV value "matches": "". Expected matches1 & matches2 should include the same number of players.',
        });
      }
    });
  });
});
