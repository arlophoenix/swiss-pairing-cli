export interface SwissPairingInput {
  players: string[];
  numRounds: number;
  startRound: number;
  playedMatches: Record<string, string[]>;
}

export type ValidationResult = { isValid: true } | { isValid: false; errorMessage: string };

export type GeneratePairingsResult =
  | { success: true; roundPairings: Record<string, string[][]> }
  | { success: false; errorType: 'InvalidInput' | 'NoValidSolution' | 'InvalidOutput'; errorMessage: string };
