import type {
  CsvOptions,
  GridCell,
  GridColumn,
  GridColumnOverflow,
  GridColumnState,
  GridColumnStateChange,
  GridNode,
  GridQuery,
  GridQueryChange,
  GridRange,
  ResolvedGridColumn,
} from '@slotted/core/grid';
import type { ChangeRequest } from '@slotted/core/state';
import { inject, Injectable, InjectionToken } from '@angular/core';

export type DataGridVariant = 'plain' | 'ruled' | 'framed';
export type DataGridStickyTo = 'scroll' | 'page';
export type DataGridSelectionMode = 'none' | 'single' | 'multiple' | 'range';
export type DataGridEditMode = 'cell' | 'row';
export type DataGridMode = 'client' | 'server';
/**
 * Which wait a load is. `initial` has nothing to keep and draws skeleton rows;
 * `refresh` reads again over an answer the grid already drew — rows, or the
 * empty state — and keeps it. `true` is `initial` until the grid has drawn an
 * answer, and `refresh` after.
 */
export type DataGridLoading = boolean | 'initial' | 'refresh';
export type DataGridVirtualize = 'auto' | boolean;

/**
 * What asks for the next page of a grid that has more. `scroll` asks when the
 * window nears the end and draws a quiet status while the page loads, and a
 * retry only after `loadMoreFailed`; `button` asks only from a Load more
 * control; `both` does the two. Default `scroll`.
 */
export type DataGridLoadMoreTrigger = 'scroll' | 'button' | 'both';
export type DataGridRowHeight = number | 'auto';
/**
 * What a frame too narrow for the template does: moves columns into the row's
 * pop-in, scrolls, or — `auto` — pops in on a phone-wide or a touch frame
 * narrower than a desktop and scrolls elsewhere.
 */
export type DataGridColumnOverflow = GridColumnOverflow;
export type DataGridReason = 'pointer' | 'keyboard' | 'clear' | 'select' | 'programmatic';
export type DataGridExpandedGroups = readonly string[] | 'all';
export type DataGridSelection = string | readonly string[] | null;

export interface DataGridDataSourceResult<Row> {
  readonly rows: readonly Row[];
  /** The whole set's size, when known. */
  readonly total?: number | undefined;
  /** Whether a page past this one exists, when the total is not known. */
  readonly hasMore?: boolean | undefined;
}

export interface DataGridDataSource<Row> {
  getRows(
    query: GridQuery,
    options: { readonly signal: AbortSignal },
  ): Promise<DataGridDataSourceResult<Row>>;
  /** Answers kept, by query. Default 20; 0 keeps none. */
  readonly cacheSize?: number | undefined;
}

export interface DataGridPinnedRows {
  readonly top?: readonly string[] | undefined;
  readonly bottom?: readonly string[] | undefined;
}

export interface DataGridRowsReorderEvent {
  readonly key: string;
  /** The row's index in `rows`. */
  readonly from: number;
  /** The index the row takes in `rows` once moved. */
  readonly to: number;
  readonly reason: 'pointer' | 'keyboard';
  readonly event?: Event | undefined;
}

export interface DataGridExportOptions extends Omit<CsvOptions, 'booleans'> {
  /** What a boolean writes in the file. Default: the grid's own words, `filterYes` and `filterNo`. */
  readonly booleans?: CsvOptions['booleans'] | undefined;
  /** Default `export.csv`. */
  readonly filename?: string | undefined;
  /** `visible`: the rows the query left (every page in client mode; the received page in server mode). `selected`: the selected rows, in the grid's order. Default `visible`. */
  readonly rows?: 'visible' | 'selected' | undefined;
  /** `visible`: the columns not hidden, in the reader's order. `all`: every column the model declares. Default `visible`. */
  readonly columns?: 'visible' | 'all' | undefined;
}

/** The request a query change carries: the value, plus which part of it moved. */
export interface DataGridQueryRequest extends ChangeRequest<GridQuery> {
  readonly change: GridQueryChange;
}

export interface DataGridColumnStateRequest extends ChangeRequest<GridColumnState> {
  readonly change: GridColumnStateChange;
}

export interface DataGridEditCommit<Row = unknown> {
  readonly key: string;
  readonly column: string;
  readonly value: unknown;
  readonly previous: unknown;
  readonly row: Row;
  readonly reason: 'keyboard' | 'pointer' | 'blur' | 'programmatic';
  readonly changes: Readonly<Record<string, unknown>>;
  /** A promise the consumer hands back keeps the cell pending until it settles. */
  wait(promise: Promise<void>): void;
}

export interface DataGridActivateEvent {
  readonly key: string;
  readonly reason: 'pointer' | 'keyboard';
  readonly event: unknown;
}

/** What a projected cell template is handed. */
export interface DataGridCellContext<Row = unknown> {
  readonly $implicit: Row;
  readonly row: Row;
  readonly key: string;
  readonly column: GridColumn<Row>;
  readonly value: unknown;
  readonly text: string;
  readonly current: boolean;
  readonly selected: boolean;
}

export interface DataGridEditorContext<Row = unknown> extends DataGridCellContext<Row> {
  readonly draft: unknown;
  readonly setDraft: (draft: unknown) => void;
  readonly commit: () => void;
  readonly cancel: () => void;
  readonly invalid: boolean;
  readonly message: string | null;
}

export interface DataGridHeaderContext<Row = unknown> {
  readonly $implicit: GridColumn<Row>;
  readonly column: GridColumn<Row>;
  readonly resolved: ResolvedGridColumn<Row>;
  readonly sorted: 'ascending' | 'descending' | null;
  readonly sortIndex: number | null;
  readonly filtered: boolean;
}

export interface DataGridGroupContext<Row = unknown> {
  readonly $implicit: Extract<GridNode<Row>, { kind: 'group' }>;
  readonly node: Extract<GridNode<Row>, { kind: 'group' }>;
  readonly column: GridColumn<Row>;
  readonly toggle: () => void;
}

export interface DataGridFilterOperandContext {
  readonly $implicit: unknown;
  readonly column: string;
  readonly operator: string;
  readonly value: unknown;
  readonly setValue: (value: unknown) => void;
  readonly apply: () => void;
  readonly label: string;
}

export type { GridCell, GridRange };

export interface DataGridDefaults {
  variant: DataGridVariant;
  striped: boolean;
  stickyHeader: boolean;
  stickyTo: DataGridStickyTo;
  selectionMode: DataGridSelectionMode;
  editMode: DataGridEditMode;
  filterRow: boolean;
  virtualize: DataGridVirtualize;
  rowHeight: DataGridRowHeight | undefined;
  columnOverflow: DataGridColumnOverflow;
  overscan: number;
  pageSizes: readonly number[];
  filterDebounce: number;
  loadMoreThreshold: number;
  loadMoreTrigger: DataGridLoadMoreTrigger;
  skeletonRows: number;
}

const FALLBACK: DataGridDefaults = {
  variant: 'ruled',
  striped: false,
  stickyHeader: true,
  stickyTo: 'scroll',
  selectionMode: 'none',
  editMode: 'cell',
  filterRow: false,
  virtualize: 'auto',
  rowHeight: undefined,
  columnOverflow: 'auto',
  overscan: 6,
  pageSizes: [25, 50, 100],
  filterDebounce: 300,
  loadMoreThreshold: 20,
  loadMoreTrigger: 'scroll',
  skeletonRows: 8,
};

export const DATA_GRID_DEFAULTS = new InjectionToken<DataGridDefaults>(
  'slotted data-grid defaults',
  {
    providedIn: 'root',
    factory: () => FALLBACK,
  },
);

/**
 * An application decides once how its grids are framed, how they select and
 * how they edit. A grid that states any of them itself still wins. Its words
 * and its locale come from the language in force (`provideSlotted`).
 */
export function provideDataGridDefaults(defaults: Partial<DataGridDefaults>) {
  return {
    provide: DATA_GRID_DEFAULTS,
    useFactory: (): DataGridDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

export function injectDataGridDefaults(): DataGridDefaults {
  return inject(DATA_GRID_DEFAULTS);
}

/** Application-scoped, so the server and the client produce the same sequence. */
@Injectable({ providedIn: 'root' })
export class SlDataGridIdFactory {
  private count = 0;

  next() {
    this.count += 1;
    return `slotted-data-grid-${this.count}`;
  }
}
