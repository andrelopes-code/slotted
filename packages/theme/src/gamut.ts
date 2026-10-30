import { toLinearSrgb } from './color';
import { fmt } from './format';

/**
 * The most chroma sRGB holds at one lightness, as a function of the hue.
 *
 * A color turned from a seed by a fixed hue offset can land on any hue, and
 * the chroma sRGB holds at a lightness ranges from 0.1 (cyan) to over 0.25
 * (red, violet) at 0.6. A single chroma low enough for every hue paints every
 * other hue grey; a single chroma high enough for the reds leaves the screen
 * to clip the cyans, which moves their hue and their lightness. The limit is
 * a fourth-order Fourier series in the hue, fitted over every degree and
 * moved by its largest overshoot toward the inside, so it never admits a
 * color the gamut refuses.
 */
export interface ChromaLimit {
  /** The chroma asked for, where sRGB holds it. */
  readonly max: number;
  /** The fitted limit's Fourier coefficients: `k0 + Σ k(2n−1)·cos nh + k(2n)·sin nh`. */
  readonly gamut: readonly number[];
}

export const LIMIT_HARMONICS = 4;

function basis(h: number): number[] {
  const radians = (h * Math.PI) / 180;
  const values = [1];
  for (let n = 1; n <= LIMIT_HARMONICS; n += 1) {
    values.push(Math.cos(n * radians), Math.sin(n * radians));
  }
  return values;
}

/** The limit's value at one hue, from the coefficients as `fmt` writes them. */
export function gamutChroma(gamut: readonly number[], h: number): number {
  return basis(h).reduce((sum, value, j) => sum + value * Number(fmt(gamut[j] ?? 0)), 0);
}

/** The chroma a limited derivation paints at one hue. */
export function limitedChroma(limit: ChromaLimit, h: number): number {
  return Math.max(0, Math.min(limit.max, gamutChroma(limit.gamut, h)));
}

const inside = (l: number, c: number, h: number) =>
  toLinearSrgb({ l, c, h }).every((channel) => channel >= -1e-9 && channel <= 1 + 1e-9);

/** The exact limit at one lightness and hue, by bisection on chroma. */
function exactChroma(l: number, h: number): number {
  let low = 0;
  let high = 0.5;
  for (let step = 0; step < 40; step += 1) {
    const middle = (low + high) / 2;
    if (inside(l, middle, h)) low = middle;
    else high = middle;
  }
  return low;
}

function solve(rows: number[][], targets: number[]): number[] {
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
 * The fitted limit at one lightness. The constant term is lowered by the
 * largest overshoot of the rounded series over the exact limit, and a margin
 * of 0.002, so every hue it admits is painted as derived.
 */
export function fitGamut(l: number): readonly number[] {
  const hues = Array.from({ length: 360 }, (_, h) => h);
  const exact = hues.map((h) => exactChroma(l, h));
  const rounded = solve(
    hues.map((h) => basis(h)),
    exact,
  ).map((value) => Number(value.toFixed(5)));
  const overshoot = Math.max(...hues.map((h) => gamutChroma(rounded, h) - exact[h]!));
  rounded[0] = Number((rounded[0]! - overshoot - 0.002).toFixed(5));
  return rounded;
}

/** Coefficients of T_n(u), ascending powers. */
const CHEBYSHEV_T = [[1], [0, 1], [-1, 0, 2], [0, -3, 0, 4], [1, 0, -8, 0, 8]] as const;
/** Coefficients of U_{n−1}(u), ascending powers, for n = 1…4. */
const CHEBYSHEV_U = [[], [1], [0, 2], [-1, 0, 4], [0, -4, 0, 8]] as const;

function horner(coefficients: readonly number[], u: string): string {
  let last = coefficients.length - 1;
  while (last > 0 && Number(fmt(coefficients[last]!)) === 0) last -= 1;
  let out = fmt(coefficients[last]!);
  for (let power = last - 1; power >= 0; power -= 1)
    out = `${fmt(coefficients[power]!)} + ${u} * (${out})`;
  return `(${out})`;
}

/**
 * The limited color in CSS. The seed is turned to the hue at chroma 1, so
 * the `a` and `b` of its OKLab form are the hue's cosine and sine; the series
 * is a polynomial of the two (cos nh = T_n(a), sin nh = b · U_{n−1}(a)), and
 * scaling `a` and `b` by the limited chroma paints it. No trigonometric
 * function reads a channel keyword: Firefox 146–152 refuses them.
 */
export function limitedColorCss(seed: string, l: string, h: string, limit: ChromaLimit): string {
  const k = (j: number) => Number(fmt(limit.gamut[j] ?? 0));
  const even = Array<number>(LIMIT_HARMONICS + 1).fill(0);
  const odd = Array<number>(LIMIT_HARMONICS).fill(0);
  even[0] = k(0);
  for (let n = 1; n <= LIMIT_HARMONICS; n += 1) {
    CHEBYSHEV_T[n]!.forEach((t, i) => (even[i]! += k(2 * n - 1) * t));
    CHEBYSHEV_U[n]!.forEach((t, i) => (odd[i]! += k(2 * n) * t));
  }
  const chroma = `max(0, min(${fmt(limit.max)}, ${horner(even, 'a')} + b * ${horner(odd, 'a')}))`;
  return `oklab(from oklch(from ${seed} ${l} 1 ${h}) l calc(a * ${chroma}) calc(b * ${chroma}))`;
}
