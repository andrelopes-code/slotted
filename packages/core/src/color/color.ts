/**
 * Color as `color-picker` holds it: a string in a notation the reader chose,
 * parsed into sRGB channels for the picture and written back in the same
 * notation. This module is the only place a color is converted; no binding
 * does arithmetic on one.
 *
 * Channels are 0–255 for red, green and blue and 0–1 for alpha. An `oklch`
 * color outside sRGB keeps its out-of-range channels here and is reported by
 * `inGamut`, so the family can say so instead of clipping it in silence.
 */

export type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'oklch';

export const COLOR_FORMATS: readonly ColorFormat[] = ['hex', 'rgb', 'hsl', 'oklch'];

export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** Hue 0–360, saturation and value 0–1, alpha 0–1. */
export interface Hsva {
  h: number;
  s: number;
  v: number;
  a: number;
}

export interface ParsedColor {
  rgba: Rgba;
  format: ColorFormat;
  /** Whether every channel lies inside sRGB. Only an `oklch` value can say no. */
  inGamut: boolean;
}

export type ContrastLevel = 'AAA' | 'AA' | 'AA-large' | 'fail';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round = (value: number, digits = 0) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

/** A number, a percentage of `scale`, or `none` read as 0. */
function channel(token: string, scale: number): number | null {
  if (token === 'none') return 0;
  const percent = token.endsWith('%');
  const value = Number.parseFloat(percent ? token.slice(0, -1) : token);
  if (!Number.isFinite(value)) return null;
  return percent ? (value / 100) * scale : value;
}

function hue(token: string): number | null {
  const match = /^(-?[\d.]+)(deg|turn|rad|grad)?$/.exec(token);
  if (match === null) return token === 'none' ? 0 : null;
  const value = Number.parseFloat(match[1]!);
  const unit = match[2] ?? 'deg';
  const degrees =
    unit === 'turn'
      ? value * 360
      : unit === 'rad'
        ? (value * 180) / Math.PI
        : unit === 'grad'
          ? value * 0.9
          : value;
  return ((degrees % 360) + 360) % 360;
}

/** `name(a b c / d)` or `name(a, b, c, d)`, split into its tokens. */
function functional(
  input: string,
): { name: string; parts: string[]; alpha: string | undefined } | null {
  const match = /^([a-z]+)\(\s*([^)]*)\)$/i.exec(input.trim());
  if (match === null) return null;
  const name = match[1]!.toLowerCase().replace(/a$/, '');
  const body = match[2]!.trim();
  let parts: string[];
  let alpha: string | undefined;
  if (body.includes(',')) {
    parts = body.split(',').map((part) => part.trim());
    if (parts.length === 4) alpha = parts.pop();
  } else {
    const [values, slash] = body.split('/').map((part) => part.trim());
    parts = (values ?? '').split(/\s+/).filter(Boolean);
    alpha = slash;
  }
  if (parts.length !== 3) return null;
  return { name, parts, alpha };
}

function alphaOf(token: string | undefined): number | null {
  if (token === undefined) return 1;
  const value = channel(token, 1);
  return value === null ? null : clamp(value, 0, 1);
}

function parseHex(input: string): Rgba | null {
  const match = /^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.exec(input.trim());
  if (match === null) return null;
  let digits = match[1]!;
  if (digits.length <= 4) digits = [...digits].map((digit) => digit + digit).join('');
  const value = (index: number) => Number.parseInt(digits.slice(index, index + 2), 16);
  return { r: value(0), g: value(2), b: value(4), a: digits.length === 8 ? value(6) / 255 : 1 };
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}

function rgbToHsl({ r, g, b }: Rgba): [number, number, number] {
  const [rr, gg, bb] = [r / 255, g / 255, b / 255];
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === rr ? ((gg - bb) / d) % 6 : max === gg ? (bb - rr) / d + 2 : (rr - gg) / d + 4;
  return [(((h * 60) % 360) + 360) % 360, s, l];
}

const toLinear = (c: number) => {
  const v = c / 255;
  return Math.abs(v) <= 0.04045 ? v / 12.92 : Math.sign(v) * ((Math.abs(v) + 0.055) / 1.055) ** 2.4;
};
const fromLinear = (c: number) =>
  (Math.abs(c) <= 0.0031308
    ? 12.92 * c
    : Math.sign(c) * (1.055 * Math.abs(c) ** (1 / 2.4) - 0.055)) * 255;

export function oklchToRgb(l: number, c: number, h: number): [number, number, number] {
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    fromLinear(4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_),
    fromLinear(-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_),
    fromLinear(-0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_),
  ];
}

function rgbToOklch({ r, g, b }: Rgba): [number, number, number] {
  const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)];
  const l = Math.cbrt(0.4122214708 * lr + 0.5363015976 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.hypot(A, B);
  const H = C < 1e-4 ? 0 : ((((Math.atan2(B, A) * 180) / Math.PI) % 360) + 360) % 360;
  return [L, C, H];
}

/** Whether every channel lies inside sRGB, with half a step of tolerance for rounding. */
export function inGamut({ r, g, b }: Rgba): boolean {
  return [r, g, b].every((value) => value >= -0.5 && value <= 255.5);
}

/**
 * Reads hex (`#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`), `rgb()`, `rgba()`,
 * `hsl()`, `hsla()` and `oklch()` in either the space or the comma syntax.
 * Anything else — a named color, a typo, half a value — is `null`, so a
 * field can hold the reader's text while it is being written.
 */
export function parseColor(input: string): ParsedColor | null {
  const text = input.trim();
  const hex = parseHex(text);
  if (hex !== null) return { rgba: hex, format: 'hex', inGamut: true };

  const parsed = functional(text);
  if (parsed === null) return null;
  const a = alphaOf(parsed.alpha);
  if (a === null) return null;
  const [p0, p1, p2] = parsed.parts as [string, string, string];

  if (parsed.name === 'rgb') {
    const values = [channel(p0, 255), channel(p1, 255), channel(p2, 255)];
    if (values.some((value) => value === null)) return null;
    const [r, g, b] = values.map((value) => clamp(value!, 0, 255)) as [number, number, number];
    return { rgba: { r, g, b, a }, format: 'rgb', inGamut: true };
  }
  if (parsed.name === 'hsl') {
    const h = hue(p0);
    const s = channel(p1, 1);
    const l = channel(p2, 1);
    if (h === null || s === null || l === null) return null;
    const [r, g, b] = hslToRgb(h, clamp(s, 0, 1), clamp(l, 0, 1));
    return { rgba: { r, g, b, a }, format: 'hsl', inGamut: true };
  }
  if (parsed.name === 'oklch') {
    const l = channel(p0, 1);
    const c = channel(p1, 0.4);
    const h = hue(p2);
    if (l === null || c === null || h === null) return null;
    const [r, g, b] = oklchToRgb(clamp(l, 0, 1), Math.max(0, c), h);
    const rgba = { r, g, b, a };
    return { rgba, format: 'oklch', inGamut: inGamut(rgba) };
  }
  return null;
}

/** The color pulled into sRGB: what a screen can show and a hex can hold. */
export function clampToGamut({ r, g, b, a }: Rgba): Rgba {
  return { r: clamp(r, 0, 255), g: clamp(g, 0, 255), b: clamp(b, 0, 255), a };
}

const hex2 = (value: number) =>
  Math.round(clamp(value, 0, 255))
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();
const percent = (value: number) => `${round(value * 100)}%`;
const alphaSuffix = (a: number) => (a >= 1 ? '' : ` / ${percent(a)}`);

/** Writes the color in a notation, in the space syntax CSS Color 4 reads. */
export function formatColor(rgba: Rgba, format: ColorFormat): string {
  const inside = clampToGamut(rgba);
  if (format === 'hex') {
    const body = `#${hex2(inside.r)}${hex2(inside.g)}${hex2(inside.b)}`;
    return inside.a >= 1 ? body : `${body}${hex2(inside.a * 255)}`;
  }
  if (format === 'rgb') {
    return `rgb(${round(inside.r)} ${round(inside.g)} ${round(inside.b)}${alphaSuffix(inside.a)})`;
  }
  if (format === 'hsl') {
    const [h, s, l] = rgbToHsl(inside);
    return `hsl(${round(h)} ${percent(s)} ${percent(l)}${alphaSuffix(inside.a)})`;
  }
  const [l, c, h] = rgbToOklch(rgba);
  return `oklch(${round(l, 3)} ${round(c, 3)} ${round(h)}${alphaSuffix(rgba.a)})`;
}

/** The color as a CSS value for a runtime property, always parseable by the browser. */
export function toCss({ r, g, b, a }: Rgba, opaque = false): string {
  const inside = clampToGamut({ r, g, b, a });
  return `rgb(${round(inside.r, 2)} ${round(inside.g, 2)} ${round(inside.b, 2)}${opaque ? '' : ` / ${round(inside.a, 3)}`})`;
}

export function rgbaToHsva(rgba: Rgba): Hsva {
  const { r, g, b, a } = clampToGamut(rgba);
  const [rr, gg, bb] = [r / 255, g / 255, b / 255];
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const d = max - min;
  const h =
    d === 0
      ? 0
      : max === rr
        ? ((gg - bb) / d) % 6
        : max === gg
          ? (bb - rr) / d + 2
          : (rr - gg) / d + 4;
  return { h: (((h * 60) % 360) + 360) % 360, s: max === 0 ? 0 : d / max, v: max, a };
}

export function hsvaToRgba({ h, s, v, a }: Hsva): Rgba {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return (v - v * s * Math.max(0, Math.min(k, 4 - k, 1))) * 255;
  };
  return { r: f(5), g: f(3), b: f(1), a };
}

function luminance({ r, g, b }: Rgba): number {
  const c = (value: number) => {
    const v = clamp(value, 0, 255) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
}

/**
 * The WCAG 2 contrast ratio of a color over a background. An alpha color is
 * composited over the background first, because that is what the reader sees.
 */
export function contrastRatio(foreground: Rgba, background: Rgba): number {
  const a = clamp(foreground.a, 0, 1);
  const seen = {
    r: foreground.r * a + background.r * (1 - a),
    g: foreground.g * a + background.g * (1 - a),
    b: foreground.b * a + background.b * (1 - a),
    a: 1,
  };
  const [hi, lo] = [luminance(seen), luminance(background)].sort((x, y) => y - x) as [
    number,
    number,
  ];
  return (hi + 0.05) / (lo + 0.05);
}

/** The level a ratio reaches for normal text, with the large-text level below it. */
export function contrastLevel(ratio: number): ContrastLevel {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA-large';
  return 'fail';
}
