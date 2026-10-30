import { describe, expect, it } from 'vitest';

import { deltaE, fromSrgb, parseSeed, toLinearSrgb, type Oklch } from '../color';
import { evaluateRecipe, SCHEMES, SEED_NAMES, type Scheme, type SeedName } from '../recipe';
import { checkScheme, seedGrid } from '../recipe-checks';
import { standard } from './standard';

const DEFAULT_SEEDS: Record<SeedName, string> = {
  accent: '#1d4ed8',
  neutral: '#64748b',
  success: '#15803d',
  info: 'oklch(0.6 0.15 255)',
  warning: '#facc15',
  danger: '#dc2626',
};
const base = Object.fromEntries(
  SEED_NAMES.map((name) => [name, parseSeed(DEFAULT_SEEDS[name])!]),
) as Record<SeedName, NonNullable<ReturnType<typeof parseSeed>>>;

describe('recipes.standard', () => {
  it('derives the same 97 tokens in every scheme', () => {
    for (const scheme of SCHEMES) expect(Object.keys(standard[scheme])).toHaveLength(97);
  });

  it('meets every ratio for every seed of the grid, one seed varied at a time', () => {
    const failures = new Set<string>();
    for (const scheme of SCHEMES) {
      for (const name of SEED_NAMES) {
        for (const seed of seedGrid()) {
          const values = evaluateRecipe(standard, { ...base, [name]: seed }, scheme);
          for (const failure of checkScheme(values, scheme)) {
            failures.add(`${scheme} ${name} ${failure}`);
          }
        }
      }
    }
    expect([...failures].slice(0, 20)).toEqual([]);
  });

  /** The rule a token comes from, through its aliases and its hover mixes. */
  const origin = (scheme: Scheme, token: string) => {
    let rule = standard[scheme][token];
    while (rule && !('seed' in rule))
      rule = standard[scheme]['alias' in rule ? rule.alias : rule.mix];
    return rule;
  };
  const NEUTRAL = Object.fromEntries(
    SCHEMES.map((scheme) => [
      scheme,
      Object.keys(standard[scheme]).filter((token) => origin(scheme, token)?.seed === 'neutral'),
    ]),
  ) as Record<Scheme, string[]>;
  const inside = (color: Oklch) =>
    toLinearSrgb(color).every((channel) => channel >= -1e-9 && channel <= 1 + 1e-9);
  /** What an sRGB screen paints: every channel clipped to 0–1, read back unquantised. */
  const painted = (color: Oklch) => {
    const [r, g, b] = toLinearSrgb(color).map((channel) => {
      const linear = Math.min(1, Math.max(0, channel));
      return linear <= 0.0031308 ? linear * 12.92 : 1.055 * linear ** (1 / 2.4) - 0.055;
    });
    return fromSrgb(r!, g!, b!);
  };
  const turn = (color: Oklch, seed: Oklch) => Math.abs(((color.h - seed.h + 540) % 360) - 180);

  /**
   * A fixed `h` is what gave a neutral token the slate reference's hue offset
   * instead of the seed's own: the one `a66d725d` removed. A tolerance alone
   * does not guard the regression, because a wide enough one would still pass
   * a small fixed offset — so the rule itself is read, not only the colour it
   * paints.
   */
  it('derives every neutral rule with no fixed hue offset', () => {
    const offenders: string[] = [];
    for (const scheme of SCHEMES) {
      for (const [token, rule] of Object.entries(standard[scheme])) {
        if ('seed' in rule && rule.seed === 'neutral' && 'h' in rule)
          offenders.push(`${scheme} ${token}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  /**
   * A neutral seed recolours every line, highlight, ink and ground it derives,
   * or a page painted with it reads two colours at once: the pink seed of a
   * Nexora theme left the highlights a fixed slate share of it, and the step
   * from a pink ground to them read green. Each token is read where an sRGB
   * screen paints it — inside the gamut, so the hue `evaluateRecipe` computes
   * is the one on screen — and it carries the seed's hue and some of its
   * chroma. The tolerance is 1°, not the fixed offsets `a66d725d` removed
   * (text +8°, inverse/on-solid +7°, border-strong −6°): what is left is
   * rounding at the sRGB gamut edge, read above on the rule itself.
   */
  it('gives every neutral token the hue and a share of the chroma of a tinted neutral seed', () => {
    const misses: string[] = [];
    for (const neutral of ['#e8a0b8', '#db2777', '#846f6c', '#0e7490', '#7c3aed']) {
      const seed = parseSeed(neutral)!;
      for (const scheme of ['light', 'dark'] as const) {
        const values = evaluateRecipe(standard, { ...base, neutral: seed }, scheme);
        for (const token of NEUTRAL[scheme]) {
          const screen = painted(values[token]!);
          if (!inside(values[token]!) || screen.c < 0.005 || turn(screen, seed) > 1)
            misses.push(
              `${neutral} ${scheme} ${token}: c ${screen.c.toFixed(4)}, ${turn(screen, seed).toFixed(2)}° from the seed, ${inside(values[token]!) ? 'in' : 'out of'} sRGB`,
            );
        }
      }
    }
    expect(misses).toEqual([]);
  });

  it('keeps every neutral token inside sRGB for every neutral seed of the grid', () => {
    const misses = new Set<string>();
    for (const scheme of SCHEMES) {
      for (const seed of seedGrid()) {
        const values = evaluateRecipe(standard, { ...base, neutral: seed }, scheme);
        for (const token of NEUTRAL[scheme])
          if (!inside(values[token]!)) misses.add(`${scheme} ${token}`);
      }
    }
    expect([...misses]).toEqual([]);
  });

  /**
   * The fills and lines drawn over a ground. Each one holds at least the
   * ground's chroma, so the step from the ground to it points at the seed's
   * hue: with less, the step points at the opposite hue, and a hover on a pink
   * ground reads green. A hover mix is the fill it lightens and is not one.
   */
  const OVER_GROUNDS = [
    '--slotted-border-subtle',
    '--slotted-border-strong',
    '--slotted-control-border-color',
    '--slotted-disabled-border',
    '--slotted-disabled-background',
    '--slotted-tone-secondary-surface',
    '--slotted-tone-secondary-solid',
    '--slotted-tone-secondary-solid-active',
    '--slotted-tone-secondary-border',
    '--slotted-tone-secondary-subtle-hover',
    '--slotted-tone-secondary-subtle-active',
  ];
  const GROUNDS = ['--slotted-surface', '--slotted-surface-raised', '--slotted-surface-sunken'];

  it('gives every neutral fill and line at least the chroma of the grounds it is drawn on', () => {
    const misses = new Set<string>();
    for (const scheme of ['light', 'dark'] as const) {
      for (const seed of seedGrid()) {
        const values = evaluateRecipe(standard, { ...base, neutral: seed }, scheme);
        const ground = Math.max(...GROUNDS.map((token) => values[token]!.c));
        for (const token of OVER_GROUNDS)
          if (values[token]!.c < ground - 1e-9) misses.add(`${scheme} ${token}`);
      }
    }
    expect([...misses]).toEqual([]);
  });

  /**
   * The dark edge and ink of the accent keep its hue; the floor bounds alone
   * lift them to the contrast the scheme needs. Fixed offsets of −10° and −13°
   * copied the drift of the palette the default theme was matched to, and
   * turned every other seed toward blue: #7c6cff, a violet at 283°, gave a
   * dark border of #b1c7ff. The derivation is read for four hues; the screen
   * is read for that violet, which the two tokens hold inside sRGB — a seed
   * whose light tints leave the gamut is clipped by the display, a drift no
   * offset in the recipe answers.
   */
  it('keeps the accent hue in the dark edge and ink for any accent seed', () => {
    const misses: string[] = [];
    const tokens = ['--slotted-tone-accent-border', '--slotted-tone-accent-text'];
    for (const h of [30, 150, 230, 283]) {
      const seed = { l: 0.6, c: 0.2, h };
      const values = evaluateRecipe(standard, { ...base, accent: seed }, 'dark');
      for (const token of tokens) {
        if (turn(values[token]!, seed) > 3)
          misses.push(`${h}° ${token}: ${turn(values[token]!, seed).toFixed(2)}° from the seed`);
      }
    }
    const violet = parseSeed('#7c6cff')!;
    const values = evaluateRecipe(standard, { ...base, accent: violet }, 'dark');
    for (const token of tokens) {
      const screen = painted(values[token]!);
      if (turn(screen, violet) > 3)
        misses.push(`#7c6cff ${token}: ${turn(screen, violet).toFixed(2)}° on screen`);
    }
    expect(misses).toEqual([]);
  });

  /**
   * The categorical ladder turns with the accent: slot 1 is the accent's hue,
   * so a new accent never sits beside a first series of another hue, and
   * slots 2 to 8 step back 45° at a time. Two lightness steps alternate: at
   * one lightness, a reader without red or green cones tells two hues on the
   * red-green axis apart by nothing, and adjacent slots — the bars of a
   * stacked chart, the lines of a legend — have to differ by more than hue.
   * The chroma is capped where sRGB stops holding it, so a slot is painted as
   * derived on any screen. Every accent hue is read, 15° apart.
   */
  describe('the data ladder', () => {
    const SLOTS = Array.from({ length: 8 }, (_, index) => `--slotted-data-${index + 1}`);
    /** Machado, Oliveira and Fernandes 2009, at severity 1, on linear sRGB. */
    const DEFICIENCIES = {
      deuteranopia: [
        [0.367322, 0.860646, -0.227968],
        [0.280085, 0.672501, 0.047413],
        [-0.01182, 0.04294, 0.968881],
      ],
      protanopia: [
        [0.152286, 1.052583, -0.204868],
        [0.114503, 0.786281, 0.099216],
        [-0.003882, -0.048116, 1.051998],
      ],
    };
    const gamma = (channel: number) => {
      const linear = Math.min(1, Math.max(0, channel));
      return linear <= 0.0031308 ? linear * 12.92 : 1.055 * linear ** (1 / 2.4) - 0.055;
    };
    const simulate = (color: Oklch, matrix: number[][]) => {
      const rgb = toLinearSrgb(color).map((channel) => Math.min(1, Math.max(0, channel)));
      const [r, g, b] = matrix.map((row) => gamma(row.reduce((sum, k, i) => sum + k * rgb[i]!, 0)));
      return fromSrgb(r!, g!, b!);
    };

    for (const scheme of SCHEMES) {
      it(`follows the accent and stays apart without red or green cones in ${scheme}`, () => {
        const misses: string[] = [];
        for (let h = 0; h < 360; h += 15) {
          const seed = { l: 0.6, c: 0.2, h };
          const values = evaluateRecipe(standard, { ...base, accent: seed }, scheme);
          const slots = SLOTS.map((slot) => values[slot]!);
          if (turn(slots[0]!, seed) > 3)
            misses.push(`${h}°: slot 1 is ${turn(slots[0]!, seed)}° off`);
          for (const parity of [0, 1]) {
            const steps = slots.filter((_, index) => index % 2 === parity).map((slot) => slot.l);
            if (Math.max(...steps) - Math.min(...steps) > 0.01)
              misses.push(`${h}°: the slots of one step differ in lightness`);
          }
          slots.forEach((slot, index) => {
            if (!inside(slot)) misses.push(`${h}° ${SLOTS[index]} is outside sRGB`);
            const next = slots[index + 1];
            if (next === undefined) return;
            for (const [name, matrix] of Object.entries(DEFICIENCIES)) {
              const distance = deltaE(simulate(slot, matrix), simulate(next, matrix)) * 100;
              if (distance < 8)
                misses.push(
                  `${h}° ${SLOTS[index]}–${index + 2}: ΔE ${distance.toFixed(1)}, ${name}`,
                );
            }
          });
        }
        expect(misses).toEqual([]);
      });
    }
  });

  it('keeps the high-contrast grounds achromatic for any neutral seed', () => {
    const values = evaluateRecipe(
      standard,
      { ...base, neutral: parseSeed('#7c3aed')! },
      'high-contrast',
    );
    for (const token of [...GROUNDS, '--slotted-control-surface', '--slotted-surface-inverse'])
      expect(values[token]!.c).toBe(0);
  });
});
