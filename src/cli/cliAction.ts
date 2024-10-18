import { Result, UnvalidatedCLIOptions } from '../types/types.js';
import { createBidirectionalMap, mergeOptions, prepareTeams, validateFileOptions } from './cliUtils.js';

import { formatOutput } from './outputFormatter.js';
import { generateRoundMatches } from '../swiss-pairing/swissPairing.js';
import { validateCLIOptions } from '../validators/cliValidator.js';

export async function handleCLIAction(cliOptions: UnvalidatedCLIOptions): Promise<Result<string>> {
  const validateCLIOptionsResult = validateCLIOptions(cliOptions);
  if (!validateCLIOptionsResult.success) return validateCLIOptionsResult;
  const validateFileOptionsResult = await validateFileOptions(cliOptions.file);
  if (!validateFileOptionsResult.success) return validateFileOptionsResult;

  const { teams, numRounds, startRound, order, matches, format } = mergeOptions({
    cliOptions: validateCLIOptionsResult.value,
    fileOptions: validateFileOptionsResult.value,
  });

  const preparedTeams = prepareTeams({ teams, order });
  const playedOpponents = createBidirectionalMap(matches);

  const roundMatchesResult = generateRoundMatches({
    teams: preparedTeams,
    numRounds,
    startRound,
    playedOpponents,
  });

  if (!roundMatchesResult.success) {
    return roundMatchesResult;
  }

  const formattedOutput = formatOutput({
    roundMatches: roundMatchesResult.value,
    format,
  });

  return { success: true, value: formattedOutput };
}
