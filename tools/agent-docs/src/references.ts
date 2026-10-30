import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Every name a published rule or skill may write between backticks, read from
 * the sources that define it: the family contracts, the theme contract, the
 * token files and the custom properties the stylesheets declare.
 */
export interface Catalog {
  names: Map<string, string>;
  tokens: string[];
}

/** WAI-ARIA 1.2 states and properties. */
const ARIA = new Set(
  'activedescendant atomic autocomplete braillelabel brailleroledescription busy checked colcount colindex colindextext colspan controls current describedby description details disabled errormessage expanded flowto haspopup hidden invalid keyshortcuts label labelledby level live modal multiline multiselectable orientation owns placeholder posinset pressed readonly relevant required roledescription rowcount rowindex rowindextext rowspan selected setsize sort valuemax valuemin valuenow valuetext'
    .split(' ')
    .map((name) => `aria-${name}`),
);

/** The words of the guideline format itself (`writing-rules.md`): levels, fields, front matter. */
const GUIDELINE_FORMAT = new Set([
  'MUST',
  'SHOULD',
  'MAY',
  'Level',
  'Applies to',
  'Rule',
  'Why',
  'Do',
  "Don't",
  'Check',
  'Status: retired',
  'topic',
  'prefix',
  'triggers',
  'families',
]);

/** A name that resolves against nothing above and stays, with the reason it stays. */
export const REFERENCE_EXCEPTIONS: Readonly<Record<string, string>> = {
  'minmax(0, 1fr)': 'the CSS grid track with a zero minimum that lets a family scroll (CP-03)',
  '(hover: none) and (pointer: coarse)':
    'the media query that identifies a touch-primary device (SC-06)',
  'data-ui': 'the attribute that names a family on its root (OE-08)',
  'data-part': 'the attribute that names a part of a family (OE-08)',
  'container-name': 'the CSS property an element of its own names its container with (OE-09)',
  ':focus-visible': 'the CSS pseudo-class an element of its own draws its focus ring on (OE-03)',
};

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
  );
}

export function loadCatalog(root: string): Catalog {
  const names = new Map<string, string>();
  const add = (name: string, kind: string) => {
    if (!names.has(name)) names.set(name, kind);
  };
  const specs = join(root, 'specs/components');
  const contracts = readdirSync(specs)
    .map((family) => join(specs, family, 'contract.json'))
    .filter((file) => existsSync(file))
    .map((file) => JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>);
  // Families first: a family name that is also another family's part resolves as the family.
  for (const contract of contracts) {
    add(String(contract['family']), 'family');
    add(String(contract['ui']), 'family');
    for (const member of Object.keys((contract['members'] as object) ?? {})) add(member, 'family');
  }
  for (const contract of contracts) {
    // A family declares its parts, states and options per member, and some parts also under
    // `anatomy` or `elements`.
    for (const member of Object.values((contract['members'] as Record<string, unknown>) ?? {})) {
      const { parts, states, defaults } = member as {
        parts?: unknown;
        states?: unknown;
        defaults?: object;
      };
      if (Array.isArray(parts)) for (const part of parts) add(String(part), 'part');
      if (Array.isArray(states)) for (const state of states) add(String(state), 'state');
      for (const option of Object.keys(defaults ?? {})) add(option, 'option');
    }
    for (const part of Object.keys((contract['anatomy'] as object) ?? {})) add(part, 'part');
    // The custom properties a family writes on the page at run time.
    for (const property of Object.keys((contract['runtime'] as object) ?? {}))
      if (property.startsWith('--slotted-')) add(property, 'token');
    for (const part of Object.keys((contract['elements'] as object) ?? {})) add(part, 'part');
    const states = contract['stateAttributes'];
    for (const state of Array.isArray(states) ? states : Object.keys((states as object) ?? {})) {
      add(`data-${state}`, 'state');
      add(String(state), 'state');
    }
    for (const [axis, values] of Object.entries(
      (contract['axes'] as Record<string, unknown>) ?? {},
    )) {
      add(axis, 'axis');
      if (Array.isArray(values)) for (const value of values) add(String(value), 'axis-value');
    }
  }
  const theme = JSON.parse(
    readFileSync(join(root, 'packages/theme/src/contract.json'), 'utf8'),
  ) as {
    tokens: { name: string }[];
    groups?: { id: string }[];
  };
  for (const token of theme.tokens) add(token.name, 'token');
  for (const group of theme.groups ?? []) add(group.id, 'token-group');
  addThemeApi(root, add);
  for (const binding of ['react', 'angular'])
    add(
      (
        JSON.parse(readFileSync(join(root, 'packages', binding, 'package.json'), 'utf8')) as {
          name: string;
        }
      ).name,
      'package',
    );
  for (const file of walk(join(root, 'packages/styles/src'))) {
    if (file.endsWith('.tokens.json'))
      for (const [token] of readFileSync(file, 'utf8').matchAll(/--slotted-[a-z0-9-]+/g))
        add(token, 'token');
    if (file.endsWith('.css'))
      for (const [, property] of readFileSync(file, 'utf8').matchAll(/(--slotted-[a-z0-9-]+)\s*:/g))
        add(property!, 'token');
  }
  return { names, tokens: [...names].filter(([, kind]) => kind === 'token').map(([name]) => name) };
}

/** The single-quoted strings of the array literal `name` declares in `source`. */
function constArray(source: string, name: string): string[] {
  const body = new RegExp(`${name}\\s*=\\s*\\[([^\\]]*)\\]`).exec(source)?.[1];
  if (body === undefined) throw new Error(`no array literal ${name}`);
  return [...body.matchAll(/'([^']+)'/g)].map(([, value]) => value!);
}

/**
 * The public API of the theme packages, read from their sources: the value
 * exports of `@slotted/theme` and its conformance module, its command, the
 * subpaths of both packages, the keys of a theme definition, the attributes
 * that select a theme (a variant's by its axis), the seed properties, the cascade layers, and the scheme
 * density and corner values.
 */
function addThemeApi(root: string, add: (name: string, kind: string) => void): void {
  const theme = join(root, 'packages/theme');
  const read = (path: string) => readFileSync(join(theme, path), 'utf8');
  for (const [, names] of read('src/index.ts').matchAll(/^export \{([^}]*)\} from/gm))
    for (const name of names!.split(','))
      if (name.trim() !== '')
        add(
          name
            .trim()
            .split(/\s+as\s+/)
            .at(-1)!,
          'theme-api',
        );
  for (const [, name] of read('conformance/theme-conformance.mjs').matchAll(
    /^export (?:const|function) (\w+)/gm,
  ))
    add(name!, 'theme-api');
  for (const dir of ['packages/theme', 'packages/themes']) {
    const manifest = JSON.parse(readFileSync(join(root, dir, 'package.json'), 'utf8')) as {
      name: string;
      bin?: Record<string, string>;
      exports: Record<string, unknown>;
    };
    for (const command of Object.keys(manifest.bin ?? {})) add(command, 'theme-api');
    for (const subpath of Object.keys(manifest.exports))
      add(manifest.name + subpath.slice(1), 'theme-api');
  }
  const definition = /interface ThemeDefinition \{([^}]*)\}/.exec(read('src/define.ts'))?.[1];
  if (definition === undefined) throw new Error('no interface ThemeDefinition');
  for (const [, key] of definition.matchAll(/readonly (\w+)\??:/g)) add(key!, 'theme-option');
  for (const [, attribute] of read('src/rule-policy.ts').matchAll(/'(data-slotted-[a-z-]+)'/g))
    add(attribute!, 'theme-attribute');
  if (read('src/rule-policy.ts').includes('data-slotted-variant-'))
    add('data-slotted-variant-<axis>', 'theme-attribute');
  for (const seed of constArray(read('src/seeds.ts'), 'SEED_NAMES'))
    add(`--slotted-seed-${seed}`, 'seed');
  add('slotted', 'layer');
  for (const layer of constArray(read('src/layer-order.ts'), 'LAYER_NAMES'))
    add(`slotted.${layer}`, 'layer');
  for (const value of [
    ...constArray(read('src/recipe.ts'), 'SCHEMES'),
    ...(/'system'/.test(read('src/render.ts')) ? ['system'] : []),
    ...constArray(read('src/define.ts'), 'DENSITIES'),
    ...constArray(read('src/define.ts'), 'CORNERS'),
  ])
    add(value, 'theme-axis-value');
}

export function nameKind(
  name: string,
  catalog: Catalog,
  ruleIds: ReadonlySet<string>,
  local: ReadonlySet<string> = new Set(),
): string | undefined {
  if (local.has(name)) return 'local';
  const known = catalog.names.get(name);
  if (known !== undefined) return known;
  if (/^[A-Z]{2}-\d{2}$/.test(name)) return ruleIds.has(name) ? 'rule' : undefined;
  if (ARIA.has(name)) return 'aria';
  if (GUIDELINE_FORMAT.has(name)) return 'guideline-format';
  const wildcard = /^(--slotted-[a-z0-9-]+-)\*$/.exec(name);
  if (wildcard !== null)
    return catalog.tokens.some((token) => token.startsWith(wildcard[1]!))
      ? 'token-wildcard'
      : undefined;
  if (/^[a-z-]+: [^;:]+$/.test(name))
    return [...name.matchAll(/--slotted-[a-z0-9-]+/g)].every(([token]) =>
      catalog.tokens.includes(token),
    )
      ? 'css-declaration'
      : undefined;
  if (name in REFERENCE_EXCEPTIONS) return 'exception';
  return undefined;
}

export function unresolvedNames(
  markdown: string,
  catalog: Catalog,
  ruleIds: ReadonlySet<string>,
  local: ReadonlySet<string> = new Set(),
): string[] {
  const found: string[] = [];
  for (const [, name] of markdown.matchAll(/`([^`\n]+)`/g))
    if (nameKind(name!, catalog, ruleIds, local) === undefined && !found.includes(name!))
      found.push(name!);
  return found;
}
