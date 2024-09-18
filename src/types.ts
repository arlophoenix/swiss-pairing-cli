export interface SwissPairingInput {
  readonly players: readonly string[];
  readonly numRounds: number;
  readonly startRound: number;
  readonly playedMatches: Record<string, readonly string[]>;
}

export type Result<T> =
  | { readonly success: true; readonly value: T }
  | { readonly success: false; readonly errorMessage: string };

export type ValidationResult =
  | { readonly isValid: true }
  | { readonly isValid: false; readonly errorMessage: string };

export type GeneratePairingsResult =
  | { readonly success: true; readonly roundPairings: Record<string, readonly (readonly string[])[]> }
  | {
      readonly success: false;
      readonly errorType: 'InvalidInput' | 'NoValidSolution' | 'InvalidOutput';
      readonly errorMessage: string;
    };
