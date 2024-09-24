import {
  BYE_PLAYER,
  CLI_OPTION_FORMAT_DEFAULT,
  CLI_OPTION_NUM_ROUND_DEFAULT,
  CLI_OPTION_ORDER_DEFAULT,
  CLI_OPTION_START_ROUND_DEFAULT,
} from '../constants.js';
import { CLIOptionOrder, CLIOptions, Result } from '../types.js';
import { buildErrorMessage, createBidirectionalMap, reverse, shuffle } from '../utils.js';

import { formatOutput } from './outputFormatter.js';
import { generateRoundMatches } from '../swiss-pairing/swissPairing.js';

/**
 * Creates and configures the CLI command for Swiss pairing generation
 * @returns {Command} Configured Command object
 */
// This exists in a seperate file mainly to enable mocking for test
export function handleCLIAction({
  players = [],
  numRounds = CLI_OPTION_NUM_ROUND_DEFAULT,
  startRound = CLI_OPTION_START_ROUND_DEFAULT,
  matches = [],
  order = CLI_OPTION_ORDER_DEFAULT,
  format = CLI_OPTION_FORMAT_DEFAULT,
}: CLIOptions): Result<string> {
  const currentPlayers = preparePlayers({ players, order });
  const playedMatches = createBidirectionalMap(matches);

  const roundMatchesResult = generateRoundMatches({
    players: currentPlayers,
    numRounds,
    startRound,
    playedOpponents: playedMatches,
  });

  if (!roundMatchesResult.success) {
    return {
      success: false,
      errorMessage: buildErrorMessage({
        type: roundMatchesResult.errorType,
        message: roundMatchesResult.errorMessage,
      }),
    };
  }

  return {
    success: true,
    value: formatOutput({ roundMatches: roundMatchesResult.roundMatches, format }),
  };
}

function preparePlayers({
  players,
  order,
}: {
  readonly players: readonly string[];
  readonly order: CLIOptionOrder;
}): readonly string[] {
  const currentPlayers = addByePlayerIfNecessary(players);

  switch (order) {
    case 'random':
      return shuffle(currentPlayers);
    case 'top-down':
      return currentPlayers;
    case 'bottom-up':
      return reverse(currentPlayers);
  }
}

/**
 * Adds a 'BYE' player if necessary to ensure an even number of players
 * @param {readonly string[]} players - The original list of players
 * @returns {readonly string[]} The shuffled list of players
 */
function addByePlayerIfNecessary(players: readonly string[]): readonly string[] {
  return players.length % 2 === 1 ? [...players, BYE_PLAYER] : players;
}
