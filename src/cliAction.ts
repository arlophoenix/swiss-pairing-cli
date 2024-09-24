import {
  BYE_PLAYER,
  CLI_OPTION_FORMAT_DEFAULT,
  CLI_OPTION_FORMAT_JSON_PLAIN,
  CLI_OPTION_FORMAT_JSON_PRETTY,
  CLI_OPTION_FORMAT_TEXT,
  CLI_OPTION_NUM_ROUND_DEFAULT,
  CLI_OPTION_ORDER_DEFAULT,
  CLI_OPTION_START_ROUND_DEFAULT,
} from './constants.js';
import { CLIOptions, Result } from './types.js';
import { buildErrorMessage, createBidirectionalMap, reverse, shuffle } from './utils.js';

import { generateRoundMatches } from './swiss-pairing/index.js';

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
  const playedMatches = createBidirectionalMap(matches);

  let currentPlayers = addByePlayerIfNecessary(players);

  switch (order) {
    case 'random':
      currentPlayers = shuffle(currentPlayers);
      break;
    case 'top-down':
      break;
    case 'bottom-up':
      currentPlayers = reverse(currentPlayers);
      break;
  }

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

  let message: string;

  switch (format) {
    case CLI_OPTION_FORMAT_JSON_PLAIN:
      message = JSON.stringify(roundMatchesResult.roundMatches);
      break;
    case CLI_OPTION_FORMAT_JSON_PRETTY:
      message = JSON.stringify(roundMatchesResult.roundMatches, null, 2);
      break;
    case CLI_OPTION_FORMAT_TEXT:
      message = 'Matches generated successfully: ' + JSON.stringify(roundMatchesResult.roundMatches);
  }

  return {
    success: true,
    value: message,
  };
}

/**
 * Adds a 'BYE' player if necessary to ensure an even number of players
 * @param {readonly string[]} players - The original list of players
 * @returns {readonly string[]} The shuffled list of players
 */
function addByePlayerIfNecessary(players: readonly string[]): readonly string[] {
  return players.length % 2 === 1 ? [...players, BYE_PLAYER] : players;
}
