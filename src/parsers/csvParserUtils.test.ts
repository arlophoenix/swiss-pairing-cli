import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { UnvalidatedCSVRow, parseCSV } from './csvParserUtils.js';
import * as papa from 'papaparse';

jest.mock('papaparse');

function createMockPapaParseResult({
  data = [],
  errors = [],
}: {
  // eslint-disable-next-line functional/prefer-readonly-type
  data?: UnvalidatedCSVRow[];
  // eslint-disable-next-line functional/prefer-readonly-type
  errors?: papa.ParseError[];
}): papa.ParseResult<UnvalidatedCSVRow> {
  return {
    data,
    errors,
    meta: { delimiter: ',', linebreak: '\n', aborted: false, truncated: false, cursor: 1 },
  };
}

describe('csvParserUtils', () => {
  let mockPapaParse: jest.MockedFunction<typeof papa.parse<UnvalidatedCSVRow>>;

  beforeEach(() => {
    // unsure why the typing isn't working here
    mockPapaParse = papa.parse as unknown as jest.MockedFunction<typeof papa.parse<UnvalidatedCSVRow>>;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('parseCSV', () => {
    it('should return success with parsed data when CSV is valid', () => {
      const mockCSV = `teams,num-rounds,start-round,order,format,matches-home,matches-away
      Alice,3,1,random,text,Alice,Bob
      Bob,,,,,`;
      const mockParseResult = createMockPapaParseResult({
        data: [
          {
            teams: 'Alice',
            'num-rounds': '3',
            'start-round': '1',
            order: 'random',
            format: 'text-markdown',
            'matches-home': 'Alice',
            'matches-away': 'Bob',
          },
          { teams: 'Bob' },
        ],
      });

      // eslint-disable-next-line max-params, @typescript-eslint/no-explicit-any
      mockPapaParse.mockImplementation((_input: any, _config: any) => mockParseResult);

      const result = parseCSV(mockCSV);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual(mockParseResult.data);
      }
      expect(mockPapaParse).toHaveBeenCalledWith(mockCSV, expect.any(Object));
    });

    it('should return failure with error message when CSV parsing fails', () => {
      const mockCSV = 'invalid,csv,data';
      const mockParseResult = createMockPapaParseResult({
        errors: [
          {
            type: 'Quotes',
            code: 'MissingQuotes',
            message: 'Quoted field unterminated',
            row: 0,
          },
        ],
      });

      // eslint-disable-next-line max-params, @typescript-eslint/no-explicit-any
      mockPapaParse.mockImplementation((_input: any, _config?: any) => mockParseResult);

      const result = parseCSV(mockCSV);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toBe('Invalid CSV: Quoted field unterminated');
      }
      expect(mockPapaParse).toHaveBeenCalledWith(mockCSV, expect.any(Object));
    });

    it('should ignore UndetectableDelimiter warnings', () => {
      const mockCSV = 'Teams\nTeam1\nTeam2';
      const mockParseResult = createMockPapaParseResult({
        data: [{ teams: 'Team1' }, { teams: 'Team2' }],
        errors: [
          {
            type: 'Delimiter',
            code: 'UndetectableDelimiter',
            message: "Unable to auto-detect delimiting character; defaulted to ','",
          },
        ],
      });

      // eslint-disable-next-line max-params, @typescript-eslint/no-explicit-any
      mockPapaParse.mockImplementation((_input: any, _config?: any) => mockParseResult);

      const result = parseCSV(mockCSV);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual([{ teams: 'Team1' }, { teams: 'Team2' }]);
      }
      expect(mockPapaParse).toHaveBeenCalledWith(mockCSV, expect.any(Object));
    });

    it('should be case-insensitive for header names', () => {
      const mockCSV = `TeAmS,NuM-rOuNdS,StArT-rOuNd,OrDeR,FoRmAt,MaTcHeS1,MaTcHeS2
      Alice,3,1,random,text,Alice,Bob
      Bob,,,,,`;
      const mockParseResult = createMockPapaParseResult({
        data: [
          {
            teams: 'Alice',
            'num-rounds': '3',
            'start-round': '1',
            order: 'random',
            format: 'text-markdown',
            'matches-home': 'Alice',
            'matches-away': 'Bob',
          },
          { teams: 'Bob' },
        ],
      });

      // eslint-disable-next-line max-params, @typescript-eslint/no-explicit-any
      mockPapaParse.mockImplementation((_input: any, _config: any) => mockParseResult);

      const result = parseCSV(mockCSV);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual(mockParseResult.data);
      }
      expect(mockPapaParse).toHaveBeenCalledWith(
        mockCSV,
        expect.objectContaining({
          transformHeader: expect.any(Function),
        })
      );
    });

    it('should trim whitespace and convert headers to lowercase', () => {
      const mockCSV = ` Teams , Num-Rounds ,  START-ROUND
      Alice,3,1`;
      const mockParseResult = createMockPapaParseResult({
        data: [
          {
            teams: 'Alice',
            'num-rounds': '3',
            'start-round': '1',
          },
        ],
      });

      // eslint-disable-next-line max-params, @typescript-eslint/no-explicit-any
      mockPapaParse.mockImplementation((_input: any, config: any) => {
        // Test the transformHeader function directly
        const headers = [' Teams ', ' Num-Rounds ', '  START-ROUND  '];
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        const transformedHeaders = headers.map(config.transformHeader);
        expect(transformedHeaders).toEqual(['teams', 'num-rounds', 'start-round']);

        return mockParseResult;
      });

      const result = parseCSV(mockCSV);

      expect(result.success).toBe(true);
      expect(mockPapaParse).toHaveBeenCalledWith(
        mockCSV,
        expect.objectContaining({
          transformHeader: expect.any(Function),
        })
      );
    });
  });
});
