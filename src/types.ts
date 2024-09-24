import { CLI_OPTION_FORMAT, CLI_OPTION_ORDER, SUPPORTED_FILE_TYPES } from './constants.js';

/**
 * Represents the options provided through the CLI
 */
export interface CLIOptions {
  readonly players?: readonly string[];
  readonly numRounds?: number;
  readonly startRound?: number;
  readonly matches?: readonly ReadonlyMatch[];
  readonly order?: CLIOptionOrder;
  readonly file?: string;
  readonly format?: CLIOptionFormat;
}

/**
 * Represents the order option for CLI
 */
export type CLIOptionOrder = (typeof CLI_OPTION_ORDER)[number];

/**
 * Represents the format option for CLI
 */
export type CLIOptionFormat = (typeof CLI_OPTION_FORMAT)[number];

/**
 * Represents the input for generating matches over multiple rounds
 */
export interface GenerateRoundMatchesInput {
  readonly players: readonly string[];
  readonly numRounds: number;
  readonly startRound: number;
  readonly playedOpponents: ReadonlyPlayedOpponents;
}

export type GenerateRoundMatchesOutputErrorType = 'InvalidInput' | 'NoValidSolution' | 'InvalidOutput';

/**
 * Represents the output for generating matches over multiple rounds
 */
export type GenerateRoundMatchesOutput =
  | { readonly success: true; readonly roundMatches: ReadonlyRoundMatches }
  | {
      readonly success: false;
      readonly errorType: GenerateRoundMatchesOutputErrorType;
      readonly errorMessage: string;
    };

export interface ValidateRoundMatchesInput {
  readonly players: readonly string[];
  readonly numRounds: number;
  readonly playedOpponents: ReadonlyPlayedOpponents;
}

export interface ValidateRoundMatchesOutput {
  readonly roundMatches: ReadonlyRoundMatches;
  readonly players: readonly string[];
  readonly numRounds: number;
  readonly playedOpponents: ReadonlyPlayedOpponents;
}

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
 * Represents the matches for multiple rounds
 */
export type RoundMatches = Record<string, readonly Match[]>;

/**
 * Represents the matches for multiple rounds (readonly version)
 */
export type ReadonlyRoundMatches = Record<string, readonly ReadonlyMatch[]>;

/**
 * Represents a match played between two players
 */
// eslint-disable-next-line functional/prefer-readonly-type
export type Match = [string, string];

/**
 * Represents a match played between two players (readonly version)
 */
export type ReadonlyMatch = readonly [string, string];

/**
 * Represents the opponents already played
 */
// eslint-disable-next-line functional/prefer-readonly-type
export type PlayedOpponents = Map<string, Set<string>>;

/**
 * Represents the opponents already played (readonly version)
 */
export type ReadonlyPlayedOpponents = ReadonlyMap<string, ReadonlySet<string>>;

export type SupportedFileTypes = (typeof SUPPORTED_FILE_TYPES)[number];
