export function createBidirectionalMap(
  matches: readonly (readonly [string, string])[] = []
): ReadonlyMap<string, ReadonlySet<string>> {
  // eslint-disable-next-line functional/prefer-readonly-type
  const playedMatches = new Map<string, Set<string>>();

  matches.forEach(([player, opponent]) => {
    if (!playedMatches.has(player)) {
      playedMatches.set(player, new Set());
    }
    if (!playedMatches.has(opponent)) {
      playedMatches.set(opponent, new Set());
    }
    playedMatches.get(player)?.add(opponent);
    playedMatches.get(opponent)?.add(player);
  });

  return playedMatches;
}

export function shuffle<T>(array: readonly T[]): readonly T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
