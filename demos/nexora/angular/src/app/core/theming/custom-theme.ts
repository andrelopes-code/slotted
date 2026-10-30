import {
  applyTheme,
  extendTheme,
  type Density,
  type FontFaceDefinition,
  type Theme,
  type ThemeOverrides,
} from '@slotted/theme';
import defaultTheme from '@slotted/themes/default';

import {
  buttonRules,
  FIELD_FAMILIES,
  fieldRules,
  FOCUS_TOKENS,
  inputTokens,
  TAB_STYLES,
} from './control-styles';
import type { Customization, FontId, LabelSpacingChoice, LabelWeightChoice } from './customization';
import { nexoraTheme } from './nexora-themes';
import { facesOf, fontFamily } from './theme-faces';
import { catalogueTheme, DEFAULT_THEME_ID } from './theme-catalogue';

/**
 * The builder: a customization is compiled into a theme by `extendTheme` on
 * the chosen catalogue theme, so the result is a theme of the same shape as
 * the five it starts from, validated against the same contract and written
 * by the same `renderTheme`. Each axis writes one set of entries, at the
 * level of the model it belongs to:
 *
 * | axis | level | entries |
 * | --- | --- | --- |
 * | radius | base, components | `--slotted-radius-xs…lg` as ¼, ½, ¾ and 1 of the value; `--slotted-control-radius`; the corner of every family a theme sets |
 * | body | base, components, fonts | `--slotted-font-family-sans`, `--slotted-control-font-family`, the faces of the badge, the table and running text; the family's `@font-face` |
 * | heading | base, components, fonts | `--slotted-font-family-heading`, the alert title's face; the family's `@font-face` |
 * | scale | base, densities | `--slotted-font-size-xs…4xl` and each density's `--slotted-control-font-size-*`, as a share of the library's |
 * | border | base, components | `--slotted-border-width-thin`, `-medium`, `-thick`, `--slotted-control-border-width`, the families' own line widths |
 * | shadow | schemes | per light and dark scheme, `--slotted-shadow-xs…lg` and `--slotted-control-shadow`; high contrast keeps its rings |
 * | motion | base | `--slotted-duration-*` and the easings |
 * | cards | components | the card's and the stat card's line, shadow and ground |
 * | tabs | components, rules | the tabs' marker and track, and a rule on the selected item (`TAB_STYLES`) |
 * | chart | components | `--slotted-chart-color-1…8` |
 * | input | components, rules | each field family's ground, line, hover line and shadow; the frame's edges and corners and the invalid edge |
 * | focus | base, rules | `--slotted-focus-ring-width` and `-offset`; a field's and a button's focus mark |
 * | button | rules | the primary button's paint at rest, under the pointer and pressed |
 * | controlRadius | base, components | `--slotted-control-radius`; every field family's corner, the toggle's and the segmented control's |
 * | cardRadius | components | the corner of cards, stat cards, chart cards, tables, data grids and alerts |
 * | overlayRadius | components | the corner of dialogs, drawers, popovers, menus, the select families' panels, tooltips, hover cards, toasts and the command palette |
 * | controlBorder | base | `--slotted-control-border-width`, as the scale's thin or thick line |
 * | labelWeight | base | `--slotted-control-font-weight`, on the theme's weight scale |
 * | labelSpacing | base | `--slotted-control-letter-spacing` |
 * | controlText | densities | each density's `--slotted-control-font-size-*`, moved by the value |
 * | controlHeight | densities | each density's `--slotted-control-height-*`, moved by the value, never below 24 px |
 *
 * An axis writes the whole set, whatever the theme under it declared: a
 * corner the theme set on one family follows the slider too. The input,
 * focus and button axes write their rules for the three styles in effect —
 * each one the reader's, or the theme's own — after the theme's own rules.
 */

type Base = NonNullable<ThemeOverrides['base']>;
type Components = NonNullable<ThemeOverrides['components']>;
type SchemeValues = NonNullable<NonNullable<ThemeOverrides['schemes']>['light']>;
type DensityValues = NonNullable<NonNullable<ThemeOverrides['densities']>[Density]>;
type Densities = Partial<Record<Density, Record<string, string>>>;

const LIBRARY = defaultTheme.base as Readonly<Record<string, string>>;
const SIZE_STEPS = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'] as const;
const DENSITIES = ['comfortable', 'compact', 'dense'] as const;
const round = (value: number) => Math.round(value * 10_000) / 10_000;
/** The contract's floor: no control is shorter than a 24 px target (WCAG 2.5.8). */
const TARGET_FLOOR = 24;

function radius(px: number): { base: Base; components: Components } {
  return {
    base: {
      '--slotted-radius-xs': `${round(px / 4)}px`,
      '--slotted-radius-sm': `${round(px / 2)}px`,
      '--slotted-radius-md': `${round((px * 3) / 4)}px`,
      '--slotted-radius-lg': `${px}px`,
      '--slotted-control-radius': 'var(--slotted-radius-sm)',
    },
    components: {
      '--slotted-card-radius': 'var(--slotted-radius-lg)',
      '--slotted-stat-card-radius': 'var(--slotted-radius-lg)',
      '--slotted-chart-card-radius': 'var(--slotted-radius-lg)',
      '--slotted-chart-bar-radius': 'var(--slotted-radius-sm)',
      '--slotted-badge-radius': 'var(--slotted-radius-sm)',
      '--slotted-table-radius': 'var(--slotted-radius-md)',
      '--slotted-alert-radius': 'var(--slotted-radius-md)',
      '--slotted-select-content-radius': 'var(--slotted-radius-lg)',
    },
  };
}

function body(id: FontId): { base: Base; components: Components; fonts: FontFaceDefinition[] } {
  return {
    base: {
      '--slotted-font-family-sans': fontFamily(id).stack,
      '--slotted-control-font-family': 'var(--slotted-font-family-sans)',
    },
    components: {
      '--slotted-badge-font-family': 'var(--slotted-control-font-family)',
      '--slotted-table-font-family': 'var(--slotted-control-font-family)',
      '--slotted-typography-font-family': 'var(--slotted-font-family-sans)',
    },
    fonts: facesOf(id),
  };
}

function heading(id: FontId): {
  base: Base;
  components: Components;
  fonts: FontFaceDefinition[];
} {
  return {
    base: { '--slotted-font-family-heading': fontFamily(id).stack },
    components: {
      '--slotted-alert-title-font-family': 'var(--slotted-font-family-heading)',
      '--slotted-dialog-title-font-family': 'var(--slotted-font-family-heading)',
    },
    fonts: facesOf(id),
  };
}

/** Each density's control pixel values the theme draws with: its own, else the library's. */
function themeDensities(theme: Theme): Densities {
  return Object.fromEntries(
    DENSITIES.map((density) => [
      density,
      {
        ...(defaultTheme.densities?.[density] as Readonly<Record<string, string>>),
        ...((theme.densities?.[density] ?? {}) as Readonly<Record<string, string>>),
      },
    ]),
  ) as Densities;
}

function scale(percent: number): { base: Base; densities: Densities } {
  const factor = percent / 100;
  const base = Object.fromEntries(
    SIZE_STEPS.map((step) => {
      const token = `--slotted-font-size-${step}`;
      return [token, `${round(Number.parseFloat(LIBRARY[token]!) * factor)}rem`];
    }),
  ) as Base;
  const densities = Object.fromEntries(
    Object.entries(defaultTheme.densities ?? {}).map(([density, values]) => [
      density,
      Object.fromEntries(
        Object.entries(values as Record<string, string>)
          .filter(([token]) => token.startsWith('--slotted-control-font-size-'))
          .map(([token, value]) => [token, `${round(Number.parseFloat(value) * factor)}px`]),
      ),
    ]),
  ) as Densities;
  return { base, densities };
}

/**
 * The control tokens of `prefix` in every density, each moved by `px` from
 * the value it holds so far — the scale axis's when it wrote one, the
 * theme's otherwise — and kept at `floor` or above.
 */
function moved(current: Densities, prefix: string, px: number, floor = 0): Densities {
  return Object.fromEntries(
    DENSITIES.map((density) => [
      density,
      Object.fromEntries(
        Object.entries(current[density] ?? {})
          .filter(([token]) => token.startsWith(prefix))
          .map(([token, value]) => [
            token,
            `${round(Math.max(floor, Number.parseFloat(value) + px))}px`,
          ]),
      ),
    ]),
  ) as Densities;
}

function border(px: number): { base: Base; components: Components } {
  return {
    base: {
      '--slotted-border-width-thin': `${px}px`,
      '--slotted-border-width-medium': `${px === 1 ? 1.5 : px}px`,
      '--slotted-border-width-thick': `${px + 1}px`,
      '--slotted-control-border-width': 'var(--slotted-border-width-thin)',
    },
    components: {
      '--slotted-badge-border-width': 'var(--slotted-border-width-thin)',
      '--slotted-alert-border-width': 'var(--slotted-border-width-thin)',
      '--slotted-table-border-width': 'var(--slotted-border-width-thin)',
    },
  };
}

const NO_SHADOW: SchemeValues = {
  '--slotted-shadow-xs': 'none',
  '--slotted-shadow-sm': 'none',
  '--slotted-shadow-md': 'none',
  '--slotted-shadow-lg': 'none',
  '--slotted-control-shadow': 'none',
};
const STRONG_SHADOW: Readonly<Record<'light' | 'dark', SchemeValues>> = {
  light: {
    '--slotted-shadow-xs': '0 1px 3px rgb(15 23 42 / 0.14)',
    '--slotted-shadow-sm': '0 3px 8px -1px rgb(15 23 42 / 0.18), 0 1px 3px rgb(15 23 42 / 0.12)',
    '--slotted-shadow-md':
      '0 12px 24px -6px rgb(15 23 42 / 0.25), 0 4px 8px -4px rgb(15 23 42 / 0.15)',
    '--slotted-shadow-lg':
      '0 24px 48px -12px rgb(15 23 42 / 0.35), 0 8px 16px -8px rgb(15 23 42 / 0.20)',
    '--slotted-control-shadow': '0 2px 4px rgb(15 23 42 / 0.14)',
  },
  dark: {
    '--slotted-shadow-xs': '0 1px 3px rgb(0 0 0 / 0.55)',
    '--slotted-shadow-sm': '0 3px 8px -1px rgb(0 0 0 / 0.65), 0 1px 3px rgb(0 0 0 / 0.5)',
    '--slotted-shadow-md': '0 12px 24px -6px rgb(0 0 0 / 0.75), 0 4px 8px -4px rgb(0 0 0 / 0.55)',
    '--slotted-shadow-lg': '0 24px 48px -12px rgb(0 0 0 / 0.85), 0 8px 16px -8px rgb(0 0 0 / 0.6)',
    '--slotted-control-shadow': '0 2px 4px rgb(0 0 0 / 0.6)',
  },
};
const SHADOW_TOKENS = Object.keys(NO_SHADOW);

function shadow(choice: NonNullable<Customization['shadow']>): ThemeOverrides['schemes'] {
  const values = (scheme: 'light' | 'dark'): SchemeValues => {
    if (choice === 'none') return NO_SHADOW;
    if (choice === 'strong') return STRONG_SHADOW[scheme];
    const library = defaultTheme.schemes?.[scheme] as Readonly<Record<string, string>>;
    return Object.fromEntries(
      SHADOW_TOKENS.map((token) => [token, library[token]!]),
    ) as SchemeValues;
  };
  return { light: values('light'), dark: values('dark') };
}

function motion(choice: NonNullable<Customization['motion']>): Base {
  const library = (token: string) => LIBRARY[token]!;
  if (choice === 'off') {
    return {
      '--slotted-duration-instant': '1ms',
      '--slotted-duration-short': '1ms',
      '--slotted-duration-medium': '1ms',
      '--slotted-duration-long': '1ms',
    };
  }
  const easings = {
    '--slotted-easing-standard': library('--slotted-easing-standard'),
    '--slotted-easing-exit': library('--slotted-easing-exit'),
  };
  if (choice === 'reduced') {
    return {
      '--slotted-duration-short': '60ms',
      '--slotted-duration-medium': '100ms',
      '--slotted-duration-long': '160ms',
      ...easings,
      '--slotted-easing-enter': 'var(--slotted-easing-standard)',
      '--slotted-easing-emphasized': 'var(--slotted-easing-standard)',
    };
  }
  return {
    ...Object.fromEntries(
      ['instant', 'short', 'medium', 'long'].map((step) => [
        `--slotted-duration-${step}`,
        library(`--slotted-duration-${step}`),
      ]),
    ),
    ...easings,
    '--slotted-easing-enter': library('--slotted-easing-enter'),
    '--slotted-easing-emphasized': library('--slotted-easing-emphasized'),
  };
}

function cards(choice: NonNullable<Customization['cards']>): Components {
  const line = choice === 'bordered' ? 'var(--slotted-border-width-thin)' : '0px';
  const rest = choice === 'elevated' ? 'var(--slotted-shadow-md)' : 'none';
  const ground =
    choice === 'flat' ? 'var(--slotted-surface-sunken)' : 'var(--slotted-surface-raised)';
  return {
    '--slotted-card-border-width': line,
    '--slotted-card-border-color': 'var(--slotted-border-subtle)',
    '--slotted-card-shadow': rest,
    '--slotted-card-shadow-hover':
      choice === 'elevated'
        ? 'var(--slotted-shadow-lg)'
        : choice === 'flat'
          ? 'none'
          : 'var(--slotted-shadow-xs)',
    '--slotted-card-background': ground,
    '--slotted-stat-card-border-width': line,
    '--slotted-stat-card-border-color': 'var(--slotted-border-subtle)',
    '--slotted-stat-card-shadow': rest,
    '--slotted-stat-card-background': ground,
  };
}

const ACCENT_SERIES = [
  'var(--slotted-tone-accent-solid)',
  'color-mix(in oklch, var(--slotted-tone-accent-solid) 55%, var(--slotted-surface))',
  'var(--slotted-tone-accent-text)',
  'color-mix(in oklch, var(--slotted-tone-accent-solid) 30%, var(--slotted-surface))',
  'var(--slotted-tone-accent-border)',
  'color-mix(in oklch, var(--slotted-tone-accent-text) 60%, var(--slotted-surface))',
  'var(--slotted-text-muted)',
  'var(--slotted-border-strong)',
];

function chart(choice: NonNullable<Customization['chart']>): Components {
  return Object.fromEntries(
    ACCENT_SERIES.map((accent, index) => [
      `--slotted-chart-color-${index + 1}`,
      choice === 'accent' ? accent : `var(--slotted-data-${index + 1})`,
    ]),
  ) as Components;
}

/** A corner in px, or the pill. */
const corner = (px: number) => (px >= 9999 ? 'var(--slotted-radius-full)' : `${px}px`);
/**
 * The control corner, a semantic token: the contract has it name a
 * primitive, so a corner in px is laid on the none corner.
 */
const controlCorner = (px: number) =>
  px >= 9999
    ? 'var(--slotted-radius-full)'
    : px === 0
      ? 'var(--slotted-radius-none)'
      : `calc(var(--slotted-radius-none) + ${px}px)`;

/** The families whose corner the control radius moves, beside `--slotted-control-radius`. */
export const CONTROL_RADIUS_TOKENS = [
  ...FIELD_FAMILIES.map(({ ui }) => `--slotted-${ui}-radius`),
  '--slotted-toggle-radius',
  '--slotted-segmented-control-radius',
] as const;
/** The surfaces a card radius moves. */
export const CARD_RADIUS_TOKENS = [
  '--slotted-card-radius',
  '--slotted-stat-card-radius',
  '--slotted-chart-card-radius',
  '--slotted-table-radius',
  '--slotted-data-grid-radius',
  '--slotted-alert-radius',
] as const;
/** The layers an overlay radius moves. */
export const OVERLAY_RADIUS_TOKENS = [
  '--slotted-dialog-radius',
  '--slotted-drawer-radius',
  '--slotted-popover-radius',
  '--slotted-menu-radius',
  '--slotted-select-content-radius',
  '--slotted-combobox-content-radius',
  '--slotted-multi-select-content-radius',
  '--slotted-date-picker-content-radius',
  '--slotted-tooltip-radius',
  '--slotted-hover-card-radius',
  '--slotted-toast-radius',
  '--slotted-command-palette-radius',
] as const;

const every = (tokens: readonly string[], value: string): Components =>
  Object.fromEntries(tokens.map((token) => [token, value])) as Components;

/** A label weight on the theme's weight scale; bold is a hundred over its semibold. */
export const LABEL_WEIGHT: Readonly<Record<LabelWeightChoice, string>> = {
  400: 'var(--slotted-font-weight-regular)',
  500: 'var(--slotted-font-weight-medium)',
  600: 'var(--slotted-font-weight-semibold)',
  700: 'calc(var(--slotted-font-weight-semibold) + 100)',
};

export const LABEL_SPACING: Readonly<Record<LabelSpacingChoice, string>> = {
  tight: '-0.01em',
  normal: '0em',
  wide: '0.02em',
  wider: '0.05em',
};

/**
 * The overrides a customization writes over the catalogue theme `themeId`;
 * an axis left to the theme writes nothing.
 */
export function customOverrides(
  customization: Customization,
  themeId: string = DEFAULT_THEME_ID,
): ThemeOverrides {
  const base: Record<string, string> = {};
  const components: Record<string, string> = {};
  const fonts: FontFaceDefinition[] = [];
  const rules: string[] = [];
  let schemes: ThemeOverrides['schemes'];
  let densities: Densities | undefined;
  const theme = nexoraTheme(themeId);
  const own = catalogueTheme(themeId).controls;

  if (customization.radius !== null) {
    const written = radius(customization.radius);
    Object.assign(base, written.base);
    Object.assign(components, written.components);
  }
  for (const written of [
    customization.body === null ? null : body(customization.body),
    customization.heading === null ? null : heading(customization.heading),
  ]) {
    if (written === null) continue;
    Object.assign(base, written.base);
    Object.assign(components, written.components);
    fonts.push(...written.fonts.filter((face) => !fonts.includes(face)));
  }
  if (customization.scale !== null) {
    const written = scale(customization.scale);
    Object.assign(base, written.base);
    densities = written.densities;
  }
  if (customization.border !== null) {
    const written = border(customization.border);
    Object.assign(base, written.base);
    Object.assign(components, written.components);
  }
  if (customization.shadow !== null) schemes = shadow(customization.shadow);
  if (customization.motion !== null) Object.assign(base, motion(customization.motion));
  if (customization.cards !== null) Object.assign(components, cards(customization.cards));
  if (customization.tabs !== null) {
    Object.assign(components, TAB_STYLES[customization.tabs].components);
    rules.push(TAB_STYLES[customization.tabs].rule);
  }
  if (customization.chart !== null) Object.assign(components, chart(customization.chart));

  // Controls.
  const input = customization.input ?? own.input;
  const focus = customization.focus ?? own.focus;
  const button = customization.button ?? own.button;
  if (customization.input !== null) Object.assign(components, inputTokens(customization.input));
  if (customization.focus !== null) Object.assign(base, FOCUS_TOKENS[customization.focus]);
  if (customization.input !== null || customization.focus !== null) {
    rules.push(...fieldRules(input, focus));
  }
  if (customization.button !== null || customization.focus !== null) {
    rules.push(...buttonRules(button, focus));
  }
  if (customization.controlRadius !== null) {
    base['--slotted-control-radius'] = controlCorner(customization.controlRadius);
    Object.assign(components, every(CONTROL_RADIUS_TOKENS, 'var(--slotted-control-radius)'));
  }
  if (customization.cardRadius !== null) {
    Object.assign(components, every(CARD_RADIUS_TOKENS, corner(customization.cardRadius)));
  }
  if (customization.overlayRadius !== null) {
    Object.assign(components, every(OVERLAY_RADIUS_TOKENS, corner(customization.overlayRadius)));
  }
  if (customization.controlBorder !== null) {
    base['--slotted-control-border-width'] =
      customization.controlBorder === 1
        ? 'var(--slotted-border-width-thin)'
        : 'var(--slotted-border-width-thick)';
  }
  if (customization.labelWeight !== null) {
    base['--slotted-control-font-weight'] = LABEL_WEIGHT[customization.labelWeight];
  }
  if (customization.labelSpacing !== null) {
    base['--slotted-control-letter-spacing'] = LABEL_SPACING[customization.labelSpacing];
  }
  if (customization.controlText !== null || customization.controlHeight !== null) {
    const current = themeDensities(theme);
    for (const density of DENSITIES) Object.assign(current[density]!, densities?.[density] ?? {});
    const merge = (written: Densities) => {
      densities ??= {};
      for (const density of DENSITIES) {
        densities[density] = { ...densities[density], ...written[density] };
      }
    };
    if (customization.controlText !== null) {
      merge(moved(current, '--slotted-control-font-size-', customization.controlText, 1));
    }
    if (customization.controlHeight !== null) {
      merge(moved(current, '--slotted-control-height-', customization.controlHeight, TARGET_FLOOR));
    }
  }

  const overrides: { -readonly [K in keyof ThemeOverrides]: ThemeOverrides[K] } = {};
  if (Object.keys(base).length > 0) overrides.base = base as Base;
  if (Object.keys(components).length > 0) overrides.components = components as Components;
  if (fonts.length > 0) overrides.fonts = fonts;
  if (rules.length > 0) overrides.rules = rules;
  if (schemes !== undefined) overrides.schemes = schemes;
  if (densities !== undefined) {
    overrides.densities = densities as Partial<Record<Density, DensityValues>>;
  }
  return overrides;
}

/** The theme a customization of a catalogue theme compiles to, under `name`. */
export function customTheme(themeId: string, customization: Customization, name: string): Theme {
  return extendTheme(nexoraTheme(themeId), customOverrides(customization, themeId), { name });
}

/**
 * Compiles a customization into `document` under `name`. A second call with
 * the same name replaces the sheet in place (`applyTheme`); the returned
 * function removes it while this call is still the latest.
 */
export function applyCustomTheme(
  themeId: string,
  customization: Customization,
  name: string,
  document: Document,
): { readonly theme: Theme; readonly dispose: () => void } {
  const theme = customTheme(themeId, customization, name);
  return { theme, dispose: applyTheme(theme, { document }) };
}
