import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { CSVRecord, parseCSV } from './csvParserUtils.js';
import * as papa from 'papaparse';

jest.mock('papaparse');

function createMockPapaParseResult({
  data = [],
  errors = [],
}: {
  // eslint-disable-next-line functional/prefer-readonly-type
  data?: CSVRecord[];
  // eslint-disable-next-line functional/prefer-readonly-type
  errors?: papa.ParseError[];
}): papa.ParseResult<CSVRecord> {
  return {
    data,
    errors,
    meta: { delimiter: ',', linebreak: '\n', aborted: false, truncated: false, cursor: 1 },
  };
}

describe('csvParserUtils', () => {
  let mockPapaParse: jest.MockedFunction<typeof papa.parse<CSVRecord>>;

  beforeEach(() => {
    // unsure why the typing isn't working here
    mockPapaParse = papa.parse as unknown as jest.MockedFunction<typeof papa.parse<CSVRecord>>;
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
            format: 'text',
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
            type: 'Delimiter',
            code: 'UndetectableDelimiter',
            message: "Unable to auto-detect delimiting character; defaulted to ','",
          },
        ],
      });

      // eslint-disable-next-line max-params, @typescript-eslint/no-explicit-any
      mockPapaParse.mockImplementation((_input: any, _config?: any) => mockParseResult);

      const result = parseCSV(mockCSV);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('InvalidInput');
        expect(result.error.message).toContain('CSV parsing error');
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
            format: 'text',
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
  });
});
