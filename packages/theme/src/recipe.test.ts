import { describe, expect, it } from 'vitest';

import { parseSeed } from './color';
import { derivationCss, evaluateRecipe, SCHEMES, type Recipe } from './recipe';
import { recipes } from './recipes';

const seeds = {
  accent: parseSeed('#1d4ed8')!,
  neutral: parseSeed('#64748b')!,
  success: parseSeed('#15803d')!,
  info: parseSeed('oklch(0.6 0.15 255)')!,
  warning: parseSeed('#facc15')!,
  danger: parseSeed('#dc2626')!,
};

const recipe: Recipe = {
  light: {
    '--slotted-tone-accent-solid': {
      seed: 'accent',
      l: { offset: 0.05, min: 0.3, max: 0.5 },
      c: { scale: 1, max: 0.25 },
    },
    '--slotted-tone-accent-solid-hover': { mix: '--slotted-tone-accent-solid', share: 0.06 },
    '--slotted-surface': { seed: 'neutral', l: 1, c: { scale: 0, max: 0 } },
    '--slotted-control-surface': { alias: '--slotted-surface' },
    '--slotted-tone-warning-text': {
      seed: 'warning',
      l: 0.476,
      c: { scale: 0.6, max: 0.2 },
      h: -30,
    },
  },
  dark: {},
  'high-contrast': {},
};

describe('evaluateRecipe', () => {
  const values = evaluateRecipe(recipe, seeds, 'light');

  it('clamps the seed lightness plus its offset', () => {
    expect(values['--slotted-tone-accent-solid']!.l).toBe(0.5);
    expect(values['--slotted-tone-accent-solid']!.h).toBeCloseTo(seeds.accent.h, 6);
  });

  it('mixes toward white below 0.9 and keeps the hue', () => {
    const solid = values['--slotted-tone-accent-solid']!;
    const hover = values['--slotted-tone-accent-solid-hover']!;
    expect(hover.l).toBeCloseTo(solid.l * 0.94 + 0.06, 9);
    expect(hover.c).toBeCloseTo(solid.c * 0.94, 9);
    expect(hover.h).toBe(solid.h);
  });

  it('mixes toward black above 0.9', () => {
    const light = evaluateRecipe(
      {
        ...recipe,
        light: {
          '--a': { seed: 'neutral', l: 0.95, c: { scale: 0, max: 0 } },
          '--b': { mix: '--a', share: 0.06 },
        },
      },
      seeds,
      'light',
    );
    expect(light['--b']!.l).toBeCloseTo(0.95 * 0.94, 9);
  });

  it('follows an alias and shifts a hue', () => {
    expect(values['--slotted-control-surface']).toEqual(values['--slotted-surface']);
    expect(values['--slotted-tone-warning-text']!.h).toBeCloseTo(seeds.warning.h - 30, 6);
  });

  it('names a missing rule and a cycle', () => {
    expect(() =>
      evaluateRecipe({ ...recipe, dark: { '--a': { alias: '--b' } } }, seeds, 'dark'),
    ).toThrow('dark: the recipe has no rule for --b');
    expect(() =>
      evaluateRecipe(
        { ...recipe, dark: { '--a': { alias: '--b' }, '--b': { alias: '--a' } } },
        seeds,
        'dark',
      ),
    ).toThrow('Recipe cycle at --a → --b → --a');
  });
});

describe('derivationCss', () => {
  it('writes a seed derivation as relative oklch', () => {
    expect(derivationCss(recipe.light['--slotted-tone-accent-solid']!)).toBe(
      'oklch(from var(--slotted-seed-accent) clamp(0.3, calc(l + 0.05), 0.5) min(calc(c * 1), 0.25) h)',
    );
    expect(derivationCss(recipe.light['--slotted-tone-warning-text']!)).toBe(
      'oklch(from var(--slotted-seed-warning) 0.476 min(calc(c * 0.6), 0.2) calc(h + -30))',
    );
  });

  it('writes a mix toward white or black by lightness, with no hue on the target', () => {
    expect(derivationCss(recipe.light['--slotted-tone-accent-solid-hover']!)).toBe(
      'color-mix(in oklch, var(--slotted-tone-accent-solid), oklch(from var(--slotted-tone-accent-solid) clamp(0, calc((0.9 - l) * 1000000), 1) 0 none) 6%)',
    );
  });

  it('writes an alias as a var()', () => {
    expect(derivationCss({ alias: '--slotted-surface' })).toBe('var(--slotted-surface)');
  });

  it('wraps a bounded colour in an oklab whose alpha carries the chroma, once per bound', () => {
    const k = Array(27).fill(0);
    const css = derivationCss({
      seed: 'accent',
      l: 0.5,
      c: { scale: 1, max: 0.25 },
      bounds: [{ side: 'floor', l: 0.3, k }],
    });
    expect(
      css.startsWith('oklch(from oklab(from oklch(from oklch(from var(--slotted-seed-accent) 0.5 '),
    ).toBe(true);
    expect(css).toContain(' h) l c h / c) max(l, calc(0.3 + alpha * (');
    expect(css.endsWith(') a b / 1) l c h)')).toBe(true);
  });

  /*
   * Firefox 146–152 refuses sin(), cos(), sqrt(), pow() and the rest over a
   * channel keyword, and its content process crashes on hypot() of them: the
   * token stays declared and every property that reads it is invalid at
   * computed-value time. WebKit 18 drops the unit of calc(h * 1deg) inside
   * cos(). Every derivation of the standard recipe is arithmetic only.
   */
  it('writes no trigonometric, root, power or logarithm function in the standard recipe', () => {
    let bounded = 0;
    for (const scheme of SCHEMES) {
      for (const [name, rule] of Object.entries(recipes.standard[scheme])) {
        if ('bounds' in rule && rule.bounds?.length) bounded += 1;
        expect(derivationCss(rule), `${scheme} ${name}`).not.toMatch(
          /\b(sin|cos|tan|asin|acos|atan|atan2|sqrt|pow|hypot|exp|log)\(/,
        );
      }
    }
    expect(bounded).toBeGreaterThan(0);
  });
});
