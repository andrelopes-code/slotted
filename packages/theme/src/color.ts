/**
 * Colour arithmetic for themes: OKLCH in, relative luminance and sRGB out. The
 * matrices are Björn Ottosson's OKLab reference. A theme carries its seeds in
 * OKLCH because the recipe derives every token by moving lightness and chroma
 * along a fixed hue, which is what `oklch(from …)` computes in the browser.
 */
export interface Oklch {
  readonly l: number;
  readonly c: number;
  readonly h: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function toLinear(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function toGamma(value: number): number {
  return value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055;
}

/** sRGB channels in 0–1 to OKLCH. A chroma under 1e-4 has no hue; it reads as 0. */
export function fromSrgb(r: number, g: number, b: number): Oklch {
  const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)];
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.hypot(A, B);
  const H = C < 1e-4 ? 0 : ((((Math.atan2(B, A) * 180) / Math.PI) % 360) + 360) % 360;
  return { l: L, c: C, h: H };
}

/** Linear-light sRGB, unclipped: a colour outside sRGB has a channel below 0 or above 1. */
export function toLinearSrgb({ l, c, h }: Oklch): [number, number, number] {
  const radians = (h * Math.PI) / 180;
  const a = c * Math.cos(radians);
  const b = c * Math.sin(radians);
  const l3 = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m3 = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s3 = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  ];
}

const HEX = /^#([\da-f]{3}|[\da-f]{6})$/i;
const OKLCH = /^oklch\(\s*(-?[\d.]+)(%?)\s+(-?[\d.]+)\s+(-?[\d.]+)(?:deg)?\s*\)$/i;

/** A seed in one of the two notations a theme accepts, or `null`. */
export function parseSeed(text: string): Oklch | null {
  const value = text.trim();
  const hex = HEX.exec(value);
  if (hex) {
    const body = hex[1]!;
    const digits = body.length === 3 ? [...body].map((digit) => digit + digit).join('') : body;
    const [r, g, b] = [0, 2, 4].map(
      (at) => Number.parseInt(digits.slice(at, at + 2), 16) / 255,
    ) as [number, number, number];
    return fromSrgb(r, g, b);
  }
  const oklch = OKLCH.exec(value);
  if (!oklch) return null;
  const l = Number(oklch[1]) / (oklch[2] === '%' ? 100 : 1);
  const c = Number(oklch[3]);
  const h = Number(oklch[4]);
  if (![l, c, h].every(Number.isFinite) || l < 0 || l > 1 || c < 0) return null;
  return { l, c, h: ((h % 360) + 360) % 360 };
}

export interface Luminance {
  /** Of the colour as computed, which a wide-gamut screen shows. Never below 0. */
  readonly raw: number;
  /** Of the colour clipped per channel to sRGB, which an sRGB screen shows. */
  readonly clipped: number;
}

export function relativeLuminance(color: Oklch): Luminance {
  const linear = toLinearSrgb(color);
  const y = ([r, g, b]: readonly number[]) => 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  return {
    raw: Math.max(0, y(linear)),
    clipped: y(linear.map((value) => clamp(value, 0, 1))),
  };
}

function ratio(first: number, second: number): number {
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

/** The WCAG ratio a reader gets on either kind of screen: the lower of the two. */
export function contrast(first: Oklch, second: Oklch): number {
  const a = relativeLuminance(first);
  const b = relativeLuminance(second);
  return Math.min(ratio(a.raw, b.raw), ratio(a.clipped, b.clipped));
}

/** Six-digit hex of the colour clipped to sRGB. */
export function toHex(color: Oklch): string {
  return `#${toLinearSrgb(color)
    .map((value) =>
      Math.round(clamp(toGamma(clamp(value, 0, 1)), 0, 1) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

/** Euclidean distance in OKLab. */
export function deltaE(first: Oklch, second: Oklch): number {
  const lab = ({ l, c, h }: Oklch) => [
    l,
    c * Math.cos((h * Math.PI) / 180),
    c * Math.sin((h * Math.PI) / 180),
  ];
  const [p, q] = [lab(first), lab(second)];
  return Math.hypot(p[0]! - q[0]!, p[1]! - q[1]!, p[2]! - q[2]!);
}
