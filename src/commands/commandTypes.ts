import {
  CLIOptionFormat,
  ReadonlyMatch,
  Result,
  SwissPairingOutput,
  UnvalidatedCLIOptions,
} from '../types/types.js';

export type CLIActionCommand = UnvalidatedCLIOptions;
export interface CLIActionCommandOutput {
  readonly output: string;
  readonly exitCode: number;
}

export type CorePipelineCommand = UnvalidatedCLIOptions;
export type CorePipelineCommandOutput = Result<string>;

export type ProcessInputCommand = CorePipelineCommand;
export type ProcessInputCommandOutput = Result<ProcessInputCommandOutputSuccess>;
export type ProcessInputCommandOutputSuccess = GenerateRoundsCommand & { readonly format: CLIOptionFormat };

/**
 * Command parameters for tournament generation.
 * Provides validated and prepared inputs:
 * - Teams in desired pairing order
 * - Tournament settings (rounds, format)
 * - Constraints (matches, squads)
 */
export interface GenerateRoundsCommand {
  readonly teams: readonly string[];
  readonly numRounds: number;
  readonly startRound: number;
  readonly matches?: readonly ReadonlyMatch[];
  readonly squadMap: ReadonlyMap<string, string>;
}
export type GenerateRoundsCommandOutput = Result<SwissPairingOutput>;
