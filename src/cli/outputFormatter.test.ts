import { describe, expect, it } from '@jest/globals';

import { ReadonlyRoundMatches } from '../types/types.js';
import { formatOutput } from './outputFormatter.js';

describe('outputFormatter', () => {
  const sampleRoundMatches: ReadonlyRoundMatches = {
    'Round 1': [
      ['Alice', 'Bob'],
      ['Charlie', 'David'],
    ],
    'Round 2': [
      ['Alice', 'Charlie'],
      ['Bob', 'David'],
    ],
  };

  describe('formatOutput', () => {
    it('should format output as plain JSON', () => {
      const result = formatOutput({ roundMatches: sampleRoundMatches, format: 'json-plain' });
      expect(result).toBe(JSON.stringify(sampleRoundMatches));
    });

    it('should format output as pretty JSON', () => {
      const result = formatOutput({ roundMatches: sampleRoundMatches, format: 'json-pretty' });
      expect(result).toBe(JSON.stringify(sampleRoundMatches, null, 2));
    });

    it('should format output as text (markdown)', () => {
      const result = formatOutput({ roundMatches: sampleRoundMatches, format: 'text' });
      const expected = `# Matches

**Round 1**

1. Alice vs Bob
2. Charlie vs David

**Round 2**

1. Alice vs Charlie
2. Bob vs David`;
      expect(result).toBe(expected);
    });

    it('should format single round output as text without title', () => {
      const singleRoundMatch: ReadonlyRoundMatches = {
        'Round 1': [
          ['Alice', 'Bob'],
          ['Charlie', 'David'],
        ],
      };
      const result = formatOutput({ roundMatches: singleRoundMatch, format: 'text' });
      const expected = `**Round 1**

1. Alice vs Bob
2. Charlie vs David`;
      expect(result).toBe(expected);
    });
  });
});
