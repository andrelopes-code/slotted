import { parseSeed, toHex, type Oklch } from './color';
import {
  COMPONENT_TOKENS,
  contract,
  type BaseToken,
  type ComponentToken,
  type DensityToken,
  type MotionToken,
  type SchemeToken,
} from './generated/contract';
import {
  derivationCss,
  evaluateRecipe,
  SCHEMES,
  SEED_NAMES,
  type Derivation,
  type Recipe,
  type Scheme,
  type SeedName,
} from './recipe';
import { ruleErrors } from './rule-policy';
import { splitTopLevel } from './rules';
import { hasUnsafeStructuralChar, validateTheme, type FlatTheme } from './validate';

export const DENSITIES = ['comfortable', 'compact', 'dense'] as const;
export type Density = (typeof DENSITIES)[number];

/** How round the corners are, chosen at runtime like the density. */
export const CORNERS = ['square', 'soft', 'standard', 'round'] as const;
export type Corner = (typeof CORNERS)[number];
/** The radius scale a corner entry may write; `--slotted-radius-full` is never changed by it. */
export const CORNER_TOKENS = [
  '--slotted-radius-xs',
  '--slotted-radius-sm',
  '--slotted-radius-md',
  '--slotted-radius-lg',
] as const;
export type CornerToken = (typeof CORNER_TOKENS)[number];

type Values<T extends string> = Readonly<Partial<Record<T, string>>>;

/** What one variant value derives again: a partial recipe, per scheme it changes. */
export type RecipeVariant = Readonly<Partial<Record<Scheme, Readonly<Record<string, Derivation>>>>>;

export interface FontFaceDefinition {
  readonly family: string;
  /** A CSS `src` value, written as it would be in `@font-face`. */
  readonly src: string;
  readonly weight?: string;
  readonly style?: string;
  readonly display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
}

export interface ThemeDefinition {
  readonly name: string;
  readonly seeds: Readonly<Record<SeedName, string>>;
  readonly recipe: Recipe;
  readonly base?: Values<BaseToken>;
  readonly schemes?: Readonly<Partial<Record<Scheme, Values<SchemeToken>>>>;
  readonly densities?: Readonly<Partial<Record<Density, Values<DensityToken>>>>;
  /** A partial radius scale per corner; `standard` is the base scale unless it is written here. */
  readonly corners?: Readonly<Partial<Record<Corner, Values<CornerToken>>>>;
  /**
   * Recipe values a reader chooses at runtime, by axis and value, written under
   * `data-slotted-variant-<axis>="<value>"`. Two axes that derive the same token
   * of one scheme are refused: they are one combined axis.
   */
  readonly variants?: Readonly<Record<string, Readonly<Record<string, RecipeVariant>>>>;
  readonly reducedMotion?: Values<MotionToken>;
  readonly components?: Values<ComponentToken>;
  readonly fonts?: readonly FontFaceDefinition[];
  /** CSS text, or the URL of a `.css` file the CLI reads at build time. */
  readonly rules?: readonly (string | URL)[];
}

export interface Theme extends ThemeDefinition {
  readonly kind: 'slotted-theme';
}

export type ThemeOverrides = Omit<Partial<ThemeDefinition>, 'name' | 'seeds'> & {
  readonly seeds?: Readonly<Partial<Record<SeedName, string>>>;
};

const NAME = /^[a-z][a-z0-9-]*$/;

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !(value instanceof URL) && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

function parsedSeeds(seeds: ThemeDefinition['seeds']): Record<SeedName, Oklch> {
  return Object.fromEntries(SEED_NAMES.map((name) => [name, parseSeed(seeds[name])!])) as Record<
    SeedName,
    Oklch
  >;
}

/**
 * The theme as the contract reads it: every scheme with the recipe evaluated —
 * an alias as its `var()`, every other derivation as the hex it computes to
 * with the theme's own seeds — and the theme's scheme values laid over it.
 */
export function flattenTheme(theme: ThemeDefinition): FlatTheme {
  const seeds = parsedSeeds(theme.seeds);
  const schemes = Object.fromEntries(
    SCHEMES.map((scheme) => [scheme, flatScheme(theme, seeds, scheme, {})]),
  );
  const variants = Object.fromEntries(
    Object.entries(theme.variants ?? {}).map(([axis, values]) => [
      axis,
      Object.fromEntries(
        Object.entries(values).map(([value, variant]) => [
          value,
          Object.fromEntries(
            Object.entries(variant).map(([scheme, rules]) => [
              scheme,
              flatScheme(theme, seeds, scheme as Scheme, rules),
            ]),
          ),
        ]),
      ),
    ]),
  );

  return {
    name: theme.name,
    base: { ...(theme.base ?? {}) },
    schemes,
    densities: Object.fromEntries(
      Object.entries(theme.densities ?? {}).map(([density, values]) => [density, { ...values }]),
    ),
    reducedMotion: { ...(theme.reducedMotion ?? {}) },
    variants,
  };
}

/**
 * One scheme with `variant` laid over its recipe. A token the variant derives
 * wins over the theme's scheme value for it, as its declaration does in the
 * stylesheet.
 */
function flatScheme(
  theme: ThemeDefinition,
  seeds: Record<SeedName, Oklch>,
  scheme: Scheme,
  variant: Readonly<Record<string, Derivation>>,
): Record<string, string> {
  const rules = { ...theme.recipe[scheme], ...variant };
  const derived = evaluateRecipe({ ...theme.recipe, [scheme]: rules }, seeds, scheme);
  const values: Record<string, string> = {};
  for (const [name, rule] of Object.entries(rules)) {
    values[name] = 'alias' in rule ? `var(${rule.alias})` : toHex(derived[name]!);
  }
  const literals = Object.entries(theme.schemes?.[scheme] ?? {}).filter(
    ([name]) => !(name in variant),
  );

  return { ...values, ...Object.fromEntries(literals) };
}

/**
 * Every reason a definition cannot be rendered: its name lands in selectors,
 * every seed, value, font field and recipe derivation lands in a declaration,
 * so each one is checked against the contract and against the structural
 * characters that would close the rule it is written into; every rule given
 * as text is checked for balance and against what a theme rule may select
 * and read (`ruleErrors`).
 */
function themeErrors(definition: ThemeDefinition): string[] {
  const errors: string[] = [];
  if (typeof definition.name !== 'string' || !NAME.test(definition.name)) {
    errors.push(`name ${JSON.stringify(definition.name)} is not [a-z][a-z0-9-]*`);
  }
  for (const seed of SEED_NAMES) {
    const value = definition.seeds?.[seed];
    if (typeof value !== 'string' || parseSeed(value) === null) {
      errors.push(`seed ${seed} ${JSON.stringify(value)} is neither #rrggbb nor oklch(L C H)`);
    }
  }
  const components = new Set<string>(COMPONENT_TOKENS);
  for (const [name, value] of Object.entries(definition.components ?? {})) {
    if (!components.has(name)) errors.push(`components contains ${name}, which no family reads`);
    if (hasUnsafeStructuralChar(value as string)) {
      errors.push(
        `components ${name} is ${JSON.stringify(value)}, which contains an unquoted ;, { or }, or leaves a string, a comment or an escape open`,
      );
    }
  }
  const cornerTokens = new Set<string>(CORNER_TOKENS);
  for (const [corner, values] of Object.entries(definition.corners ?? {})) {
    if (!(CORNERS as readonly string[]).includes(corner)) {
      errors.push(`corners contains ${corner}, which is none of ${CORNERS.join(', ')}`);
      continue;
    }
    for (const [name, value] of Object.entries(values ?? {})) {
      if (!cornerTokens.has(name)) {
        errors.push(`corners ${corner} writes ${name}, which is not a step of the radius scale`);
      } else if (typeof value !== 'string' || hasUnsafeStructuralChar(value)) {
        errors.push(
          `corners ${corner} ${name} is ${JSON.stringify(value)}, which is not a length or contains an unquoted ;, { or }, or leaves a string, a comment or an escape open`,
        );
      }
    }
  }
  const schemeTokens = new Set(
    contract.tokens.filter((token) => token.axis === 'scheme').map((token) => token.name),
  );
  for (const scheme of SCHEMES) {
    for (const name of Object.keys(definition.recipe?.[scheme] ?? {})) {
      if (!schemeTokens.has(name))
        errors.push(`recipe ${scheme} derives ${name}, which no scheme carries`);
    }
    for (const [name, rule] of Object.entries(definition.recipe?.[scheme] ?? {})) {
      errors.push(...derivationErrors(`recipe ${scheme} ${name}`, rule));
    }
  }
  errors.push(...variantErrors(definition));
  // A rule given as a URL is read, and held to the same policy, by `slotted-build-theme`.
  for (const [index, rule] of (definition.rules ?? []).entries()) {
    if (typeof rule !== 'string') {
      if (!(rule instanceof URL)) errors.push('a rule is neither CSS text nor a URL');
      continue;
    }
    try {
      splitTopLevel(rule);
    } catch (error) {
      errors.push(`rules[${index}]: ${(error as Error).message}`);
      continue;
    }
    for (const { line, selector, message } of ruleErrors(rule))
      errors.push(`rules[${index}]:${line} ${selector}: ${message}`);
  }
  // `family` is written through `JSON.stringify` and stays a quoted CSS string whatever
  // it contains; the other fields are interpolated into `@font-face` verbatim.
  for (const [index, font] of (definition.fonts ?? []).entries()) {
    if (typeof font.family !== 'string') errors.push(`fonts[${index}].family is not a string`);
    for (const field of ['src', 'weight', 'style', 'display'] as const) {
      const value = font[field];
      if (value !== undefined && hasUnsafeStructuralChar(value)) {
        errors.push(
          `fonts[${index}].${field} is ${JSON.stringify(value)}, which contains an unquoted ;, { or }, or leaves a string, a comment or an escape open`,
        );
      }
    }
  }
  if (errors.length === 0) {
    try {
      errors.push(...validateTheme(contract, flattenTheme(definition)));
    } catch (error) {
      errors.push((error as Error).message);
    }
  }
  return errors;
}

/** Why one derivation cannot be written into a declaration, if it cannot. */
function derivationErrors(label: string, rule: Derivation): string[] {
  let css: string;
  try {
    css = derivationCss(rule);
  } catch {
    return [`${label} is not a derivation`];
  }

  return hasUnsafeStructuralChar(css)
    ? [
        `${label} writes ${JSON.stringify(css)}, which contains an unquoted ;, { or }, or leaves a string, a comment or an escape open`,
      ]
    : [];
}

/**
 * Every reason the variants cannot be rendered. An axis and a value land in an
 * attribute selector; a variant derives again only what the recipe derives for
 * that scheme; and two axes never derive one token of one scheme, because
 * their scopes would overlap with no order between them.
 */
function variantErrors(definition: ThemeDefinition): string[] {
  const errors: string[] = [];
  const owners = new Map<string, string>();
  for (const [axis, values] of Object.entries(definition.variants ?? {})) {
    if (!NAME.test(axis))
      errors.push(`variants axis ${JSON.stringify(axis)} is not [a-z][a-z0-9-]*`);
    for (const [value, variant] of Object.entries(values ?? {})) {
      if (!NAME.test(value)) {
        errors.push(`variants ${axis} value ${JSON.stringify(value)} is not [a-z][a-z0-9-]*`);
      }
      for (const [scheme, rules] of Object.entries(variant ?? {})) {
        if (!(SCHEMES as readonly string[]).includes(scheme)) {
          errors.push(
            `variants ${axis} ${value} contains ${scheme}, which is none of ${SCHEMES.join(', ')}`,
          );
          continue;
        }
        for (const [name, rule] of Object.entries(rules ?? {})) {
          const label = `variants ${axis} ${value} ${scheme} ${name}`;
          if (definition.recipe?.[scheme as Scheme]?.[name] === undefined) {
            errors.push(`${label} is not a token the recipe derives for ${scheme}`);
            continue;
          }
          errors.push(...derivationErrors(label, rule));
          const owner = owners.get(`${scheme} ${name}`);
          if (owner !== undefined && owner !== axis) {
            errors.push(
              `${label} is also derived by the axis ${owner}; axes that derive one token are one combined axis`,
            );
          }
          owners.set(`${scheme} ${name}`, axis);
        }
      }
    }
  }

  return errors;
}

/**
 * Throws when `theme` could not have come from `defineTheme`. `renderTheme`
 * calls it on every theme, because an object typed `Theme` — one read back
 * from storage, say — need never have passed through `defineTheme`.
 */
export function assertTheme(theme: ThemeDefinition): void {
  const errors = themeErrors(theme);
  if (errors.length > 0) {
    throw new Error(
      `Invalid theme ${String(theme.name)}:\n${errors.map((error) => `- ${error}`).join('\n')}`,
    );
  }
}

export function defineTheme(definition: ThemeDefinition): Theme {
  assertTheme(definition);
  const { kind: _kind, ...plain } = definition as ThemeDefinition & { kind?: string };
  return deepFreeze({ ...plain, kind: 'slotted-theme' as const });
}

function mergeVariants(
  base: ThemeDefinition['variants'],
  overrides: ThemeDefinition['variants'],
): NonNullable<ThemeDefinition['variants']> {
  const merged: Record<string, Record<string, RecipeVariant>> = { ...(base ?? {}) };
  for (const [axis, values] of Object.entries(overrides ?? {})) {
    const own = { ...(merged[axis] ?? {}) };
    for (const [value, variant] of Object.entries(values))
      own[value] = mergeNested(own[value], variant);
    merged[axis] = own;
  }

  return merged;
}

function mergeNested<K extends string, V extends object>(
  base: Readonly<Partial<Record<K, V>>> | undefined,
  overrides: Readonly<Partial<Record<K, V>>> | undefined,
): Partial<Record<K, V>> {
  const merged: Partial<Record<K, V>> = { ...(base ?? {}) };
  for (const [key, value] of Object.entries(overrides ?? {}) as [K, V][]) {
    merged[key] = { ...(merged[key] ?? {}), ...value } as V;
  }
  return merged;
}

/**
 * A theme built on another: `base`, `reducedMotion` and `components` merged
 * key by key; `schemes`, `densities` and `corners` merged per scheme/density/corner;
 * `variants` merged per axis, value and scheme; `seeds`
 * merged per seed name; `recipe` replaced whole when `overrides` carries one;
 * `fonts` and `rules` appended after `base`'s own.
 */
export function extendTheme(
  base: Theme,
  overrides: ThemeOverrides,
  options: { readonly name: string },
): Theme {
  const { kind: _kind, ...parent } = base;
  return defineTheme({
    ...parent,
    name: options.name,
    seeds: { ...parent.seeds, ...(overrides.seeds ?? {}) },
    recipe: overrides.recipe ?? parent.recipe,
    base: { ...(parent.base ?? {}), ...(overrides.base ?? {}) },
    schemes: mergeNested(parent.schemes, overrides.schemes),
    densities: mergeNested(parent.densities, overrides.densities),
    corners: mergeNested(parent.corners, overrides.corners),
    variants: mergeVariants(parent.variants, overrides.variants),
    reducedMotion: { ...(parent.reducedMotion ?? {}), ...(overrides.reducedMotion ?? {}) },
    components: { ...(parent.components ?? {}), ...(overrides.components ?? {}) },
    fonts: [...(parent.fonts ?? []), ...(overrides.fonts ?? [])],
    rules: [...(parent.rules ?? []), ...(overrides.rules ?? [])],
  });
}
