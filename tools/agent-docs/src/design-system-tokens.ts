import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { groupCovers, type TokenGroup } from '../../../packages/theme/src/token-groups.ts';
import { meaningCell, resolveValue, type TokenSource } from './tokens.ts';

/**
 * `project/tokens.json` of the Design System export: the default theme's
 * values in the type's grammar (lists of `{name, value, usage}`, colours as
 * hex per scheme), each usage note the purpose and meaning the theme
 * contract's groups give, as `tokens.md` reads them.
 */
export const SCHEMES = ['light', 'dark', 'high-contrast'] as const;
export type Scheme = (typeof SCHEMES)[number];

/** `flattenTheme` of a theme: base values, and every scheme's values with the recipe evaluated. */
export interface FlatTheme {
  base: Record<string, string>;
  schemes: Record<Scheme, Record<string, string>>;
}

export interface Entry {
  name: string;
  value: string;
  usage: string;
}
export interface SchemeEntry {
  name: string;
  value: Record<Scheme, string>;
  usage: string;
}
export interface FontFile {
  family: string;
  file: string;
  weight: string;
  style: 'normal' | 'italic';
}
export interface TypeStyle {
  name: string;
  fontSize: string;
  lineHeight: string;
  fontWeight: number;
  usage: string;
}
export interface DesignTokens {
  name: string;
  version: 1;
  meta: Record<string, unknown>;
  color: { themes: { id: Scheme; name: string }[]; tokens: SchemeEntry[] };
  type: {
    fonts: FontFile[];
    families: Record<string, string>;
    groups: { name: string; family: string; styles: TypeStyle[] }[];
  };
  spacing: { tokens: Entry[] };
  radius: { tokens: Entry[] };
  borderWidth: { tokens: Entry[] };
  zIndex: { tokens: Entry[] };
  shadow: { tokens: SchemeEntry[] };
}

const THEME_NAMES: Record<Scheme, string> = {
  light: 'Light',
  dark: 'Dark',
  'high-contrast': 'High contrast',
};
/** A colour the type reads: hex, or a colour function of plain numbers (`format.md`). */
const COLOR =
  /^(?:#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|(?:rgba?|hsla?|oklch|oklab|lab|lch)\([0-9.%\s,/+-]+\))$/;

/**
 * A share of a colour over transparency, as a state layer is written, read as
 * the colour itself at that alpha: interpolation is premultiplied, so mixing
 * with `transparent` keeps the hue and scales only the alpha.
 */
function overTransparency(value: string): string {
  const match = /^color-mix\(in [a-z]+, #([0-9a-f]{6}) ([0-9.]+)%, transparent\)$/.exec(value);
  if (match === null) return value;
  const [r, g, b] = [0, 2, 4].map((at) => Number.parseInt(match[1]!.slice(at, at + 2), 16));
  return `rgb(${r} ${g} ${b} / ${Number(match[2]) / 100})`;
}

export async function loadFlatTheme(root: string): Promise<FlatTheme> {
  const url = (path: string) => pathToFileURL(join(root, path)).href;
  const { flattenTheme } = (await import(url('packages/theme/dist/index.js'))) as {
    flattenTheme: (theme: unknown) => FlatTheme;
  };
  const { default: theme } = (await import(url('packages/themes/src/default/theme.mjs'))) as {
    default: unknown;
  };
  return flattenTheme(theme);
}

function usage(group: TokenGroup, name: string): string {
  const meaning = meaningCell(group, name);
  return meaning === '—' ? group.purpose : `${group.purpose} ${meaning}`;
}

export function designTokens(input: {
  source: TokenSource;
  flat: FlatTheme;
  meta: { ref: string; synced: string };
  fonts?: FontFile[];
}): { tokens: DesignTokens; dropped: string[] } {
  const { source, flat } = input;
  const dropped: string[] = [];
  const group = (id: string) => source.groups.find((entry) => entry.id === id)!;
  const members = (id: string) =>
    source.tokens.filter((token) => groupCovers(group(id), token.name));
  const base = (name: string) => resolveValue(flat.base[name] ?? '', {}, flat.base);
  const inScheme = (name: string, scheme: Scheme) =>
    resolveValue(
      flat.schemes[scheme][name] ?? flat.base[name] ?? '',
      flat.schemes[scheme],
      flat.base,
    );
  const entries = (id: string): Entry[] =>
    members(id).map((token) => ({
      name: token.name.slice(2),
      value: base(token.name),
      usage: usage(group(id), token.name),
    }));
  const bySchemes = (name: string) =>
    Object.fromEntries(SCHEMES.map((scheme) => [scheme, inScheme(name, scheme)])) as Record<
      Scheme,
      string
    >;

  const colors: SchemeEntry[] = [];
  for (const entry of source.groups.filter(
    (candidate) => candidate.reader === 'application' && candidate.id !== 'shadow',
  ))
    for (const token of source.tokens.filter(
      (candidate) => candidate.axis === 'scheme' && groupCovers(entry, candidate.name),
    )) {
      const value = Object.fromEntries(
        SCHEMES.map((scheme) => [
          scheme,
          overTransparency(inScheme(token.name, scheme).toLowerCase()),
        ]),
      ) as Record<Scheme, string>;
      if (Object.values(value).every((one) => COLOR.test(one)))
        colors.push({ name: token.name.slice(2), value, usage: usage(entry, token.name) });
      else dropped.push(token.name);
    }

  const step = (name: string, prefix: string) => name.slice(prefix.length);
  const families = Object.fromEntries(
    members('font-family').map((token) => [
      step(token.name, '--slotted-font-family-'),
      base(token.name),
    ]),
  );
  const styles = members('font-size').map((token) => {
    const name = step(token.name, '--slotted-font-size-');
    return {
      name,
      fontSize: base(token.name),
      lineHeight: base(`--slotted-line-height-${name}`),
      fontWeight: Number(base('--slotted-font-weight-regular')),
      usage: usage(group('font-size'), token.name),
    };
  });

  return {
    dropped,
    tokens: {
      name: 'Slotted',
      version: 1,
      meta: {
        source: 'github',
        repo: 'andrelopes-code/slotted',
        ref: input.meta.ref,
        package: 'packages/theme',
        paths: {
          tokens: ['packages/theme/src/contract.json', 'packages/themes/src/default/theme.mjs'],
          fonts: (input.fonts ?? []).map((font) => font.file),
        },
        synced: input.meta.synced,
      },
      color: { themes: SCHEMES.map((id) => ({ id, name: THEME_NAMES[id] })), tokens: colors },
      type: {
        fonts: input.fonts ?? [],
        families,
        groups: [{ name: 'Text', family: 'sans', styles }],
      },
      spacing: { tokens: entries('space') },
      radius: { tokens: entries('radius') },
      borderWidth: { tokens: entries('border-width') },
      zIndex: { tokens: entries('z-index') },
      shadow: {
        tokens: members('shadow').map((token) => ({
          name: token.name.slice(2),
          value: bySchemes(token.name),
          usage: usage(group('shadow'), token.name),
        })),
      },
    },
  };
}
