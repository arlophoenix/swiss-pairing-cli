import { Result } from './types.js';
import { createBidirectionalMap } from './utils.js';
import { generatePairings } from './swissPairing.js';

// This exists in a seperate file mainly to enable mocking for test
export function handleCLIAction({
  players = [],
  numRounds = 1,
  startRound = 1,
  matches = [],
}: {
  players?: string[];
  numRounds?: number;
  startRound?: number;
  matches?: [string, string][];
}): Result<String> {
  const playedMatches = createBidirectionalMap(matches);

  const pairingResult = generatePairings({ players, numRounds, startRound, playedMatches });
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
