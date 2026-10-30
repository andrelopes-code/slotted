import type { TokenContract, TokenDefinition } from './contract-types';
import { scanCssText } from './css-scan';
import { resolveTokens } from './resolve';

/**
 * A theme is valid when it states every token the contract declares, on the
 * axis the contract puts it on, and when the values it states obey the two
 * rules the layering exists to enforce: a token never reaches for a deeper
 * layer, and a token that is not a scale root composes its value from another
 * token instead of restating a literal.
 */

const LAYER_DEPTH: Readonly<Record<string, number>> = { primitive: 0, semantic: 1, component: 2 };

const REFERENCE = /var\(\s*(--[a-z0-9-]+)/g;

/** The keywords `forced-colors` may map a token to, plus the two absences. */
const SYSTEM_COLORS = new Set([
  'AccentColor',
  'AccentColorText',
  'ActiveText',
  'ButtonBorder',
  'ButtonFace',
  'ButtonText',
  'Canvas',
  'CanvasText',
  'Field',
  'FieldText',
  'GrayText',
  'Highlight',
  'HighlightText',
  'LinkText',
  'Mark',
  'MarkText',
  'SelectedItem',
  'SelectedItemText',
  'VisitedText',
  'none',
  'transparent',
]);

type Values = Record<string, string>;

/** The resolved shape of a theme: what `flattenTheme` returns and what the contract is checked on. */
export interface FlatTheme {
  readonly name: string;
  readonly base: Values;
  readonly schemes: Readonly<Record<string, Values>>;
  readonly densities: Readonly<Record<string, Values>>;
  readonly reducedMotion: Values;
  /** Per axis and value, every scheme the variant changes, with the variant laid over it. */
  readonly variants?: Readonly<
    Record<string, Readonly<Record<string, Readonly<Record<string, Values>>>>>
  >;
}

function namesOn(contract: TokenContract, axis: string): string[] {
  return (contract.tokens ?? []).filter((token) => token.axis === axis).map((token) => token.name);
}

function reducedMotionNames(contract: TokenContract): string[] {
  return (contract.tokens ?? []).filter((token) => token.reducedMotion).map((token) => token.name);
}

function tokenIndex(contract: TokenContract): Map<string, TokenDefinition> {
  return new Map((contract.tokens ?? []).map((token) => [token.name, token]));
}

function asMap(values: unknown): Values {
  return values !== null && typeof values === 'object' && !Array.isArray(values)
    ? (values as Values)
    : {};
}

function checkTokenMap(
  errors: string[],
  label: string,
  expectedNames: readonly string[],
  values: unknown,
): void {
  const expected = new Set(expectedNames);
  const actual = asMap(values);

  for (const name of expectedNames) {
    if (!(name in actual)) errors.push(`${label} is missing ${name}`);
  }

  for (const name of Object.keys(actual)) {
    if (!expected.has(name)) errors.push(`${label} contains unknown token ${name}`);
  }
}

function checkVariantMaps(
  errors: string[],
  label: string,
  requiredNames: readonly string[],
  expectedTokens: readonly string[],
  values: unknown,
): void {
  const required = new Set(requiredNames);
  const actual = asMap(values);

  for (const name of requiredNames) {
    if (!(name in actual)) {
      errors.push(`${label} is missing required variant ${name}`);
      continue;
    }
    checkTokenMap(errors, `${label} ${name}`, expectedTokens, actual[name]);
  }

  for (const name of Object.keys(actual)) {
    if (!required.has(name)) errors.push(`${label} contains unknown variant ${name}`);
  }
}

function references(value: unknown): string[] {
  return [...String(value).matchAll(REFERENCE)].map(([, name]) => name!);
}

/**
 * A token value, a component value or a font field is interpolated into CSS
 * text verbatim (`render.ts` writes `${name}: ${value};` and the like). An
 * unquoted, uncommented `;`, `{` or `}` inside it would close the
 * declaration, the rule or the `@layer`/`@scope` it is written into, and a
 * string or comment the value leaves open, or a trailing `\` escaping the
 * character written after it, would do the same to whatever follows it in
 * the stylesheet — so all of them are rejected here, and so is a value that
 * is not a string, which `String()` could turn into any text. `url("a;b.woff2")`
 * and `"1px /* comment *\/"` stay legitimate: the scan this shares with
 * `splitTopLevel` skips a structural character inside either.
 */
export function hasUnsafeStructuralChar(value: unknown): boolean {
  if (typeof value !== 'string') return true;
  let unsafe = false;
  const end = scanCssText(value, {
    onCodeChar(char) {
      if (char === ';' || char === '{' || char === '}') unsafe = true;
    },
  });
  return unsafe || end.openQuote !== null || end.openCommentAt !== null || end.openEscape;
}

function checkStructuralSafety(errors: string[], label: string, values: unknown): void {
  for (const [name, value] of Object.entries(asMap(values))) {
    if (hasUnsafeStructuralChar(value)) {
      errors.push(
        `${label} ${name} is ${JSON.stringify(value)}, which contains an unquoted ;, { or }, or leaves a string, a comment or an escape open`,
      );
    }
  }
}

function checkComposition(
  errors: string[],
  index: Map<string, TokenDefinition>,
  label: string,
  values: unknown,
): void {
  for (const [name, value] of Object.entries(asMap(values))) {
    const token = index.get(name);
    if (token === undefined) continue;

    const referenced = references(value);
    for (const reference of referenced) {
      const target = index.get(reference);
      if (target === undefined) {
        errors.push(
          `${label} ${name} references ${reference}, which the contract does not declare`,
        );
        continue;
      }
      if (LAYER_DEPTH[target.layer]! > LAYER_DEPTH[token.layer]!) {
        errors.push(
          `${label} ${name} is ${token.layer} and reaches for ${target.layer} ${reference}`,
        );
      }
    }

    if (!token.root && !token.literal && referenced.length === 0) {
      errors.push(`${label} ${name} states a literal without declaring why`);
    }
  }
}

/** WCAG 2.2 target size, in the unit every geometry value is authored in. */
function pixels(value: unknown): number | undefined {
  const match = /^(\d+(?:\.\d+)?)px$/.exec(String(value).trim());
  return match ? Number(match[1]) : undefined;
}

function checkTargets(errors: string[], theme: Partial<FlatTheme>): void {
  const base = asMap(theme.base);
  for (const [density, values] of Object.entries(asMap(theme.densities))) {
    const resolved = resolveTokens({ ...base, ...asMap(values) });
    const minimum = pixels(resolved['--slotted-target-min']);
    if (minimum === undefined) continue;

    for (const [name, value] of Object.entries(resolved)) {
      if (!/^--slotted-control-height-(sm|md|lg)$/.test(name)) continue;
      const height = pixels(value);
      if (height !== undefined && height < minimum) {
        errors.push(`density ${density} ${name} is ${value}, below the ${minimum}px target size`);
      }
    }
  }
}

export function validateContract(contract: TokenContract): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const token of contract.tokens ?? []) {
    if (seen.has(token.name)) errors.push(`contract declares ${token.name} twice`);
    seen.add(token.name);

    if (!(token.layer in LAYER_DEPTH))
      errors.push(`${token.name} has unknown layer ${token.layer}`);
    if (!(contract.axes ?? []).includes(token.axis)) {
      errors.push(`${token.name} has unknown axis ${token.axis}`);
    }
    if (token.root && token.literal) {
      errors.push(`${token.name} is a scale root, so a literal reason says nothing`);
    }

    if (token.axis === 'scheme') {
      if (token.forcedColor === undefined) {
        errors.push(`${token.name} varies by scheme and declares no forced-colors mapping`);
      } else if (!SYSTEM_COLORS.has(token.forcedColor)) {
        errors.push(`${token.name} maps to ${token.forcedColor}, which is not a system colour`);
      }
    } else if (token.forcedColor !== undefined) {
      errors.push(`${token.name} does not vary by scheme, so forced colours cannot replace it`);
    }
  }

  return errors;
}

export function validateTheme(contract: TokenContract, theme: Partial<FlatTheme>): string[] {
  const errors = validateContract(contract);

  const index = tokenIndex(contract);

  checkTokenMap(errors, 'base', namesOn(contract, 'base'), theme.base);
  checkTokenMap(errors, 'reducedMotion', reducedMotionNames(contract), theme.reducedMotion);

  checkVariantMaps(
    errors,
    'scheme',
    contract.requiredSchemes,
    namesOn(contract, 'scheme'),
    theme.schemes,
  );
  checkVariantMaps(
    errors,
    'density',
    contract.requiredDensities,
    namesOn(contract, 'density'),
    theme.densities,
  );

  checkComposition(errors, index, 'base', theme.base);
  for (const [scheme, values] of Object.entries(asMap(theme.schemes))) {
    checkComposition(errors, index, `scheme ${scheme}`, values);
  }
  for (const [density, values] of Object.entries(asMap(theme.densities))) {
    checkComposition(errors, index, `density ${density}`, values);
  }

  checkStructuralSafety(errors, 'base', theme.base);
  for (const [scheme, values] of Object.entries(asMap(theme.schemes))) {
    checkStructuralSafety(errors, `scheme ${scheme}`, values);
  }
  for (const [density, values] of Object.entries(asMap(theme.densities))) {
    checkStructuralSafety(errors, `density ${density}`, values);
  }
  checkStructuralSafety(errors, 'reducedMotion', theme.reducedMotion);

  checkTargets(errors, theme);

  return errors;
}
