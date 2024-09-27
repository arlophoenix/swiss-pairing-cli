import {
  ARG_FORMAT,
  ARG_MATCHES,
  ARG_NUM_ROUNDS,
  ARG_ORDER,
  ARG_PLAYERS,
  ARG_START_ROUND,
  CLI_OPTION_FORMAT,
  CLI_OPTION_ORDER,
} from '../constants.js';
import {
  CLIArg,
  InputOrigin,
  ReadonlyMatch,
  Result,
  UnvalidatedCLIOptions,
  ValidatedCLIOptions,
} from '../types/types.js';

import { createInvalidInputError } from '../utils/errorUtils.js';
import { parseStringLiteral } from '../utils/utils.js';

export function validateAllOptions({
  input,
  origin,
}: {
  readonly input: UnvalidatedCLIOptions;
  readonly origin: InputOrigin;
}): Result<Partial<ValidatedCLIOptions>> {
  const results = [
    validatePlayers({ players: input.players, origin }),
    validateNumRounds({ numRounds: input.numRounds, origin }),
    validateStartRound({ startRound: input.startRound, origin }),
    validateOrder({ order: input.order, origin }),
    validateFormat({ format: input.format, origin }),
    validateMatches({ matches: input.matches, origin }),
  ] as const;

  // Check all results for errors
  const firstError = results.find((result) => !result.success);
  if (firstError) return firstError as Result<never>;

  // If no errors, construct the validated options
  return {
    success: true,
    value: {
      players: results[0].success ? results[0].value : undefined,
      numRounds: results[1].success ? results[1].value : undefined,
      startRound: results[2].success ? results[2].value : undefined,
      order: results[3].success ? results[3].value : undefined,
      format: results[4].success ? results[4].value : undefined,
      matches: results[5].success ? results[5].value : undefined,
    },
  };
}

export function validatePlayers({
  players,
  origin,
}: {
  readonly players: readonly string[] | undefined;
  readonly origin: InputOrigin;
}): Result<readonly string[] | undefined> {
  if (players === undefined) return { success: true, value: undefined };

  const createError = (expected: string) =>
    createInvalidInputError({
      origin,
      argName: ARG_PLAYERS,
      inputValue: players.join(', '),
      expectedValue: expected,
    });

  if (players.length < 2) {
    return { success: false, error: createError('at least two players') };
  }
  if (players.length % 2 !== 0) {
    return { success: false, error: createError('an even number of players') };
  }
  if (new Set(players).size !== players.length) {
    return { success: false, error: createError('unique player names') };
  }
  return { success: true, value: players };
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
      expectedValue: 'an array of two player names',
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
