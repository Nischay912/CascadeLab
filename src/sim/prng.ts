/**
 * Mulberry32: A fast, high-quality, 32-bit deterministic seeded pseudo-random number generator.
 * Same seed => 100% byte-identical sequence of random numbers in [0, 1).
 */
export class PRNG {
  private state: number;

  constructor(seed: number = 42) {
    this.state = seed >>> 0;
  }

  /**
   * Returns a deterministic pseudo-random float in [0, 1).
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns a deterministic integer in [min, max] inclusive.
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Returns true with probability p (where p is in [0, 1]).
   */
  chance(p: number): boolean {
    return this.next() < p;
  }

  /**
   * Resets the PRNG to a given seed.
   */
  reset(seed: number): void {
    this.state = seed >>> 0;
  }
}
