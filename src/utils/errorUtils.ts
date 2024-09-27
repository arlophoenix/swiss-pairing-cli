import { CLIArg, ErrorType, InputOrigin, ValidationError } from '../types/types.js';

export function createInvalidValueErrorMessage({
  origin,
  argName,
  inputValue,
  expectedValue,
}: {
  readonly origin: InputOrigin;
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

export function createValidationError({
  type,
  message,
}: {
  readonly type: ErrorType;
  readonly message: string;
}): ValidationError {
  return { type, message };
}

export function createInvalidInputError({
  origin,
  argName,
  inputValue,
  expectedValue,
}: {
  readonly origin: 'JSON' | 'CSV' | 'CLI';
  readonly argName: CLIArg;
  readonly inputValue: string;
  readonly expectedValue: string | readonly string[];
}): ValidationError {
  const message = createInvalidValueErrorMessage({ origin, argName, inputValue, expectedValue });
  return createValidationError({ type: 'InvalidInput', message });
}
