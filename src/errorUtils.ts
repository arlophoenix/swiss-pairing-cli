import { CLIArg } from './types.js';

export function createInvalidValueErrorMessage({
  origin,
  argName,
  inputValue,
  expectedValue,
}: {
  readonly origin: 'JSON' | 'CSV' | 'CLI';
  readonly argName: CLIArg;
  readonly inputValue: string;
  readonly expectedValue: string | readonly string[];
}): string {
  let expectedValueString: string;
  if (Array.isArray(expectedValue)) {
    expectedValueString = `"${expectedValue.join(', ')}"`;
  } else {
    expectedValueString = expectedValue as string;
  }
  const argNamePrefix = origin === 'CLI' ? '--' : '';
  const expectedValuePrefix = Array.isArray(expectedValue) ? 'one of ' : '';
  return `Invalid ${origin} value "${argNamePrefix}${argName}": "${inputValue}". Expected ${expectedValuePrefix}${expectedValueString}.`;
}
