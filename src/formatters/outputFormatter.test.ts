import { beforeEach, describe, expect, it } from '@jest/globals';
import {
  formatOutput,
  formatRoundsAsCSV,
  formatRoundsAsMarkdown,
  formatRoundsAsText,
} from './outputFormatter.js';

import { SwissPairingOutput } from '../types/types.js';

describe('outputFormatter', () => {
  let sampleResults: SwissPairingOutput;

  beforeEach(() => {
    sampleResults = {
      rounds: [
        {
          label: 'Round 1',
          number: 1,
          matches: [
            ['Alice', 'Bob'],
            ['Charlie', 'David'],
          ],
        },
        {
          label: 'Round 2',
          number: 2,
          matches: [
            ['Alice', 'Charlie'],
            ['Bob', 'David'],
          ],
        },
      ],
    };
  });

  describe('formatRoundsAsCSV', () => {
    it('should format basic matches correctly', () => {
      const result = formatRoundsAsCSV(sampleResults.rounds);
      const expected = `Round,Match,Home Team,Away Team
1,1,Alice,Bob
1,2,Charlie,David
2,1,Alice,Charlie
2,2,Bob,David`;
      expect(result).toBe(expected);
    });

    it('should handle non-sequential round numbers', () => {
      const nonSequentialResults: SwissPairingOutput = {
        rounds: [
          {
            label: 'Round 3',
            number: 3,
            matches: [
              ['Alice', 'Bob'],
              ['Charlie', 'David'],
            ],
          },
        ],
      };
      const result = formatRoundsAsCSV(nonSequentialResults.rounds);
      const expected = `Round,Match,Home Team,Away Team
3,1,Alice,Bob
3,2,Charlie,David`;
      expect(result).toBe(expected);
    });

    it('should handle BYE teams', () => {
      const byeResults: SwissPairingOutput = {
        rounds: [
          {
            label: 'Round 1',
            number: 1,
            matches: [
              ['Alice', 'Bob'],
              ['Charlie', 'BYE'],
            ],
          },
        ],
      };
      const result = formatRoundsAsCSV(byeResults.rounds);
      expect(result).toContain('1,2,Charlie,BYE');
    });

    it('should handle empty rounds', () => {
      const emptyResults: SwissPairingOutput = {
        rounds: [],
      };
      const result = formatRoundsAsCSV(emptyResults.rounds);
      expect(result).toBe('Round,Match,Home Team,Away Team');
    });
  });

  describe('formatRoundsAsMarkdown', () => {
    it('should format multiple rounds with header', () => {
      const result = formatRoundsAsMarkdown(sampleResults.rounds);
      const expected = `# Matches

**Round 1**

1. Alice vs Bob
2. Charlie vs David

**Round 2**

1. Alice vs Charlie
2. Bob vs David`;
      expect(result).toBe(expected);
    });

    it('should format single round without header', () => {
      const singleRoundResults: SwissPairingOutput = {
        rounds: [sampleResults.rounds[0]],
      };
      const result = formatRoundsAsMarkdown(singleRoundResults.rounds);
      const expected = `**Round 1**

1. Alice vs Bob
2. Charlie vs David`;
      expect(result).toBe(expected);
    });

    it('should handle BYE teams', () => {
      const byeResults: SwissPairingOutput = {
        rounds: [
          {
            label: 'Round 1',
            number: 1,
            matches: [['Alice', 'BYE']],
          },
        ],
      };
      const result = formatRoundsAsMarkdown(byeResults.rounds);
      expect(result).toContain('1. Alice vs BYE');
    });

    it('should handle empty rounds', () => {
      const emptyResults: SwissPairingOutput = {
        rounds: [],
      };
      const result = formatRoundsAsMarkdown(emptyResults.rounds);
      expect(result).toBe('');
    });
  });

  describe('formatRoundsAsText', () => {
    it('should format basic matches correctly', () => {
      const result = formatRoundsAsText(sampleResults.rounds);
      const expected = `Round 1:
Alice vs Bob
Charlie vs David
Round 2:
Alice vs Charlie
Bob vs David`;
      expect(result).toBe(expected);
    });

    it('should handle BYE teams', () => {
      const byeResults: SwissPairingOutput = {
        rounds: [
          {
            label: 'Round 1',
            number: 1,
            matches: [['Alice', 'BYE']],
          },
        ],
      };
      const result = formatRoundsAsText(byeResults.rounds);
      expect(result).toBe('Round 1:\nAlice vs BYE');
    });

    it('should handle empty rounds', () => {
      const emptyResults: SwissPairingOutput = {
        rounds: [],
      };
      const result = formatRoundsAsText(emptyResults.rounds);
      expect(result).toBe('');
    });

    it('should preserve round labels', () => {
      const customLabelResults: SwissPairingOutput = {
        rounds: [
          {
            label: 'Finals',
            number: 1,
            matches: [['Alice', 'Bob']],
          },
        ],
      };
      const result = formatRoundsAsText(customLabelResults.rounds);
      expect(result).toBe('Finals:\nAlice vs Bob');
    });
  });

  describe('formatOutput', () => {
    it('should format output as plain JSON', () => {
      const result = formatOutput({ results: sampleResults, format: 'json-plain' });
      expect(result).toBe(
        JSON.stringify({
          'Round 1': [
            ['Alice', 'Bob'],
            ['Charlie', 'David'],
          ],
          'Round 2': [
            ['Alice', 'Charlie'],
            ['Bob', 'David'],
          ],
        })
      );
    });

    it('should format output as pretty JSON', () => {
      const result = formatOutput({ results: sampleResults, format: 'json-pretty' });
      expect(result).toBe(
        JSON.stringify(
          {
            'Round 1': [
              ['Alice', 'Bob'],
              ['Charlie', 'David'],
            ],
            'Round 2': [
              ['Alice', 'Charlie'],
              ['Bob', 'David'],
            ],
          },
          null,
          2
        )
      );
    });

    it('should format output as text (markdown)', () => {
      const result = formatOutput({ results: sampleResults, format: 'text-markdown' });
      const expected = `# Matches

**Round 1**

1. Alice vs Bob
2. Charlie vs David

**Round 2**

1. Alice vs Charlie
2. Bob vs David`;
      expect(result).toBe(expected);
    });

    it('should format output as CSV', () => {
      const result = formatOutput({ results: sampleResults, format: 'csv' });
      const expected = `Round,Match,Home Team,Away Team
1,1,Alice,Bob
1,2,Charlie,David
2,1,Alice,Charlie
2,2,Bob,David`;
      expect(result).toBe(expected);
    });

    it('should format single round output without title', () => {
      const singleRoundResults: SwissPairingOutput = {
        rounds: [sampleResults.rounds[0]],
      };
      const result = formatOutput({ results: singleRoundResults, format: 'text-markdown' });
      const expected = `**Round 1**

1. Alice vs Bob
2. Charlie vs David`;
      expect(result).toBe(expected);
    });
  });

  it('should handle non-sequential round numbers in CSV format', () => {
    const nonSequentialResults: SwissPairingOutput = {
      rounds: [
        {
          label: 'Round 3',
          number: 3,
          matches: [
            ['Alice', 'Bob'],
            ['Charlie', 'David'],
          ],
        },
        {
          label: 'Round 4',
          number: 4,
          matches: [
            ['Alice', 'Charlie'],
            ['Bob', 'David'],
          ],
        },
      ],
    };

    const result = formatOutput({ results: nonSequentialResults, format: 'csv' });
    const expected = `Round,Match,Home Team,Away Team
3,1,Alice,Bob
3,2,Charlie,David
4,1,Alice,Charlie
4,2,Bob,David`;
    expect(result).toBe(expected);
  });

  it('should handle BYE teams in formats', () => {
    const byeResults: SwissPairingOutput = {
      rounds: [
        {
          label: 'Round 1',
          number: 1,
          matches: [
            ['Alice', 'Bob'],
            ['Charlie', 'BYE'],
          ],
        },
      ],
    };

    const markdown = formatOutput({ results: byeResults, format: 'text-markdown' });
    expect(markdown).toContain('Charlie vs BYE');

    const csv = formatOutput({ results: byeResults, format: 'csv' });
    expect(csv).toContain('Charlie,BYE');
  });

  it('should handle empty rounds array', () => {
    const emptyResults: SwissPairingOutput = {
      rounds: [],
    };

    const json = formatOutput({ results: emptyResults, format: 'json-plain' });
    expect(json).toBe('{}');

    const markdown = formatOutput({ results: emptyResults, format: 'text-markdown' });
    expect(markdown).toBe('');
  });
});
