import { SCHEMES, SEED_NAMES, type Theme } from '@slotted/theme';
import defaultTheme from '@slotted/themes/default';

import { customOverrides } from './custom-theme';
import {
  customizedAxes,
  NO_CUSTOMISATION,
  type Customization,
  type CustomizationAxis,
} from './customization';

/**
 * A theme read layer by layer, against the library's own theme: what each
 * layer of the object declares that the library's does not. The appearance
 * section draws it for the theme a reader chose and for the theme the builder
 * compiled, which is one more object of the same shape.
 */
export const ANATOMY_LAYERS = [
  'seeds',
  'recipe',
  'base',
  'schemes',
  'densities',
  'motion',
  'components',
  'rules',
  'fonts',
] as const;
export type AnatomyLayerId = (typeof ANATOMY_LAYERS)[number];

export interface AnatomyLayer {
  readonly id: AnatomyLayerId;
  /**
   * How many entries of the layer differ from the library's theme; the seeds
   * are always five. `base` holds the scales, `motion` the durations and
   * easings of `base` with `reducedMotion`.
   */
  readonly count: number;
  /** The entries, short: a seed and its color, a token's name, a family and its count, a selector. */
  readonly items: readonly string[];
}

type Values = Readonly<Record<string, string>> | undefined;

const changed = (values: Values, reference: Values) =>
  Object.keys(values ?? {}).filter((name) => values![name] !== reference?.[name]);
const short = (token: string) => token.replace(/^--slotted-/, '');
/** The family a component token belongs to: the longest family name the token starts with. */
const family = (token: string) =>
  /^--slotted-(stat-card|text-field|number-field|currency-field|date-field|date-picker|multi-select|tags-input|segmented-control|select-content|combobox-content|[a-z]+)-/.exec(
    token,
  )?.[1] ?? short(token);

export function themeAnatomy(theme: Theme, reference: Theme = defaultTheme): AnatomyLayer[] {
  const recipe = SCHEMES.flatMap((scheme) =>
    Object.keys(theme.recipe[scheme])
      .filter(
        (name) =>
          JSON.stringify(theme.recipe[scheme][name]) !==
          JSON.stringify(reference.recipe[scheme][name]),
      )
      .map((name) => `${scheme} ${short(name)}`),
  );
  const MOTION = /^--slotted-(duration|easing)-/;
  const scales = changed(theme.base, reference.base);
  const base = scales.filter((token) => !MOTION.test(token));
  const motion = [
    ...scales.filter((token) => MOTION.test(token)).map(short),
    ...changed(theme.reducedMotion, reference.reducedMotion).map(
      (token) => `reduced ${short(token)}`,
    ),
  ];
  const schemes = SCHEMES.map((scheme) => [
    scheme,
    changed(theme.schemes?.[scheme], reference.schemes?.[scheme]).length,
  ]) as [string, number][];
  const densities = (['comfortable', 'compact', 'dense'] as const).map((density) => [
    density,
    changed(theme.densities?.[density], reference.densities?.[density]).length,
  ]) as [string, number][];
  const components = changed(theme.components, reference.components);
  const families = new Map<string, number>();
  for (const token of components)
    families.set(family(token), (families.get(family(token)) ?? 0) + 1);
  const rules = (theme.rules ?? []).slice((reference.rules ?? []).length).map(String);
  const fonts = (theme.fonts ?? []).slice((reference.fonts ?? []).length);

  const counted = (entries: [string, number][]) =>
    entries.filter(([, count]) => count > 0).map(([name, count]) => `${name} · ${count}`);
  return [
    {
      id: 'seeds',
      count: SEED_NAMES.length,
      items: SEED_NAMES.map((name) => `${name} ${theme.seeds[name]}`),
    },
    { id: 'recipe', count: recipe.length, items: recipe },
    { id: 'base', count: base.length, items: base.map(short) },
    {
      id: 'schemes',
      count: schemes.reduce((sum, [, count]) => sum + count, 0),
      items: counted(schemes),
    },
    {
      id: 'densities',
      count: densities.reduce((sum, [, count]) => sum + count, 0),
      items: counted(densities),
    },
    { id: 'motion', count: motion.length, items: motion },
    { id: 'components', count: components.length, items: counted([...families]) },
    {
      id: 'rules',
      count: rules.length,
      items: rules.flatMap((rule) =>
        rule
          .split('}')
          .map((statement) => statement.split('{')[0]!.replace(/\s+/g, ' ').trim())
          .filter(Boolean),
      ),
    },
    { id: 'fonts', count: fonts.length, items: fonts.map((font) => font.family) },
  ];
}

/** One axis a reader set, and the layers of the model it writes. */
export interface AxisAnatomy {
  readonly axis: CustomizationAxis;
  /** Each layer the axis writes into, with how many entries; no layer it leaves alone. */
  readonly layers: readonly { readonly id: AnatomyLayerId; readonly count: number }[];
}

/**
 * A customization of `themeId` read axis by axis: the overrides each axis
 * compiles to on its own, counted by the layer they land in. `base` counts
 * the scales, `motion` the durations and easings, `schemes` and `densities`
 * every entry of every scheme or density.
 */
export function customizationAnatomy(themeId: string, customization: Customization): AxisAnatomy[] {
  const MOTION = /^--slotted-(duration|easing)-/;
  const sum = (
    groups: Readonly<Record<string, Readonly<Record<string, string>> | undefined>> = {},
  ) => Object.values(groups).reduce((total, group) => total + Object.keys(group ?? {}).length, 0);
  return customizedAxes(customization).map((axis) => {
    const overrides = customOverrides(
      { ...NO_CUSTOMISATION, [axis]: customization[axis] },
      themeId,
    );
    const base = Object.keys(overrides.base ?? {});
    const counts: Record<AnatomyLayerId, number> = {
      seeds: 0,
      recipe: 0,
      base: base.filter((token) => !MOTION.test(token)).length,
      schemes: sum(overrides.schemes as never),
      densities: sum(overrides.densities as never),
      motion: base.filter((token) => MOTION.test(token)).length,
      components: Object.keys(overrides.components ?? {}).length,
      rules: overrides.rules?.length ?? 0,
      fonts: overrides.fonts?.length ?? 0,
    };
    return {
      axis,
      layers: ANATOMY_LAYERS.filter((id) => counts[id] > 0).map((id) => ({
        id,
        count: counts[id],
      })),
    };
  });
}
