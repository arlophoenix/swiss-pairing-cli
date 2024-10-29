export interface FailureResult {
  readonly success: false;
  readonly message: string;
}

export type Result<T> = { readonly success: true; readonly value: T } | FailureResult;

export type BooleanResult = { readonly success: true } | FailureResult;

export type ErrorType = 'InvalidInput' | 'InvalidOutput' | 'NoValidSolution';

export type InputOrigin = 'CLI' | 'CSV' | 'JSON';
