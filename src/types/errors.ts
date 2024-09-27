export type Result<T> =
  | { readonly success: true; readonly value: T }
  | { readonly success: false; readonly error: ValidationError };

export type BooleanResult =
  | { readonly success: true }
  | { readonly success: false; readonly error: ValidationError };

export interface ValidationError {
  readonly type: ErrorType;
  readonly message: string;
}

export type ErrorType = 'InvalidInput' | 'InvalidOutput' | 'NoValidSolution';
