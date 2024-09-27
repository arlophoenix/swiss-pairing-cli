import { ARG_FORMAT, ARG_NUM_ROUNDS, ARG_ORDER, CLI_OPTION_FORMAT, CLI_OPTION_ORDER } from '../constants.js';
import {
  CLIOptionFormat,
  CLIOptionOrder,
  ReadonlyMatch,
  Result,
  UnvalidatedCLIOptions,
  ValidatedCLIOptions,
} from '../types/types.js';

import { createInvalidValueErrorMessage } from '../utils/errorUtils.js';
import { parseStringLiteral } from '../utils/utils.js';

export function validateCLIOptions(options: UnvalidatedCLIOptions): Result<Partial<ValidatedCLIOptions>> {
  const results: readonly [
    Result<'text' | 'json-plain' | 'json-pretty' | undefined>,
    Result<readonly ReadonlyMatch[] | undefined>,
    Result<number | undefined>,
    Result<'top-down' | 'bottom-up' | 'random' | undefined>,
    Result<readonly string[] | undefined>,
    Result<number | undefined>,
  ] = [
    validateFormat(options.format),
    validateMatches(options.matches),
    validateNumRounds(options.numRounds),
    validateOrder(options.order),
    validatePlayers(options.players),
    validateStartRound(options.startRound),
  ];
  const firstFailureResult = results.find((result) => !result.success);
  if (firstFailureResult) {
    return firstFailureResult;
  }
  const [format, matches, numRounds, order, players, startRound] = results;

  return {
    success: true,
    value: {
      format: format.success ? format.value : undefined,
      matches: matches.success ? matches.value : undefined,
      numRounds: numRounds.success ? numRounds.value : undefined,
      order: order.success ? order.value : undefined,
      players: players.success ? players.value : undefined,
      startRound: startRound.success ? startRound.value : undefined,
    },
  };
}

export function validatePlayers(
  players: readonly string[] | undefined
): Result<readonly string[] | undefined> {
  if (players === undefined) {
    return { success: true, value: undefined };
  }
  if (players.length < 2) {
    return {
      success: false,
      error: { type: 'InvalidInput', message: 'There must be at least two players.' },
    };
  }
  if (players.length % 2 !== 0) {
    return {
      success: false,
      error: { type: 'InvalidInput', message: 'There must be an even number of players.' },
    };
  }
  if (new Set(players).size !== players.length) {
    return {
      success: false,
      error: { type: 'InvalidInput', message: 'Duplicate players are not allowed.' },
    };
  }
  return { success: true, value: players };
}

export function validateNumRounds(numRounds: string | undefined): Result<number | undefined> {
  if (numRounds === undefined) {
    return { success: true, value: undefined };
  }
  const parsedNumRounds = parseInt(numRounds, 10);
  if (isNaN(parsedNumRounds)) {
    return {
      success: false,
      error: { type: 'InvalidInput', message: `Invalid ${ARG_NUM_ROUNDS}: ${numRounds}` },
    };
  }
  if (!Number.isInteger(parsedNumRounds) || parsedNumRounds < 1) {
    return {
      success: false,
      error: { type: 'InvalidInput', message: 'Number of rounds must be a positive integer.' },
    };
  }
  return { success: true, value: parsedNumRounds };
}

export function validateStartRound(startRound: string | undefined): Result<number | undefined> {
  if (startRound === undefined) {
    return { success: true, value: undefined };
  }
  const parsedStartRound = parseInt(startRound, 10);
  if (isNaN(parsedStartRound)) {
    return {
      success: false,
      error: { type: 'InvalidInput', message: `Invalid ${ARG_NUM_ROUNDS}: ${startRound}` },
    };
  }
  if (!Number.isInteger(parsedStartRound) || parsedStartRound < 1) {
    return {
      success: false,
      error: { type: 'InvalidInput', message: 'Number of rounds must be a positive integer.' },
    };
  }
  return { success: true, value: parsedStartRound };
}

export function validateOrder(order: string | undefined): Result<CLIOptionOrder | undefined> {
  if (order === undefined) {
    return { success: true, value: undefined };
  }
  return parseStringLiteral({
    input: order,
    options: CLI_OPTION_ORDER,
    error: {
      type: 'InvalidInput',
      message: createInvalidValueErrorMessage({
        origin: 'CLI',
        argName: ARG_ORDER,
        expectedValue: CLI_OPTION_ORDER,
        inputValue: order,
      }),
    },
  });
}

export function validateFormat(format: string | undefined): Result<CLIOptionFormat | undefined> {
  if (format === undefined) {
    return { success: true, value: undefined };
  }
  return parseStringLiteral({
    input: format,
    options: CLI_OPTION_FORMAT,
    error: {
      type: 'InvalidInput',
      message: createInvalidValueErrorMessage({
        origin: 'CLI',
        argName: ARG_FORMAT,
        expectedValue: CLI_OPTION_FORMAT,
        inputValue: format,
      }),
    },
  });
}

export function validateMatches(
  matches: readonly (readonly string[])[] | undefined
): Result<readonly ReadonlyMatch[] | undefined> {
  if (matches === undefined) {
    return { success: true, value: undefined };
  }
  for (const match of matches) {
    if (
      !Array.isArray(match) ||
      match.length !== 2 ||
      typeof match[0] !== 'string' ||
      typeof match[1] !== 'string'
    ) {
      return {
        success: false,
        error: {
          type: 'InvalidInput',
          message: 'Invalid match format. Each match should be an array of two player names.',
        },
      };
    }
  }
  return { success: true, value: matches as readonly ReadonlyMatch[] };
}
