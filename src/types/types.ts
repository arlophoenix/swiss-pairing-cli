export * from './errors.js';

import { ARGS, CLI_OPTION_FORMAT, CLI_OPTION_ORDER, SUPPORTED_FILE_TYPES } from '../constants.js';

export interface UnvalidatedCLIOptions {
  readonly players?: readonly string[];
  readonly numRounds?: string;
  readonly startRound?: string;
  readonly matches?: readonly (readonly string[])[];
  readonly order?: string;
  readonly file?: string;
  readonly format?: string;
}

export interface ValidatedCLIOptions {
  readonly players: readonly string[];
  readonly numRounds: number;
  readonly startRound: number;
  readonly matches: readonly ReadonlyMatch[];
  readonly order: CLIOptionOrder;
  readonly file: string;
  readonly format: CLIOptionFormat;
}

export type CLIOptionOrder = (typeof CLI_OPTION_ORDER)[number];
export type CLIOptionFormat = (typeof CLI_OPTION_FORMAT)[number];

export interface GenerateRoundMatchesInput {
  readonly players: readonly string[];
  readonly numRounds: number;
  readonly startRound: number;
  readonly playedOpponents: ReadonlyPlayedOpponents;
}

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

export type RoundMatches = Record<string, readonly Match[]>;
export type ReadonlyRoundMatches = Record<string, readonly ReadonlyMatch[]>;

// eslint-disable-next-line functional/prefer-readonly-type
export type Match = [string, string];
export type ReadonlyMatch = readonly [string, string];
// eslint-disable-next-line functional/prefer-readonly-type
export type PlayedOpponents = Map<string, Set<string>>;
export type ReadonlyPlayedOpponents = ReadonlyMap<string, ReadonlySet<string>>;

export type SupportedFileTypes = (typeof SUPPORTED_FILE_TYPES)[number];

// export type CLIArg = keyof UnvalidatedCLIOptions;
export type CLIArg = (typeof ARGS)[number];
