import { mkdir, rm } from 'fs/promises';

import { CLIOptions } from './types.js';
import { join } from 'path';
import { parseFile } from './fileParser.js';
import { writeFile } from 'fs/promises';

describe('fileParser', () => {
  const tempDir = join(__dirname, 'temp');

  beforeAll(async () => {
    await mkdir(tempDir, { recursive: true });
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('CSV parsing', () => {
    it('should parse a valid CSV file correctly', async () => {
      const csvContent = `
players,numRounds,startRound,order,matches1,matches2
Alice,2,1,random,Alice,Bob
Bob,,,,,
Charlie,,,,,
David,,,,,
`;
      const filePath = join(tempDir, 'test.csv');
      await writeFile(filePath, csvContent);

      const result = await parseFile(filePath);

      expect(result).toEqual({
        players: ['Alice', 'Bob', 'Charlie', 'David'],
        numRounds: 2,
        startRound: 1,
        order: 'random',
        matches: [['Alice', 'Bob']],
      });
    });

    it('should handle missing optional fields in CSV', async () => {
      const csvContent = `
players,matches1,matches2
Alice,Alice,Bob
Bob,Charlie,David
Charlie,,
David,,
`;
      const filePath = join(tempDir, 'test_minimal.csv');
      await writeFile(filePath, csvContent);

      const result = await parseFile(filePath);

      expect(result).toEqual({
        players: ['Alice', 'Bob', 'Charlie', 'David'],
        matches: [
          ['Alice', 'Bob'],
          ['Charlie', 'David'],
        ],
      });
    });
  });

  describe('JSON parsing', () => {
    it('should parse a valid JSON file correctly', async () => {
      const jsonContent: CLIOptions = {
        players: ['Alice', 'Bob', 'Charlie', 'David'],
        numRounds: 2,
        startRound: 1,
        order: 'random',
        matches: [
          ['Alice', 'Bob'],
          ['Charlie', 'David'],
        ],
      };
      const filePath = join(tempDir, 'test.json');
      await writeFile(filePath, JSON.stringify(jsonContent));

      const result = await parseFile(filePath);

      expect(result).toEqual(jsonContent);
    });

    it('should handle JSON with missing optional fields', async () => {
      const jsonContent = {
        players: ['Alice', 'Bob', 'Charlie', 'David'],
        matches: [['Alice', 'Bob']],
      };
      const filePath = join(tempDir, 'test_minimal.json');
      await writeFile(filePath, JSON.stringify(jsonContent));

      const result = await parseFile(filePath);

      expect(result).toEqual(jsonContent);
    });

    it('should filter out invalid matches in JSON', async () => {
      const jsonContent = {
        players: ['Alice', 'Bob', 'Charlie', 'David'],
        matches: [['Alice', 'Bob'], ['Charlie'], 'Invalid', { not: 'valid' }],
      };
      const filePath = join(tempDir, 'test_invalid_matches.json');
      await writeFile(filePath, JSON.stringify(jsonContent));

      const result = await parseFile(filePath);

      expect(result).toEqual({
        players: ['Alice', 'Bob', 'Charlie', 'David'],
        matches: [['Alice', 'Bob']],
      });
    });
  });
});
