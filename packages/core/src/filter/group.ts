/**
 * A filter one level up from the column: several fields, and groups of them.
 *
 * `descriptor.ts` holds what one column's filter is, and `parseFilter` refuses
 * more than two conditions in it with `filter-bar` named as the reason. This is
 * that reason. A **rule** is a field and the descriptor `table` already edits in
 * that field's header, unchanged, so a screen offering both the header and the
 * bar holds one object; a **group** is a join and a list of rules and groups.
 *
 * Every surveyed bar that holds a map of fields — Polaris, Fiori, PatternFly,
 * EUI, Carbon, MUI — is a group with `join: 'and'` and no nested group, which
 * is why the first level has map-shaped helpers of its own. AG Grid's Advanced
 * Filter and react-querybuilder nest, and `docs/process/build-order.md` assigns the
 * nesting here by name.
 *
 * Every field is JSON, as the descriptor's are, and the rule the descriptor
 * states for an unfinished condition holds one level up: a leaf that is
 * inactive is dropped, a group that is then empty is dropped, and a group with
 * nothing active matches everything.
 */

import { createFilter } from '../collection/filter';
import { describeFilter, type FilterDescriptionFormat } from './describe';
import { normalizeFilter, type FilterDescriptor, type FilterJoin } from './descriptor';
import { createFilterPredicate, type FilterMatchOptions } from './predicate';
import { parseFilter, serializeFilter } from './serialize';

export interface FilterRule {
  readonly field: string;
  readonly filter: FilterDescriptor;
}

export interface FilterGroup {
  readonly join: FilterJoin;
  readonly rules: readonly FilterNode[];
}

export type FilterNode = FilterRule | FilterGroup;

/** A path of indices from the root group to a node. `[]` is the root. */
export type FilterPath = readonly number[];

export function isFilterGroup(node: FilterNode | null | undefined): node is FilterGroup {
  return node !== null && node !== undefined && 'rules' in node;
}

export function isFilterRule(node: FilterNode | null | undefined): node is FilterRule {
  return node !== null && node !== undefined && 'field' in node;
}

export function emptyFilterGroup(join: FilterJoin = 'and'): FilterGroup {
  return { join, rules: [] };
}

/**
 * The group with nothing incomplete left in it, or `null` when that leaves
 * nothing at all — the value a consumer stores and a URL carries. A nested
 * group survives only while something inside it does.
 */
export function normalizeFilterGroup(group: FilterGroup | null | undefined): FilterGroup | null {
  if (!group) return null;
  const rules: FilterNode[] = [];
  for (const node of group.rules) {
    if (isFilterGroup(node)) {
      const inner = normalizeFilterGroup(node);
      if (inner) rules.push(inner);
      continue;
    }
    const filter = normalizeFilter(node.filter);
    if (filter) rules.push({ field: node.field, filter });
  }
  return rules.length === 0 ? null : { join: group.join, rules };
}

export function isFilterGroupActive(group: FilterGroup | null | undefined): boolean {
  return normalizeFilterGroup(group) !== null;
}

/** The first-level rules, which is what a chip and a pinned pill draw. */
export function firstLevelRules(group: FilterGroup | null | undefined): readonly FilterRule[] {
  return group ? group.rules.filter(isFilterRule) : [];
}

/** The first-level rule for a field, or `undefined` — what a column header reads. */
export function ruleFor(
  group: FilterGroup | null | undefined,
  field: string,
): FilterDescriptor | undefined {
  return firstLevelRules(group).find((rule) => rule.field === field)?.filter;
}

/**
 * The group with the first-level rule for one field replaced, appended, or —
 * with `null` — removed. What a column header writes, and what a pill's
 * popover writes. A rule for the same field nested deeper is not touched: it
 * is a different condition, and the builder is where it is edited.
 */
export function withRuleFor(
  group: FilterGroup | null | undefined,
  field: string,
  filter: FilterDescriptor | null,
): FilterGroup {
  const base = group ?? emptyFilterGroup();
  const index = base.rules.findIndex((node) => isFilterRule(node) && node.field === field);
  const rules = [...base.rules];
  if (filter === null) {
    if (index !== -1) rules.splice(index, 1);
  } else if (index === -1) {
    rules.push({ field, filter });
  } else {
    rules[index] = { field, filter };
  }
  return { join: base.join, rules };
}

export function withoutRuleFor(group: FilterGroup | null | undefined, field: string): FilterGroup {
  return withRuleFor(group, field, null);
}

function nodeAt(group: FilterGroup, path: FilterPath): FilterNode | undefined {
  let node: FilterNode | undefined = group;
  for (const index of path) {
    if (!isFilterGroup(node)) return undefined;
    node = node.rules[index];
  }
  return node;
}

function replaceAt(
  group: FilterGroup,
  path: FilterPath,
  replace: (rules: FilterNode[]) => void,
): FilterGroup {
  if (path.length === 0) {
    const rules = [...group.rules];
    replace(rules);
    return { join: group.join, rules };
  }
  const [head, ...rest] = path as [number, ...number[]];
  const child = group.rules[head];
  if (!isFilterGroup(child)) return group;
  const rules = [...group.rules];
  rules[head] = replaceAt(child, rest, replace);
  return { join: group.join, rules };
}

/** The group with the node at `path` replaced. The root — `[]` — replaces itself. */
export function updateNodeAt(group: FilterGroup, path: FilterPath, node: FilterNode): FilterGroup {
  if (path.length === 0) return isFilterGroup(node) ? node : group;
  const parent = path.slice(0, -1);
  const index = path[path.length - 1]!;
  return replaceAt(group, parent, (rules) => {
    if (index < rules.length) rules[index] = node;
  });
}

/** The group with the node at `path` removed. The root cannot be removed. */
export function removeNodeAt(group: FilterGroup, path: FilterPath): FilterGroup {
  if (path.length === 0) return group;
  const parent = path.slice(0, -1);
  const index = path[path.length - 1]!;
  return replaceAt(group, parent, (rules) => {
    if (index < rules.length) rules.splice(index, 1);
  });
}

/**
 * The group with `node` appended to the group at `path`, or inserted before
 * `index` inside it.
 */
export function insertNodeAt(
  group: FilterGroup,
  path: FilterPath,
  node: FilterNode,
  index?: number,
): FilterGroup {
  if (!isFilterGroup(nodeAt(group, path))) return group;
  return replaceAt(group, path, (rules) => {
    rules.splice(index === undefined ? rules.length : Math.min(index, rules.length), 0, node);
  });
}

export function withGroupJoin(group: FilterGroup, path: FilterPath, join: FilterJoin): FilterGroup {
  const target = nodeAt(group, path);
  if (!isFilterGroup(target)) return group;
  return updateNodeAt(group, path, { join, rules: target.rules });
}

/** The fields the group names, at every depth, each once. */
export function fieldsOf(group: FilterGroup | null | undefined): readonly string[] {
  const fields = new Set<string>();
  const walk = (node: FilterNode) => {
    if (isFilterGroup(node)) node.rules.forEach(walk);
    else fields.add(node.field);
  };
  if (group) walk(group);
  return [...fields];
}

/**
 * One predicate for the whole tree, built once: a `createFilterPredicate` per
 * leaf, `and` and `or` composed over them. An inactive leaf is dropped first,
 * so an unfinished condition under `or` does not match every row.
 */
export function createFilterGroupPredicate<Row>(
  group: FilterGroup | null | undefined,
  read: (row: Row, field: string) => unknown,
  options: FilterMatchOptions = {},
): (row: Row) => boolean {
  const active = normalizeFilterGroup(group);
  if (!active) return () => true;

  const compile = (node: FilterNode): ((row: Row) => boolean) => {
    if (isFilterRule(node)) {
      const predicate = createFilterPredicate(node.filter, options);
      return (row) => predicate(read(row, node.field));
    }
    const members = node.rules.map(compile);
    return node.join === 'and'
      ? (row) => members.every((member) => member(row))
      : (row) => members.some((member) => member(row));
  };

  return compile(active);
}

/**
 * The one condition that belongs to no column: a `contains` against every
 * named field, `or`-joined, through the collator the typed conditions use. An
 * empty query matches everything, as an empty filter does.
 */
export function createSearchPredicate<Row>(
  query: string,
  read: (row: Row, field: string) => unknown,
  fields: readonly string[],
  options: FilterMatchOptions = {},
): (row: Row) => boolean {
  const needle = query.trim();
  if (needle === '' || fields.length === 0) return () => true;
  const filter = createFilter({ locale: options.locale });
  return (row) =>
    fields.some((field) => {
      const value = read(row, field);
      if (value === null || value === undefined) return false;
      if (Array.isArray(value)) return value.some((item) => filter.contains(String(item), needle));
      return filter.contains(String(value), needle);
    });
}

export interface FilterGroupDescriptionFormat extends FilterDescriptionFormat {
  /** The field's name in the reader's language. */
  field: (field: string) => string;
  /** The brackets round a nested group. Defaults to `(` and `)`. */
  group?: (inner: string) => string;
}

/**
 * The tree as a sentence — "Status any of paid, refunded and (Amount greater
 * than 100 or Customer contains ana)" — composed from `describeFilter`, so a
 * chip, the collapsed summary and `table`'s own announcement say the same
 * thing about the same rule.
 */
export function describeFilterGroup(
  group: FilterGroup | null | undefined,
  format: FilterGroupDescriptionFormat,
): string {
  const active = normalizeFilterGroup(group);
  if (!active) return '';
  const bracket = format.group ?? ((inner: string) => `(${inner})`);

  const describe = (node: FilterNode, depth: number): string => {
    if (isFilterRule(node)) {
      return `${format.field(node.field)} ${describeFilter(node.filter, format)}`;
    }
    const inner = node.rules
      .map((member) => describe(member, depth + 1))
      .join(` ${format.join(node.join)} `);
    return depth === 0 ? inner : bracket(inner);
  };

  return describe(active, 0);
}

/*
 * The URL form.
 *
 *   and(status~set~and~anyOf:paid,refunded|or(amount~number~and~greaterThan:100|customer~text~and~contains:ana))
 *
 * A rule is the field's key, `~`, and `serializeFilter` of its descriptor
 * unchanged. A group is its join, `(`, its members separated by `|`, `)`.
 * `encodeURIComponent` leaves `(` and `)` alone, so the three structural
 * characters are percent-encoded a second time inside a serialised rule, where
 * they can only be operand text or a field key; `decodeURIComponent` inside
 * `parseFilter` turns them back.
 */
const OPEN = '(';
const CLOSE = ')';
const SEPARATOR = '|';
const FIELD = '~';
const JOINS: readonly FilterJoin[] = ['and', 'or'];

function shield(text: string): string {
  return text.replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\|/g, '%7C');
}

function encodeField(field: string): string {
  return shield(encodeURIComponent(field).replace(/~/g, '%7E'));
}

function decodeField(text: string): string | null {
  try {
    return decodeURIComponent(text);
  } catch {
    return null;
  }
}

export function serializeFilterGroup(group: FilterGroup | null | undefined): string {
  const active = normalizeFilterGroup(group);
  if (!active) return '';

  const write = (node: FilterNode): string => {
    if (isFilterRule(node)) {
      return `${encodeField(node.field)}${FIELD}${shield(serializeFilter(node.filter))}`;
    }
    return `${node.join}${OPEN}${node.rules.map(write).join(SEPARATOR)}${CLOSE}`;
  };

  return write(active);
}

/**
 * Total, as `parseFilter` is: an unbalanced bracket, an unknown join, an empty
 * group, a rule `parseFilter` refuses — all give `null`, so a bookmark from an
 * older application degrades to no filter rather than to an error.
 */
export function parseFilterGroup(text: string | null | undefined): FilterGroup | null {
  if (!text) return null;
  let at = 0;

  const readGroup = (): FilterGroup | null => {
    const open = text.indexOf(OPEN, at);
    if (open === -1) return null;
    const join = text.slice(at, open);
    if (!JOINS.includes(join as FilterJoin)) return null;
    at = open + 1;

    const rules: FilterNode[] = [];
    for (;;) {
      if (at >= text.length) return null;
      const node = readNode();
      if (!node) return null;
      rules.push(node);
      const next = text[at];
      if (next === SEPARATOR) {
        at += 1;
        continue;
      }
      if (next === CLOSE) {
        at += 1;
        break;
      }
      return null;
    }
    return rules.length === 0 ? null : { join: join as FilterJoin, rules };
  };

  const readNode = (): FilterNode | null => {
    const rest = text.slice(at);
    const group = /^(and|or)\(/.exec(rest);
    if (group) return readGroup();

    let end = at;
    while (end < text.length && text[end] !== SEPARATOR && text[end] !== CLOSE) end += 1;
    const written = text.slice(at, end);
    at = end;

    const split = written.indexOf(FIELD);
    if (split <= 0) return null;
    const field = decodeField(written.slice(0, split));
    const filter = parseFilter(written.slice(split + 1));
    if (field === null || field === '' || !filter) return null;
    return { field, filter };
  };

  const group = readGroup();
  return group && at === text.length ? group : null;
}

export interface FilterBarParamOptions {
  /** The parameter that carries the tree. */
  filterParam?: string;
  /** The parameter that carries the query. */
  queryParam?: string;
  /** The prefix of the per-column parameters `toFilterParams` writes. */
  prefix?: string;
}

export interface FilterBarState {
  readonly filter: FilterGroup | null;
  readonly query: string;
}

const DEFAULT_FILTER_PARAM = 'f';
const DEFAULT_QUERY_PARAM = 'q';
const DEFAULT_PREFIX = 'f.';

/** `f` for the tree and `q` for the query, each only when it holds something. */
export function toFilterBarParams(
  state: Partial<FilterBarState>,
  {
    filterParam = DEFAULT_FILTER_PARAM,
    queryParam = DEFAULT_QUERY_PARAM,
  }: FilterBarParamOptions = {},
): URLSearchParams {
  const params = new URLSearchParams();
  const written = serializeFilterGroup(state.filter);
  if (written !== '') params.set(filterParam, written);
  const query = (state.query ?? '').trim();
  if (query !== '') params.set(queryParam, query);
  return params;
}

/**
 * Reads `f` and `q`; when `f` is absent, the per-column parameters
 * `toFilterParams` writes become a first-level `and` group, so a bookmark
 * written by a screen that only had column filters opens in one that has the
 * bar.
 */
export function fromFilterBarParams(
  input: URLSearchParams | string,
  {
    filterParam = DEFAULT_FILTER_PARAM,
    queryParam = DEFAULT_QUERY_PARAM,
    prefix = DEFAULT_PREFIX,
  }: FilterBarParamOptions = {},
): FilterBarState {
  const params = typeof input === 'string' ? new URLSearchParams(input) : input;
  const query = params.get(queryParam) ?? '';

  const tree = params.get(filterParam);
  if (tree !== null) return { filter: parseFilterGroup(tree), query };

  const rules: FilterRule[] = [];
  for (const [key, value] of params) {
    if (!key.startsWith(prefix)) continue;
    const field = key.slice(prefix.length);
    const filter = parseFilter(value);
    if (field !== '' && filter) rules.push({ field, filter });
  }
  return { filter: rules.length === 0 ? null : { join: 'and', rules }, query };
}
