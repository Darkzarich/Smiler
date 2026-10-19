const MODULUS = 2147483647;
const MULTIPLIER = 16807;

export type Random = ReturnType<typeof createRandom>;

/**
 * A seeded Park–Miller generator, so that every run builds the same users,
 * posts and threads - a bug seen on seeded data can be seen again after a
 * reset. Plain arithmetic stays exact here (the product never passes 2^53),
 * which keeps it clear of the bitwise tricks the usual generators rely on.
 */
export function createRandom(seed: number) {
  let state = seed % MODULUS || 1;

  /** A float in [0, 1) */
  const next = () => {
    state = (state * MULTIPLIER) % MODULUS;

    return (state - 1) / (MODULUS - 1);
  };

  /** An integer in [min, max], both ends included */
  const int = (min: number, max: number) =>
    min + Math.floor(next() * (max - min + 1));

  const chance = (probability: number) => next() < probability;

  const pick = <T>(items: readonly T[]): T => items[int(0, items.length - 1)];

  /** `count` distinct items, in random order */
  const sample = <T>(items: readonly T[], count: number): T[] => {
    const pool = [...items];

    // Fisher–Yates, stopped as soon as the first `count` slots are settled
    for (let i = 0; i < Math.min(count, pool.length); i += 1) {
      const j = int(i, pool.length - 1);

      // Both are integers this loop produced, not keys anyone passed in
      // eslint-disable-next-line security/detect-object-injection
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    return pool.slice(0, count);
  };

  return { next, int, chance, pick, sample };
}
