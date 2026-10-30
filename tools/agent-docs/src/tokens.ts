import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  dimensionValues,
  groupCovers,
  type TokenGroup,
} from '../../../packages/theme/src/token-groups.ts';

/**
 * The published `tokens.md`: the theme's groups an element of the
 * application's own reads, with the default theme's values. Generated from
 * `packages/theme/src/contract.json` and
 * `packages/themes/src/default/values.json`; never written by hand.
 */
export interface ThemeToken {
  name: string;
  layer: string;
  axis: 'base' | 'scheme' | 'density';
}
export interface ThemeValues {
  base: Record<string, string>;
  densities: Record<string, Record<string, string>>;
  reducedMotion: Record<string, string>;
}
export interface TokenSource {
  tokens: ThemeToken[];
  groups: TokenGroup[];
  values: ThemeValues;
}

const DENSITIES = ['comfortable', 'compact', 'dense'] as const;

export function loadTokenSource(root: string): TokenSource {
  const read = (path: string) => JSON.parse(readFileSync(join(root, path), 'utf8'));
  const contract = read('packages/theme/src/contract.json') as {
    tokens: ThemeToken[];
    groups?: TokenGroup[];
  };
  return {
    tokens: contract.tokens,
    groups: contract.groups ?? [],
    values: read('packages/themes/src/default/values.json') as ThemeValues,
  };
}

/** `value` with each `var()` replaced by its value in `scope`, then in `base`; one with no value stays. */
export function resolveValue(
  value: string,
  scope: Record<string, string>,
  base: Record<string, string>,
  depth = 0,
): string {
  return value.replace(/var\((--slotted-[a-z0-9-]+)\)/g, (whole, name: string) => {
    const next = scope[name] ?? base[name];
    return next === undefined || depth > 8 ? whole : resolveValue(next, scope, base, depth + 1);
  });
}

function valueCell(token: ThemeToken, values: ThemeValues): string {
  if (token.axis === 'scheme') return 'by scheme';
  if (token.axis === 'density')
    return DENSITIES.map((density) => {
      const scope = values.densities[density] ?? {};
      const value = scope[token.name];
      return `${density} ${value === undefined ? '—' : resolveValue(value, scope, values.base)}`;
    }).join(', ');
  const value = values.base[token.name];
  const resolved = value === undefined ? '—' : resolveValue(value, {}, values.base);
  const reduced =
    value === undefined
      ? resolved
      : (values.reducedMotion[token.name] ??
        resolveValue(value, values.reducedMotion, values.base));
  return reduced === resolved ? resolved : `${resolved}; ${reduced} under reduced motion`;
}

export function meaningCell(group: TokenGroup, name: string): string {
  if (group.tokens !== undefined) return group.tokens[name] ?? '—';
  const meanings = Object.entries(dimensionValues(group, name)).flatMap(([slot, value]) => {
    const dimension = group.dimensions?.[slot];
    return dimension === undefined || dimension === 'open' ? [] : [dimension[value] ?? ''];
  });
  return meanings.length === 0 ? '—' : meanings.join(' ');
}

const INTRO = [
  '# Tokens',
  '',
  'The theme states every value the families draw with. An element of the application\'s own reads the groups on this page, never a literal, and never a token of a group under "Read by their family only" (CP-05, OE-01).',
  '',
  "A primitive is a step on a scale; a semantic token says what a value is for. Values are the default theme's. A color has no value here: it changes with the scheme — light, dark, high-contrast — and is chosen by its role. A value that follows density is given for comfortable, compact and dense.",
  '',
];

export function renderTokens(source: TokenSource): string {
  const lines = [...INTRO];
  const members = (group: TokenGroup) =>
    source.tokens.filter((token) => groupCovers(group, token.name));
  for (const group of source.groups.filter((group) => group.reader === 'application')) {
    lines.push(`## ${group.id}`, '', group.purpose, '');
    const dimensions = Object.entries(group.dimensions ?? {});
    if (group.pattern !== undefined) {
      lines.push(`Names: ${group.pattern}`, '');
      for (const [slot, meanings] of dimensions)
        if (meanings !== 'open')
          lines.push(
            `| ${slot} | Meaning |`,
            '| --- | --- |',
            ...Object.entries(meanings).map(([value, meaning]) => `| ${value} | ${meaning} |`),
            '',
          );
    }
    const tokens = members(group);
    const derivable =
      group.pattern !== undefined && dimensions.every(([, meanings]) => meanings !== 'open');
    if (derivable && tokens.every((token) => token.axis === 'scheme')) continue;
    lines.push(
      '| Token | Meaning | Default value |',
      '| --- | --- | --- |',
      ...tokens.map(
        (token) =>
          `| \`${token.name}\` | ${meaningCell(group, token.name)} | ${valueCell(token, source.values)} |`,
      ),
      '',
    );
  }
  const family = source.groups.filter((group) => group.reader === 'family');
  if (family.length > 0)
    lines.push(
      '## Read by their family only',
      '',
      "A family adjusts these for itself. An element of the application's own does not read them.",
      '',
      ...family.map(
        (group) =>
          `- ${group.id}: ${group.purpose.replaceAll('`', '')} Names: ${group.pattern ?? Object.keys(group.tokens ?? {}).join(', ')}`,
      ),
      '',
    );
  return lines.join('\n');
}
