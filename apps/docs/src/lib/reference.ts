import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { Framework } from '../runtime/frameworks';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
} from '../../../../tools/storybook-workbench/src/api-table';
import type { ReferenceImport } from '../../../../tools/storybook-workbench/src/reference-page';

export type { AnatomyRow, ApiRow, EventRow, ReferenceImport };

/**
 * Build-time only: the reference a family publishes for each binding, read
 * from the sources the Storybook reference pages read.
 *
 * - `packages/<binding>/…/<family>.docs.ts`: imports, API, events,
 *   composition, anatomy and accessibility notes, one entry per member.
 * - `specs/components/<family>/contract.json` › `keyboard`.
 * - `packages/styles/src/<family>/<family>.tokens.json`, with each token's
 *   default from the default theme or, failing that, from the fallback the
 *   family stylesheet writes.
 *
 * JSON and CSS are read from the working directory, as `catalog.ts` reads the
 * contracts. The `docs.ts` modules are TypeScript with package imports, so
 * Vite loads them.
 */
const repoRoot = resolve(process.cwd(), '../..');

const read = (path: string): string => readFileSync(resolve(repoRoot, path), 'utf8');

/** One member of a family's reference: `field`, or `button` and `iconButton`. */
export interface ReferenceMember {
  description?: string;
  imports?: ReferenceImport;
  api?: readonly ApiRow[];
  events?: readonly EventRow[];
  composition?: readonly ApiRow[];
  anatomy?: readonly AnatomyRow[];
  accessibility?: readonly string[];
}

export interface Member extends ReferenceMember {
  /** The key the `docs.ts` entry is written under. */
  key: string;
  /** The name a reader imports: `Field`, `SlField`; the key when no import names it. */
  name: string;
}

export interface KeyboardRow {
  key: string;
  effect: string;
  focus?: string;
}

export interface TokenRow {
  name: string;
  defaultValue: TokenDefault;
}

export type TokenDefault =
  | { kind: 'value'; value: string }
  | { kind: 'density'; values: { density: string; value: string }[] }
  | { kind: 'scheme' }
  | { kind: 'none' };

export interface FamilyReference {
  members: Member[];
  keyboard: KeyboardRow[];
  /** The family's own tokens: `--slotted-<family>-*`. */
  familyTokens: TokenRow[];
  /** The theme's tokens the family stylesheet reads. */
  themeTokens: TokenRow[];
}

type DocsModule = Record<string, unknown>;

const docsModules: Record<Framework, Record<string, () => Promise<DocsModule>>> = {
  react: import.meta.glob<DocsModule>('../../../../packages/react/src/*/*.docs.ts'),
  angular: import.meta.glob<DocsModule>('../../../../packages/angular/*/src/*.docs.ts'),
};

const EXPORT_PREFIX: Record<Framework, string> = { react: 'REACT', angular: 'ANGULAR' };

function docsLoader(framework: Framework, family: string) {
  const suffix = `/${family}.docs.ts`;
  const entry = Object.entries(docsModules[framework]).find(([path]) => path.endsWith(suffix));
  return entry?.[1];
}

const pascal = (key: string): string => key.charAt(0).toUpperCase() + key.slice(1);

/**
 * `field` → `Field` in React and `SlField` in Angular, kept only when an
 * import statement of the family names it.
 */
function memberName(framework: Framework, key: string, sources: string[]): string {
  const name = framework === 'react' ? pascal(key) : `Sl${pascal(key)}`;
  const named = new RegExp(`\\b${name}\\b`);
  return sources.some((source) => named.test(source)) ? name : key;
}

async function members(framework: Framework, family: string): Promise<Member[]> {
  const load = docsLoader(framework, family);
  if (!load) throw new Error(`No ${framework} docs.ts for "${family}"`);
  const module = await load();
  const exportName = `${EXPORT_PREFIX[framework]}_${family.toUpperCase().replace(/-/g, '_')}_DOCS`;
  const docs = module[exportName] as Record<string, ReferenceMember> | undefined;
  if (!docs) throw new Error(`${family}.docs.ts exports no ${exportName}`);
  const sources = Object.values(docs).flatMap((member) =>
    member.imports ? [member.imports.source] : [],
  );
  return Object.entries(docs).map(([key, member]) => ({
    ...member,
    key,
    name: memberName(framework, key, sources),
  }));
}

/**
 * The contract's keyboard rows. Rows carry no member, so they are the
 * family's; a row's focus is `focus`, or `focusTo` where the contract
 * describes a move between parts.
 */
function keyboard(family: string): KeyboardRow[] {
  const contract = JSON.parse(read(`specs/components/${family}/contract.json`)) as {
    keyboard?: unknown;
  };
  if (!Array.isArray(contract.keyboard)) return [];
  return contract.keyboard.flatMap((row: unknown) => {
    if (typeof row !== 'object' || row === null) return [];
    const { key, effect, focus, focusTo } = row as Record<string, unknown>;
    if (typeof key !== 'string' || typeof effect !== 'string') return [];
    const moves = typeof focus === 'string' ? focus : typeof focusTo === 'string' ? focusTo : '';
    return [{ key, effect, ...(moves ? { focus: moves } : {}) }];
  });
}

interface ThemeValues {
  base: Record<string, string>;
  densities: Record<string, Record<string, string>>;
}

let themeCache: { values: ThemeValues; perScheme: Set<string> } | undefined;

/**
 * The default theme: `values.json` holds what it sets once and per density;
 * the colors it computes per scheme exist only in the built stylesheet,
 * inside the light scheme's `@scope`.
 */
function theme() {
  if (themeCache) return themeCache;
  const values = JSON.parse(read('packages/themes/src/default/values.json')) as ThemeValues;
  const css = read('packages/themes/dist/default.css');
  const start = css.indexOf('@scope ([data-slotted-theme="default"][data-slotted-scheme="light"]');
  const end = start === -1 ? -1 : css.indexOf('@scope', start + 1);
  const block = start === -1 ? '' : css.slice(start, end === -1 ? undefined : end);
  const perScheme = new Set([...block.matchAll(/(--slotted-[\w-]+)\s*:/g)].map((m) => m[1]!));
  themeCache = { values, perScheme };
  return themeCache;
}

/** The second argument of the first `var(<token>, …)` the stylesheet writes. */
function stylesheetFallback(css: string, token: string): string | undefined {
  const opening = new RegExp(`var\\(\\s*${token}\\s*,`).exec(css);
  if (!opening) return undefined;
  let depth = 1;
  const start = opening.index + opening[0].length;
  for (let index = start; index < css.length; index += 1) {
    const char = css[index];
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (depth === 0) return css.slice(start, index).replace(/\s+/g, ' ').trim();
  }
  return undefined;
}

function tokenDefault(token: string, css: string): TokenDefault {
  const { values, perScheme } = theme();
  const base = values.base[token];
  if (base !== undefined) return { kind: 'value', value: base };
  const densities = Object.entries(values.densities).flatMap(([density, set]) =>
    set[token] === undefined ? [] : [{ density, value: set[token] }],
  );
  if (densities.length > 0) return { kind: 'density', values: densities };
  if (perScheme.has(token)) return { kind: 'scheme' };
  const fallback = stylesheetFallback(css, token);
  return fallback === undefined ? { kind: 'none' } : { kind: 'value', value: fallback };
}

function tokens(family: string): Pick<FamilyReference, 'familyTokens' | 'themeTokens'> {
  const names = JSON.parse(read(`packages/styles/src/${family}/${family}.tokens.json`)) as string[];
  const css = read(`packages/styles/src/${family}/${family}.css`);
  const rows = names.map((name) => ({ name, defaultValue: tokenDefault(name, css) }));
  const own = `--slotted-${family}-`;
  return {
    familyTokens: rows.filter((row) => row.name.startsWith(own)),
    themeTokens: rows.filter((row) => !row.name.startsWith(own)),
  };
}

export async function familyReference(
  framework: Framework,
  family: string,
): Promise<FamilyReference> {
  return {
    members: await members(framework, family),
    keyboard: keyboard(family),
    ...tokens(family),
  };
}

/**
 * Whether a row applies to the member itself rather than to one of its parts:
 * `Field`, `slField` and `[slField]` all name the member `field`.
 */
export function appliesToMember(appliesTo: string, member: Member): boolean {
  const normal = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
  const key = normal(member.key);
  return [key, `sl${key}`].includes(normal(appliesTo));
}
