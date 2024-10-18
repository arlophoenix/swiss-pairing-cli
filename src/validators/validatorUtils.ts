import {
  ARG_FILE,
  ARG_FORMAT,
  ARG_MATCHES,
  ARG_NUM_ROUNDS,
  ARG_ORDER,
  ARG_START_ROUND,
  ARG_TEAMS,
  CLI_OPTION_FORMAT,
  CLI_OPTION_ORDER,
  SUPPORTED_FILE_TYPES,
} from '../constants.js';
import {
  CLIArg,
  InputOrigin,
  ReadonlyMatch,
  Result,
  Team,
  UnvalidatedCLIOptions,
  ValidatedCLIOptions,
  ValidationError,
} from '../types/types.js';
import { parseStringLiteral, stringToTeam, teamToString } from '../utils/utils.js';

import { createInvalidInputError } from '../utils/errorUtils.js';

type Validator<K extends keyof ValidatedCLIOptions> = (
  input: UnvalidatedCLIOptions
) => Result<ValidatedCLIOptions[K] | undefined>;

export function validateAllOptions({
  input,
  origin,
}: {
  readonly input: UnvalidatedCLIOptions;
  readonly origin: InputOrigin;
}): Result<Partial<ValidatedCLIOptions>> {
  // eslint-disable-next-line functional/prefer-readonly-type
  const validators: { [K in keyof ValidatedCLIOptions]: Validator<K> } = {
    teams: (i) => validateTeams({ teams: i.teams, origin }),
    numRounds: (i) => validateNumRounds({ numRounds: i.numRounds, origin }),
    startRound: (i) => validateStartRound({ startRound: i.startRound, origin }),
    order: (i) => validateOrder({ order: i.order, origin }),
    format: (i) => validateFormat({ format: i.format, origin }),
    matches: (i) => validateMatches({ matches: i.matches, origin }),
    file: (i) => validateFile({ file: i.file, origin }),
  };

  type ValidatorResult = {
    readonly [K in keyof ValidatedCLIOptions]: Result<ValidatedCLIOptions[K] | undefined>;
  };
  const results: ValidatorResult = Object.fromEntries(
    Object.entries(validators).map(([key, validator]) => [key, validator(input)])
  ) as ValidatorResult;

  const firstError = Object.values(results).find(
    (result): result is { readonly success: false; readonly error: ValidationError } => !result.success
  );
  if (firstError) return firstError;

  const validatedOptions: Partial<ValidatedCLIOptions> = Object.fromEntries(
    Object.entries(results)
      .filter(
        (
          entry
          // eslint-disable-next-line functional/prefer-readonly-type
        ): entry is [
          keyof ValidatedCLIOptions,
          {
            readonly success: true;
            readonly value: Exclude<ValidatedCLIOptions[keyof ValidatedCLIOptions], undefined>;
          },
        ] => entry[1].success && entry[1].value !== undefined
      )
      .map(([key, result]) => [key, result.value])
  );

  return { success: true, value: validatedOptions };
}

export function validateTeams({
  teams,
  origin,
}: {
  readonly teams: readonly string[] | undefined;
  readonly origin: InputOrigin;
}): Result<readonly string[] | undefined> {
  if (teams === undefined) return { success: true, value: undefined };

  const createError = (expected: string) =>
    createInvalidInputError({
      origin,
      argName: ARG_TEAMS,
      inputValue: teams.join(', '),
      expectedValue: expected,
    });

  if (teams.length < 2) {
    return { success: false, error: createError('at least two teams') };
  }

  const teamObjects: readonly Team[] = teams.map(stringToTeam);
  const uniqueTeamNames = new Set(teamObjects.map((team) => team.name));
  if (uniqueTeamNames.size !== teamObjects.length) {
    return { success: false, error: createError('unique team names') };
  }

  return { success: true, value: teams };
}

function validatePositiveInteger({
  value,
  argName,
  origin,
}: {
  readonly value: string | number | undefined;
  readonly argName: CLIArg;
  readonly origin: InputOrigin;
}): Result<number | undefined> {
  if (value === undefined) return { success: true, value: undefined };

  const createError = () =>
    createInvalidInputError({
      origin,
      argName,
      inputValue: String(value),
      expectedValue: 'a positive integer',
    });

  const parsedValue = typeof value === 'string' ? parseInt(value, 10) : value;
  if (isNaN(parsedValue)) {
    return { success: false, error: createError() };
  }
  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return { success: false, error: createError() };
  }
  return { success: true, value: parsedValue };
}

export function validateNumRounds({
  numRounds,
  origin,
}: {
  readonly numRounds: string | number | undefined;
  readonly origin: InputOrigin;
}): Result<number | undefined> {
  return validatePositiveInteger({ value: numRounds, argName: ARG_NUM_ROUNDS, origin });
}

export function validateStartRound({
  startRound,
  origin,
}: {
  readonly startRound: string | number | undefined;
  readonly origin: InputOrigin;
}): Result<number | undefined> {
  return validatePositiveInteger({ value: startRound, argName: ARG_START_ROUND, origin });
}

export function validateOrder({
  order,
  origin,
}: {
  readonly order: string | undefined;
  readonly origin: InputOrigin;
}): Result<(typeof CLI_OPTION_ORDER)[number] | undefined> {
  if (order === undefined) return { success: true, value: undefined };
  return parseStringLiteral({
    input: order,
    options: CLI_OPTION_ORDER,
    errorInfo: {
      origin,
      argName: ARG_ORDER,
    },
  });
}

export function validateFormat({
  format,
  origin,
}: {
  readonly format: string | undefined;
  readonly origin: InputOrigin;
}): Result<(typeof CLI_OPTION_FORMAT)[number] | undefined> {
  if (format === undefined) return { success: true, value: undefined };
  return parseStringLiteral({
    input: format,
    options: CLI_OPTION_FORMAT,
    errorInfo: {
      origin,
      argName: ARG_FORMAT,
    },
  });
}

export function validateFile({
  file,
  origin,
}: {
  readonly file: string | undefined;
  readonly origin: InputOrigin;
}): Result<(typeof SUPPORTED_FILE_TYPES)[number] | undefined> {
  if (file === undefined) return { success: true, value: undefined };
  return parseStringLiteral({
    input: file,
    options: SUPPORTED_FILE_TYPES,
    errorInfo: {
      origin,
      argName: ARG_FILE,
    },
  });
}

export function validateMatches({
  matches,
  origin,
}: {
  readonly matches: readonly (readonly string[])[] | undefined;
  readonly origin: InputOrigin;
}): Result<readonly ReadonlyMatch[] | undefined> {
  if (matches === undefined) return { success: true, value: undefined };

  const createError = (match: readonly string[]) =>
    createInvalidInputError({
      origin,
      argName: ARG_MATCHES,
      inputValue: JSON.stringify(match),
      expectedValue: 'an array of two team names',
    });

  for (const match of matches) {
    if (
      !Array.isArray(match) ||
      match.length !== 2 ||
      typeof match[0] !== 'string' ||
      typeof match[1] !== 'string'
    ) {
      return { success: false, error: createError(match) };
    }
  }
  return { success: true, value: matches as readonly ReadonlyMatch[] };
}
