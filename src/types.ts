/**
 * Represents the options provided through the CLI
 */
export interface CLIOptions {
  readonly players?: readonly string[];
  readonly numRounds?: number;
  readonly startRound?: number;
  readonly matches?: readonly ReadonlyPairing[];
  readonly randomize?: boolean;
}

/**
 * Represents the input for generating round pairings
 */
export interface GenerateRoundPairingsInput {
  readonly players: readonly string[];
  readonly numRounds: number;
  readonly startRound: number;
  readonly playedMatches: ReadonlyPlayedMatches;
}

/**
 * Represents the output of the round pairing generation
 */
export type GenerateRoundPairingsOutput =
  | { readonly success: true; readonly roundPairings: ReadonlyRoundPairings }
  | {
      readonly success: false;
      readonly errorType: 'InvalidInput' | 'NoValidSolution' | 'InvalidOutput';
      readonly errorMessage: string;
    };

/**
 * Represents a generic result type
 */
export type Result<T> =
  | { readonly success: true; readonly value: T }
  | { readonly success: false; readonly errorMessage: string };

/**
 * Represents the result of a validation operation
 */
export type ValidationResult =
  | { readonly isValid: true }
  | { readonly isValid: false; readonly errorMessage: string };

/**
 * Represents the pairings for multiple rounds
 */
export type RoundPairings = Record<string, readonly Pairing[]>;

/**
 * Represents the pairings for multiple rounds (readonly version)
 */
export type ReadonlyRoundPairings = Record<string, readonly ReadonlyPairing[]>;

/**
 * Represents a pairing of two players
 */
// eslint-disable-next-line functional/prefer-readonly-type
export type Pairing = [string, string];

/**
 * Represents a pairing of two players (readonly version)
 */
export type ReadonlyPairing = readonly [string, string];

/**
 * Represents the matches already played
 */
// eslint-disable-next-line functional/prefer-readonly-type
export type PlayedMatches = Map<string, Set<string>>;

/**
 * Represents the matches already played (readonly version)
 */
export type ReadonlyPlayedMatches = ReadonlyMap<string, ReadonlySet<string>>;
