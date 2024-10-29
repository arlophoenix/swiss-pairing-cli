import { Result, UnvalidatedCLIOptions } from '../types/types.js';
import {
  createBidirectionalMap,
  createSquadMap,
  mergeOptions,
  prepareTeams,
  validateFileOptions,
} from './cliUtils.js';

import { formatOutput } from './outputFormatter.js';
import { generateRoundMatches } from '../swiss-pairing/swissPairing.js';
import { validateCLIOptions } from '../validators/cliValidator.js';

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
  const playedOpponents = createBidirectionalMap(matches);
  const squadMap = createSquadMap(teams);

  const roundMatchesResult = generateRoundMatches({
    teams: preparedTeams,
    numRounds,
    startRound,
    playedOpponents,
    squadMap,
  });

  if (!roundMatchesResult.success) {
    return roundMatchesResult;
  }

  // TODO: should the squad names be included in the output?
  const formattedOutput = formatOutput({
    roundMatches: roundMatchesResult.value,
    format,
  });

  return { success: true, value: formattedOutput };
}
