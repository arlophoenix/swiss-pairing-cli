export interface SwissPairingInput {
  players: string[];
  rounds: number;
  playedMatches: Record<string, string[]>;
}
