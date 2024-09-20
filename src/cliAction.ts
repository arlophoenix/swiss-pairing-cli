import { CLIOptions, Result } from './types.js';

import { createBidirectionalMap } from './utils.js';
import { generateRoundPairings } from './swiss-pairing/index.js';

// This exists in a seperate file mainly to enable mocking for test
export function handleCLIAction({
  players = [],
  numRounds = 1,
  startRound = 1,
  matches = [],
}: CLIOptions): Result<string> {
  const playedMatches = createBidirectionalMap(matches);

  const pairingResult = generateRoundPairings({ players, numRounds, startRound, playedMatches });

  if (!pairingResult.success) {
    let errorPrefix;

    switch (pairingResult.errorType) {
      case 'InvalidInput':
        errorPrefix = 'Invalid input: ';
        break;
      case 'InvalidOutput':
      case 'NoValidSolution':
        errorPrefix = 'Pairing failed: ';
        break;
    }

    return {
      success: false,
      errorMessage: errorPrefix + pairingResult.errorMessage,
    };
  }

  return {
    success: true,
    value: 'Pairings generated successfully: ' + JSON.stringify(pairingResult.roundPairings),
  };
}
