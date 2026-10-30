import { applyBounds, boundColorCss, type Bound } from './bound';
import type { Oklch } from './color';
import { fmt } from './format';
import { limitedChroma, limitedColorCss, type ChromaLimit } from './gamut';
import { SEED_NAMES, type SeedName } from './seeds';

export { SEED_NAMES, type SeedName };

export const SCHEMES = ['light', 'dark', 'high-contrast'] as const;
export type Scheme = (typeof SCHEMES)[number];

/**
 * A color taken from a seed: fixed or offset lightness, scaled or limited
 * chroma, shifted hue. A limited chroma takes the seed's hue alone — a ladder
 * turned from it stays as vivid whatever the seed's own chroma — and asks for
 * `max` where sRGB holds it at the derivation's fixed lightness.
 */
export interface SeedDerivation {
  readonly seed: SeedName;
  readonly l: number | { readonly offset: number; readonly min?: number; readonly max?: number };
  readonly c: { readonly scale: number; readonly max: number } | ChromaLimit;
  readonly h?: number;
  readonly bounds?: readonly Bound[];
}

/** A color moved `share` toward white, or toward black when its lightness is above 0.9. */
export interface MixDerivation {
  readonly mix: string;
  readonly share: number;
  readonly bounds?: readonly Bound[];
}

export interface AliasDerivation {
  readonly alias: string;
}

export type Derivation = SeedDerivation | MixDerivation | AliasDerivation;

/** Per scheme, the derivation of every color token the recipe owns. */
export type Recipe = Readonly<Record<Scheme, Readonly<Record<string, Derivation>>>>;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const hue = (value: number) => ((value % 360) + 360) % 360;

/**
 * Every token of one scheme, computed with the arithmetic `derivationCss`
 * writes: the browser's `oklch(from …)` and `color-mix(in oklch, …)` on the
 * same constants.
 */
export function evaluateRecipe(
  recipe: Recipe,
  seeds: Readonly<Record<SeedName, Oklch>>,
  scheme: Scheme,
): Record<string, Oklch> {
  const rules = recipe[scheme];
  const values: Record<string, Oklch> = {};

  const visit = (name: string, path: readonly string[]): Oklch => {
    const known = values[name];
    if (known) return known;
    if (path.includes(name)) throw new Error(`Recipe cycle at ${[...path, name].join(' → ')}`);
    const rule = rules[name];
    if (!rule) throw new Error(`${scheme}: the recipe has no rule for ${name}`);
    const next = [...path, name];

    let value: Oklch;
    if ('alias' in rule) {
      value = visit(rule.alias, next);
    } else if ('mix' in rule) {
      const base = visit(rule.mix, next);
      const white = clamp((0.9 - base.l) * 1_000_000, 0, 1);
      value = applyBounds(
        {
          l: base.l * (1 - rule.share) + white * rule.share,
          c: base.c * (1 - rule.share),
          h: base.h,
        },
        rule.bounds,
      );
    } else {
      const seed = seeds[rule.seed];
      const l =
        typeof rule.l === 'number'
          ? rule.l
          : clamp(seed.l + rule.l.offset, rule.l.min ?? 0, rule.l.max ?? 1);
      const h = hue(seed.h + (rule.h ?? 0));
      const c =
        'gamut' in rule.c ? limitedChroma(rule.c, h) : Math.min(seed.c * rule.c.scale, rule.c.max);
      value = applyBounds({ l, c, h }, rule.bounds);
    }
    values[name] = value;
    return value;
  };

  for (const name of Object.keys(rules)) visit(name, []);
  return values;
}

/** The CSS value of one derivation. */
export function derivationCss(rule: Derivation): string {
  if ('alias' in rule) return `var(${rule.alias})`;

  let color: string;
  if ('mix' in rule) {
    color =
      `color-mix(in oklch, var(${rule.mix}), oklch(from var(${rule.mix}) ` +
      `clamp(0, calc((0.9 - l) * 1000000), 1) 0 none) ${fmt(rule.share * 100)}%)`;
  } else {
    const l =
      typeof rule.l === 'number'
        ? fmt(rule.l)
        : `clamp(${fmt(rule.l.min ?? 0)}, calc(l + ${fmt(rule.l.offset)}), ${fmt(rule.l.max ?? 1)})`;
    const h = rule.h ? `calc(h + ${fmt(rule.h)})` : 'h';
    const seed = `var(--slotted-seed-${rule.seed})`;
    color =
      'gamut' in rule.c
        ? limitedColorCss(seed, l, h, rule.c)
        : `oklch(from ${seed} ${l} min(calc(c * ${fmt(rule.c.scale)}), ${fmt(rule.c.max)}) ${h})`;
  }
  for (const bound of rule.bounds ?? []) {
    color = boundColorCss(color, bound);
  }
  return color;
}
