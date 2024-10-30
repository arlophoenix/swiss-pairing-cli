/**
 * CLI support utilities for preprocessing and validating input.
 * Handles:
 * - Team preparation (ordering, BYE addition)
 * - Option merging (CLI + file inputs)
 * - Squad mapping
 *
 * @module cliUtils
 */

import { BYE_TEAM, CLI_OPTION_DEFAULTS } from '../constants.js';
import { CLIOptionOrder, Result, Team, ValidatedCLIOptions } from '../types/types.js';
import { reverse, shuffle } from '../utils/utils.js';

import { parseFile } from '../parsers/fileParser.js';

export * from '../utils/utils.js';

/**
 * Validates options from input file.
 * Returns empty object if no file provided.
 */
export async function validateFileOptions(
  filePath: string | undefined
): Promise<Result<Partial<ValidatedCLIOptions>>> {
  if (filePath === undefined) {
    return { success: true, value: {} };
  }
  return await parseFile(filePath);
}

/**
 * Merges options from multiple sources.
 * Priority order (highest to lowest):
 * 1. CLI options
 * 2. File options
 * 3. Default values
 */
export function mergeOptions({
  cliOptions,
  fileOptions,
}: {
  readonly cliOptions: Partial<ValidatedCLIOptions>;
  readonly fileOptions: Partial<ValidatedCLIOptions>;
}): ValidatedCLIOptions {
  return { ...CLI_OPTION_DEFAULTS, ...fileOptions, ...cliOptions };
}

/**
 * Prepares teams list for pairing.
 * - Applies ordering strategy
 * - Adds BYE team if needed
 *
 * Note: Teams must be base names only (no squad info)
 * as squad constraints are handled separately.
 */
export function prepareTeams({
  teams,
  order,
}: {
  readonly teams: readonly string[];
  readonly order: CLIOptionOrder;
}): readonly string[] {
  const currentTeams = addByeTeamIfNecessary(teams);

  switch (order) {
    case 'random':
      return shuffle(currentTeams);
    case 'top-down':
      return currentTeams;
    case 'bottom-up':
      return reverse(currentTeams);
  }
}

/**
 * Adds BYE team to list if odd number of teams.
 * BYE team always added at end of list to maintain
 * original team order for standings.
 */
export function addByeTeamIfNecessary(teams: readonly string[]): readonly string[] {
  return teams.length % 2 === 1 ? [...teams, BYE_TEAM] : teams;
}

/**
 * Creates squad assignment map from team objects.
 * Omits teams without squad assignments.
 * Used to enforce squad-based pairing constraints.
 */
export function createSquadMap(teams: readonly Team[]): ReadonlyMap<string, string> {
  const squadMap = new Map<string, string>();
  teams.forEach((team) => {
    if (team.squad) {
      squadMap.set(team.name, team.squad);
    }
  });
  return squadMap;
}
