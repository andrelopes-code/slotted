import type { FilterDescriptor, FilterOperator } from '@slotted/core/filter';
import type {
  CsvOptions,
  GridCell,
  GridColumn,
  GridColumnGroup,
  GridColumnOverflow,
  GridColumnState,
  GridColumnStateChange,
  GridDensity,
  GridNode,
  GridOutOfSpace,
  GridQuery,
  GridQueryChange,
  GridRange,
  ResolvedGridColumn,
  GridTree,
} from '@slotted/core/grid';
import type { DataGridMessages, FamilyTranslator, PartialMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, ReactNode } from 'react';

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

/** A column of the grid: the model's column, plus what only React can carry. */
export interface DataGridColumn<Row> extends GridColumn<Row> {
  /**
   * The column's help, rendered under its `description` in the popover its
   * column-help button opens. Its presence alone draws the button.
   */
  readonly help?: ReactNode;
}

/** The request a query change carries: the value, plus which part of it moved. */
export interface DataGridQueryRequest extends ChangeRequest<GridQuery> {
  readonly change: GridQueryChange;
}

export interface DataGridColumnStateRequest extends ChangeRequest<GridColumnState> {
  readonly change: GridColumnStateChange;
}

export type DataGridExpandedGroups = readonly string[] | 'all';

/** What an application sets once. */
export interface DataGridDefaults {
  variant?: DataGridVariant | undefined;
  striped?: boolean | undefined;
  stickyHeader?: boolean | undefined;
  stickyTo?: DataGridStickyTo | undefined;
  selectionMode?: DataGridSelectionMode | undefined;
  editMode?: DataGridEditMode | undefined;
  filterRow?: boolean | undefined;
  virtualize?: DataGridVirtualize | undefined;
  rowHeight?: DataGridRowHeight | undefined;
  /**
   * What a frame too narrow for the template does. `popin` moves the columns
   * of least `priority` into a pop-in at the foot of each row, as labelled
   * values; `scroll` keeps every column and scrolls sideways; `auto` pops in
   * on a frame under 600px, or under 1024px when the main pointer is coarse,
   * and scrolls elsewhere. Default `auto`.
   */
  columnOverflow?: DataGridColumnOverflow | undefined;
  overscan?: number | undefined;
  pageSizes?: readonly number[] | undefined;
  filterDebounce?: number | undefined;
  loadMoreThreshold?: number | undefined;
  loadMoreTrigger?: DataGridLoadMoreTrigger | undefined;
  skeletonRows?: number | undefined;
}

export interface DataGridDefaultsProviderProps extends DataGridDefaults {
  children?: ReactNode | undefined;
}

/** What a cell renderer is handed. */
export interface DataGridCellContext<Row> {
  readonly row: Row;
  readonly rowKey: string;
  readonly column: GridColumn<Row>;
  readonly value: unknown;
  readonly text: string;
  /** Whether the cursor stands on this cell. */
  readonly current: boolean;
  readonly selected: boolean;
}

export interface DataGridEditorContext<Row> extends DataGridCellContext<Row> {
  /** The draft as it stands. */
  readonly draft: unknown;
  readonly setDraft: (draft: unknown) => void;
  readonly commit: () => void;
  readonly cancel: () => void;
  readonly invalid: boolean;
  readonly message: string | null;
}

export interface DataGridHeaderContext<Row> {
  readonly column: GridColumn<Row>;
  readonly resolved: ResolvedGridColumn<Row>;
  readonly sorted: 'ascending' | 'descending' | null;
  readonly sortIndex: number | null;
  readonly filtered: boolean;
}

export interface DataGridGroupContext<Row> {
  readonly node: Extract<GridNode<Row>, { kind: 'group' }>;
  readonly column: GridColumn<Row>;
  readonly toggle: () => void;
}

export interface DataGridFilterOperandContext {
  readonly column: string;
  readonly operator: FilterOperator;
  readonly value: unknown;
  readonly setValue: (value: unknown) => void;
  readonly apply: () => void;
  readonly label: string;
}

export interface DataGridEditCommit<Row> {
  readonly key: string;
  readonly column: string;
  readonly value: unknown;
  readonly previous: unknown;
  readonly row: Row;
  readonly reason: 'keyboard' | 'pointer' | 'blur' | 'programmatic';
  /** Every changed value of the row, in row mode. */
  readonly changes: Readonly<Record<string, unknown>>;
}

export interface DataGridActivateEvent {
  readonly key: string;
  readonly reason: 'pointer' | 'keyboard';
  readonly event: unknown;
}

/** The imperative surface: what a consumer cannot express declaratively. */
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

export interface DataGridHandle {
  focusCell(cell: GridCell): void;
  scrollToRow(key: string, align?: 'start' | 'center' | 'end' | 'nearest'): void;
  scrollToColumn(id: string): void;
  scrollToCell(cell: GridCell): void;
  startEdit(cell: GridCell): void;
  stopEdit(options?: { commit?: boolean }): void;
  autofit(column?: string): void;
  /**
   * The columns a narrow frame has taken out by their `priority`: those in
   * the pop-in and those hidden. Never part of `columnState`.
   */
  getOutOfSpace(): GridOutOfSpace;
  getVisibleRows(): readonly unknown[];
  /** The file's text, by `toCsv`, for the consumer who sends it elsewhere. */
  toCsv(options?: DataGridExportOptions): string;
  /** Builds the file and hands it to the browser as a download. */
  exportCsv(options?: DataGridExportOptions): void;
  /** Drops the data source's cache and asks the query again. */
  reload(): void;
  selectAll(): void;
  clearSelection(): void;
  readonly element: HTMLDivElement | null;
}

export interface DataGridProps<Row>
  extends
    Omit<
      ComponentPropsWithRef<'div'>,
      'children' | 'defaultValue' | 'onChange' | 'onSelect' | 'role'
    >,
    DataGridDefaults {
  /* ── Data ───────────────────────────────────────────────────────────── */
  /** The rows, or nothing when a `dataSource` answers for them. */
  rows?: readonly Row[] | undefined;
  /**
   * The grid asks for its own rows: `getRows` is called with the query on
   * every change, the request before it aborted, and the answer is kept by
   * the query's text. The grid is in `server` mode, with the loading and the
   * error states of its own; `handle.reload()` drops the cache.
   */
  dataSource?: DataGridDataSource<Row> | undefined;
  /** A field name, or a function of the row. */
  rowKey: keyof Row | ((row: Row) => string);
  columns: readonly DataGridColumn<Row>[];
  columnGroups?: readonly GridColumnGroup[] | undefined;
  /** `client` applies the query to `rows`; `server` draws `rows` as given. Inferred from `totalCount` and `hasMore`. */
  mode?: DataGridMode | undefined;
  /** The whole set's size in `server` mode, when it is known. */
  totalCount?: number | undefined;
  /** Whether a page past this one exists, in `server` mode with an unknown total. */
  hasMore?: boolean | undefined;
  /**
   * A load in flight. Zero rows is an answer too: after the grid has drawn
   * one, `true` keeps it — the empty state stays and no skeleton is drawn —
   * so a refetch of an empty list does not flicker. `'initial'` asks for the
   * skeleton anyway, for a grid that stays mounted across two different sets.
   */
  loading?: DataGridLoading | undefined;
  /** The message of a failed load; draws the error state. */
  error?: string | null | undefined;
  onRetry?: (() => void) | undefined;
  onLoadMore?: (() => void) | undefined;
  /** The last page asked for failed: the automatic request stops and the footer offers a retry. */
  loadMoreFailed?: boolean | undefined;
  /** Rows a consumer has disabled: not selectable, not editable. */
  disabledKeys?: readonly string[] | undefined;
  /**
   * Rows held at the top or the bottom of the body, by key, in the stated
   * order: out of the query — never sorted, filtered or paged — and always on
   * screen, under the head and over the summary.
   */
  pinnedRows?: DataGridPinnedRows | undefined;
  /**
   * Marks a mounted cell whose value changed between two `rows`, for the
   * stated milliseconds (`true` is 1200). A row that arrived is not a change.
   */
  highlightChanges?: boolean | number | undefined;

  /* ── Query ──────────────────────────────────────────────────────────── */
  query?: GridQuery | undefined;
  defaultQuery?: GridQuery | undefined;
  onQueryChange?: ((query: GridQuery, request: DataGridQueryRequest) => void) | undefined;

  /* ── Columns ────────────────────────────────────────────────────────── */
  columnState?: GridColumnState | undefined;
  defaultColumnState?: Partial<GridColumnState> | undefined;
  onColumnStateChange?:
    ((state: GridColumnState, request: DataGridColumnStateRequest) => void) | undefined;
  /** Called when the column menu asks for the manager; the consumer opens `column-manager`. */
  onManageColumns?: (() => void) | undefined;
  /**
   * Called when either set of columns a narrow frame has taken out by their
   * `priority` changes — those in the pop-in and those hidden. Neither set is
   * ever part of `columnState`.
   */
  onOutOfSpaceChange?: ((outOfSpace: GridOutOfSpace) => void) | undefined;
  /**
   * The density of this grid alone, written as `data-slotted-density` on the
   * root; absent or `null`, the grid takes the page's. The layers it opens
   * are portals and stay at the page's density.
   */
  density?: GridDensity | null | undefined;

  /* ── Selection ──────────────────────────────────────────────────────── */
  value?: string | readonly string[] | null | undefined;
  defaultValue?: string | readonly string[] | null | undefined;
  onValueChange?:
    | ((
        value: string | readonly string[] | null,
        request: ChangeRequest<string | readonly string[] | null>,
      ) => void)
    | undefined;
  range?: GridRange | null | undefined;
  defaultRange?: GridRange | null | undefined;
  onRangeChange?:
    ((range: GridRange | null, request: ChangeRequest<GridRange | null>) => void) | undefined;

  /* ── Cursor ─────────────────────────────────────────────────────────── */
  current?: GridCell | null | undefined;
  defaultCurrent?: GridCell | null | undefined;
  onCurrentChange?:
    ((cell: GridCell | null, request: ChangeRequest<GridCell | null>) => void) | undefined;

  /* ── Expansion ──────────────────────────────────────────────────────── */
  expanded?: readonly string[] | undefined;
  defaultExpanded?: readonly string[] | undefined;
  onExpandedChange?:
    ((expanded: readonly string[], request: ChangeRequest<readonly string[]>) => void) | undefined;
  expandedGroups?: DataGridExpandedGroups | undefined;
  defaultExpandedGroups?: DataGridExpandedGroups | undefined;
  onExpandedGroupsChange?:
    | ((expanded: DataGridExpandedGroups, request: ChangeRequest<DataGridExpandedGroups>) => void)
    | undefined;
  /** Whether a row has a detail to open; the detail itself comes from `renderDetail`. */
  expandable?: boolean | ((row: Row) => boolean) | undefined;
  /**
   * Rows as a tree: each row names its parent by key. The open branches are
   * `expanded`; `query.group` is ignored. The root is a `treegrid`.
   */
  tree?: GridTree<Row> | undefined;
  /** Called when a row `hasChildren` says has children opens and none are in `rows`. */
  onLoadChildren?: ((event: { key: string; row: Row }) => void) | undefined;
  /**
   * A handle per row, dragged with the pointer or moved with Alt and the
   * vertical arrows. The grid keeps no order of its own: `onRowsReorder`
   * says where the row goes in `rows` and the consumer moves it. Only while
   * the query is at rest — no sort, filter, search or group — and without a
   * tree; elsewhere the handle is disabled.
   */
  rowsReorderable?: boolean | undefined;
  onRowsReorder?: ((event: DataGridRowsReorderEvent) => void) | undefined;

  /* ── Editing and activation ─────────────────────────────────────────── */
  onEditStart?: ((cell: GridCell) => void) | undefined;
  onEditCommit?: ((commit: DataGridEditCommit<Row>) => void | Promise<void>) | undefined;
  onEditCancel?: ((cell: GridCell) => void) | undefined;
  activatable?: boolean | undefined;
  onActivate?: ((event: DataGridActivateEvent) => void) | undefined;

  /* ── Rendering ──────────────────────────────────────────────────────── */
  renderCell?: ((context: DataGridCellContext<Row>) => ReactNode) | undefined;
  renderEditor?: ((context: DataGridEditorContext<Row>) => ReactNode) | undefined;
  renderHeader?: ((context: DataGridHeaderContext<Row>) => ReactNode) | undefined;
  renderDetail?: ((row: Row, key: string) => ReactNode) | undefined;
  renderGroup?: ((context: DataGridGroupContext<Row>) => ReactNode) | undefined;
  renderEmpty?: ((status: 'empty' | 'no-results' | 'error') => ReactNode) | undefined;
  renderFilterOperand?: ((context: DataGridFilterOperandContext) => ReactNode) | undefined;
  /** Renderers per column, keyed by id; a per-column renderer wins over the grid's. */
  cellRenderers?:
    Readonly<Record<string, (context: DataGridCellContext<Row>) => ReactNode>> | undefined;
  editorRenderers?:
    Readonly<Record<string, (context: DataGridEditorContext<Row>) => ReactNode>> | undefined;
  /** The bar under the grid: pagination, a count, load more. */
  footer?: ReactNode | undefined;
  /** Whether the footer states the range. Default: when the query pages. */
  showRange?: boolean | undefined;
  /**
   * The frame's height: a length, or a number of pixels. It writes
   * `--slotted-data-grid-block-size`; without one the grid grows to its rows
   * and windows nothing.
   */
  height?: string | number | undefined;
  /** The id of the element that names the grid; a native `aria-label` names it directly. */
  labelledBy?: string | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * grid's name (`grid`), every control, state and announcement.
   */
  messages?: PartialMessages<DataGridMessages> | undefined;
  /** The locale cells, numbers and dates are written in. Default: the language in force. */
  locale?: string | undefined;
  /** A name to announce and to persist by. */
  handle?: React.RefObject<DataGridHandle | null> | undefined;
  timeZone?: string | undefined;
}

export interface DataGridContextValue<Row> {
  readonly id: string;
  /** The family's words in the language in force, with this grid's `messages` laid over them. */
  readonly t: FamilyTranslator<DataGridMessages>;
  readonly locale: string;
  readonly timeZone: string | undefined;
  readonly columns: readonly GridColumn<Row>[];
  readonly resolved: readonly ResolvedGridColumn<Row>[];
  readonly query: GridQuery;
  readonly selectionMode: DataGridSelectionMode;
  readonly editMode: DataGridEditMode;
}

export type DataGridFilterDraft = FilterDescriptor | null;
