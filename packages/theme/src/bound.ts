import { relativeLuminance } from './color';
import type { Oklch } from './color';
import { fmt } from './format';

/**
 * A lightness limit that holds a contrast ratio for every hue and chroma.
 *
 * The relative luminance of an OKLCH color depends on its hue and chroma as
 * well as on `l`: white text holds 4.5:1 up to l 0.568 at chroma 0, and the
 * limit moves by about ±0.13 × chroma with the hue. A bound is a least-squares
 * fit of the exact limit over chroma 0–`maxChroma` and every hue, moved by the
 * fit's largest error toward the safe side, so it never admits a color the
 * exact limit refuses. `l + c·(T1 + c·(T2 + c·T3))`, each `Tp` a fourth-order
 * Fourier series in the hue.
 */
export interface Bound {
  readonly side: 'ceiling' | 'floor';
  readonly l: number;
  readonly k: readonly number[];
}

export const BOUND_POWERS = 3;
export const BOUND_HARMONICS = 4;
const TERMS = 1 + 2 * BOUND_HARMONICS;

function basis(h: number): number[] {
  const radians = (h * Math.PI) / 180;
  const values = [1];
  for (let n = 1; n <= BOUND_HARMONICS; n += 1) {
    values.push(Math.cos(n * radians), Math.sin(n * radians));
  }
  return values;
}

export function boundValue(bound: Bound, c: number, h: number): number {
  const trig = basis(h);
  let total = 0;
  for (let power = BOUND_POWERS; power >= 1; power -= 1) {
    let term = 0;
    for (let j = 0; j < TERMS; j += 1) term += (bound.k[(power - 1) * TERMS + j] ?? 0) * trig[j]!;
    total = c * (term + total);
  }
  return bound.l + total;
}

export function applyBounds(color: Oklch, bounds: readonly Bound[] = []): Oklch {
  let { l } = color;
  for (const bound of bounds) {
    const limit = boundValue(bound, color.c, color.h);
    l = bound.side === 'ceiling' ? Math.min(l, limit) : Math.max(l, limit);
  }
  return { l, c: color.c, h: color.h };
}

/*
 * The CSS reads the hue through `a` and `b` of an `oklab(from …)`, never
 * through `h`: Firefox 146–152 refuses sin(), cos(), sqrt(), pow(), exp(),
 * log() and atan2() over a channel keyword, and the content process of 146
 * crashes on hypot() of them; WebKit 18 drops the unit of `calc(h * 1deg)`
 * inside cos(). With u = cos h = a / c and v = sin h = b / c, each harmonic
 * is a Chebyshev polynomial: cos nh = T_n(u) and sin nh = v · U_{n−1}(u).
 * `c` cannot come from `a` and `b` without a root, so it rides in the alpha
 * channel (`/ c`), which holds 0–1; a bound is fitted for chroma 0–0.25.
 */
const U = '(a / max(alpha, 0.00001))';
const V = '(b / max(alpha, 0.00001))';

/** Coefficients of T_n(u), ascending powers. */
const CHEBYSHEV_T = [[1], [0, 1], [-1, 0, 2], [0, -3, 0, 4], [1, 0, -8, 0, 8]] as const;
/** Coefficients of U_{n−1}(u), ascending powers, for n = 1…4. */
const CHEBYSHEV_U = [[], [1], [0, 2], [-1, 0, 4], [0, -4, 0, 8]] as const;

/** `c0 + u·(c1 + u·(…))`, with the zero coefficients of the highest powers left out. */
function horner(coefficients: readonly number[]): string {
  let last = coefficients.length - 1;
  while (last > 0 && Number(fmt(coefficients[last]!)) === 0) last -= 1;
  let out = fmt(coefficients[last]!);
  for (let power = last - 1; power >= 0; power -= 1) {
    out = `${fmt(coefficients[power]!)} + ${U} * (${out})`;
  }
  return `(${out})`;
}

/** One power's Fourier series as `P(u) + v·Q(u)`, from the coefficients rounded as `fmt` writes them. */
function termCss(bound: Bound, power: number): string {
  const k = (j: number) => Number(fmt(bound.k[(power - 1) * TERMS + j] ?? 0));
  const even = Array<number>(BOUND_HARMONICS + 1).fill(0);
  const odd = Array<number>(BOUND_HARMONICS).fill(0);
  even[0] = k(0);
  for (let n = 1; n <= BOUND_HARMONICS; n += 1) {
    CHEBYSHEV_T[n]!.forEach((t, i) => (even[i]! += k(2 * n - 1) * t));
    CHEBYSHEV_U[n]!.forEach((t, i) => (odd[i]! += k(2 * n) * t));
  }
  return `(${horner(even)} + ${V} * ${horner(odd)})`;
}

/**
 * The limit as a `calc()` over the `a`, `b` and `alpha` channel keywords of an
 * `oklab(from …)` whose alpha holds the chroma; `boundColorCss` builds it.
 */
export function boundCss(bound: Bound): string {
  let inner = `alpha * ${termCss(bound, BOUND_POWERS)}`;
  for (let power = BOUND_POWERS - 1; power >= 1; power -= 1) {
    inner = `alpha * (${termCss(bound, power)} + ${inner})`;
  }
  return `calc(${fmt(bound.l)} + ${inner})`;
}

/**
 * A color with its lightness held at the bound: the chroma moves into the
 * alpha channel, the limit reads it there and the alpha returns to 1, so a
 * bounded color is opaque.
 */
export function boundColorCss(color: string, bound: Bound): string {
  const limit = `${bound.side === 'ceiling' ? 'min' : 'max'}(l, ${boundCss(bound)})`;
  return `oklch(from oklab(from oklch(from ${color} l c h / c) ${limit} a b / 1) l c h)`;
}

/** The exact limit at one hue and chroma, by bisection on lightness. */
function exactLimit(h: number, c: number, target: number, side: Bound['side']): number {
  let low = 0;
  let high = 1;
  for (let step = 0; step < 40; step += 1) {
    const middle = (low + high) / 2;
    const { raw, clipped } = relativeLuminance({ l: middle, c, h });
    if (side === 'ceiling') {
      if (Math.max(raw, clipped) <= target) low = middle;
      else high = middle;
    } else if (Math.min(raw, clipped) >= target) high = middle;
    else low = middle;
  }
  return side === 'ceiling' ? low : high;
}

function features(c: number, h: number): number[] {
  const trig = basis(h);
  const row: number[] = [];
  for (let power = 1; power <= BOUND_POWERS; power += 1) {
    for (const value of trig) row.push(c ** power * value);
  }
  return row;
}

function leastSquares(rows: number[][], targets: number[]): number[] {
  const size = rows[0]!.length;
  const a = Array.from({ length: size }, () => Array<number>(size).fill(0));
  const b = Array<number>(size).fill(0);
  rows.forEach((row, index) => {
    for (let i = 0; i < size; i += 1) {
      b[i]! += row[i]! * targets[index]!;
      for (let j = 0; j < size; j += 1) a[i]![j]! += row[i]! * row[j]!;
    }
  });
  for (let i = 0; i < size; i += 1) {
    let pivot = i;
    for (let r = i + 1; r < size; r += 1)
      if (Math.abs(a[r]![i]!) > Math.abs(a[pivot]![i]!)) pivot = r;
    [a[i], a[pivot]] = [a[pivot]!, a[i]!];
    [b[i], b[pivot]] = [b[pivot]!, b[i]!];
    for (let r = 0; r < size; r += 1) {
      if (r === i) continue;
      const factor = a[r]![i]! / a[i]![i]!;
      for (let col = i; col < size; col += 1) a[r]![col]! -= factor * a[i]![col]!;
      b[r]! -= factor * b[i]!;
    }
  }
  return b.map((value, i) => value / a[i]![i]!);
}

/**
 * The bound for a target relative luminance: a ceiling keeps the color at or
 * under it, a floor at or over it. Coefficients are rounded before the error
 * is measured, so the shift covers the rounding as well as the fit.
 */
export function fitBound(target: number, side: Bound['side'], maxChroma = 0.25): Bound {
  const origin = exactLimit(0, 0, target, side);
  const rows: number[][] = [];
  const offsets: number[] = [];
  for (let c = 0; c <= maxChroma + 1e-9; c += 0.01) {
    for (let h = 0; h < 360; h += 3) {
      rows.push(features(c, h));
      offsets.push(exactLimit(h, c, target, side) - origin);
    }
  }
  const k = leastSquares(rows, offsets).map((value) => Number(value.toFixed(5)));
  let worst = 0;
  rows.forEach((row, index) => {
    const predicted = row.reduce((sum, value, j) => sum + value * k[j]!, 0);
    const error = side === 'ceiling' ? predicted - offsets[index]! : offsets[index]! - predicted;
    worst = Math.max(worst, error);
  });
  const l =
    side === 'ceiling'
      ? Math.floor((origin - worst - 0.001) * 1e4) / 1e4
      : Math.ceil((origin + worst + 0.001) * 1e4) / 1e4;
  return { side, l, k };
}
