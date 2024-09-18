export function createBidirectionalMap(matches: [string, string][] = []): Record<string, string[]> {
  const playedMatches: Record<string, string[]> = {};

  matches.forEach(([player, opponent]) => {
    if (!playedMatches[player]) playedMatches[player] = [];
    if (!playedMatches[opponent]) playedMatches[opponent] = [];
    playedMatches[player].push(opponent);
    playedMatches[opponent].push(player);
  });

  return playedMatches;
}
