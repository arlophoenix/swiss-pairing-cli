import {
  ErrorTemplate,
  createBidirectionalMap,
  createSquadMap,
  formatError,
  mergeOptions,
  prepareTeams,
  validateFileOptions,
} from './cliUtils.js';
import { Result, UnvalidatedCLIOptions } from '../types/types.js';
import {
  validateGenerateRoundsInput,
  validateGenerateRoundsOutput,
} from '../swiss-pairing/swissValidator.js';

import { formatOutput } from './outputFormatter.js';
import { generateRounds } from '../swiss-pairing/swissPairing.js';
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

  const validateInputResult = validateGenerateRoundsInput({
    teams: preparedTeams,
    numRounds,
    playedTeams,
    squadMap,
  });

  if (!validateInputResult.success) {
    return {
      success: false,
      message: formatError({
        template: ErrorTemplate.INVALID_INPUT,
        values: { message: validateInputResult.message },
      }),
    };
  }

  const generateRoundsResult = generateRounds({
    teams: preparedTeams,
    numRounds,
    startRound,
    playedTeams,
    squadMap,
  });

  if (!generateRoundsResult.success) {
    return {
      success: false,
      message: formatError({
        template: ErrorTemplate.GENERATION_FAILED,
        values: { message: generateRoundsResult.message },
      }),
    };
  }

  const validateOutputResult = validateGenerateRoundsOutput({
    rounds: generateRoundsResult.value.rounds,
    teams: preparedTeams,
    numRounds,
    startRound,
    playedTeams,
    squadMap,
  });

  if (!validateOutputResult.success) {
    return {
      success: false,
      message: formatError({
        template: ErrorTemplate.GENERATION_FAILED,
        values: { message: validateOutputResult.message },
      }),
    };
  }

  const formattedOutput = formatOutput({
    results: generateRoundsResult.value,
    format,
  });

  return { success: true, value: formattedOutput };
}
