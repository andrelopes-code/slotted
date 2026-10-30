import {
  checkScheme,
  evaluateRecipe,
  parseSeed,
  ruleErrors,
  SCHEMES,
  SEED_NAMES,
  toLinearSrgb,
  type Oklch,
  type SeedName,
  type Theme,
} from '@slotted/theme';
import defaultTheme from '@slotted/themes/default';
import { describe, expect, it } from 'vitest';

import { BRAND_PRESETS, NEUTRAL_PRESETS } from './appearance';
import { controlStyle } from './control-styles';
import { nexoraTheme } from './nexora-themes';
import { fontFamily } from './theme-faces';
import {
  DEFAULT_THEME_ID,
  RUNTIME_THEME_IDS,
  THEME_CATALOGUE,
  type ThemeEntry,
} from './theme-catalogue';

const changed = (
  values: Readonly<Record<string, string>> | undefined,
  reference: Readonly<Record<string, string>> | undefined,
) => Object.keys(values ?? {}).filter((name) => values![name] !== reference?.[name]);

const familyOf = (token: string) =>
  /^--slotted-(stat-card|text-field|segmented-control|select-content|[a-z]+)-/.exec(token)![1];

const parsed = (seeds: Readonly<Record<SeedName, string>>) =>
  Object.fromEntries(SEED_NAMES.map((name) => [name, parseSeed(seeds[name])!])) as Record<
    SeedName,
    Oklch
  >;

const failures = (theme: Theme, seeds: Partial<Record<SeedName, string>>) =>
  SCHEMES.flatMap((scheme) =>
    checkScheme(
      evaluateRecipe(theme.recipe, parsed({ ...theme.seeds, ...seeds }), scheme),
      scheme,
    ).map((failure) => `${scheme}: ${failure}`),
  );

/**
 * A theme's value for a base or component token, with every `var()` that
 * names another declared token replaced by that token's value, the way the
 * cascade would resolve it on `html`.
 */
function resolved(theme: Theme, token: string, density = 'comfortable'): string {
  const values: Record<string, string | undefined> = {
    ...(defaultTheme.base as Record<string, string>),
    ...(defaultTheme.densities?.[density as 'comfortable'] as Record<string, string>),
    ...(defaultTheme.schemes?.light as Record<string, string>),
    ...(theme.base as Record<string, string>),
    ...(theme.densities?.[density as 'comfortable'] as Record<string, string>),
    ...(theme.schemes?.light as Record<string, string>),
    ...(theme.components as Record<string, string>),
  };
  let value = values[token] ?? 'unset';
  for (let depth = 0; depth < 6; depth++) {
    const next = value.replace(/var\((--slotted-[a-z0-9-]+)\)/g, (match, name: string) =>
      values[name] === undefined ? match : values[name]!,
    );
    if (next === value) break;
    value = next;
  }
  return value;
}

/**
 * The structural axes a theme is read on: what a reader sees before the
 * color — the faces and the size of the text, the height and corner of a
 * control, a field, a focus mark and a primary button, a card's edge, the
 * tabs' marker, the table's head, the shadow, the line, the space and the
 * motion. Color is not one of them.
 */
const STRUCTURE: readonly [string, (theme: Theme, entry: ThemeEntry) => string][] = [
  ['text face', (theme) => resolved(theme, '--slotted-font-family-sans')],
  ['heading face', (theme) => resolved(theme, '--slotted-font-family-heading')],
  [
    'prose face',
    (theme) =>
      theme.components?.['--slotted-typography-font-family' as never] ??
      resolved(theme, '--slotted-font-family-sans'),
  ],
  ['text size', (theme) => resolved(theme, '--slotted-font-size-md')],
  ['heading scale', (theme) => resolved(theme, '--slotted-font-size-4xl')],
  ['control height', (theme) => resolved(theme, '--slotted-control-height-md')],
  ['control corner', (theme) => resolved(theme, '--slotted-control-radius')],
  ['card corner', (theme) => resolved(theme, '--slotted-card-radius')],
  ['field', (_, entry) => entry.controls.input],
  [
    'focus',
    (theme, entry) =>
      `${entry.controls.focus} ${resolved(theme, '--slotted-focus-ring-width')} ${resolved(theme, '--slotted-focus-ring-offset')}`,
  ],
  [
    'button',
    (theme, entry) =>
      `${entry.controls.button} ${resolved(theme, '--slotted-control-font-weight')} ${resolved(theme, '--slotted-control-letter-spacing')}`,
  ],
  [
    'card edge',
    (theme) =>
      ['border-width', 'shadow', 'background']
        .map((part) => resolved(theme, `--slotted-card-${part}`))
        .join(' | '),
  ],
  [
    'tabs',
    (theme) =>
      `${resolved(theme, '--slotted-tabs-marker-color')} ${resolved(theme, '--slotted-tabs-track-color')} ${(
        theme.rules ?? []
      ).some((rule) => String(rule).includes("[data-part='item'][data-selected]"))}`,
  ],
  [
    'table head',
    (theme) =>
      `${resolved(theme, '--slotted-table-header-surface')} ${resolved(theme, '--slotted-table-row-min-block-size')}`,
  ],
  ['shadow', (theme) => resolved(theme, '--slotted-shadow-md')],
  ['space', (theme) => resolved(theme, '--slotted-space-6')],
  [
    'motion',
    (theme) =>
      `${resolved(theme, '--slotted-duration-medium')} ${resolved(theme, '--slotted-easing-standard')}`,
  ],
];
/** Of the seventeen axes, how many every two themes of the catalogue differ on. */
const MIN_DIFFERING = 12;

describe('theme catalogue', () => {
  it('names one definition per entry, and only the runtime themes leave `default`', () => {
    expect(THEME_CATALOGUE.map((entry) => nexoraTheme(entry.id).name)).toEqual(
      THEME_CATALOGUE.map((entry) => entry.id),
    );
    expect(RUNTIME_THEME_IDS).toEqual([
      'nexora-precise',
      'nexora-editorial',
      'nexora-corporate',
      'nexora-expressive',
    ]);
    expect(nexoraTheme(DEFAULT_THEME_ID)).toBe(defaultTheme);
  });

  /**
   * The corner the builder's slider starts at is the theme's own largest
   * radius; Standard's accent is Nexora's violet, every other theme keeps the
   * seed its sheet declares.
   */
  it('states each theme’s own corner and accent as its definition does', () => {
    for (const entry of THEME_CATALOGUE) {
      expect(`${entry.radius}px`, entry.id).toBe(
        resolved(nexoraTheme(entry.id), '--slotted-radius-lg'),
      );
    }
    expect(THEME_CATALOGUE.map((entry) => entry.accent)).toEqual([
      '#7c3aed',
      null,
      null,
      null,
      null,
    ]);
  });

  /**
   * A theme is a product language, not a tint: each one carries its five
   * seeds and a recipe of its own, rewrites the scales, the schemes and the
   * densities, dresses the families through their own tokens, adds rules
   * where no token reaches and brings its typeface.
   */
  it.each(RUNTIME_THEME_IDS)('%s exercises every layer of the theme model', (id) => {
    const theme = nexoraTheme(id);
    expect(SEED_NAMES.filter((name) => theme.seeds[name] === defaultTheme.seeds[name])).toEqual([]);
    expect(
      SCHEMES.flatMap((scheme) =>
        Object.keys(theme.recipe[scheme]).filter(
          (name) =>
            JSON.stringify(theme.recipe[scheme][name]) !==
            JSON.stringify(defaultTheme.recipe[scheme][name]),
        ),
      ).length,
    ).toBeGreaterThanOrEqual(4);
    expect(changed(theme.base, defaultTheme.base).length).toBeGreaterThanOrEqual(30);
    for (const scheme of SCHEMES) {
      expect(
        changed(theme.schemes?.[scheme], defaultTheme.schemes?.[scheme]).length,
        scheme,
      ).toBeGreaterThanOrEqual(scheme === 'high-contrast' ? 8 : 12);
    }
    expect(
      changed(theme.densities?.comfortable, defaultTheme.densities?.comfortable).length,
    ).toBeGreaterThanOrEqual(6);
    const components = Object.keys(theme.components ?? {});
    expect(components.length).toBeGreaterThanOrEqual(15);
    expect(new Set(components.map(familyOf)).size).toBeGreaterThanOrEqual(6);
    expect(theme.rules?.length ?? 0).toBeGreaterThanOrEqual(1);
    expect(theme.fonts?.length ?? 0).toBeGreaterThanOrEqual(1);
  });

  /**
   * The input, focus and button styles a catalogue entry names are the ones
   * its theme draws: the theme carries the rules and the tokens
   * `controlStyle` writes for them.
   */
  it.each(RUNTIME_THEME_IDS)('%s draws the Controls styles its entry names', (id) => {
    const theme = nexoraTheme(id);
    const entry = THEME_CATALOGUE.find((candidate) => candidate.id === id)!;
    const style = controlStyle(entry.controls);
    const rules = (theme.rules ?? []).map(String);
    for (const rule of style.rules) expect(rules, id).toContain(rule);
    expect(theme.base?.['--slotted-focus-ring-offset']).toBe(
      style.base['--slotted-focus-ring-offset' as never],
    );
  });

  /**
   * Every two themes of the catalogue — Standard among them — differ on at
   * least twelve of the seventeen structural axes: a reader tells them apart
   * before reading a color.
   */
  it('keeps every two themes apart on the structural axes', () => {
    const read = THEME_CATALOGUE.map((entry) => ({
      id: entry.id,
      axes: STRUCTURE.map(([axis, value]) => [axis, value(nexoraTheme(entry.id), entry)] as const),
    }));
    expect(STRUCTURE).toHaveLength(17);
    for (const [index, a] of read.entries()) {
      for (const b of read.slice(index + 1)) {
        const shared = a.axes
          .filter(([axis, value]) => b.axes.find(([other]) => other === axis)![1] === value)
          .map(([axis]) => axis);
        expect(
          STRUCTURE.length - shared.length,
          `${a.id} and ${b.id} share ${shared.join(', ')}`,
        ).toBeGreaterThanOrEqual(MIN_DIFFERING);
      }
    }
  });

  /** The four rebuilt themes draw a field, and a focus mark, each in a style of its own. */
  it('draws a field and a focus mark in a different style in each rebuilt theme', () => {
    const inputs = RUNTIME_THEME_IDS.map(
      (id) => THEME_CATALOGUE.find((entry) => entry.id === id)!.controls.input,
    );
    expect(new Set(inputs).size).toBe(RUNTIME_THEME_IDS.length);
    const focus = RUNTIME_THEME_IDS.map(
      (id) => THEME_CATALOGUE.find((entry) => entry.id === id)!.controls.focus,
    );
    expect(new Set(focus).size).toBe(RUNTIME_THEME_IDS.length);
  });

  it.each(RUNTIME_THEME_IDS)('%s draws the chart in a palette of its own in every scheme', (id) => {
    const theme = nexoraTheme(id);
    for (const scheme of SCHEMES) {
      const palette = Array.from(
        { length: 8 },
        (_, index) => theme.schemes?.[scheme]?.[`--slotted-data-${index + 1}` as never],
      );
      expect(new Set(palette).size, scheme).toBe(8);
      expect(
        palette.filter(
          (color, index) =>
            color === defaultTheme.schemes?.[scheme]?.[`--slotted-data-${index + 1}` as never],
        ),
        scheme,
      ).toEqual([]);
    }
  });

  /**
   * recipe-checks' floors hold for every theme in every scheme: with its own
   * seeds, and with each brand and grey a reader can lay over them.
   */
  it.each(THEME_CATALOGUE.map((entry) => entry.id))(
    '%s keeps every text, border and solid at its floor in the three schemes',
    (id) => {
      const theme = nexoraTheme(id);
      expect(failures(theme, {})).toEqual([]);
      for (const brand of BRAND_PRESETS) {
        for (const neutral of NEUTRAL_PRESETS) {
          const seeds = {
            accent: brand.color,
            ...(neutral.color === null ? {} : { neutral: neutral.color }),
          };
          expect(failures(theme, seeds), `${brand.id} × ${neutral.id}`).toEqual([]);
        }
      }
    },
  );

  /**
   * A ground, a line and a hover are one neutral family: in every theme, with
   * its own neutral and with each grey a reader can lay over it, the lines and
   * the hovers carry the ground's hue (±20°) and at least its chroma, wherever
   * the ground's chroma (≥ 0.01) gives it a hue.
   */
  it.each(THEME_CATALOGUE.map((entry) => entry.id))(
    '%s tints its lines and hovers as it tints its grounds',
    (id) => {
      const theme = nexoraTheme(id);
      const greys = [
        null,
        ...NEUTRAL_PRESETS.flatMap((preset) => (preset.color === null ? [] : [preset.color])),
      ];
      let tinted = 0;
      for (const grey of greys) {
        for (const scheme of ['light', 'dark'] as const) {
          const values = evaluateRecipe(
            theme.recipe,
            parsed({ ...theme.seeds, ...(grey === null ? {} : { neutral: grey }) }),
            scheme,
          );
          const ground = values['--slotted-surface']!;
          if (ground.c < 0.01) continue;
          tinted += 1;
          for (const token of [
            '--slotted-border-subtle',
            '--slotted-tone-secondary-subtle-hover',
            '--slotted-control-border-color',
          ]) {
            const value = values[token]!;
            const hue = Math.abs(value.h - ground.h) % 360;
            expect(
              Math.min(hue, 360 - hue),
              `${grey ?? 'own'} ${scheme} ${token}`,
            ).toBeLessThanOrEqual(20);
            expect(value.c, `${grey ?? 'own'} ${scheme} ${token}`).toBeGreaterThanOrEqual(
              ground.c * 0.99,
            );
          }
        }
      }
      expect(tinted).toBeGreaterThanOrEqual(4);
    },
  );

  /**
   * A grey the reader picks has to read as a choice beside the theme's own:
   * every pair of greys offered — the four presets and the themes' own — is
   * apart by 25° of hue or 0.01 of chroma (OKLCH).
   */
  it('offers greys apart from one another and from every theme’s own', () => {
    const greys = [
      ...NEUTRAL_PRESETS.flatMap((preset) => (preset.color === null ? [] : [preset.color])),
      ...RUNTIME_THEME_IDS.map((id) => nexoraTheme(id).seeds.neutral),
    ];
    for (const [index, a] of greys.entries()) {
      for (const b of greys.slice(index + 1)) {
        const [x, y] = [parseSeed(a)!, parseSeed(b)!];
        const hue = Math.abs(x.h - y.h) % 360;
        const apart = Math.min(hue, 360 - hue) >= 25 || Math.abs(x.c - y.c) >= 0.01;
        expect(apart, `${a} beside ${b}`).toBe(true);
      }
    }
  });

  /**
   * A grey the reader picks reaches every ground, line and hover: each one
   * derives from the neutral seed. Under a strong grey of any hue (chroma
   * 0.2, every 15°) each ground stays inside sRGB, so the screen shows the
   * grey's hue and not the hue clipping leaves, and keeps 0.004 of chroma,
   * so it still reads as tinted (`tools/theme-switch.mjs`, the greys).
   */
  it('derives its grounds, lines and hovers from the neutral seed, tinted and inside sRGB', () => {
    const grounds = ['--slotted-surface', '--slotted-surface-raised', '--slotted-surface-sunken'];
    const neutrals = [
      ...grounds,
      '--slotted-border-subtle',
      '--slotted-control-border-color',
      '--slotted-tone-secondary-subtle-hover',
    ];
    const inside = (color: Oklch) => toLinearSrgb(color).every((v) => v >= -0.002 && v <= 1.002);
    for (const id of RUNTIME_THEME_IDS) {
      const theme = nexoraTheme(id);
      for (const scheme of ['light', 'dark'] as const) {
        for (const token of neutrals) {
          const rule = theme.recipe[scheme][token];
          expect(rule !== undefined && 'seed' in rule ? rule.seed : rule, `${id} ${scheme} ${token}`).toBe('neutral');
        }
        for (let h = 0; h < 360; h += 15) {
          const neutral = `oklch(0.5 0.2 ${h})`;
          const values = evaluateRecipe(theme.recipe, parsed({ ...theme.seeds, neutral }), scheme);
          for (const token of grounds) {
            expect(inside(values[token]!), `${id} ${scheme} ${neutral} ${token}`).toBe(true);
            expect(values[token]!.c, `${id} ${scheme} ${neutral} ${token}`).toBeGreaterThanOrEqual(0.004);
          }
        }
      }
    }
  });

  /**
   * ADR 0004: a theme rule selects by the families' public hooks and reads
   * only tokens. `defineTheme` holds every rule given as text to that policy,
   * so each theme here exists only because its rules passed it;
   * `ruleErrors` is the same check, read directly.
   */
  it('selects in its rules by the families’ public hooks only, and reads only tokens', () => {
    for (const id of RUNTIME_THEME_IDS) {
      for (const rule of nexoraTheme(id).rules ?? []) {
        expect(ruleErrors(String(rule)), id).toEqual([]);
      }
    }
  });

  /**
   * Faces are the contract's tokens, taken from the families the builder
   * offers; each theme declares the `@font-face` of every face it names, and
   * no rule writes a face of its own.
   */
  it('sets every face through the font tokens, from the builder’s families', () => {
    for (const entry of THEME_CATALOGUE) {
      const theme = nexoraTheme(entry.id);
      expect(resolved(theme, '--slotted-font-family-sans'), entry.id).toBe(
        fontFamily(entry.body).stack,
      );
      expect(resolved(theme, '--slotted-font-family-heading'), entry.id).toBe(
        fontFamily(entry.heading).stack,
      );
      expect(resolved(theme, '--slotted-control-font-family'), entry.id).toBe(
        fontFamily(entry.body).stack,
      );
      expect(theme.components?.['--slotted-typography-font-family' as never], entry.id).toBe(
        entry.prose === null ? undefined : fontFamily(entry.prose).stack,
      );
      expect((theme.fonts ?? []).map((font) => font.family).sort(), entry.id).toEqual(
        [...new Set([entry.body, entry.heading, ...(entry.prose === null ? [] : [entry.prose])])]
          .flatMap((id) => (fontFamily(id).face === null ? [] : [fontFamily(id).face!.family]))
          .sort(),
      );
    }
    for (const id of RUNTIME_THEME_IDS) {
      expect((nexoraTheme(id).rules ?? []).join('\n'), id).not.toMatch(/font-family\s*:/);
    }
  });
});
