import { Result, UnvalidatedCLIOptions } from '../types/types.js';
import { mergeOptions, preparePlayers, validateFileOptions } from './cliActionUtils.js';

import { createBidirectionalMap } from '../utils.js';
import { formatOutput } from './outputFormatter.js';
import { generateRoundMatches } from '../swiss-pairing/swissPairing.js';
import { validateCLIOptions } from '../validators/cliValidator.js';

export async function handleCLIAction(cliOptions: UnvalidatedCLIOptions): Promise<Result<string>> {
  const validateCLIOptionsResult = validateCLIOptions(cliOptions);
  if (!validateCLIOptionsResult.success) return validateCLIOptionsResult;
  const validateFileOptionsResult = await validateFileOptions(cliOptions.file);
  if (!validateFileOptionsResult.success) return validateFileOptionsResult;

  const { players, numRounds, startRound, order, matches, format } = mergeOptions({
    cliOptions: validateCLIOptionsResult.value,
    fileOptions: validateFileOptionsResult.value,
  });

  const preparedPlayers = preparePlayers({ players, order });
  const playedOpponents = createBidirectionalMap(matches);

  const roundMatchesResult = generateRoundMatches({
    players: preparedPlayers,
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
