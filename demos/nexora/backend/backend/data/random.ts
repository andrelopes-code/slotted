/**
 * Deterministic, namespaced pseudo-random source (section 24). Every stream is
 * derived from the root seed plus a namespace path, so a generator can be
 * re-entered at any point without replaying earlier draws.
 */

function hashSeed(value: string): [number, number, number, number] {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let index = 0; index < value.length; index += 1) {
    const k = value.charCodeAt(index);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0];
}

export interface WeightedOption<T> {
  value: T;
  weight: number;
}

export class Random {
  private a: number;
  private b: number;
  private c: number;
  private d: number;

  constructor(
    private readonly seed: string,
    private readonly namespace: string,
  ) {
    const [a, b, c, d] = hashSeed(`${seed}\u0000${namespace}`);
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    for (let index = 0; index < 6; index += 1) this.next();
  }

  fork(namespace: string): Random {
    return new Random(this.seed, `${this.namespace}/${namespace}`);
  }

  /** Uniform float in [0, 1). sfc32. */
  next(): number {
    this.a >>>= 0;
    this.b >>>= 0;
    this.c >>>= 0;
    this.d >>>= 0;
    let t = (this.a + this.b) | 0;
    this.a = this.b ^ (this.b >>> 9);
    this.b = (this.c + (this.c << 3)) | 0;
    this.c = (this.c << 21) | (this.c >>> 11);
    this.d = (this.d + 1) | 0;
    t = (t + this.d) | 0;
    this.c = (this.c + t) | 0;
    return (t >>> 0) / 4294967296;
  }

  /** Uniform integer in [min, max]. */
  int(min: number, max: number): number {
    if (max < min) throw new RangeError(`int bounds inverted: ${min}..${max}`);
    return min + Math.floor(this.next() * (max - min + 1));
  }

  float(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  chance(probability: number): boolean {
    return this.next() < probability;
  }

  pick<T>(values: readonly T[]): T {
    if (values.length === 0) throw new RangeError('pick from empty list');
    return values[Math.floor(this.next() * values.length)] as T;
  }

  /** Picks `count` distinct values (order preserved from a partial shuffle). */
  sample<T>(values: readonly T[], count: number): T[] {
    const pool = values.slice();
    const taken = Math.min(count, pool.length);
    for (let index = 0; index < taken; index += 1) {
      const swap = index + Math.floor(this.next() * (pool.length - index));
      const value = pool[swap] as T;
      pool[swap] = pool[index] as T;
      pool[index] = value;
    }
    return pool.slice(0, taken);
  }

  shuffle<T>(values: readonly T[]): T[] {
    return this.sample(values, values.length);
  }

  weighted<T>(options: readonly WeightedOption<T>[]): T {
    let total = 0;
    for (const option of options) total += option.weight;
    let roll = this.next() * total;
    for (const option of options) {
      roll -= option.weight;
      if (roll < 0) return option.value;
    }
    return (options[options.length - 1] as WeightedOption<T>).value;
  }

  /** Standard normal via Box–Muller. */
  normal(mean = 0, standardDeviation = 1): number {
    let u = 0;
    while (u === 0) u = this.next();
    const v = this.next();
    return mean + standardDeviation * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /** Log-normal with the given median and sigma of the underlying normal. */
  logNormal(median: number, sigma: number): number {
    return median * Math.exp(this.normal(0, sigma));
  }

  /**
   * Skewed index in [0, size): a Pareto-like draw where low indices dominate.
   * `alpha` near 1.16 gives the 80/20 shape; larger values are steeper.
   */
  paretoIndex(size: number, alpha = 1.16): number {
    const u = 1 - this.next();
    const scaled = 1 - Math.pow(u, alpha);
    return Math.min(size - 1, Math.floor(scaled * size));
  }

  /** Integer count around a target with a small spread, never below `minimum`. */
  around(target: number, spread: number, minimum = 0): number {
    return Math.max(minimum, Math.round(target + this.normal(0, spread)));
  }

  digits(count: number): string {
    let output = '';
    for (let index = 0; index < count; index += 1) output += String(this.int(0, 9));
    return output;
  }

  letters(count: number): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    let output = '';
    for (let index = 0; index < count; index += 1) output += this.pick(alphabet.split(''));
    return output;
  }
}

export function createRandom(seed: string, namespace: string): Random {
  return new Random(seed, namespace);
}
