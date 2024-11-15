import { ProcessInputCommand, ProcessInputCommandOutput } from '../commandTypes.js';
import { createSquadMap, mergeOptions, prepareTeams, validateFileOptions } from './processInputUtils.js';

import { Result } from '../../types/types.js';
import { validateCLIOptions } from '../../validators/cliValidator.js';

export async function handleProcessInput(
  command: ProcessInputCommand
): Promise<Result<ProcessInputCommandOutput>> {
  const validateCLIOptionsResult = validateCLIOptions(command);
  if (!validateCLIOptionsResult.success) {
    return validateCLIOptionsResult;
  }

  const validateFileOptionsResult = await validateFileOptions(command.file);
  if (!validateFileOptionsResult.success) {
    return validateFileOptionsResult;
  }

  const { teams, numRounds, startRound, order, matches, format } = mergeOptions({
    cliOptions: validateCLIOptionsResult.value,
    fileOptions: validateFileOptionsResult.value,
  });

  // Strip squad info before preparing teams - squads are handled separately via squadMap
  const preparedTeams = prepareTeams({ teams: teams.map((t) => t.name), order });
  const squadMap = createSquadMap(teams);

  return {
    success: true,
    value: {
      teams: preparedTeams,
      numRounds,
      startRound,
      matches,
      squadMap,
      format,
    },
  };
}
