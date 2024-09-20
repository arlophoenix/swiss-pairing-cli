export interface CLIOptions {
  readonly players?: readonly string[];
  readonly numRounds?: number;
  readonly startRound?: number;
  readonly matches?: readonly ReadonlyPairing[];
  readonly randomize?: boolean;
}

export interface GenerateRoundPairingsInput {
  readonly players: readonly string[];
  readonly numRounds: number;
  readonly startRound: number;
  readonly playedMatches: ReadonlyPlayedMatches;
}

export type GenerateRoundPairingsOutput =
  | { readonly success: true; readonly roundPairings: ReadonlyRoundPairings }
  | {
      readonly success: false;
      readonly errorType: 'InvalidInput' | 'NoValidSolution' | 'InvalidOutput';
      readonly errorMessage: string;
    };

export type Result<T> =
  | { readonly success: true; readonly value: T }
  | { readonly success: false; readonly errorMessage: string };

export type ValidationResult =
  | { readonly isValid: true }
  | { readonly isValid: false; readonly errorMessage: string };

// eslint-disable-next-line functional/prefer-readonly-type
export type RoundPairings = Record<string, Pairing[]>;
export type ReadonlyRoundPairings = Record<string, readonly ReadonlyPairing[]>;
// eslint-disable-next-line functional/prefer-readonly-type
export type Pairing = [string, string];
export type ReadonlyPairing = readonly [string, string];
// eslint-disable-next-line functional/prefer-readonly-type
export type PlayedMatches = Map<string, Set<string>>;
export type ReadonlyPlayedMatches = ReadonlyMap<string, ReadonlySet<string>>;
