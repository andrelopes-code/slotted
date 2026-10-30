import type { TokenDefinition } from './contract-types';

/**
 * What each token of the contract is for. A group covers its tokens by a
 * pattern of `{dimension}` slots or by a list of names. The published token
 * page is generated from the groups, and `groupErrors` holds them complete:
 * every token in exactly one group, every meaning stated.
 */
export interface TokenGroup {
  readonly id: string;
  readonly purpose: string;
  /** `application`: an element of the application's own reads it. `family`: only its family does. */
  readonly reader: 'application' | 'family';
  readonly pattern?: string;
  /** Per slot: the meaning of each value, or `open` for values with no meaning of their own. */
  readonly dimensions?: Readonly<Record<string, Readonly<Record<string, string>> | 'open'>>;
  readonly tokens?: Readonly<Record<string, string>>;
}

const SLOT = /\{([a-z]+)\}/g;
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function slots(group: TokenGroup): string[] {
  return [...(group.pattern ?? '').matchAll(SLOT)].map(([, name]) => name!);
}

function patternRegExp(group: TokenGroup): RegExp {
  const source = (group.pattern ?? '')
    .split(/(\{[a-z]+\})/)
    .map((piece) => {
      const slot = /^\{([a-z]+)\}$/.exec(piece)?.[1];
      if (slot === undefined) return escape(piece);
      const dimension = group.dimensions?.[slot];
      if (dimension === undefined || dimension === 'open') return '([a-z0-9]+(?:-[a-z0-9]+)*)';
      const values = Object.keys(dimension).sort((a, b) => b.length - a.length);
      return `(${values.map(escape).join('|')})`;
    })
    .join('');
  return new RegExp(`^${source}$`);
}

export function groupCovers(group: TokenGroup, name: string): boolean {
  if (group.tokens !== undefined) return name in group.tokens;
  return group.pattern !== undefined && patternRegExp(group).test(name);
}

/** The value a token takes in each slot of its group's pattern. */
export function dimensionValues(group: TokenGroup, name: string): Record<string, string> {
  const match = patternRegExp(group).exec(name);
  if (match === null) return {};
  return Object.fromEntries(slots(group).map((slot, index) => [slot, match[index + 1]!]));
}

function combinations(group: TokenGroup): string[] | undefined {
  let names = [group.pattern ?? ''];
  for (const slot of slots(group)) {
    const dimension = group.dimensions?.[slot];
    if (dimension === undefined || dimension === 'open') return undefined;
    names = names.flatMap((name) =>
      Object.keys(dimension).map((value) => name.replace(`{${slot}}`, value)),
    );
  }
  return names;
}

export function groupErrors(
  tokens: readonly TokenDefinition[],
  groups: readonly TokenGroup[],
): string[] {
  const errors: string[] = [];
  const names = new Set(tokens.map((token) => token.name));
  for (const group of groups) {
    if ((group.pattern === undefined) === (group.tokens === undefined))
      errors.push(`${group.id}: has a pattern or tokens, not both`);
    const declared = Object.keys(group.dimensions ?? {});
    for (const slot of slots(group))
      if (!declared.includes(slot)) errors.push(`${group.id}: slot {${slot}} has no dimension`);
    for (const dimension of declared)
      if (!slots(group).includes(dimension))
        errors.push(`${group.id}: dimension ${dimension} is not in the pattern`);
    for (const [dimension, meanings] of Object.entries(group.dimensions ?? {}))
      if (meanings !== 'open')
        for (const [value, meaning] of Object.entries(meanings))
          if (meaning.trim() === '')
            errors.push(`${group.id}: ${dimension} ${value} has no meaning`);
    for (const [name, meaning] of Object.entries(group.tokens ?? {})) {
      if (!names.has(name)) errors.push(`${group.id}: ${name} is not in the contract`);
      if (meaning.trim() === '') errors.push(`${group.id}: ${name} has no meaning`);
    }
    if (group.pattern !== undefined && group.tokens === undefined)
      for (const name of combinations(group) ?? [])
        if (!names.has(name)) errors.push(`${group.id}: ${name} is missing`);
    if (!tokens.some((token) => groupCovers(group, token.name)))
      errors.push(`${group.id}: covers no token`);
  }
  for (const token of tokens) {
    const covering = groups.filter((group) => groupCovers(group, token.name));
    if (covering.length === 0) errors.push(`${token.name}: in no group`);
    if (covering.length > 1)
      errors.push(`${token.name}: in groups ${covering.map((group) => group.id).join(', ')}`);
    if (token.layer === 'component')
      for (const group of covering)
        if (group.reader === 'application')
          errors.push(`${token.name}: a component token in the application group ${group.id}`);
  }
  return errors.sort();
}
