import { parseJSON } from './jsonParser.js';

describe('jsonParser', () => {
  describe('parseJSON', () => {
    it('should parse JSON content correctly', () => {
      const mockContent = JSON.stringify({
        players: ['Alice', 'Bob', 'Charlie'],
        'num-rounds': 3,
        'start-round': 1,
        order: 'random',
        matches: [['Bob', 'Charlie']],
      });

      const result = parseJSON(mockContent);

      expect(result).toEqual({
        players: ['Alice', 'Bob', 'Charlie'],
        numRounds: 3,
        startRound: 1,
        order: 'random',
        matches: [['Bob', 'Charlie']],
      });
    });

    it('should parse JSON content with only players field', () => {
      const mockContent = JSON.stringify({
        players: ['Alice', 'Bob', 'Charlie'],
      });

      const result = parseJSON(mockContent);

      expect(result).toEqual({
        players: ['Alice', 'Bob', 'Charlie'],
      });
    });

    it('should parse JSON content with some optional fields missing', () => {
      const mockContent = JSON.stringify({
        players: ['Alice', 'Bob', 'Charlie'],
        'num-rounds': 3,
      });

      const result = parseJSON(mockContent);

      expect(result).toEqual({
        players: ['Alice', 'Bob', 'Charlie'],
        numRounds: 3,
      });
    });

    it('should parse JSON content with format field', () => {
      const mockContent = JSON.stringify({
        players: ['Alice', 'Bob'],
        'num-rounds': 3,
        'start-round': 1,
        order: 'random',
        matches: [['Alice', 'Bob']],
        format: 'json-plain',
      });

      const result = parseJSON(mockContent);

      expect(result).toEqual({
        players: ['Alice', 'Bob'],
        numRounds: 3,
        startRound: 1,
        order: 'random',
        matches: [['Alice', 'Bob']],
        format: 'json-plain',
      });
    });

    it('should throw error for invalid format field', () => {
      const mockContent = JSON.stringify({
        players: ['Alice', 'Bob'],
        format: 'invalid-format',
      });

      expect(() => parseJSON(mockContent)).toThrow(
        'Invalid JSON value "format": ""invalid-format"". Expected one of "text, json-plain, json-pretty".'
      );
    });

    it('should throw error for invalid order field', () => {
      const mockContent = JSON.stringify({
        players: ['Alice', 'Bob'],
        order: 'invalid-order',
      });

      expect(() => parseJSON(mockContent)).toThrow(
        'Invalid JSON value "order": ""invalid-order"". Expected one of "top-down, bottom-up, random".'
      );
    });
  });
});
