import { CLIArg, InputOrigin } from '../types/types.js';

/**
 * Creates a standardized error message for invalid input values.
 * Used by validators to provide consistent error messaging across the application.
 *
 * @param {Object} params - The parameters for creating the message
 * @param {InputOrigin} params.origin - The source of the input (CLI, CSV, or JSON)
 * @param {CLIArg} params.argName - The name of the argument that was invalid
 * @param {string} params.inputValue - The actual invalid value provided
 * @param {string | readonly string[]} params.expectedValue - The expected value or array of valid options
 * @returns {string} A formatted error message string
 */
export function createInvalidValueMessage({
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
  const argNamePrefix = origin === 'CLI' ? '--' : '';
  const expectedValueString = Array.isArray(expectedValue)
    ? `"${expectedValue.join(', ')}"`
    : (expectedValue as string);
  const expectedValuePrefix = Array.isArray(expectedValue) ? 'one of ' : '';

  return `Invalid ${origin} argument "${argNamePrefix}${argName}": "${inputValue}". Expected ${expectedValuePrefix}${expectedValueString}`;
}
