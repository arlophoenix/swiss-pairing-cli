import * as cliValidator from './cliValidator.js';

import {
  JSONRecord,
  validateJSONFormat,
  validateJSONMatches,
  validateJSONNumRounds,
  validateJSONOptions,
  validateJSONOrder,
  validateJSONPlayers,
  validateJSONStartRound,
} from './jsonValidator.js';
import { describe, expect, it, jest } from '@jest/globals';

jest.mock('./cliValidator.js');

describe('jsonValidator', () => {
  describe('validateJSONOptions', () => {
    it('should return success with valid options', () => {
      const jsonRecord = {
        players: ['Alice', 'Bob'],
        'num-rounds': 3,
        'start-round': 1,
        order: 'random',
        format: 'text',
        matches: [['Alice', 'Bob']],
      };

      jest.spyOn(cliValidator, 'validatePlayers').mockReturnValue({ success: true, value: ['Alice', 'Bob'] });
      jest.spyOn(cliValidator, 'validateNumRounds').mockReturnValue({ success: true, value: 3 });
      jest.spyOn(cliValidator, 'validateStartRound').mockReturnValue({ success: true, value: 1 });
      jest.spyOn(cliValidator, 'validateOrder').mockReturnValue({ success: true, value: 'random' });
      jest.spyOn(cliValidator, 'validateFormat').mockReturnValue({ success: true, value: 'text' });
      jest
        .spyOn(cliValidator, 'validateMatches')
        .mockReturnValue({ success: true, value: [['Alice', 'Bob']] });

      const result = validateJSONOptions(jsonRecord);

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
      const jsonRecord = {
        players: ['Alice'],
        'num-rounds': 'invalid',
        'start-round': 'invalid',
        order: 'invalid',
        format: 'invalid',
        // intentionally invalid type
      } as unknown as JSONRecord;

      jest
        .spyOn(cliValidator, 'validatePlayers')
        .mockReturnValue({ success: false, error: { type: 'InvalidInput', message: 'Invalid players' } });

      const result = validateJSONOptions(jsonRecord);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Invalid players');
      }
    });

    it('should handle empty object', () => {
      const result = validateJSONOptions({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toEqual({
          message: 'Invalid players',
          type: 'InvalidInput',
        });
      }
    });
  });

  describe('validateJSONPlayers', () => {
    it('should call validatePlayers with correct arguments', () => {
      const mockValidatePlayers = jest
        .spyOn(cliValidator, 'validatePlayers')
        .mockReturnValue({ success: true, value: ['Alice', 'Bob'] });
      const result = validateJSONPlayers({ players: ['Alice', 'Bob'] });

      expect(mockValidatePlayers).toHaveBeenCalledWith(['Alice', 'Bob']);
      expect(result).toEqual({ success: true, value: ['Alice', 'Bob'] });
    });

    it('should handle undefined input', () => {
      const mockValidatePlayers = jest
        .spyOn(cliValidator, 'validatePlayers')
        .mockReturnValue({ success: true, value: undefined });
      const result = validateJSONPlayers({});

      expect(mockValidatePlayers).toHaveBeenCalledWith(undefined);
      expect(result).toEqual({ success: true, value: undefined });
    });
  });

  describe('validateJSONNumRounds', () => {
    it('should call validateNumRounds with correct arguments', () => {
      const mockValidateNumRounds = jest
        .spyOn(cliValidator, 'validateNumRounds')
        .mockReturnValue({ success: true, value: 3 });
      const result = validateJSONNumRounds({ 'num-rounds': 3 });

      expect(mockValidateNumRounds).toHaveBeenCalledWith('3');
      expect(result).toEqual({ success: true, value: 3 });
    });
  });

  describe('validateJSONStartRound', () => {
    it('should call validateStartRound with correct arguments', () => {
      const mockValidateStartRound = jest
        .spyOn(cliValidator, 'validateStartRound')
        .mockReturnValue({ success: true, value: 1 });
      const result = validateJSONStartRound({ 'start-round': 1 });

      expect(mockValidateStartRound).toHaveBeenCalledWith('1');
      expect(result).toEqual({ success: true, value: 1 });
    });
  });

  describe('validateJSONOrder', () => {
    it('should call validateOrder with correct arguments', () => {
      const mockValidateOrder = jest
        .spyOn(cliValidator, 'validateOrder')
        .mockReturnValue({ success: true, value: 'random' });
      const result = validateJSONOrder({ order: 'random' });

      expect(mockValidateOrder).toHaveBeenCalledWith('random');
      expect(result).toEqual({ success: true, value: 'random' });
    });
  });

  describe('validateJSONFormat', () => {
    it('should call validateFormat with correct arguments', () => {
      const mockValidateFormat = jest
        .spyOn(cliValidator, 'validateFormat')
        .mockReturnValue({ success: true, value: 'text' });
      const result = validateJSONFormat({ format: 'text' });

      expect(mockValidateFormat).toHaveBeenCalledWith('text');
      expect(result).toEqual({ success: true, value: 'text' });
    });
  });

  describe('validateJSONMatches', () => {
    it('should call validateMatches with correct arguments', () => {
      const mockValidateMatches = jest
        .spyOn(cliValidator, 'validateMatches')
        .mockReturnValue({ success: true, value: [['Alice', 'Bob']] });
      const result = validateJSONMatches({ matches: [['Alice', 'Bob']] });

      expect(mockValidateMatches).toHaveBeenCalledWith([['Alice', 'Bob']]);
      expect(result).toEqual({ success: true, value: [['Alice', 'Bob']] });
    });
  });
});
