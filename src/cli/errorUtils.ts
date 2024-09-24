import { CLIArg } from '../types.js';

export function throwInvalidValueError({
  errorType,
  argName,
  inputValue,
  expectedValue,
}: {
  readonly errorType: 'JSON' | 'CSV' | 'argument';
  readonly argName: CLIArg;
  readonly inputValue: string;
  readonly expectedValue: string | readonly string[];
}): never {
  const errorMessage = createInvalidValueErrorMessage({
    errorType,
    argName,
    inputValue,
    expectedValue,
  });
  throw new Error(errorMessage);
}

export function createInvalidValueErrorMessage({
  errorType,
  argName,
  inputValue,
  expectedValue,
}: {
  readonly errorType: 'JSON' | 'CSV' | 'argument';
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
  const argNamePrefix = errorType === 'argument' ? '--' : '';
  const expectedValuePrefix = Array.isArray(expectedValue) ? 'one of ' : '';
  return `Invalid ${errorType} value "${argNamePrefix}${argName}": "${inputValue}". Expected ${expectedValuePrefix}${expectedValueString}.`;
}
