export interface SwissPairingInput {
  players: string[];
  numRounds: number;
  startRound: number;
  playedMatches: Record<string, string[]>;
}

export type ValidationResult = { isValid: true } | { isValid: false; errorMessage: string };
