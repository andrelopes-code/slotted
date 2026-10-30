import type { FilterDescriptor } from '@slotted/core/filter';
import type { PositionerAnchor } from '@slotted/core/positioner';
import type {
  GridCell,
  GridColumn,
  GridNode,
  GridQuery,
  RangeBounds,
  ResolvedGridColumn,
  SortDirection,
} from '@slotted/core/grid';
import type { DataGridMessages, FamilyTranslator } from '@slotted/core/i18n';
import { createContext, useContext, useSyncExternalStore } from 'react';
import type { KeyboardEvent, MouseEvent, PointerEvent, ReactNode } from 'react';

import type {
  DataGridCellContext,
  DataGridEditMode,
  DataGridEditorContext,
  DataGridGroupContext,
  DataGridHeaderContext,
  DataGridReason,
  DataGridSelectionMode,
} from './data-grid.types';

/** The editing session, as the body reads it. */
export interface EditSession {
  readonly cell: GridCell;
  /** Every cell of the row in row mode, the one cell in cell mode. */
  readonly columns: readonly string[];
  readonly drafts: Readonly<Record<string, unknown>>;
  /** The values when the session opened, to say what changed and to detect a conflict. */
  readonly originals: Readonly<Record<string, unknown>>;
  readonly status: 'editing' | 'pending' | 'invalid';
  readonly messages: Readonly<Record<string, string>>;
  /** The key that opened the editor, typed into it as its first character. */
  readonly seed: string | null;
}

/** What a column menu opened by a context menu hangs from, and where focus returns. */
export interface ColumnMenuAnchor {
  readonly column: string;
  readonly anchor: PositionerAnchor;
  readonly returnTo: HTMLElement;
}

/**
 * Everything a part needs from the root. One object, one context: the parts
 * are private to the family and re-render with the grid.
 */
export interface DataGridInternal<Row> {
  readonly id: string;
  /** The family's words in the language in force, with the grid's `messages` laid over them. */
  readonly t: FamilyTranslator<DataGridMessages>;
  readonly locale: string;
  /** What a boolean cell says, in the language in force. */
  readonly booleans: { readonly true: string; readonly false: string };
  readonly timeZone: string | undefined;
  readonly columns: readonly GridColumn<Row>[];
  readonly resolved: readonly ResolvedGridColumn<Row>[];
  readonly resolvedById: ReadonlyMap<string, ResolvedGridColumn<Row>>;
  /** The visible columns' ids, the cursor's column axis. */
  readonly columnIds: readonly string[];
  /** The ids mounted in the DOM: the pinned ones and the window over the middle. */
  readonly mountedColumns: readonly ResolvedGridColumn<Row>[];
  readonly columnsWindowed: boolean;
  /** The columns a narrow frame moved into each row's pop-in, in the resolved order; empty without one. */
  readonly popinColumns: readonly ResolvedGridColumn<Row>[];
  /** The pop-in's columns that aggregate: the summary row's pop-in draws their totals. */
  readonly popinAggregated: readonly ResolvedGridColumn<Row>[];
  /** The pop-in's `aria-colindex`: after every visible column. */
  readonly popinIndex: number;
  /** Whether a cursor row draws a pop-in. */
  readonly hasPopinCell: (row: string) => boolean;
  readonly query: GridQuery;
  readonly nodes: readonly GridNode<Row>[];
  readonly total: number | null;
  readonly selectionMode: DataGridSelectionMode;
  readonly editMode: DataGridEditMode;
  readonly filterRow: boolean;
  readonly activatable: boolean;
  readonly rowKeyOf: (row: Row) => string;
  readonly textOf: (column: GridColumn<Row>, row: Row) => string;
  readonly valueOf: (column: GridColumn<Row>, row: Row) => unknown;
  readonly isEditable: (column: GridColumn<Row>, row: Row) => boolean;
  readonly anyEditable: boolean;
  readonly isDisabled: (key: string) => boolean;
  readonly isExpandable: (row: Row) => boolean;

  /* cursor */
  readonly current: GridCell | null;
  /** The one cell in the tab sequence: the current one, or the header's first. */
  readonly tabStop: GridCell;
  readonly focused: boolean;
  readonly setCurrent: (cell: GridCell, reason: DataGridReason, source?: unknown) => void;

  /* selection */
  readonly isSelected: (key: string) => boolean;
  readonly selectedCount: number;
  readonly toggleSelected: (
    key: string,
    options: { range?: boolean; source?: unknown; reason?: DataGridReason },
  ) => void;
  readonly toggleAll: (source?: unknown) => void;
  readonly allState: 'none' | 'some' | 'all';
  readonly selectableCount: number;
  readonly rangeBounds: RangeBounds | null;
  readonly rangeInfo: (cell: GridCell) => { inside: boolean; edges: readonly string[] };
  /** The mark of a cell whose value just changed — `a` or `b`, alternating so a second change restarts the paint — or `null`. */
  readonly changedOf: (cell: GridCell) => 'a' | 'b' | null;
  readonly beginRange: (cell: GridCell, extend: boolean, source: unknown) => void;
  readonly extendRange: (cell: GridCell, source: unknown) => void;
  readonly rangeDragging: boolean;

  /* expansion */
  readonly isExpanded: (key: string) => boolean;
  readonly toggleExpanded: (key: string, source?: unknown, reason?: DataGridReason) => void;
  /** Opens or closes a tree row's children, asking for them when they are not in `rows`. */
  readonly toggleBranch: (key: string, source?: unknown, reason?: DataGridReason) => void;
  /** Whether rows can be reordered now: the prop, the query at rest, no tree. */
  readonly rowsReorderable: boolean;
  readonly attachRowDraggable: (node: HTMLElement | null, key: string) => void;
  /** What a row is called: its row header's text, else its key. */
  readonly rowLabelOf: (key: string) => string;
  /** The column that carries the tree's indent and toggle, or `null` without a tree. */
  readonly treeColumn: string | null;
  /** Whether a row says it has children that are not in `rows` yet. */
  readonly hasChildren: (row: Row) => boolean;
  /** Rows whose children were asked for and have not arrived. */
  readonly isLoadingChildren: (key: string) => boolean;
  readonly toggleGroup: (key: string, source?: unknown, reason?: DataGridReason) => void;

  /* sorting and filtering */
  readonly sortOf: (id: string) => { direction: SortDirection; index: number } | null;
  readonly pressSort: (
    id: string,
    append: boolean,
    source?: unknown,
    reason?: DataGridReason,
  ) => void;
  readonly setSort: (id: string, direction: SortDirection | null, source?: unknown) => void;
  readonly filterOf: (id: string) => FilterDescriptor | null;
  readonly setFilter: (
    id: string,
    filter: FilterDescriptor | null,
    reason: DataGridReason,
    source?: unknown,
  ) => void;
  readonly filterOpen: string | null;
  readonly setFilterOpen: (id: string | null) => void;
  readonly menuOpen: string | null;
  readonly setMenuOpen: (id: string | null) => void;
  /** The anchor of a column menu a context menu opened; `null` under its button. */
  readonly menuAnchor: ColumnMenuAnchor | null;
  readonly anchorToButton: () => void;
  readonly onHeaderContextMenu: (event: MouseEvent<HTMLElement>, columnId: string) => void;
  readonly filterDebounce: number;
  /** Counts of a set column's values over the rows every other rule kept. */
  readonly countsFor: (id: string) => ReadonlyMap<string, number>;

  /* columns */
  readonly pin: (id: string, zone: 'start' | 'end' | null, source?: unknown) => void;
  readonly hide: (id: string, source?: unknown, reason?: DataGridReason) => void;
  readonly resizeBy: (id: string, delta: number, source?: unknown) => void;
  readonly resizeTo: (id: string, width: number, reason: DataGridReason, source?: unknown) => void;
  /** One column, or every resizable column with `null`, with the gesture's reason. */
  readonly autofit: (id: string | null, reason: DataGridReason, source?: unknown) => void;
  readonly moveColumn: (id: string, direction: -1 | 1, source?: unknown) => void;
  readonly resizing: string | null;
  readonly setResizing: (id: string | null) => void;
  readonly dragging: string | null;
  readonly dropTarget: string | null;
  readonly draggingRow: string | null;
  readonly dropOffset: number | null;
  readonly attachDraggable: (element: HTMLElement | null, id: string) => void;
  readonly onManageColumns: (() => void) | undefined;

  /* editing */
  readonly edit: EditSession | null;
  readonly startEdit: (cell: GridCell, seed?: string | null) => void;
  readonly setDraft: (column: string, draft: unknown) => void;
  readonly commitEdit: (
    reason: 'keyboard' | 'pointer' | 'blur' | 'programmatic',
    options?: { move?: 'down' | 'next' | 'previous' | 'stay' },
  ) => void;
  readonly cancelEdit: () => void;
  readonly activate: (key: string, reason: 'pointer' | 'keyboard', event: unknown) => void;

  /* rendering */
  readonly renderCellContent: (context: DataGridCellContext<Row>) => ReactNode;
  readonly renderEditorContent: (context: DataGridEditorContext<Row>) => ReactNode;
  readonly renderHeaderContent: ((context: DataGridHeaderContext<Row>) => ReactNode) | undefined;
  readonly renderDetail: ((row: Row, key: string) => ReactNode) | undefined;
  readonly renderGroup: ((context: DataGridGroupContext<Row>) => ReactNode) | undefined;
  readonly renderFilterOperand:
    | ((context: {
        column: string;
        operator: string;
        value: unknown;
        setValue: (value: unknown) => void;
        apply: () => void;
        label: string;
      }) => ReactNode)
    | undefined;

  /* events composed on cells */
  readonly onCellPointerDown: (event: PointerEvent<HTMLElement>, cell: GridCell) => void;
  readonly onCellPointerEnter: (event: PointerEvent<HTMLElement>, cell: GridCell) => void;
  readonly onCellClick: (event: MouseEvent<HTMLElement>, cell: GridCell) => void;
  readonly onCellDoubleClick: (event: MouseEvent<HTMLElement>, cell: GridCell) => void;
  readonly onCellKeyDown: (event: KeyboardEvent<HTMLElement>, cell: GridCell) => void;
  readonly onCellFocus: (cell: GridCell) => void;
  readonly onCellBlur: (cell: GridCell) => void;

  readonly announce: (message: string) => void;
  readonly detailId: (key: string) => string;
  readonly rangeSummary: string | null;
}

export const DataGridInternalContext = createContext<DataGridInternal<unknown> | undefined>(
  undefined,
);

export function useDataGridInternal<Row = unknown>(): DataGridInternal<Row> {
  const context = useContext(DataGridInternalContext);
  if (context === undefined)
    throw new Error('Every DataGrid part must be rendered inside DataGrid.');
  return context as DataGridInternal<Row>;
}

/**
 * Fields a row reads for its own key only. A change to one re-renders the rows
 * whose answer for their key changed, never the whole window.
 */
const ROW_SCOPED = new Set<string>([
  'changedOf',
  'current',
  'detailId',
  'draggingRow',
  'edit',
  'hasPopinCell',
  'isDisabled',
  'isExpanded',
  'isLoadingChildren',
  'isSelected',
  'rangeBounds',
  'rangeInfo',
  'rowLabelOf',
]);

/**
 * Fields a row and its cells never read while rendering: handlers called from
 * an event, read through the proxy at that moment, and the header's and the
 * footer's figures. A change to one re-renders no row.
 */
const ROW_IGNORED = new Set<string>([
  'activate',
  'allState',
  'announce',
  'anchorToButton',
  'attachDraggable',
  'attachRowDraggable',
  'autofit',
  'beginRange',
  'cancelEdit',
  'commitEdit',
  'extendRange',
  'focused',
  'hide',
  'moveColumn',
  'onCellBlur',
  'onCellClick',
  'onCellDoubleClick',
  'onCellFocus',
  'onCellKeyDown',
  'onCellPointerDown',
  'onCellPointerEnter',
  'onHeaderContextMenu',
  'onManageColumns',
  'pin',
  'pressSort',
  'rangeDragging',
  'rangeSummary',
  'resizeBy',
  'resizeTo',
  'selectableCount',
  'selectedCount',
  'setCurrent',
  'setDraft',
  'setFilter',
  'setFilterOpen',
  'setMenuOpen',
  'setResizing',
  'setSort',
  'startEdit',
  'tabStop',
  'toggleAll',
  'toggleBranch',
  'toggleExpanded',
  'toggleGroup',
  'toggleSelected',
]);

/**
 * What a body row subscribes to instead of the grid context.
 *
 * The context value is a new object whenever the selection, the cursor, the
 * window or a handler changes, and a row that read it re-rendered with every
 * other row on each of them: a selection click rendered the whole window. The
 * store holds the latest value, counts the changes every row must answer (a
 * column, a renderer, the language), and each row renders again only when that
 * count or its own answers change.
 *
 * `grid` is a stable proxy over the latest value, and it is what the context
 * carries. A context whose value changed re-renders every consumer under it,
 * a memoized row's cells included, so the context never changes: every part
 * that is not a memoized row re-renders with the root that renders it, and
 * reads the latest value through the proxy; a handler a cell calls is the
 * current one although the cell did not re-render.
 */
export interface DataGridRowStore<Row> {
  readonly grid: DataGridInternal<Row>;
  readonly latest: () => DataGridInternal<Row>;
  readonly set: (value: DataGridInternal<Row>) => void;
  readonly publish: () => void;
  readonly subscribe: (listener: () => void) => () => void;
  readonly signature: (key: string) => string;
}

export function createDataGridRowStore<Row>(initial: DataGridInternal<Row>): DataGridRowStore<Row> {
  let value = initial;
  let version = 0;
  const listeners = new Set<() => void>();

  const grid = new Proxy({} as DataGridInternal<Row>, {
    get: (_, property) => (value as unknown as Record<PropertyKey, unknown>)[property],
    has: (_, property) => property in value,
  });

  return {
    grid,
    latest: () => value,
    set: (next) => {
      if (next === value) return;
      const before = value as unknown as Record<string, unknown>;
      const after = next as unknown as Record<string, unknown>;
      for (const field of Object.keys(after)) {
        if (ROW_SCOPED.has(field) || ROW_IGNORED.has(field)) continue;
        if (before[field] !== after[field]) {
          version += 1;
          break;
        }
      }
      value = next;
    },
    publish: () => {
      for (const listener of listeners) listener();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    signature: (key) => {
      const current = value.current;
      const edit = value.edit;
      const cells = value.columnIds
        .map((column) => {
          const cell = { row: key, column };
          const range = value.rangeInfo(cell);
          return `${range.inside ? 1 : 0}${range.edges.join('')}${value.changedOf(cell) ?? ''}`;
        })
        .join(',');
      return [
        version,
        value.isSelected(key) ? 1 : 0,
        value.isDisabled(key) ? 1 : 0,
        value.isExpanded(key) ? 1 : 0,
        value.isLoadingChildren(key) ? 1 : 0,
        value.hasPopinCell(key) ? 1 : 0,
        value.draggingRow === key ? 1 : 0,
        current !== null && current.row === key ? current.column : '',
        edit !== null && edit.cell.row === key ? editVersion(edit) : '',
        value.detailId(key),
        value.rowLabelOf(key),
        cells,
      ].join('|');
    },
  };
}

/** One number per edit session object, so a new draft is a new signature. */
const editVersions = new WeakMap<EditSession, number>();
let nextEditVersion = 0;
function editVersion(edit: EditSession): number {
  let known = editVersions.get(edit);
  if (known === undefined) {
    nextEditVersion += 1;
    known = nextEditVersion;
    editVersions.set(edit, known);
  }
  return known;
}

export const DataGridRowStoreContext = createContext<DataGridRowStore<unknown> | undefined>(
  undefined,
);

/** The latest grid for a row, re-rendering the row only when its signature changes. */
export function useDataGridRow<Row>(key: string): DataGridRowStore<Row> {
  const store = useContext(DataGridRowStoreContext) as DataGridRowStore<Row> | undefined;
  if (store === undefined) throw new Error('Every DataGrid part must be rendered inside DataGrid.');
  const signature = () => store.signature(key);
  useSyncExternalStore(store.subscribe, signature, signature);
  return store;
}
