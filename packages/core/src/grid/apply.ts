/**
 * The query applied to the rows: filter, search, sort, group, page, in that
 * order. Pure, so a consumer's server mock and the family agree on what the
 * grid shows, and so a test can hold the order.
 */

import {
  createFilterGroupPredicate,
  createSearchPredicate,
  type FilterMatchOptions,
} from '../filter';
import type { GridAggregate, GridColumn, GridNode, GridQuery, SortKey, GridTree } from './types';
import { GROUP_ROW_PREFIX } from './types';

/** The domain value a column reads from a row. */
export function cellValue<Row>(column: GridColumn<Row>, row: Row): unknown {
  const accessor = column.accessor;
  if (typeof accessor === 'function') return accessor(row);
  const key = (accessor ?? column.id) as keyof Row;
  return (row as Record<keyof Row, unknown>)[key];
}

export interface FormatOptions {
  locale?: string | undefined;
  timeZone?: string | undefined;
  /**
   * What a boolean says, in the language of the caller's catalog. Required:
   * core writes no words of its own.
   */
  booleans: { readonly true: string; readonly false: string };
}

const numberFormats = new Map<string, Intl.NumberFormat>();
const dateFormats = new Map<string, Intl.DateTimeFormat>();

function numberFormat(locale: string | undefined): Intl.NumberFormat {
  const key = locale ?? '';
  let format = numberFormats.get(key);
  if (!format) {
    format = new Intl.NumberFormat(locale);
    numberFormats.set(key, format);
  }
  return format;
}

function dateFormat(
  locale: string | undefined,
  kind: 'date' | 'time' | 'datetime',
  timeZone: string | undefined,
): Intl.DateTimeFormat {
  const key = `${locale ?? ''}|${kind}|${timeZone ?? ''}`;
  let format = dateFormats.get(key);
  if (!format) {
    const options: Intl.DateTimeFormatOptions =
      kind === 'date'
        ? { dateStyle: 'medium' }
        : kind === 'time'
          ? { timeStyle: 'short' }
          : { dateStyle: 'medium', timeStyle: 'short' };
    if (timeZone) options.timeZone = timeZone;
    format = new Intl.DateTimeFormat(locale, options);
    dateFormats.set(key, format);
  }
  return format;
}

/**
 * ISO text the wall-clock kinds hold, read as a date without a zone shift: a
 * day is the day the reader wrote, wherever it is formatted.
 */
function isoToDate(kind: 'date' | 'time' | 'datetime', text: string): Date | null {
  if (kind === 'time') {
    const match = /^(\d{2})(?::(\d{2}))?(?::(\d{2}))?/.exec(text);
    if (!match) return null;
    return new Date(2000, 0, 1, Number(match[1]), Number(match[2] ?? 0), Number(match[3] ?? 0));
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2})(?::(\d{2}))?(?::(\d{2}))?)?/.exec(text);
  if (!match) return null;
  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4] ?? 0),
    Number(match[5] ?? 0),
    Number(match[6] ?? 0),
  );
}

/** The text a cell draws: the column's own `format`, else the kind's. */
export function cellText<Row>(column: GridColumn<Row>, row: Row, options: FormatOptions): string {
  const value = cellValue(column, row);
  if (column.format) return column.format(value, row);
  return formatValue(column.kind ?? 'text', value, column, options);
}

export function formatValue<Row>(
  kind: string,
  value: unknown,
  column: GridColumn<Row> | undefined,
  options: FormatOptions,
): string {
  if (value === null || value === undefined) return '';
  switch (kind) {
    case 'number':
      return typeof value === 'number' ? numberFormat(options.locale).format(value) : String(value);
    case 'boolean':
      return value ? options.booleans.true : options.booleans.false;
    case 'set': {
      const values = Array.isArray(value) ? value : [value];
      const names = new Map(column?.options?.map((option) => [option.value, option.label]) ?? []);
      return values.map((entry) => names.get(String(entry)) ?? String(entry)).join(', ');
    }
    case 'date':
    case 'time':
    case 'datetime': {
      const date =
        value instanceof Date ? value : typeof value === 'string' ? isoToDate(kind, value) : null;
      if (!date || Number.isNaN(date.getTime())) return String(value);
      return dateFormat(options.locale, kind, options.timeZone).format(date);
    }
    default:
      return Array.isArray(value) ? value.join(', ') : String(value);
  }
}

/* ── Sorting ─────────────────────────────────────────────────────────── */

const collators = new Map<string, Intl.Collator>();

function collator(locale: string | undefined): Intl.Collator {
  const key = locale ?? '';
  let instance = collators.get(key);
  if (!instance) {
    instance = new Intl.Collator(locale, { numeric: true, sensitivity: 'base' });
    collators.set(key, instance);
  }
  return instance;
}

/** Whether a value counts as absent, which sorts last whichever way the column goes. */
export function isEmptyValue(value: unknown): boolean {
  return value === null || value === undefined || value === '';
}

/** The comparator a kind implies, ascending, over two present values. */
export function compareValues(kind: string, a: unknown, b: unknown, locale?: string): number {
  const empties = Number(isEmptyValue(a)) - Number(isEmptyValue(b));
  if (empties !== 0 || isEmptyValue(a)) return empties;
  switch (kind) {
    case 'number':
      return Number(a) - Number(b);
    case 'boolean':
      return Number(Boolean(a)) - Number(Boolean(b));
    case 'date':
    case 'time':
    case 'datetime': {
      const left = a instanceof Date ? a.toISOString() : String(a);
      const right = b instanceof Date ? b.toISOString() : String(b);
      return left < right ? -1 : left > right ? 1 : 0;
    }
    case 'set': {
      const left = Array.isArray(a) ? a.join(',') : String(a);
      const right = Array.isArray(b) ? b.join(',') : String(b);
      return collator(locale).compare(left, right);
    }
    default:
      return collator(locale).compare(String(a), String(b));
  }
}

export function createComparator<Row>(
  columns: readonly GridColumn<Row>[],
  sort: readonly SortKey[],
  locale?: string,
): ((a: Row, b: Row) => number) | null {
  const keys = sort
    .map((key) => ({ key, column: columns.find((column) => column.id === key.column) }))
    .filter(
      (entry): entry is { key: SortKey; column: GridColumn<Row> } => entry.column !== undefined,
    );
  if (keys.length === 0) return null;
  return (a, b) => {
    for (const { key, column } of keys) {
      const left = cellValue(column, a);
      const right = cellValue(column, b);
      /* Empty last whichever way the column goes, which is what every
         spreadsheet does: the direction turns the comparison of two values,
         never the rule that an absent one comes after. */
      const empties = Number(isEmptyValue(left)) - Number(isEmptyValue(right));
      if (empties !== 0) return empties;
      if (isEmptyValue(left)) continue;
      const result = column.compare
        ? column.compare(left, right, [a, b])
        : compareValues(column.kind ?? 'text', left, right, locale);
      if (result !== 0) return key.direction === 'ascending' ? result : -result;
    }
    return 0;
  };
}

/* ── Aggregates ──────────────────────────────────────────────────────── */

export function aggregate(
  fn: GridAggregate | ((values: readonly unknown[]) => unknown),
  values: readonly unknown[],
): unknown {
  if (typeof fn === 'function') return fn(values);
  const numbers = values
    .filter((value) => value !== null && value !== undefined && value !== '')
    .map(Number)
    .filter((value) => Number.isFinite(value));
  switch (fn) {
    case 'count':
      return values.length;
    case 'sum':
      return numbers.reduce((total, value) => total + value, 0);
    case 'avg':
      return numbers.length === 0
        ? null
        : numbers.reduce((total, value) => total + value, 0) / numbers.length;
    case 'min':
      return numbers.length === 0 ? null : Math.min(...numbers);
    case 'max':
      return numbers.length === 0 ? null : Math.max(...numbers);
    default:
      return null;
  }
}

/** Every aggregating column's value over the rows, keyed by column id. */
export function aggregates<Row>(
  columns: readonly GridColumn<Row>[],
  rows: readonly Row[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const column of columns) {
    if (!column.aggregate) continue;
    result[column.id] = aggregate(
      column.aggregate,
      rows.map((row) => cellValue(column, row)),
    );
  }
  return result;
}

/* ── The whole query ─────────────────────────────────────────────────── */

export interface ApplyQueryOptions<Row> extends FilterMatchOptions, FormatOptions {
  /** The key of a row. */
  rowKey: (row: Row) => string;
  /** The group keys that are open, or `all`. Default `all`. */
  expandedGroups?: readonly string[] | 'all';
  /** Rows as a tree; `query.group` is ignored when set. */
  tree?: GridTree<Row> | undefined;
  /** The tree rows whose children are shown. Default none. */
  expanded?: readonly string[] | undefined;
}

export interface ApplyQueryResult<Row> {
  /** The body, in order: group nodes and the rows under the open ones, for the current page. */
  readonly nodes: readonly GridNode<Row>[];
  /** The rows the query kept, before paging and grouping. */
  readonly rows: readonly Row[];
  /** How many the query kept. */
  readonly total: number;
  /** Whether a page past this one exists. */
  readonly hasMore: boolean;
  /** The aggregates over every row the query kept. */
  readonly aggregates: Readonly<Record<string, unknown>>;
}

/** The key a group row carries: `carrier=DHL/status=Delayed`. */
export function groupKey(path: readonly { column: string; text: string }[]): string {
  return path.map((step) => `${step.column}=${step.text}`).join('/');
}

export function isGroupCursorRow(row: string): boolean {
  return row.startsWith(GROUP_ROW_PREFIX);
}

/**
 * Filter, search, sort, group, page. The page cuts the **rows**: a grouped
 * page holds the group rows its records fall under, so a group split across
 * two pages heads both.
 */
export function applyQuery<Row>(
  rows: readonly Row[],
  columns: readonly GridColumn<Row>[],
  query: GridQuery,
  options: ApplyQueryOptions<Row>,
): ApplyQueryResult<Row> {
  const read = (row: Row, field: string) => {
    const column = columns.find((entry) => entry.id === field);
    return column ? cellValue(column, row) : (row as Record<string, unknown>)[field];
  };
  const readText = (row: Row, field: string) => {
    const column = columns.find((entry) => entry.id === field);
    return column ? cellText(column, row, options) : (row as Record<string, unknown>)[field];
  };
  const match = createFilterGroupPredicate<Row>(query.filter, read, options);
  const searchable = columns
    .filter(
      (column) =>
        column.searchable ??
        ['text', 'number', 'date', 'time', 'datetime', 'boolean', 'set'].includes(
          column.kind ?? 'text',
        ),
    )
    .map((column) => column.id);
  const search = createSearchPredicate<Row>(query.search, readText, searchable, options);

  const comparator = createComparator(columns, query.sort, options.locale);
  if (options.tree)
    return applyTree(
      rows,
      columns,
      query,
      options,
      options.tree,
      (row) => match(row) && search(row),
      comparator,
    );

  let kept = rows.filter((row) => match(row) && search(row));
  if (comparator) kept = [...kept].sort(comparator);
  const total = kept.length;

  let paged = kept;
  let hasMore = false;
  if (query.page && 'index' in query.page && query.page.size > 0) {
    const from = query.page.index * query.page.size;
    paged = kept.slice(from, from + query.page.size);
    hasMore = from + query.page.size < total;
  }
  const offset = query.page && 'index' in query.page ? query.page.index * query.page.size : 0;

  const nodes = groupNodes(
    paged.map((row, index) => ({ row, index: offset + index })),
    columns,
    query.group,
    options,
    'bucket',
  );

  return { nodes, rows: kept, total, hasMore, aggregates: aggregates(columns, kept) };
}

/**
 * The body of a grouped page: a group node per value of each grouping column,
 * and the rows under the open ones. `bucket` gathers every row of a value into
 * one group, in the order the values first appear — the client's sorted rows.
 * `run` makes a group of each run of consecutive rows sharing a value, in the
 * order given — a server's page, already ordered for grouping; a value that
 * comes back after another run heads a group of its own, keyed apart.
 */
function groupNodes<Row>(
  entries: readonly { row: Row; index: number }[],
  columns: readonly GridColumn<Row>[],
  group: readonly string[],
  options: Pick<ApplyQueryOptions<Row>, 'rowKey' | 'expandedGroups'> & FormatOptions,
  gather: 'bucket' | 'run',
): GridNode<Row>[] {
  const groupColumns = group
    .map((id) => columns.find((column) => column.id === id))
    .filter((column): column is GridColumn<Row> => column !== undefined);
  const expanded = options.expandedGroups ?? 'all';
  const isOpen = (key: string) => expanded === 'all' || expanded.includes(key);

  const nodes: GridNode<Row>[] = [];
  if (groupColumns.length === 0) {
    for (const entry of entries) {
      nodes.push({
        kind: 'row',
        key: options.rowKey(entry.row),
        row: entry.row,
        index: entry.index,
        groups: [],
        ...LEAF,
      });
    }
    return nodes;
  }

  const seen = new Map<string, number>();
  const walk = (
    subset: readonly { row: Row; index: number }[],
    level: number,
    path: { column: string; text: string }[],
    parents: readonly string[],
  ) => {
    const column = groupColumns[level]!;
    const buckets: { value: unknown; text: string; rows: { row: Row; index: number }[] }[] = [];
    const byText = new Map<string, (typeof buckets)[number]>();
    for (const entry of subset) {
      const text = cellText(column, entry.row, options);
      const last = buckets.at(-1);
      let bucket = gather === 'run' ? (last?.text === text ? last : undefined) : byText.get(text);
      if (!bucket) {
        bucket = { value: cellValue(column, entry.row), text, rows: [] };
        buckets.push(bucket);
        byText.set(text, bucket);
      }
      bucket.rows.push(entry);
    }
    for (const bucket of buckets) {
      const steps = [...path, { column: column.id, text: bucket.text }];
      const base = groupKey(steps);
      const occurrence = (seen.get(base) ?? 0) + 1;
      seen.set(base, occurrence);
      const key = occurrence === 1 ? base : `${base}~${String(occurrence)}`;
      const open = isOpen(key);
      const groupRows = bucket.rows.map((entry) => entry.row);
      nodes.push({
        kind: 'group',
        key,
        column: column.id,
        value: bucket.value,
        text: bucket.text,
        level: level + 1,
        count: groupRows.length,
        rows: groupRows,
        aggregates: aggregates(columns, groupRows),
        expanded: open,
      });
      if (!open) continue;
      if (level + 1 < groupColumns.length) walk(bucket.rows, level + 1, steps, [...parents, key]);
      else {
        for (const entry of bucket.rows) {
          nodes.push({
            kind: 'row',
            key: options.rowKey(entry.row),
            row: entry.row,
            index: entry.index,
            groups: [...parents, key],
            ...LEAF,
          });
        }
      }
    }
  };
  walk(entries, 0, [], []);
  return nodes;
}

export interface GroupInOrderOptions<Row> extends FormatOptions {
  /** The key of a row. */
  rowKey: (row: Row) => string;
  /** The group keys that are open, or `all`. Default `all`. */
  expandedGroups?: readonly string[] | 'all';
  /** The index of the first row, when the rows are a page of a larger set. Default 0. */
  offset?: number;
}

/**
 * The rows a server sent, grouped in the order it sent them: consecutive rows
 * sharing the value of each column of `group` form one group, with its count
 * and its aggregates over the rows given. Nothing is filtered, sorted or paged:
 * that is the server's.
 */
export function groupInOrder<Row>(
  rows: readonly Row[],
  columns: readonly GridColumn<Row>[],
  group: readonly string[],
  options: GroupInOrderOptions<Row>,
): GridNode<Row>[] {
  const offset = options.offset ?? 0;
  return groupNodes(
    rows.map((row, index) => ({ row, index: offset + index })),
    columns,
    group,
    options,
    'run',
  );
}

/** What a row node says when there is no tree. */
const LEAF = { level: 1, parent: null, childCount: 0, open: false } as const;

/**
 * The tree: filter and search keep a row that matches or has a descendant
 * that matches, and every ancestor of a kept row; sorting is among siblings;
 * the open branches are flattened, roots first, and the page is a slice of
 * that flat list — the reader pages through what is on screen. A row whose
 * parent is not in `rows` is a root.
 */
function applyTree<Row>(
  rows: readonly Row[],
  columns: readonly GridColumn<Row>[],
  query: GridQuery,
  options: ApplyQueryOptions<Row>,
  tree: GridTree<Row>,
  keep: (row: Row) => boolean,
  comparator: ((a: Row, b: Row) => number) | null,
): ApplyQueryResult<Row> {
  const keyOf = options.rowKey;
  const present = new Set(rows.map(keyOf));
  const children = new Map<string | null, Row[]>();
  for (const row of rows) {
    const parent = tree.parentKey(row) ?? null;
    const under = parent !== null && present.has(parent) ? parent : null;
    let list = children.get(under);
    if (!list) {
      list = [];
      children.set(under, list);
    }
    list.push(row);
  }
  if (comparator) for (const list of children.values()) list.sort(comparator);

  /* A branch survives when it or anything under it does. */
  const kept = new Set<string>();
  const survives = (row: Row): boolean => {
    const key = keyOf(row);
    let alive = keep(row);
    for (const child of children.get(key) ?? []) if (survives(child)) alive = true;
    if (alive) kept.add(key);
    return alive;
  };
  for (const root of children.get(null) ?? []) survives(root);

  const open = new Set(options.expanded ?? []);
  const flat: GridNode<Row>[] = [];
  const keptRows: Row[] = [];
  /* Every kept row is walked, in tree order, so `rows` holds what the query
     kept whatever is open; only the rows under open branches become nodes. */
  const walk = (list: readonly Row[], level: number, parent: string | null, visible: boolean) => {
    for (const row of list) {
      const key = keyOf(row);
      if (!kept.has(key)) continue;
      keptRows.push(row);
      const under = (children.get(key) ?? []).filter((child) => kept.has(keyOf(child)));
      const branch = under.length > 0 || tree.hasChildren?.(row) === true;
      const shown = branch && open.has(key);
      if (visible) {
        flat.push({
          kind: 'row',
          key,
          row,
          index: flat.length,
          groups: [],
          level,
          parent,
          childCount: under.length,
          open: shown,
        });
      }
      walk(under, level + 1, key, visible && shown);
    }
  };
  walk(children.get(null) ?? [], 1, null, true);

  const total = flat.length;
  let nodes: GridNode<Row>[] = flat;
  let hasMore = false;
  if (query.page && 'index' in query.page && query.page.size > 0) {
    const from = query.page.index * query.page.size;
    nodes = flat.slice(from, from + query.page.size);
    hasMore = from + query.page.size < total;
  }
  return { nodes, rows: keptRows, total, hasMore, aggregates: aggregates(columns, keptRows) };
}

/** Every group key a grouped query produces, for a consumer collapsing them all. */
export function groupKeysOf<Row>(nodes: readonly GridNode<Row>[]): string[] {
  return nodes.filter((node) => node.kind === 'group').map((node) => node.key);
}
