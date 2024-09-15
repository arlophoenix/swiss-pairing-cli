export interface SwissPairingInput {
  players: string[];
  rounds: number;
  playedMatches: Record<string, string[]>;
}

export type ValidationResult = { isValid: true } | { isValid: false; errorMessage: string };
