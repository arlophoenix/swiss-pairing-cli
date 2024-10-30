import { Result, UnvalidatedCLIOptions } from '../types/types.js';
import { createSquadMap, mergeOptions, prepareTeams, validateFileOptions } from './cliUtils.js';

import { handleGenerateRounds } from '../commands/generateRounds.js';
import { validateCLIOptions } from '../validators/cliValidator.js';

/**
 * Handles CLI input by validating and preparing a command
 */
export async function handleCLIAction(cliOptions: UnvalidatedCLIOptions): Promise<Result<string>> {
  const validateCLIOptionsResult = validateCLIOptions(cliOptions);
  if (!validateCLIOptionsResult.success) {
    return validateCLIOptionsResult;
  }

  const validateFileOptionsResult = await validateFileOptions(cliOptions.file);
  if (!validateFileOptionsResult.success) {
    return validateFileOptionsResult;
  }

  const { teams, numRounds, startRound, order, matches, format } = mergeOptions({
    cliOptions: validateCLIOptionsResult.value,
    fileOptions: validateFileOptionsResult.value,
  });

  const preparedTeams = prepareTeams({ teams: teams.map((t) => t.name), order });
  const squadMap = createSquadMap(teams);

  return handleGenerateRounds({
    teams: preparedTeams,
    numRounds,
    startRound,
    matches,
    format,
    squadMap,
  });
}
