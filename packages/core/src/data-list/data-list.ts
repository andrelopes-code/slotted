/**
 * What a list of records draws for each record, from the column model a data
 * grid reads: which column is the title, which are the fields and in what
 * order, and which sort keys the list can offer. Nothing here holds state;
 * both bindings call it on every render. The words come from the `dataList`
 * catalog in `@slotted/core/i18n`.
 */

import {
  cellText,
  cellValue,
  isEmptyValue,
  normalizeColumnState,
  type FormatOptions,
  type GridColumn,
  type GridColumnState,
  type GridNode,
  type GridQuery,
  type SortDirection,
  type SortKey,
} from '../grid';
import type { DataListMessages, FamilyTranslator } from '../i18n';

/* ── The columns ─────────────────────────────────────────────────────── */

export interface DataListLayoutOptions {
  /** The title's column; default the first visible `rowHeader`, else the first data column. */
  readonly title?: string | undefined;
  readonly subtitle?: string | undefined;
  readonly trailing?: string | undefined;
  /** How many fields a closed record shows. Default 4. */
  readonly fields?: number | undefined;
  /** Order and hidden columns; widths and pins mean nothing in a list. */
  readonly columnState?: Partial<GridColumnState> | undefined;
}

export interface DataListLayout<Row> {
  readonly title: GridColumn<Row> | null;
  readonly subtitle: GridColumn<Row> | null;
  readonly trailing: GridColumn<Row> | null;
  /** The `actions` columns, in the visible order. */
  readonly actions: readonly GridColumn<Row>[];
  /** Every field, in the order a record shows them. */
  readonly fields: readonly GridColumn<Row>[];
  /** How many of `fields` a closed record shows. */
  readonly shown: number;
  /** The columns the sort control offers. */
  readonly sortable: readonly GridColumn<Row>[];
}

export const DEFAULT_DATA_LIST_FIELDS = 4;

const isData = <Row>(column: GridColumn<Row>) => column.kind !== 'actions';

/**
 * Which column goes where. The fields are the visible columns left after the
 * title, the subtitle, the trailing value and the actions, without the ones
 * that declined the pop-in: numbered `priority` first, ascending, ties in the
 * visible order, then the unnumbered ones in the visible order — the order
 * `columnsOutOfSpace` removes them in, reversed.
 */
export function resolveDataListLayout<Row>(
  columns: readonly GridColumn<Row>[],
  options: DataListLayoutOptions = {},
): DataListLayout<Row> {
  const state = normalizeColumnState(options.columnState, columns);
  const hidden = new Set(state.hidden);
  const byId = new Map(columns.map((column) => [column.id, column]));
  const visible = state.order
    .map((id) => byId.get(id))
    .filter((column): column is GridColumn<Row> => column !== undefined && !hidden.has(column.id));

  const named = (id: string | undefined) =>
    id === undefined ? null : (visible.find((column) => column.id === id) ?? null);

  const title =
    named(options.title) ??
    visible.find((column) => column.rowHeader === true && isData(column)) ??
    visible.find(isData) ??
    null;
  const subtitle = named(options.subtitle);
  const trailing = named(options.trailing);
  const placed = new Set([title?.id, subtitle?.id, trailing?.id]);

  const actions = visible.filter((column) => !isData(column));
  const rest = visible.filter(
    (column) => isData(column) && !placed.has(column.id) && column.popin !== false,
  );
  const numbered = rest
    .map((column, index) => ({ column, index }))
    .filter(({ column }) => typeof column.priority === 'number')
    .sort((a, b) => (a.column.priority ?? 0) - (b.column.priority ?? 0) || a.index - b.index)
    .map(({ column }) => column);
  const unnumbered = rest.filter((column) => typeof column.priority !== 'number');
  const fields = [...numbered, ...unnumbered];

  const limit = Math.max(0, Math.floor(options.fields ?? DEFAULT_DATA_LIST_FIELDS));

  return {
    title,
    subtitle,
    trailing,
    actions,
    fields,
    shown: Math.min(limit, fields.length),
    sortable: visible.filter(
      (column) => isData(column) && column.kind !== 'custom' && column.sortable !== false,
    ),
  };
}

/** What a field draws: the formatted text, or `null` for an absent value. */
export function dataListFieldText<Row>(
  column: GridColumn<Row>,
  row: Row,
  options: FormatOptions,
): string | null {
  if (isEmptyValue(cellValue(column, row))) return null;
  return cellText(column, row, options);
}

/* ── Sorting ─────────────────────────────────────────────────────────── */

/**
 * The query after the reader chose a column in the sort control: one key on
 * that column, keeping the direction in use, or none at all for `null`.
 */
export function withDataListSortColumn(query: GridQuery, column: string | null): GridQuery {
  if (column === null) return { ...query, sort: [] };
  const direction: SortDirection = query.sort[0]?.direction ?? 'ascending';
  return { ...query, sort: [{ column, direction }] };
}

/** The query after the reader chose a direction: the first key turns, the others stay. */
export function withDataListSortDirection(query: GridQuery, direction: SortDirection): GridQuery {
  const [first, ...others] = query.sort;
  if (!first) return query;
  return { ...query, sort: [{ column: first.column, direction }, ...others] };
}

/** The whole order in words: `Account ascending, Balance descending`. */
export function describeDataListSort<Row>(
  sort: readonly SortKey[],
  columns: readonly GridColumn<Row>[],
  t: FamilyTranslator<DataListMessages>,
): string {
  return sort
    .map((key) => {
      const column = columns.find((entry) => entry.id === key.column)?.label ?? key.column;
      return t(key.direction === 'ascending' ? 'sortedByAscending' : 'sortedByDescending', {
        column,
      });
    })
    .join(', ');
}

/* ── Groups ──────────────────────────────────────────────────────────── */

export type DataListNode<Row> =
  | { readonly kind: 'row'; readonly key: string; readonly row: Row; readonly index: number }
  | {
      readonly kind: 'section';
      readonly key: string;
      readonly column: string;
      readonly text: string;
      readonly count: number;
      readonly level: number;
      readonly children: readonly DataListNode<Row>[];
    };

/**
 * The flat body `applyQuery` returns, folded into the sections `list` nests:
 * a group node opens a section, and every node after it at a deeper level —
 * a row, or a group of the next level — belongs to it.
 */
export function dataListNodes<Row>(nodes: readonly GridNode<Row>[]): DataListNode<Row>[] {
  const root: DataListNode<Row>[] = [];
  const stack: { level: number; children: DataListNode<Row>[] }[] = [{ level: 0, children: root }];

  for (const node of nodes) {
    if (node.kind === 'row') {
      stack[stack.length - 1]!.children.push({
        kind: 'row',
        key: node.key,
        row: node.row,
        index: node.index,
      });
      continue;
    }
    while (stack.length > 1 && stack[stack.length - 1]!.level >= node.level) stack.pop();
    const children: DataListNode<Row>[] = [];
    stack[stack.length - 1]!.children.push({
      kind: 'section',
      key: node.key,
      column: node.column,
      text: node.text,
      count: node.count,
      level: node.level,
      children,
    });
    stack.push({ level: node.level, children });
  }
  return root;
}

/** The keys of every record in the tree, in reading order. */
export function dataListKeys<Row>(nodes: readonly DataListNode<Row>[]): string[] {
  return nodes.flatMap((node) => (node.kind === 'row' ? [node.key] : dataListKeys(node.children)));
}
