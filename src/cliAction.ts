import { CLIOptions, Result } from './types.js';
import { createBidirectionalMap, shuffle } from './utils.js';

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
  randomize = false,
}: CLIOptions): Result<string> {
  const playedMatches = createBidirectionalMap(matches);

  const currentPlayers = randomize ? shuffle(players) : players;

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
