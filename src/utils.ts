export function createBidirectionalMap(
  matches: readonly (readonly [string, string])[] = []
): Record<string, readonly string[]> {
  // eslint-disable-next-line functional/prefer-readonly-type
  const playedMatches: Record<string, string[]> = {};

  matches.forEach(([player, opponent]) => {
    if (!playedMatches[player]) playedMatches[player] = [];
    if (!playedMatches[opponent]) playedMatches[opponent] = [];
    playedMatches[player].push(opponent);
    playedMatches[opponent].push(player);
  });

  return playedMatches;
}
