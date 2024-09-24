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

    it('should throw error for invalid JSON syntax', () => {
      const mockContent = '{ invalid json }';

      expect(() => parseJSON(mockContent)).toThrow(SyntaxError);
    });

    it('should throw error for non-object JSON', () => {
      const mockContent = JSON.stringify(['Alice', 'Bob']);

      expect(() => parseJSON(mockContent)).toThrow('Invalid JSON: not an object');
    });

    it('should throw error for non-array players', () => {
      const mockContent = JSON.stringify({
        players: 'Alice',
      });

      expect(() => parseJSON(mockContent)).toThrow(
        'Invalid JSON value "players": ""Alice"". Expected an array of strings.'
      );
    });

    it('should throw error for non-number num-rounds', () => {
      const mockContent = JSON.stringify({
        players: ['Alice', 'Bob'],
        'num-rounds': '3',
      });

      expect(() => parseJSON(mockContent)).toThrow(
        'Invalid JSON value "num-rounds": ""3"". Expected a positive integer.'
      );
    });

    it('should throw error for negative num-rounds', () => {
      const mockContent = JSON.stringify({
        players: ['Alice', 'Bob'],
        'num-rounds': -1,
      });

      expect(() => parseJSON(mockContent)).toThrow(
        'Invalid JSON value "num-rounds": "-1". Expected a positive integer.'
      );
    });

    it('should throw error for non-number start-round', () => {
      const mockContent = JSON.stringify({
        players: ['Alice', 'Bob'],
        'start-round': '1',
      });

      expect(() => parseJSON(mockContent)).toThrow(
        'Invalid JSON value "start-round": ""1"". Expected a positive integer.'
      );
    });

    it('should throw error for negative start-round', () => {
      const mockContent = JSON.stringify({
        players: ['Alice', 'Bob'],
        'start-round': -1,
      });

      expect(() => parseJSON(mockContent)).toThrow(
        'Invalid JSON value "start-round": "-1". Expected a positive integer.'
      );
    });

    it('should throw error for invalid order', () => {
      const mockContent = JSON.stringify({
        players: ['Alice', 'Bob'],
        order: 'invalid-order',
      });

      expect(() => parseJSON(mockContent)).toThrow(
        'Invalid JSON value "order": ""invalid-order"". Expected one of "top-down, bottom-up, random".'
      );
    });

    it('should throw error for invalid format', () => {
      const mockContent = JSON.stringify({
        players: ['Alice', 'Bob'],
        format: 'invalid-format',
      });

      expect(() => parseJSON(mockContent)).toThrow(
        'Invalid JSON value "format": ""invalid-format"". Expected one of "text, json-plain, json-pretty".'
      );
    });

    it('should throw error for invalid matches format', () => {
      const mockContent = JSON.stringify({
        players: ['Alice', 'Bob', 'Charlie'],
        matches: ['Alice', 'Bob'],
      });

      expect(() => parseJSON(mockContent)).toThrow(
        'Invalid JSON value "matches": "["Alice","Bob"]". Expected an array of valid matches.'
      );
    });

    it('should throw error for invalid match pair', () => {
      const mockContent = JSON.stringify({
        players: ['Alice', 'Bob', 'Charlie'],
        matches: [['Alice', 'Bob', 'Charlie']],
      });

      expect(() => parseJSON(mockContent)).toThrow(
        'Invalid JSON value "matches": "[["Alice","Bob","Charlie"]]". Expected an array of valid matches.'
      );
    });
  });
});
