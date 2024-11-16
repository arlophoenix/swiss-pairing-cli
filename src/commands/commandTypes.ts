/**
 * Command type definitions for tournament generation pipeline.
 * Provides strongly typed interfaces for commands:
 * 1. CLI Action - Initial command input parsing
 * 2. Core Pipeline - Tournament generation orchestration
 * 3. Process Input - Input validation and normalization
 * 4. Generate Rounds - Tournament pairing generation
 *
 * Commands follow functional style with immutable data and
 * explicit error handling via Result type.
 *
 * @module commandTypes
 */
import {
  CLIOptionFormat,
  ReadonlyMatch,
  Result,
  SwissPairingOutput,
  UnvalidatedCLIOptions,
} from '../types/types.js';

/**
 * Initial command input from CLI.
 * Raw options before validation.
 */
export type CLIActionCommand = UnvalidatedCLIOptions;

/**
 * Result from CLI action command.
 * Includes formatted output and exit code.
 */
export interface CLIActionCommandOutput {
  readonly output: string;
  readonly exitCode: number;
}

/**
 * Tournament generation pipeline command.
 * Orchestrates input processing and round generation.
 */
export type CorePipelineCommand = UnvalidatedCLIOptions;

/**
 * Result from pipeline execution.
 * String output on success, error message on failure.
 */
export type CorePipelineCommandOutput = Result<string>;

/**
 * Input processing and validation command.
 * Normalizes input from various sources.
 */
export type ProcessInputCommand = CorePipelineCommand;

/**
 * Result from input processing.
 * Success: Tournament configuration ready for generation
 * Failure: Validation error message
 */
export type ProcessInputCommandOutput = Result<ProcessInputCommandOutputSuccess>;

/**
 * Validated tournament configuration.
 * Teams ordered by rank with squad assignments.
 */
export type ProcessInputCommandOutputSuccess = GenerateRoundsCommand & {
  readonly format: CLIOptionFormat;
};

/**
 * Tournament round generation command.
 * Takes validated teams and configuration.
 * Returns generated pairings.
 */
export interface GenerateRoundsCommand {
  /** Teams in desired pairing order */
  readonly teams: readonly string[];

  /** Number of rounds to generate */
  readonly numRounds: number;

  /** Starting round number for labels */
  readonly startRound: number;

  /** Previously played matches to avoid */
  readonly matches?: readonly ReadonlyMatch[];

  /** Team to squad assignments */
  readonly squadMap: ReadonlyMap<string, string>;
}

/**
 * Result from round generation.
 * Success: Generated rounds with pairings
 * Failure: Error message if valid pairings impossible
 */
export type GenerateRoundsCommandOutput = Result<SwissPairingOutput>;

/**
 * Input configuration for TelemetryCommand.
 * Controls telemetry behavior and privacy settings.
 */
export interface TelemetryCommandInput {
  readonly shouldShowTelemetryNotice: boolean;
}
