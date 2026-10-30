import {
  applyTheme,
  extendTheme,
  SCHEMES,
  type Density,
  type Derivation,
  type Recipe,
  type Scheme,
  toLinearSrgb,
  type Theme,
  type ThemeOverrides,
} from '@slotted/theme';
import defaultTheme from '@slotted/themes/default';

import { controlStyle, FIELD_FAMILIES, TAB_STYLES } from './control-styles';
import { facesOf, fontFamily } from './theme-faces';
import { catalogueTheme, DEFAULT_THEME_ID, type ThemeEntry } from './theme-catalogue';

/**
 * The definitions of the catalogue in `theme-catalogue.ts`. Each one is built
 * on the library's own theme with `extendTheme` and writes every layer of the
 * model:
 *
 * - `seeds` — its five colours;
 * - `recipe` — the library's derivations with some of them moved. A ground,
 *   a line and a hover keep one neutral family: a theme that tints its
 *   grounds tints its lines and hovers by at least as much, in the same hue;
 * - `base` — the type scale, the weights, the spacing rhythm, the corners,
 *   the line weights, the focus ring and the motion;
 * - `schemes` — the shadows and the chart palette of each scheme;
 * - `densities` — the controls' heights, insets and sizes;
 * - `components` — the families' own tokens: fields, cards, stat cards,
 *   tables, tabs, badges, alerts, overlays, charts;
 * - `rules` — what no token reaches, selecting only the families' public
 *   hooks: the input, focus and button styles of `control-styles.ts`, and
 *   each theme's own tabs, tables and cards;
 * - `fonts` — the `@font-face` of the faces it brings.
 *
 * The four differ in structure, not only in colour: type family and scale,
 * control height, field style, focus treatment, button paint, card edge, tab
 * marker, table head, corner language, shadow language and motion
 * (`theme-catalogue.spec.ts` counts the axes on which every pair differs).
 *
 * This module is loaded with `import()` and nothing imports it statically from
 * the initial bundle: `extendTheme` validates against the whole token contract
 * and the default theme object comes with it (LIBRARY-FEEDBACK.md, row "a
 * theme built at runtime").
 */

type Edits = Partial<Record<Scheme, Readonly<Record<string, Derivation>>>>;
type Components = NonNullable<ThemeOverrides['components']>;

/** The library's recipe with `edits` laid over it, scheme by scheme. */
function recipe(...edits: Edits[]): Recipe {
  return Object.fromEntries(
    SCHEMES.map((scheme) => [
      scheme,
      Object.assign({}, defaultTheme.recipe[scheme], ...edits.map((edit) => edit[scheme] ?? {})),
    ]),
  ) as Recipe;
}

/** The library's seed derivation of `token` in `scheme`. */
function seedRule(scheme: Scheme, token: string) {
  const rule = defaultTheme.recipe[scheme][token];
  if (rule === undefined || !('seed' in rule))
    throw new Error(`${scheme} ${token} is not a seed derivation`);
  return rule;
}

/**
 * The largest chroma every hue keeps inside sRGB at lightness `l`, to three
 * decimals: under it, a ground of any grey shows the grey's hue and not the
 * one clipping leaves. The library's own ceilings sit under it (0.006 at
 * L 0.985, where it is 0.007).
 */
function gamutCeiling(l: number): number {
  let ceiling = Infinity;
  for (let h = 0; h < 360; h += 5) {
    let [inside, outside] = [0, 0.4];
    for (let step = 0; step < 20; step++) {
      const c = (inside + outside) / 2;
      if (toLinearSrgb({ l, c, h }).every((v) => v >= 0 && v <= 1)) inside = c;
      else outside = c;
    }
    ceiling = Math.min(ceiling, inside);
  }
  return Math.floor(ceiling * 1000) / 1000;
}

/**
 * The library's derivation of `token` at another lightness. The share of the
 * seed's chroma stays the library's, so a ground, a line and a hover moved
 * this way keep one neutral family: the same hue, the same share. The
 * ceiling stays the library's where sRGB holds it at the new lightness.
 */
function relight(scheme: Scheme, token: string, l: number): Derivation {
  const rule = seedRule(scheme, token);
  return { ...rule, l, c: { ...rule.c, max: Math.min(rule.c.max, gamutCeiling(l)) } };
}

/** The library's derivation of `token` with `factor` times its share of the seed's chroma. */
function rescale(scheme: Scheme, token: string, factor: number): Derivation {
  const rule = seedRule(scheme, token);
  // A gamut-limited rule asks for a fixed chroma, so the factor moves what it asks for.
  const c = 'scale' in rule.c ? { ...rule.c, scale: rule.c.scale * factor } : { ...rule.c, max: rule.c.max * factor };
  return { ...rule, c };
}

/** The given parts of the given tones' soft grounds at `factor` times the library's chroma. */
const tints = (
  tones: readonly string[],
  factor: number,
  parts: readonly string[] = ['surface', 'subtle-hover', 'subtle-active'],
): Edits =>
  Object.fromEntries(
    (['light', 'dark'] as const).map((scheme) => [
      scheme,
      Object.fromEntries(
        tones.flatMap((tone) =>
          parts.map((part) => {
            const token = `--slotted-tone-${tone}-${part}`;
            return [token, rescale(scheme, token, factor)];
          }),
        ),
      ),
    ]),
  );

/**
 * A neutral family carrying more of the seed's chroma: the grounds at
 * `ground` of it, under a ceiling of `ceiling` or of sRGB at their lightness,
 * whichever is lower, and the lines and hovers at `line` of it, so a line is
 * never greyer than the ground it sits on.
 */
const tinted = (ground: number, line: number, ceiling: number): Edits =>
  Object.fromEntries(
    (['light', 'dark'] as const).map((scheme) => [
      scheme,
      Object.fromEntries([
        ...['--slotted-surface', '--slotted-surface-raised', '--slotted-surface-sunken'].map(
          (token) => {
            const rule = seedRule(scheme, token);
            const max = typeof rule.l === 'number' ? Math.min(ceiling, gamutCeiling(rule.l)) : ceiling;
            return [token, { ...rule, c: { scale: ground, max } }];
          },
        ),
        ...[
          '--slotted-border-subtle',
          '--slotted-control-border-color',
          '--slotted-tone-secondary-subtle-hover',
        ].map((token) => [
          token,
          { ...seedRule(scheme, token), c: { scale: line, max: ceiling + 0.02 } },
        ]),
      ]),
    ]),
  );

/** The library's type sizes, in rem, from xs to 4xl. */
const SIZE_STEPS = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'] as const;
const sizes = (rem: readonly number[]) =>
  Object.fromEntries(
    SIZE_STEPS.map((step, index) => [`--slotted-font-size-${step}`, `${rem[index]}rem`]),
  );
const lineHeights = (values: readonly number[]) =>
  Object.fromEntries(
    SIZE_STEPS.map((step, index) => [`--slotted-line-height-${step}`, String(values[index])]),
  );
/** The spacing scale from step 1 to 12, in rem. */
const spaces = (rem: readonly number[]) =>
  Object.fromEntries(rem.map((value, index) => [`--slotted-space-${index + 1}`, `${value}rem`]));
const radii = (xs: number, sm: number, md: number, lg: number) => ({
  '--slotted-radius-xs': `${xs}px`,
  '--slotted-radius-sm': `${sm}px`,
  '--slotted-radius-md': `${md}px`,
  '--slotted-radius-lg': `${lg}px`,
});
const motion = (
  [short, medium, long]: readonly [string, string, string],
  easings: Readonly<Record<'standard' | 'enter' | 'exit' | 'emphasized', string>>,
) => ({
  '--slotted-duration-short': short,
  '--slotted-duration-medium': medium,
  '--slotted-duration-long': long,
  ...Object.fromEntries(
    Object.entries(easings).map(([name, value]) => [`--slotted-easing-${name}`, value]),
  ),
});
const shadows = (xs: string, sm: string, md: string, lg: string, control: string) => ({
  '--slotted-shadow-xs': xs,
  '--slotted-shadow-sm': sm,
  '--slotted-shadow-md': md,
  '--slotted-shadow-lg': lg,
  '--slotted-control-shadow': control,
});
const palette = (colors: readonly string[]) =>
  Object.fromEntries(colors.map((color, index) => [`--slotted-data-${index + 1}`, color]));

/** One token of every field family, at `value`. */
const fields = (name: string, value: string): Components =>
  Object.fromEntries(
    FIELD_FAMILIES.map(({ ui }) => [`--slotted-${ui}-${name}`, value]),
  ) as Components;

/** The overlays' corners and shadows, one value each. */
const overlays = (radius: string, shadow: string, line: string): Components =>
  ({
    '--slotted-menu-radius': radius,
    '--slotted-menu-shadow': shadow,
    '--slotted-menu-border-color': line,
    '--slotted-popover-radius': radius,
    '--slotted-popover-shadow': shadow,
    '--slotted-popover-border-color': line,
    '--slotted-select-content-radius': radius,
    '--slotted-select-content-shadow': shadow,
    '--slotted-select-content-border-color': line,
    '--slotted-combobox-content-radius': radius,
    '--slotted-combobox-content-shadow': shadow,
    '--slotted-date-picker-content-radius': radius,
    '--slotted-date-picker-content-shadow': shadow,
  }) as Components;

type DensityValues = NonNullable<ThemeOverrides['densities']>[Density];
/** Each density of the library's, with `change` applied to its control pixel values. */
function densities(change: (token: string, px: number, density: Density) => number) {
  const out: Partial<Record<Density, DensityValues>> = {};
  for (const [density, values] of Object.entries(defaultTheme.densities ?? {}) as [
    Density,
    Record<string, string>,
  ][]) {
    out[density] = Object.fromEntries(
      Object.entries(values)
        .filter(([token]) => token.startsWith('--slotted-control-'))
        .map(([token, value]) => [
          token,
          `${Math.round(change(token, Number.parseFloat(value), density) * 100) / 100}px`,
        ]),
    ) as DensityValues;
  }
  return out;
}

/** A theme's own Controls styles, as its catalogue entry names them. */
const own = (id: string) => controlStyle(catalogueTheme(id).controls);
/** The catalogue entry of `id`, which the definition below must match. */
const entry = (id: string): ThemeEntry => catalogueTheme(id);

/**
 * Precise — after Linear and Vercel's Geist: an instrument for people who
 * live in the product. Inter at 13 px with Linear's 510 and 590 weights,
 * headings drawn in a tight track; a 4 px rhythm a step tighter than the
 * library's; 32 px controls; 6 px corners on controls and 8 px on cards.
 * Lines are hairlines, cards stand on a hairline and no shadow, overlays on
 * Geist's ring-and-drop shadows. Fields are soft fills with no line until the
 * pointer finds them, and focus is Vercel's ring with a halo. Tabs are a
 * raised chip; tables have no head band and a muted head; badges set their
 * labels in the mono face. Motion is quick and decelerating. Indigo accent,
 * a cool neutral, dark grounds deeper than the library's.
 */
const preciseControls = own('nexora-precise');
const precise = extendTheme(
  defaultTheme,
  {
    seeds: {
      accent: '#5e6ad2',
      neutral: '#6b6e7d',
      success: '#26a269',
      info: '#3e8ed0',
      warning: '#e09b2d',
      danger: '#e5484d',
    },
    recipe: recipe(tints(['accent'], 0.75), {
      light: {
        '--slotted-border-subtle': relight('light', '--slotted-border-subtle', 0.918),
        '--slotted-surface-sunken': relight('light', '--slotted-surface-sunken', 0.962),
      },
      dark: {
        '--slotted-surface': relight('dark', '--slotted-surface', 0.165),
        '--slotted-surface-raised': relight('dark', '--slotted-surface-raised', 0.21),
        '--slotted-surface-sunken': relight('dark', '--slotted-surface-sunken', 0.14),
        '--slotted-border-subtle': relight('dark', '--slotted-border-subtle', 0.275),
      },
    }),
    base: {
      '--slotted-font-family-sans': fontFamily(entry('nexora-precise').body).stack,
      ...sizes([0.6875, 0.75, 0.8125, 0.875, 1, 1.125, 1.375, 1.75]),
      ...lineHeights([1.35, 1.4, 1.45, 1.45, 1.4, 1.33, 1.25, 1.15]),
      '--slotted-font-weight-medium': '510',
      '--slotted-font-weight-semibold': '590',
      '--slotted-control-font-weight': 'var(--slotted-font-weight-medium)',
      ...spaces([0.125, 0.25, 0.375, 0.5, 0.625, 0.875, 1, 1.25, 1.75, 2.25, 2.75, 3.5]),
      ...radii(3, 5, 6, 8),
      '--slotted-control-radius': 'var(--slotted-radius-md)',
      ...motion(['100ms', '160ms', '240ms'], {
        standard: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        enter: 'cubic-bezier(0.16, 1, 0.3, 1)',
        exit: 'cubic-bezier(0.7, 0, 0.84, 0)',
        emphasized: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }),
      '--slotted-selection-halo-opacity': '0.12',
      ...preciseControls.base,
    },
    schemes: {
      light: {
        ...shadows(
          '0 1px 1px rgb(0 0 0 / 0.04)',
          '0 0 0 1px rgb(0 0 0 / 0.06), 0 1px 2px rgb(0 0 0 / 0.05)',
          '0 0 0 1px rgb(0 0 0 / 0.08), 0 4px 8px -4px rgb(0 0 0 / 0.08), 0 16px 24px -8px rgb(0 0 0 / 0.08)',
          '0 0 0 1px rgb(0 0 0 / 0.08), 0 8px 16px -4px rgb(0 0 0 / 0.06), 0 24px 32px -8px rgb(0 0 0 / 0.1)',
          '0 1px 1px rgb(0 0 0 / 0.04)',
        ),
        '--slotted-scrim': 'rgb(10 10 14 / 0.32)',
        ...palette([
          '#5e6ad2',
          '#0d9bb5',
          '#e07b28',
          '#2e9d68',
          '#d64545',
          '#9b6ad6',
          '#c99a0e',
          '#6b7a90',
        ]),
      },
      dark: {
        ...shadows(
          '0 1px 1px rgb(0 0 0 / 0.3)',
          '0 0 0 1px rgb(255 255 255 / 0.06), 0 1px 2px rgb(0 0 0 / 0.4)',
          '0 0 0 1px rgb(255 255 255 / 0.08), 0 8px 16px -4px rgb(0 0 0 / 0.5)',
          '0 0 0 1px rgb(255 255 255 / 0.1), 0 24px 48px -12px rgb(0 0 0 / 0.7)',
          'none',
        ),
        '--slotted-scrim': 'rgb(0 0 0 / 0.6)',
        ...palette([
          '#8790e8',
          '#3fc8de',
          '#f2a35e',
          '#5ecf95',
          '#f07575',
          '#bb94f5',
          '#e8c14a',
          '#9aa6b8',
        ]),
      },
      'high-contrast': {
        ...palette([
          '#3e48a8',
          '#0b6f82',
          '#9a4d0f',
          '#1d6b46',
          '#a22b2b',
          '#6a3fae',
          '#7d5f00',
          '#4a5568',
        ]),
      },
    },
    densities: densities((token, px) => {
      if (token.includes('height')) return Math.max(24, px - 2);
      if (token.includes('padding-inline')) return px - 1;
      return px;
    }),
    components: {
      ...preciseControls.components,
      '--slotted-card-border-width': 'var(--slotted-border-width-thin)',
      '--slotted-card-border-color': 'var(--slotted-border-subtle)',
      '--slotted-card-shadow': 'none',
      '--slotted-card-shadow-hover': 'var(--slotted-shadow-sm)',
      '--slotted-card-padding-block': 'var(--slotted-space-7)',
      '--slotted-card-padding-inline': 'var(--slotted-space-7)',
      '--slotted-stat-card-border-width': 'var(--slotted-border-width-thin)',
      '--slotted-stat-card-shadow': 'none',
      '--slotted-stat-card-value-font-size': 'var(--slotted-font-size-3xl)',
      '--slotted-badge-radius': 'var(--slotted-radius-sm)',
      '--slotted-badge-font-family': 'var(--slotted-font-family-mono)',
      '--slotted-badge-font-weight': 'var(--slotted-font-weight-medium)',
      '--slotted-tabs-marker-color': 'transparent',
      '--slotted-tabs-hover-marker-color': 'transparent',
      '--slotted-tabs-track-color': 'transparent',
      '--slotted-tabs-selected-color': 'var(--slotted-text)',
      '--slotted-table-header-surface': 'transparent',
      '--slotted-table-border-color': 'var(--slotted-border-subtle)',
      '--slotted-table-row-min-block-size': '36px',
      '--slotted-alert-radius': 'var(--slotted-radius-md)',
      ...overlays('var(--slotted-radius-lg)', 'var(--slotted-shadow-md)', 'transparent'),
      '--slotted-dialog-radius': 'var(--slotted-radius-lg)',
      '--slotted-tooltip-radius': 'var(--slotted-radius-sm)',
      '--slotted-chart-bar-radius': 'var(--slotted-radius-xs)',
      '--slotted-chart-line-width': '1.5px',
      '--slotted-chart-marker-size': '6px',
      '--slotted-chart-grid-color': 'var(--slotted-border-subtle)',
    },
    rules: [
      ...preciseControls.rules,
      `[data-ui='tabs'][data-variant='line'] [data-part='item'][data-selected] {
  background-color: var(--slotted-surface-raised);
  border-radius: var(--slotted-control-radius);
  box-shadow: var(--slotted-shadow-sm);
}`,
      `[data-ui='page-header'] [data-part='heading'],
[data-ui='section'] [data-part='heading'] {
  letter-spacing: -0.015em;
}

[data-ui='table'] [data-part='column-header'] {
  color: var(--slotted-text-muted);
  font-weight: var(--slotted-font-weight-medium);
}

[data-ui='stat-card'] [data-part='value'] {
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}`,
    ],
    fonts: facesOf(entry('nexora-precise').body),
  },
  { name: 'nexora-precise' },
);

/**
 * Editorial — after Notion's pages and Stripe's documentation, set like a
 * printed paper: Source Serif 4 for running text at 16 px, Fraunces for the
 * headings on a wide scale, and Source Sans 3 for the controls, the labels
 * and the tables, the way a paper sets its furniture in a sans. The space is airy,
 * corners are 2 px, and there are no shadows on the page: a card is a
 * paper panel under an ink rule, and only overlays lift on a soft warm
 * shadow. Fields are ruled lines, as on a printed form, focus thickens the
 * rule in the ring's colour, and the primary button is outlined in ink.
 * Tabs underline in ink; the table head is set in spaced capitals over an
 * ink rule. A warm paper neutral tints every ground and line alike; the
 * accent is a deep teal, with claret in the palette. Motion is slow and
 * calm.
 */
const editorialControls = own('nexora-editorial');
const editorial = extendTheme(
  defaultTheme,
  {
    seeds: {
      accent: '#0d7680',
      neutral: '#8c7a66',
      success: '#3d7a3a',
      info: '#2f6f9f',
      warning: '#b7791f',
      danger: '#b0302a',
    },
    recipe: recipe(tinted(0.55, 0.65, 0.022), tints(['success', 'warning', 'danger'], 0.6), {
      light: {
        '--slotted-surface': relight('light', '--slotted-surface', 0.975),
        '--slotted-surface-raised': relight('light', '--slotted-surface-raised', 0.989),
        '--slotted-surface-sunken': relight('light', '--slotted-surface-sunken', 0.956),
        '--slotted-tone-secondary-subtle-hover': {
          ...seedRule('light', '--slotted-tone-secondary-subtle-hover'),
          l: 0.948,
          c: { scale: 0.65, max: 0.042 },
        },
        '--slotted-control-border-color': {
          ...seedRule('light', '--slotted-control-border-color'),
          l: 0.8,
          c: { scale: 0.65, max: 0.042 },
        },
      },
    }),
    base: {
      '--slotted-font-family-sans': fontFamily(entry('nexora-editorial').body).stack,
      '--slotted-font-family-heading': fontFamily(entry('nexora-editorial').heading).stack,
      ...sizes([0.75, 0.875, 1, 1.125, 1.375, 1.75, 2.25, 3]),
      ...lineHeights([1.45, 1.5, 1.6, 1.55, 1.35, 1.25, 1.15, 1.05]),
      '--slotted-control-letter-spacing': '0.01em',
      ...spaces([0.125, 0.25, 0.375, 0.5, 0.875, 1.25, 1.5, 2, 2.5, 3.25, 4, 5.5]),
      ...radii(1, 2, 2, 2),
      '--slotted-control-radius': 'var(--slotted-radius-sm)',
      ...motion(['180ms', '280ms', '420ms'], {
        standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
        enter: 'cubic-bezier(0.22, 1, 0.36, 1)',
        exit: 'cubic-bezier(0.4, 0, 1, 1)',
        emphasized: 'cubic-bezier(0.22, 1, 0.36, 1)',
      }),
      ...editorialControls.base,
    },
    schemes: {
      light: {
        ...shadows(
          'none',
          'none',
          '0 10px 28px -8px rgb(60 45 30 / 0.18)',
          '0 18px 48px -12px rgb(60 45 30 / 0.24)',
          'none',
        ),
        '--slotted-scrim': 'rgb(40 30 20 / 0.42)',
        ...palette([
          '#0d7680',
          '#990f3d',
          '#b7791f',
          '#4d7c5a',
          '#5a4a8a',
          '#c2662d',
          '#2f5f8f',
          '#8a7a66',
        ]),
      },
      dark: {
        ...shadows(
          'none',
          'none',
          '0 10px 28px -8px rgb(0 0 0 / 0.6)',
          '0 18px 48px -12px rgb(0 0 0 / 0.7)',
          'none',
        ),
        '--slotted-scrim': 'rgb(10 8 6 / 0.66)',
        ...palette([
          '#4fb3bd',
          '#e0708f',
          '#e0a84f',
          '#8fbf9a',
          '#a99ad6',
          '#e39563',
          '#7fa8d6',
          '#c4b5a2',
        ]),
      },
      'high-contrast': {
        ...palette([
          '#0a5a62',
          '#7a0c31',
          '#7a4f0e',
          '#2f5a3a',
          '#3f3270',
          '#8a4416',
          '#1f4570',
          '#5a4c3d',
        ]),
      },
    },
    densities: densities((token, px) => {
      if (token.includes('height')) return px + 2;
      if (token.includes('padding-inline')) return px + 4;
      if (token.includes('font-size')) return px + 1;
      return px;
    }),
    components: {
      ...editorialControls.components,
      '--slotted-typography-font-family': fontFamily(entry('nexora-editorial').prose!).stack,
      '--slotted-card-border-width': '0px',
      '--slotted-card-shadow': 'none',
      '--slotted-card-shadow-hover': 'none',
      '--slotted-card-background': 'var(--slotted-surface-raised)',
      '--slotted-card-radius': 'var(--slotted-radius-xs)',
      '--slotted-card-padding-block': 'var(--slotted-space-7)',
      '--slotted-card-padding-inline': 'var(--slotted-space-7)',
      '--slotted-card-region-gap': 'var(--slotted-space-5)',
      '--slotted-stat-card-border-width': '0px',
      '--slotted-stat-card-shadow': 'none',
      '--slotted-stat-card-radius': 'var(--slotted-radius-xs)',
      '--slotted-stat-card-padding-block': 'var(--slotted-space-6)',
      '--slotted-stat-card-padding-inline': 'var(--slotted-space-6)',
      '--slotted-stat-card-value-font-size': 'var(--slotted-font-size-3xl)',
      '--slotted-table-header-surface': 'transparent',
      '--slotted-table-border-color': 'var(--slotted-border-subtle)',
      '--slotted-table-border-color-strong': 'var(--slotted-text)',
      '--slotted-table-row-min-block-size': '48px',
      '--slotted-tabs-marker-color': 'var(--slotted-text)',
      '--slotted-tabs-hover-marker-color': 'var(--slotted-border-strong)',
      '--slotted-tabs-track-color': 'transparent',
      '--slotted-tabs-selected-color': 'var(--slotted-text)',
      '--slotted-badge-radius': 'var(--slotted-radius-xs)',
      '--slotted-alert-radius': 'var(--slotted-radius-sm)',
      '--slotted-alert-title-font-family': 'var(--slotted-font-family-heading)',
      '--slotted-dialog-title-font-family': 'var(--slotted-font-family-heading)',
      '--slotted-dialog-radius': 'var(--slotted-radius-sm)',
      ...overlays(
        'var(--slotted-radius-sm)',
        'var(--slotted-shadow-md)',
        'var(--slotted-border-subtle)',
      ),
      '--slotted-chart-bar-radius': 'var(--slotted-radius-xs)',
      '--slotted-chart-line-width': '1.5px',
      '--slotted-chart-grid-color': 'var(--slotted-border-subtle)',
    },
    rules: [
      ...editorialControls.rules,
      TAB_STYLES.underline.rule,
      `[data-ui='card']::before,
[data-ui='stat-card']::before {
  border-color: var(--slotted-text);
  border-radius: 0;
  border-width: var(--slotted-border-width-thick) 0 0;
}

[data-ui='page-header'] [data-part='heading'],
[data-ui='section'] [data-part='heading'] {
  font-weight: var(--slotted-font-weight-medium);
  letter-spacing: -0.01em;
}

[data-ui='table'] [data-part='column-header'] {
  font-size: var(--slotted-font-size-xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}`,
    ],
    fonts: facesOf(
      entry('nexora-editorial').prose!,
      entry('nexora-editorial').heading,
      entry('nexora-editorial').body,
    ),
  },
  { name: 'nexora-editorial' },
);

/**
 * Corporate — after GitHub's Primer and Atlassian's design system: a tool
 * for a working day of forms and tables. Source Sans 3 at 15 px, Primer's
 * 8 px rhythm, 40 px controls, 6 px corners. Fields are outlined in the
 * strong border, at 3:1 on the page, and an invalid edge is 2 px; focus is
 * a 2 px outline 4 px off the control. Cards and stat cards keep a line and
 * Primer's resting shadow; the table head is a sunken band in the full ink;
 * tabs underline in the accent on a track; badges are outlined pills;
 * overlays carry Primer's overlay shadow. Motion is short and ease-out.
 * Atlassian blue, a slate neutral, lines a step darker than the library's.
 */
const corporateControls = own('nexora-corporate');
const corporate = extendTheme(
  defaultTheme,
  {
    seeds: {
      accent: '#0c66e4',
      neutral: '#5e6c84',
      success: '#1f845a',
      info: '#1d7afc',
      warning: '#cf9f02',
      danger: '#c9372c',
    },
    recipe: recipe(tints(['accent'], 1.3), {
      light: {
        '--slotted-border-subtle': relight('light', '--slotted-border-subtle', 0.87),
        '--slotted-control-border-color': relight('light', '--slotted-control-border-color', 0.76),
        '--slotted-surface-sunken': relight('light', '--slotted-surface-sunken', 0.962),
      },
      dark: {
        '--slotted-border-subtle': relight('dark', '--slotted-border-subtle', 0.34),
        '--slotted-control-border-color': relight('dark', '--slotted-control-border-color', 0.44),
      },
    }),
    base: {
      '--slotted-font-family-sans': fontFamily(entry('nexora-corporate').body).stack,
      ...sizes([0.75, 0.875, 0.9375, 1.0625, 1.25, 1.5, 2, 2.5]),
      ...lineHeights([1.4, 1.45, 1.5, 1.5, 1.4, 1.3, 1.25, 1.2]),
      ...spaces([0.125, 0.25, 0.5, 0.625, 0.875, 1.125, 1.5, 1.75, 2.25, 2.75, 3.5, 4.5]),
      ...radii(3, 4, 6, 6),
      '--slotted-control-radius': 'var(--slotted-radius-md)',
      '--slotted-control-invalid-edge-width': 'var(--slotted-border-width-thick)',
      ...motion(['80ms', '160ms', '240ms'], {
        standard: 'cubic-bezier(0.33, 1, 0.68, 1)',
        enter: 'cubic-bezier(0.33, 1, 0.68, 1)',
        exit: 'cubic-bezier(0.32, 0, 0.67, 0)',
        emphasized: 'cubic-bezier(0.33, 1, 0.68, 1)',
      }),
      ...corporateControls.base,
    },
    schemes: {
      light: {
        ...shadows(
          '0 1px 0 rgb(31 35 40 / 0.04)',
          '0 1px 1px rgb(31 35 40 / 0.06), 0 1px 3px rgb(31 35 40 / 0.06)',
          '0 1px 1px rgb(37 41 46 / 0.08), 0 3px 6px rgb(37 41 46 / 0.12)',
          '0 0 0 1px rgb(209 217 224 / 1), 0 6px 12px -3px rgb(37 41 46 / 0.04), 0 6px 18px rgb(37 41 46 / 0.12)',
          '0 1px 0 rgb(31 35 40 / 0.04)',
        ),
        '--slotted-scrim': 'rgb(9 30 66 / 0.54)',
        ...palette([
          '#0c66e4',
          '#1f845a',
          '#cf6b00',
          '#8f3fbf',
          '#c9372c',
          '#0e7c86',
          '#a54800',
          '#626f86',
        ]),
      },
      dark: {
        ...shadows(
          '0 1px 0 rgb(1 4 9 / 0.4)',
          '0 1px 1px rgb(1 4 9 / 0.5), 0 1px 3px rgb(1 4 9 / 0.5)',
          '0 1px 1px rgb(1 4 9 / 0.6), 0 3px 6px rgb(1 4 9 / 0.6)',
          '0 0 0 1px rgb(61 68 77 / 1), 0 8px 24px rgb(1 4 9 / 0.75)',
          '0 1px 0 rgb(1 4 9 / 0.4)',
        ),
        '--slotted-scrim': 'rgb(1 4 9 / 0.7)',
        ...palette([
          '#579dff',
          '#4bce97',
          '#fea362',
          '#c97cf4',
          '#f87168',
          '#60c6d2',
          '#f5cd47',
          '#8c9bab',
        ]),
      },
      'high-contrast': {
        ...palette([
          '#0747a6',
          '#14593d',
          '#8a4700',
          '#5e2a85',
          '#8f241c',
          '#0a5a61',
          '#6e3000',
          '#3d4759',
        ]),
      },
    },
    densities: densities((token, px, density) => {
      const step = { comfortable: 6, compact: 4, dense: 2 }[density];
      if (token.includes('height')) return px + step;
      if (token.includes('padding-inline')) return px + 3;
      if (token.includes('font-size')) return px + 1;
      if (token.includes('icon-size')) return px + 1;
      return px;
    }),
    components: {
      ...corporateControls.components,
      ...fields('border-color', 'var(--slotted-border-strong)'),
      '--slotted-card-border-width': 'var(--slotted-border-width-thin)',
      '--slotted-card-border-color': 'var(--slotted-border-subtle)',
      '--slotted-card-shadow': 'var(--slotted-shadow-xs)',
      '--slotted-card-shadow-hover': 'var(--slotted-shadow-sm)',
      '--slotted-card-padding-block': 'var(--slotted-space-6)',
      '--slotted-card-padding-inline': 'var(--slotted-space-6)',
      '--slotted-stat-card-border-width': 'var(--slotted-border-width-thin)',
      '--slotted-stat-card-shadow': 'var(--slotted-shadow-xs)',
      '--slotted-stat-card-label-font-size': 'var(--slotted-font-size-sm)',
      '--slotted-table-header-surface': 'var(--slotted-surface-sunken)',
      '--slotted-table-header-surface-hover': 'var(--slotted-tone-secondary-subtle-hover)',
      '--slotted-table-border-color': 'var(--slotted-border-subtle)',
      '--slotted-table-border-color-strong': 'var(--slotted-border-strong)',
      '--slotted-table-row-min-block-size': '40px',
      '--slotted-table-radius': 'var(--slotted-radius-lg)',
      ...TAB_STYLES.underline.components,
      '--slotted-tabs-selected-color': 'var(--slotted-text)',
      '--slotted-badge-radius': 'var(--slotted-radius-full)',
      '--slotted-badge-border-width': 'var(--slotted-border-width-thin)',
      '--slotted-alert-radius': 'var(--slotted-radius-md)',
      '--slotted-alert-border-width': 'var(--slotted-border-width-thin)',
      ...overlays('var(--slotted-radius-lg)', 'var(--slotted-shadow-lg)', 'transparent'),
      '--slotted-dialog-radius': 'var(--slotted-radius-lg)',
      '--slotted-chart-bar-radius': 'var(--slotted-radius-xs)',
      '--slotted-chart-line-width': '2px',
    },
    rules: [
      ...corporateControls.rules,
      TAB_STYLES.underline.rule,
      `[data-ui='table'] [data-part='column-header'] {
  color: var(--slotted-text);
  font-weight: var(--slotted-font-weight-semibold);
}`,
    ],
    fonts: facesOf(entry('nexora-corporate').body),
  },
  { name: 'nexora-corporate' },
);

/**
 * Expressive — after Material 3 Expressive and Apple's platform language:
 * Outfit at 15 px on a rounded geometry. Buttons are pills at 40 px with
 * Material's 500 labels; fields are Material's filled field, a tonal fill
 * with 12 px top corners over an indicator line that thickens on focus;
 * focus elsewhere is Material's 3 px ring 2 px off the control. Corners run
 * 8, 12, 16 and 24 px: cards at 16, dialogs at 24. Cards float on
 * Material's level-one shadow over the raised ground, stat
 * cards are tonal panels of the accent, tabs are pills, table rows are
 * 52 px. Motion is long and springs past its mark; a pressed button sinks
 * to 96 %. A magenta accent over a rose-grey neutral, with Material's own
 * success, warning and error hues.
 */
const expressiveControls = own('nexora-expressive');
const expressive = extendTheme(
  defaultTheme,
  {
    seeds: {
      accent: '#c0267a',
      neutral: '#7a6e74',
      success: '#188038',
      info: '#1a73e8',
      warning: '#f29900',
      danger: '#d93025',
    },
    recipe: recipe(tinted(0.5, 0.6, 0.02), tints(['accent'], 1.6)),
    base: {
      '--slotted-font-family-sans': fontFamily(entry('nexora-expressive').body).stack,
      ...sizes([0.75, 0.875, 0.9375, 1.0625, 1.25, 1.5, 1.875, 2.375]),
      ...lineHeights([1.45, 1.45, 1.5, 1.5, 1.4, 1.33, 1.27, 1.2]),
      '--slotted-control-font-weight': 'var(--slotted-font-weight-medium)',
      '--slotted-control-letter-spacing': '0.01em',
      ...spaces([0.125, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5]),
      ...radii(8, 12, 16, 24),
      '--slotted-control-radius': 'var(--slotted-radius-full)',
      ...motion(['200ms', '350ms', '500ms'], {
        standard: 'cubic-bezier(0.2, 0, 0, 1)',
        enter: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
        exit: 'cubic-bezier(0.3, 0, 0.8, 0.15)',
        emphasized: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      }),
      '--slotted-selection-halo-opacity': '0.16',
      ...expressiveControls.base,
      '--slotted-focus-ring-width':
        'calc(var(--slotted-border-width-thick) + var(--slotted-border-width-thin))',
    },
    schemes: {
      light: {
        ...shadows(
          '0 1px 2px rgb(0 0 0 / 0.12)',
          '0 1px 2px rgb(0 0 0 / 0.16), 0 1px 3px 1px rgb(0 0 0 / 0.08)',
          '0 1px 2px rgb(0 0 0 / 0.16), 0 2px 6px 2px rgb(0 0 0 / 0.08)',
          '0 1px 3px rgb(0 0 0 / 0.16), 0 4px 8px 3px rgb(0 0 0 / 0.08)',
          'none',
        ),
        '--slotted-scrim': 'rgb(30 20 26 / 0.4)',
        ...palette([
          '#c0267a',
          '#6750a4',
          '#00897b',
          '#f29900',
          '#1a73e8',
          '#e8710a',
          '#188038',
          '#9334e6',
        ]),
      },
      dark: {
        ...shadows(
          '0 1px 2px rgb(0 0 0 / 0.4)',
          '0 1px 2px rgb(0 0 0 / 0.5), 0 1px 3px 1px rgb(0 0 0 / 0.3)',
          '0 1px 2px rgb(0 0 0 / 0.5), 0 2px 6px 2px rgb(0 0 0 / 0.3)',
          '0 1px 3px rgb(0 0 0 / 0.5), 0 4px 8px 3px rgb(0 0 0 / 0.3)',
          'none',
        ),
        '--slotted-scrim': 'rgb(12 8 10 / 0.62)',
        ...palette([
          '#f48fbf',
          '#b69df8',
          '#4fd1c5',
          '#fdd663',
          '#8ab4f8',
          '#fcad70',
          '#81c995',
          '#d7aefb',
        ]),
      },
      'high-contrast': {
        ...palette([
          '#8c1257',
          '#4a3880',
          '#00665b',
          '#8a5600',
          '#1254b8',
          '#9c4a05',
          '#0f5c27',
          '#6a1fb0',
        ]),
      },
    },
    densities: densities((token, px, density) => {
      const step = { comfortable: 6, compact: 4, dense: 2 }[density];
      if (token.includes('height')) return px + step;
      if (token.includes('padding-inline')) return px + 8;
      if (token.includes('font-size')) return px + 1;
      if (token.includes('gap')) return px + 2;
      return px;
    }),
    components: {
      ...expressiveControls.components,
      ...fields('radius', 'var(--slotted-radius-sm)'),
      '--slotted-card-border-width': '0px',
      '--slotted-card-shadow': 'var(--slotted-shadow-sm)',
      '--slotted-card-shadow-hover': 'var(--slotted-shadow-md)',
      '--slotted-card-background': 'var(--slotted-surface-raised)',
      '--slotted-card-radius': 'var(--slotted-radius-md)',
      '--slotted-card-padding-block': 'var(--slotted-space-6)',
      '--slotted-card-padding-inline': 'var(--slotted-space-6)',
      '--slotted-stat-card-border-width': '0px',
      '--slotted-stat-card-shadow': 'none',
      '--slotted-stat-card-background': 'var(--slotted-tone-accent-surface)',
      '--slotted-stat-card-radius': 'var(--slotted-radius-md)',
      '--slotted-stat-card-padding-block': 'var(--slotted-space-6)',
      '--slotted-stat-card-padding-inline': 'var(--slotted-space-6)',
      '--slotted-table-header-surface': 'transparent',
      '--slotted-table-border-color': 'var(--slotted-border-subtle)',
      '--slotted-table-row-min-block-size': '52px',
      '--slotted-table-radius': 'var(--slotted-radius-md)',
      ...TAB_STYLES.pill.components,
      '--slotted-tabs-selected-color': 'var(--slotted-tone-accent-text)',
      '--slotted-badge-radius': 'var(--slotted-radius-full)',
      '--slotted-badge-font-weight': 'var(--slotted-font-weight-medium)',
      '--slotted-alert-radius': 'var(--slotted-radius-md)',
      '--slotted-alert-border-width': '0px',
      ...overlays('var(--slotted-radius-md)', 'var(--slotted-shadow-lg)', 'transparent'),
      '--slotted-dialog-radius': 'var(--slotted-radius-lg)',
      '--slotted-tooltip-radius': 'var(--slotted-radius-xs)',
      '--slotted-chart-bar-radius': 'var(--slotted-radius-xs)',
      '--slotted-chart-line-width': '3px',
      '--slotted-chart-marker-size': '10px',
      '--slotted-chart-card-radius': 'var(--slotted-radius-md)',
    },
    rules: [
      ...expressiveControls.rules,
      TAB_STYLES.pill.rule,
      `[data-ui='button']:active:not(:disabled):not([data-disabled]) {
  transform: scale(0.96);
}`,
    ],
    fonts: facesOf(entry('nexora-expressive').body),
  },
  { name: 'nexora-expressive' },
);

const THEMES: Readonly<Record<string, Theme>> = {
  [DEFAULT_THEME_ID]: defaultTheme,
  'nexora-precise': precise,
  'nexora-editorial': editorial,
  'nexora-corporate': corporate,
  'nexora-expressive': expressive,
};

/** The definition of a catalogue theme, or the default's when the catalogue no longer has it. */
export function nexoraTheme(id: string): Theme {
  return THEMES[catalogueTheme(id).id]!;
}

/** Compiles a runtime theme's sheet into `document`; the returned function removes it. */
export function applyNexoraTheme(id: string, document: Document): () => void {
  return applyTheme(nexoraTheme(id), { document });
}
