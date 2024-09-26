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
      const mockCSV = `players,num-rounds,start-round,order,format,matches1,matches2
      Alice,3,1,random,text,Alice,Bob
      Bob,,,,,`;
      const mockParseResult = createMockPapaParseResult({
        data: [
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
        ],
      });

      // eslint-disable-next-line max-params
      mockPapaParse.mockImplementation((_input, _config) => mockParseResult);

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

      // eslint-disable-next-line max-params
      mockPapaParse.mockImplementation((_input, _config?) => mockParseResult);

      const result = parseCSV(mockCSV);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('InvalidInput');
        expect(result.error.message).toContain('CSV parsing error');
      }
      expect(mockPapaParse).toHaveBeenCalledWith(mockCSV, expect.any(Object));
    });
  });
});
