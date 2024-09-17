export interface SwissPairingInput {
  players: string[];
  numRounds: number;
  startRound: number;
  playedMatches: Record<string, string[]>;
}

export type Result<T> = { success: true; value: T } | { success: false; errorMessage: string };

export type ValidationResult = { isValid: true } | { isValid: false; errorMessage: string };

export type GeneratePairingsResult =
  | { success: true; roundPairings: Record<string, string[][]> }
  | { success: false; errorType: 'InvalidInput' | 'NoValidSolution' | 'InvalidOutput'; errorMessage: string };
