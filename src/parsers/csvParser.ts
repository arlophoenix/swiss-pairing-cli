import { Result, ValidatedCLIOptions } from '../types/types.js';

import { parseCSV } from './csvParserUtils.js';
import { validateCSVOptions } from '../validators/csvValidator.js';

export function parseOptionsFromCSV(content: string): Result<Partial<ValidatedCLIOptions>> {
  const parseResult = parseCSV(content);
  if (!parseResult.success) return parseResult;

  const records = parseResult.value;
  if (records.length === 0)
    return { success: false, error: { type: 'InvalidInput', message: 'No data found in CSV' } };

  return validateCSVOptions(records);
}
