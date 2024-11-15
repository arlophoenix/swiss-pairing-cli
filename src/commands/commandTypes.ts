import { CLIOptionFormat, ReadonlyMatch } from '../types/types.js';

/**
 * Raw command input from CLI
 */
export interface CLIActionCommand {
  readonly teams?: readonly string[];
  readonly numRounds?: string;
  readonly startRound?: string;
  readonly matches?: readonly (readonly string[])[];
  readonly order?: string;
  readonly format?: string;
  readonly file?: string;
}

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

export type ProcessInputCommand = CLIActionCommand;
export type ProcessInputCommandOutput = GenerateRoundsCommand & { readonly format: CLIOptionFormat };
