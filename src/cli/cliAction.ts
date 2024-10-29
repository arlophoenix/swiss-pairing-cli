import { Result, UnvalidatedCLIOptions } from '../types/types.js';
import {
  createBidirectionalMap,
  createSquadMap,
  mergeOptions,
  prepareTeams,
  validateFileOptions,
} from './cliUtils.js';
import { validateRoundMatchesInput, validateRoundMatchesOutput } from '../swiss-pairing/swissValidator.js';

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
  const playedTeams = createBidirectionalMap(matches);
  const squadMap = createSquadMap(teams);

  const validateInput = validateRoundMatchesInput({
    teams: preparedTeams,
    numRounds,
    playedTeams,
    squadMap,
  });

  if (!validateInput.success) {
    return {
      success: false,
      message: `Invalid input: ${validateInput.message}`,
    };
  }

  const roundMatchesResult = generateRoundMatches({
    teams: preparedTeams,
    numRounds,
    startRound,
    playedTeams,
    squadMap,
  });

  if (!roundMatchesResult.success) {
    return {
      success: false,
      message: `Failed to generate matches: ${roundMatchesResult.message}`,
    };
  }

  const validateOutput = validateRoundMatchesOutput({
    roundMatches: roundMatchesResult.value,
    teams: preparedTeams,
    numRounds,
    playedTeams,
    squadMap,
  });

  if (!validateOutput.success) {
    return {
      success: false,
      message: `Failed to generate matches: ${validateOutput.message}`,
    };
  }

  const formattedOutput = formatOutput({
    roundMatches: roundMatchesResult.value,
    format,
  });

  return { success: true, value: formattedOutput };
}
