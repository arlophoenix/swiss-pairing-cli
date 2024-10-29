export type Result<T> =
  | { readonly success: true; readonly value: T }
  | { readonly success: false; readonly message: string };

export type BooleanResult =
  | { readonly success: true }
  | { readonly success: false; readonly message: string };

export type ErrorType = 'InvalidInput' | 'InvalidOutput' | 'NoValidSolution';

export type InputOrigin = 'CLI' | 'CSV' | 'JSON';
