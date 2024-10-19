import { BYE_TEAM, CLI_OPTION_DEFAULTS } from '../constants.js';
import { CLIOptionOrder, Result, ValidatedCLIOptions } from '../types/types.js';
import { reverse, shuffle, stringToTeam } from '../utils/utils.js';

import { parseFile } from '../parsers/fileParser.js';

export * from '../utils/utils.js';

export async function validateFileOptions(
  filePath: string | undefined
): Promise<Result<Partial<ValidatedCLIOptions>>> {
  if (filePath === undefined) return { success: true, value: {} };
  return await parseFile(filePath);
}

export function mergeOptions({
  cliOptions,
  fileOptions,
}: {
  readonly cliOptions: Partial<ValidatedCLIOptions>;
  readonly fileOptions: Partial<ValidatedCLIOptions>;
}): ValidatedCLIOptions {
  return { ...CLI_OPTION_DEFAULTS, ...fileOptions, ...cliOptions };
}

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

export function addByeTeamIfNecessary(teams: readonly string[]): readonly string[] {
  return teams.length % 2 === 1 ? [...teams, BYE_TEAM] : teams;
}

export function createSquadMap(teams: readonly string[]): ReadonlyMap<string, string> {
  const squadMap = new Map<string, string>();
  teams.forEach((teamStr) => {
    const team = stringToTeam(teamStr);
    if (team.squad) {
      squadMap.set(team.name, team.squad);
    }
  });
  return squadMap;
}
