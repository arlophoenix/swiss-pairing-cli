/**
 * Core error handling types.
 * Implements Result pattern for consistent error handling:
 * - No exceptions for expected error cases
 * - Type safety for success/failure paths
 * - Clear error contexts and origins
 *
 * @module errors
 */

/**
 * Error result with message.
 * Always includes success: false to distinguish from success case.
 */
export interface FailureResult {
  readonly success: false;
  readonly message: string;
}

/**
 * Generic Result type combining success and failure cases.
 * Success case includes strongly typed value.
 * Failure case includes error message.
 *
 * @template T Type of success value
 *
 * @example
 * function divide(a: number, b: number): Result<number> {
 *   if (b === 0) {
 *     return { success: false, message: "Division by zero" };
 *   }
 *   return { success: true, value: a / b };
 * }
 */
export type Result<T> = { readonly success: true; readonly value: T } | FailureResult;

/**
 * Simplified Result for operations without return value.
 * Used for pure validation functions.
 */
export type BooleanResult = { readonly success: true } | FailureResult;

/**
 * Categories of errors for appropriate handling.
 */
export type ErrorType = 'InvalidInput' | 'InvalidOutput' | 'NoValidSolution';

/**
 * Sources of input for error context.
 * Used to provide appropriate error messages.
 */
export type InputOrigin = 'CLI' | 'CSV' | 'JSON';
