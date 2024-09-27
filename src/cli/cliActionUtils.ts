import { BYE_PLAYER, CLI_OPTION_DEFAULTS } from '../constants.js';
import { CLIOptionOrder, Result, ValidatedCLIOptions } from '../types/types.js';
import { reverse, shuffle } from '../utils.js';

import { parseFile } from '../parsers/fileParser.js';

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

export function preparePlayers({
  players,
  order,
}: {
  readonly players: readonly string[];
  readonly order: CLIOptionOrder;
}): readonly string[] {
  const currentPlayers = addByePlayerIfNecessary(players);

  switch (order) {
    case 'random':
      return shuffle(currentPlayers);
    case 'top-down':
      return currentPlayers;
    case 'bottom-up':
      return reverse(currentPlayers);
  }
}

export function addByePlayerIfNecessary(players: readonly string[]): readonly string[] {
  return players.length % 2 === 1 ? [...players, BYE_PLAYER] : players;
}
