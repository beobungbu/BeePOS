/** Deterministic seeded PRNG (mulberry32) and small helpers. No external randomness. */

export type Rng = () => number;

/** Creates a deterministic pseudo-random generator returning floats in [0, 1). */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer in [min, max] inclusive. */
export function randInt(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/** Picks one element deterministically. */
export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[randInt(rng, 0, items.length - 1)];
}

/** Picks `count` distinct elements (no repeats) preserving source order. */
export function pickMany<T>(rng: Rng, items: readonly T[], count: number): T[] {
  const pool = [...items];
  const result: T[] = [];
  const n = Math.min(count, pool.length);
  for (let i = 0; i < n; i += 1) {
    const index = randInt(rng, 0, pool.length - 1);
    result.push(pool[index]);
    pool.splice(index, 1);
  }
  return result;
}

/** Fisher-Yates shuffle using the seeded RNG, returns a new array. */
export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = randInt(rng, 0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Builds a valid EAN-13 barcode from a 12-digit payload, appending the checksum digit. */
export function ean13(payload12: string): string {
  const digits = payload12.padStart(12, '0').slice(0, 12).split('').map(Number);
  const checksum =
    (10 -
      (digits.reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 1 : 3), 0) %
        10)) %
    10;
  return digits.join('') + String(checksum);
}
