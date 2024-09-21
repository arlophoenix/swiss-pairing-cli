/**
 * Creates a bidirectional map from an array of pairs.
 * Each element in a pair becomes a key in the map, with its partner added to its corresponding set of values.
 *
 * @template T The type of elements in the pairs
 * @param {readonly (readonly [T, T])[]} pairs - An array of paired elements
 * @returns {ReadonlyMap<T, ReadonlySet<T>>} A map where each element of a pair is a key,
 *          and its value is a set containing all elements it was paired with
 */
export function createBidirectionalMap<T>(
  pairs: readonly (readonly [T, T])[] = []
): ReadonlyMap<T, ReadonlySet<T>> {
  // eslint-disable-next-line functional/prefer-readonly-type
  const bidirectionalMap = new Map<T, Set<T>>();

  pairs.forEach(([a, b]) => {
    if (!bidirectionalMap.has(a)) {
      bidirectionalMap.set(a, new Set());
    }
    if (!bidirectionalMap.has(b)) {
      bidirectionalMap.set(b, new Set());
    }
    bidirectionalMap.get(a)?.add(b);
    bidirectionalMap.get(b)?.add(a);
  });

  return bidirectionalMap;
}

/**
 * Shuffles an array using the Fisher-Yates algorithm
 * @param {readonly T[]} array - The array to shuffle
 * @returns {readonly T[]} A new shuffled array
 */
export function shuffle<T>(array: readonly T[]): readonly T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Reverse a list without modifying the original
 * @param {readonly T[]} players - The original array
 * @returns {readonly T[]} A new reversed array
 */
export function reverse<T>(array: readonly T[]): readonly T[] {
  return [...array].reverse();
}
