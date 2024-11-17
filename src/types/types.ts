/**
 * Core domain types for Swiss tournament pairings.
 * Provides type definitions for teams, matches, tournament state, and CLI options.
 *
 * @module types
 */

export * from './errors.js';

import { ARGS, CLI_OPTION_FORMAT, CLI_OPTION_ORDER, SUPPORTED_FILE_TYPES } from '../constants.js';

/**
 * Raw options received from CLI before validation.
 * All fields are optional and require validation before use.
 */
export interface UnvalidatedCLIOptions {
  readonly teams?: readonly string[];
  readonly numRounds?: string;
  readonly startRound?: string;
  readonly matches?: readonly (readonly string[])[];
  readonly order?: string;
  readonly file?: string;
  readonly format?: string;
}

/**
 * Validated CLI options after type checking and constraint validation.
 * All fields are required and guaranteed to be valid.
 */
export interface ValidatedCLIOptions {
  /** List of teams with validated names and optional squad assignments */
  readonly teams: readonly Team[];

  /** Number of rounds to generate (positive integer) */
  readonly numRounds: number;

  /** Starting round number for labeling (positive integer) */
  readonly startRound: number;

  /** List of matches that have already been played */
  readonly matches: readonly ReadonlyMatch[];

  /** Order to pair teams (top-down, bottom-up, or random) */
  readonly order: CLIOptionOrder;

  /** Input file path if using file input */
  readonly file: string;

  /** Output format for generated pairings */
  readonly format: CLIOptionFormat;
}

/** Valid team pairing orders */
export type CLIOptionOrder = (typeof CLI_OPTION_ORDER)[number];

/** Valid output formats */
export type CLIOptionFormat = (typeof CLI_OPTION_FORMAT)[number];

/** Round results with team pairings */
export type validateGenerateRoundsOutput = Record<string, readonly ReadonlyMatch[]>;

/**
 * Represents a tournament team.
 * Teams must have unique names and can optionally belong to a squad.
 * Teams in the same squad cannot be paired against each other.
 */
export interface Team {
  /** Unique identifier for the team */
  readonly name: string;

  /** Optional squad assignment - teams in same squad cannot play each other */
  readonly squad: string | undefined;
}

/**
 * Represents a single tournament round with its matches.
 * Rounds are numbered sequentially and contain pairs of teams.
 */
export interface Round {
  /** Display name for the round (e.g. "Round 1") */
  readonly label: string;

  /** Sequential round number */
  readonly number: number;

  /** List of team pairings for this round */
  readonly matches: readonly ReadonlyMatch[];
}

/**
 * List of generated rounds with team pairings.
 * Rounds are numbered sequentially and contain pairs of teams.
 */
export interface SwissPairingOutput {
  /** List of rounds in sequential order */
  readonly rounds: readonly Round[];
}

/** A pair of team names representing a match */
// eslint-disable-next-line functional/prefer-readonly-type
export type Match = [string, string];

/** Immutable version of Match type */
export type ReadonlyMatch = readonly [string, string];

/** Map tracking which teams have played against each other */
// eslint-disable-next-line functional/prefer-readonly-type
export type PlayedTeams = Map<string, Set<string>>;

/** Immutable version of PlayedTeams map */
export type ReadonlyPlayedTeams = ReadonlyMap<string, ReadonlySet<string>>;

/** Valid input file types */
export type SupportedFileTypes = (typeof SUPPORTED_FILE_TYPES)[number];

/** Valid CLI argument names */
export type CLIArg = (typeof ARGS)[number];

export type Environment = 'test' | 'development' | 'ci' | 'production';
