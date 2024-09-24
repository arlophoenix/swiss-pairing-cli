import { GenerateRoundMatchesOutputErrorType, Result } from './types.js';

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

export function parseStringLiteral<T extends string>({
  input,
  options,
  errorMessage,
}: {
  readonly input: string;
  readonly options: readonly T[];
  readonly errorMessage?: string;
}): Result<T> {
  if (options.includes(input as T)) {
    return { success: true, value: input as T };
  }
  return {
    success: false,
    errorMessage: errorMessage ?? `Invalid option: ${input}. Valid options are: ${options.join(', ')}`,
  };
}

export function parseStringLiteralSilently<T extends string>({
  input,
  options,
}: {
  readonly input: string | undefined;
  readonly options: readonly T[];
}): T | undefined {
  if (input === undefined) {
    return undefined;
  }
  if (options.includes(input as T)) {
    return input as T;
  }
  return undefined;
}

export function buildErrorMessage({
  type,
  message,
}: {
  readonly type: GenerateRoundMatchesOutputErrorType;
  readonly message: string;
}) {
  let errorPrefix;

  switch (type) {
    case 'InvalidInput':
      errorPrefix = 'Invalid input';
      break;
    case 'InvalidOutput':
    case 'NoValidSolution':
      errorPrefix = 'Failed to generate matches';
      break;
  }
  return `${errorPrefix}: ${message}`;
}

export function removeNullOrUndefinedValues(obj: Record<string, any>): Record<string, any> {
  return Object.fromEntries(Object.entries(obj).filter(([_, value]) => value !== null && value !== null));
}
