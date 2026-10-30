/**
 * The vocabulary a data grid is described in: what a column is, how the
 * reader has arranged the columns, what the query asks of the rows, where the
 * cursor and the range are. Every value here is JSON — no class, no `Date`,
 * no function past the column definition — because a server receives the
 * query, a URL holds the column state and a saved view restores both.
 */

import type { FilterGroup, FilterKind } from '../filter';
import type { ChangeReason } from '../state';

export type SortDirection = 'ascending' | 'descending';

export interface SortKey {
  readonly column: string;
  readonly direction: SortDirection;
}

/** By index, or by cursor; `null` when the grid does not page. */
export type GridPage =
  | { readonly index: number; readonly size: number }
  | { readonly cursor: string | null; readonly size: number };

/**
 * One object for everything the rows are asked to answer, because a server
 * receives one request and a bookmark holds one state. `sort` holds several
 * keys, first key first; `filter` is `@slotted/core/filter`'s tree; `search`
 * is the one condition that belongs to no column; `group` names the columns
 * the rows are grouped by, outermost first.
 */
export interface GridQuery {
  readonly sort: readonly SortKey[];
  readonly filter: FilterGroup | null;
  readonly search: string;
  readonly page: GridPage | null;
  readonly group: readonly string[];
}

/** Which part of the query a request moved. */
export type GridQueryChange = 'sort' | 'filter' | 'search' | 'page' | 'group';

/** The kinds a column can be: the engine's seven, an actions column, or a custom one. */
export type GridColumnKind = FilterKind | 'actions' | 'custom';

export type GridAggregate = 'sum' | 'avg' | 'min' | 'max' | 'count';

export interface GridColumnOption {
  readonly value: string;
  readonly label: string;
}

/**
 * A column, as the consumer declares it. Only `id` and `label` are required;
 * every other field has the default the kind implies.
 */
export interface GridColumn<Row = unknown> {
  readonly id: string;
  readonly label: string;
  /**
   * A short sentence about the column: what the value means, how it is
   * computed. Read by the header's `aria-describedby`, the column menu and the
   * column manager.
   */
  readonly description?: string;
  /**
   * Responsive priority: the lower, the longer the column stays in the row
   * when the frame is too narrow. A column without one leaves before every
   * numbered one. The identity column and an `actions` column never leave.
   */
  readonly priority?: number;
  /**
   * Default `true`: a column that does not fit moves into the row's pop-in as
   * a label and a value. `false` hides it instead.
   */
  readonly popin?: boolean;
  /** Default `text`. */
  readonly kind?: GridColumnKind;
  /** The domain value. Default: `row[id]`. */
  readonly accessor?: keyof Row | ((row: Row) => unknown);
  /** The text the cell draws. Default: the kind's own formatting. */
  readonly format?: (value: unknown, row: Row) => string;
  /** Replaces the kind's comparator. */
  readonly compare?: (a: unknown, b: unknown, rows: readonly [Row, Row]) => number;
  readonly align?: 'start' | 'center' | 'end';
  /** Default: `true` for `number`. */
  readonly numeric?: boolean;
  /** Default `truncate`. */
  readonly text?: 'wrap' | 'truncate' | 'nowrap';
  /** Pixels. Default 150. */
  readonly width?: number;
  /** Pixels. Default 48. */
  readonly minWidth?: number;
  /** Pixels. Default: none. */
  readonly maxWidth?: number;
  /** Fraction of the room left after every fixed column; the track becomes `minmax(min, flex fr)`. */
  readonly flex?: number;
  /** Default `true`; `false` for `actions`. */
  readonly sortable?: boolean;
  /** Default `true`; `false` for `actions` and `custom`. */
  readonly filterable?: boolean;
  /** Default `true` for the engine's kinds. */
  readonly searchable?: boolean;
  /** Default `false`. */
  readonly editable?: boolean | ((row: Row) => boolean);
  /** Default `true`. */
  readonly resizable?: boolean;
  /** Default `true`. */
  readonly reorderable?: boolean;
  /** Default `true`. */
  readonly hideable?: boolean;
  /** The column that names the record, drawn as a `rowheader`. */
  readonly rowHeader?: boolean;
  /**
   * The edge the column is pinned to while no column state states one.
   * Default `end` for a column of kind `actions`, so the row's actions stay
   * in the frame when the columns scroll sideways; `null` otherwise.
   */
  readonly pinned?: GridPinZone;
  /** The values a `set` column can hold, with their names. */
  readonly options?: readonly GridColumnOption[];
  readonly aggregate?: GridAggregate | ((values: readonly unknown[]) => unknown);
  /** A message, `null`, or a promise of either. */
  readonly validate?: (value: unknown, row: Row) => string | null | Promise<string | null>;
  /** From the editor's draft to the domain value. Default: the kind's own parsing. */
  readonly parse?: (draft: unknown, row: Row) => unknown;
}

/**
 * Rows as a tree: each row names its parent by key, and the parent is in
 * `rows`. A row whose parent is not is a root. `hasChildren` says a row has
 * children that are not in `rows` yet, for loading on demand.
 */
export interface GridTree<Row = unknown> {
  readonly parentKey: (row: Row) => string | null | undefined;
  /** The column that carries the indent and the toggle. Default: the first visible column. */
  readonly column?: string | undefined;
  readonly hasChildren?: ((row: Row) => boolean) | undefined;
}

export interface GridColumnGroup {
  readonly id: string;
  readonly label: string;
  readonly columns: readonly string[];
}

/**
 * The reader's own arrangement of the columns. A column the state does not
 * name takes the model's order and width; a column the state names and the
 * model no longer has is dropped when the state is normalised.
 */
export interface GridColumnState {
  readonly order: readonly string[];
  readonly widths: Readonly<Record<string, number>>;
  readonly hidden: readonly string[];
  readonly pinned: {
    readonly start: readonly string[];
    readonly end: readonly string[];
  };
}

export type GridColumnStateChange = 'order' | 'width' | 'hidden' | 'pinned';

/** The density a grid is drawn at: the theme's axis, scoped to one grid. */
export type GridDensity = 'comfortable' | 'compact' | 'dense';

export type GridPinZone = 'start' | 'end' | null;

/** A column resolved against its state: what the bindings lay out. */
export interface ResolvedGridColumn<Row = unknown> {
  readonly column: GridColumn<Row>;
  readonly id: string;
  readonly kind: GridColumnKind;
  readonly width: number;
  readonly minWidth: number;
  readonly maxWidth: number | undefined;
  readonly flex: number | undefined;
  readonly pinned: GridPinZone;
  /** Pixels from the pinned edge to this column's own edge. */
  readonly pinOffset: number;
  /** Whether this is the last column of its pin zone, the one that draws the edge. */
  readonly pinEdge: boolean;
  /** 1-based, across the visible columns: what `aria-colindex` says. */
  readonly index: number;
  readonly sortable: boolean;
  readonly filterable: boolean;
  readonly searchable: boolean;
  readonly resizable: boolean;
  readonly reorderable: boolean;
  readonly hideable: boolean;
  readonly numeric: boolean;
  readonly align: 'start' | 'center' | 'end' | undefined;
  readonly text: 'wrap' | 'truncate' | 'nowrap';
}

/** The reserved rows the cursor can stand on besides a record. */
export type GridCursorRow = string;

export const HEADER_ROW = 'header';
export const FILTER_ROW = 'filter';
export const SUMMARY_ROW = 'summary';
export const GROUP_ROW_PREFIX = 'group:';

/** The virtual column the cursor stands on for a row's pop-in, after the last visible one. */
export const POPIN_COLUMN_ID = '$popin';

/**
 * What a grid does with the columns its frame cannot hold: `popin` moves them
 * into the row, `scroll` keeps them and scrolls, `auto` pops in on a phone-wide
 * frame or a touch frame narrower than a desktop, and scrolls elsewhere.
 */
export type GridColumnOverflow = 'auto' | 'popin' | 'scroll';

/** The columns that do not fit the frame, each in the order of the resolved columns. */
export interface GridOutOfSpace {
  /** Drawn in the row's pop-in. */
  readonly popin: readonly string[];
  /** Declined the pop-in with `popin: false`, and left the row. */
  readonly hidden: readonly string[];
}

export interface GridCell {
  readonly row: GridCursorRow;
  readonly column: string;
}

export interface GridRange {
  readonly anchor: GridCell;
  readonly focus: GridCell;
}

/** The reasons a grid's own requests can carry. */
export type GridReason = Extract<
  ChangeReason,
  'pointer' | 'keyboard' | 'clear' | 'select' | 'programmatic'
>;

/**
 * One line of the body after the query was applied: a record, or a group
 * heading over the records under it.
 */
export type GridNode<Row = unknown> =
  | {
      readonly kind: 'row';
      readonly key: string;
      readonly row: Row;
      /** Position among every row the query kept, across pages. */
      readonly index: number;
      /** The group keys above this row, outermost first. */
      readonly groups: readonly string[];
      /** 1 at the root; always 1 without a tree. */
      readonly level: number;
      /** The parent row's key in a tree, else `null`. */
      readonly parent: string | null;
      /** Children present in `rows`; 0 without a tree. */
      readonly childCount: number;
      /** Whether the row's children are shown; `false` for a leaf. */
      readonly open: boolean;
    }
  | {
      readonly kind: 'group';
      readonly key: string;
      readonly column: string;
      readonly value: unknown;
      readonly text: string;
      /** 1-based. */
      readonly level: number;
      readonly count: number;
      readonly rows: readonly Row[];
      readonly aggregates: Readonly<Record<string, unknown>>;
      readonly expanded: boolean;
    };
