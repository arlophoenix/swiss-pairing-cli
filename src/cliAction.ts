import { CLIOptions, Result } from './types.js';
import { createBidirectionalMap, reverse, shuffle } from './utils.js';

import { generateRoundMatches } from './swiss-pairing/index.js';

/**
 * Creates and configures the CLI command for Swiss pairing generation
 * @returns {Command} Configured Command object
 */
// This exists in a seperate file mainly to enable mocking for test
export function handleCLIAction({
  players = [],
  numRounds = 1,
  startRound = 1,
  matches = [],
  order = 'top-down',
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
    let errorPrefix;

    switch (roundMatchesResult.errorType) {
      case 'InvalidInput':
        errorPrefix = 'Invalid input: ';
        break;
      case 'InvalidOutput':
      case 'NoValidSolution':
        errorPrefix = 'Failed to generate matches: ';
        break;
    }

    return {
      success: false,
      errorMessage: errorPrefix + roundMatchesResult.errorMessage,
    };
  }

  return {
    success: true,
    value: 'Matches generated successfully: ' + JSON.stringify(roundMatchesResult.roundMatches),
  };
}

/**
 * Adds a 'BYE' player if necessary to ensure an even number of players
 * @param {readonly string[]} players - The original list of players
 * @returns {readonly string[]} The shuffled list of players
 */
function addByePlayerIfNecessary(players: readonly string[]): readonly string[] {
  return players.length % 2 === 1 ? [...players, 'BYE'] : players;
}
