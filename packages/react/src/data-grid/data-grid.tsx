import { COMPACT_BELOW } from '@slotted/core/measure';
import '@slotted/styles/data-grid/data-grid.css';

import { writeToClipboard } from '@slotted/core/clipboard';
import { createRowMetrics, nextSelection, virtualWindow } from '@slotted/core/collection';
import { createDragController, type DragController } from '@slotted/core/drag';
import { createFilterGroupPredicate, ruleFor, withoutRuleFor } from '@slotted/core/filter';
import type { FilterDescriptor } from '@slotted/core/filter';
import {
  applyQuery,
  groupInOrder,
  cellText,
  cellValue,
  columnsOutOfSpace,
  toCsv,
  columnRange,
  columnTemplate,
  emptyQuery,
  FILTER_ROW,
  GROUP_ROW_PREFIX,
  HEADER_ROW,
  isGroupCursorRow,
  moveCursor,
  normalizeColumnState,
  POPIN_COLUMN_ID,
  rangeBounds,
  rangeCells,
  rangeEdges,
  rangeToText,
  RESIZE_STEP,
  resolveColumnOverflow,
  resolveColumns,
  rowRange,
  sameCell,
  settleCursor,
  SUMMARY_ROW,
  wholeRange,
  withColumnFilter,
  withColumnHidden,
  withColumnMoved,
  withColumnPinned,
  withColumnWidth,
  withoutFilters,
  withSort,
  withSortPress,
  zoneOf,
  type CursorGrid,
  type CursorIntent,
  type GridCell,
  type GridColumn,
  type GridColumnState,
  type GridNode,
  type GridOutOfSpace,
  type GridQuery,
  type GridRange,
  type GridTree,
  type ResolvedGridColumn,
  type SortDirection,
} from '@slotted/core/grid';
import { dataGridMessages, dragMessages } from '@slotted/core/i18n';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { createScrollAffordance } from '@slotted/core/overflow';
import type { PositionerAnchor } from '@slotted/core/positioner';
import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { CSSProperties, KeyboardEvent, MouseEvent, PointerEvent, ReactNode } from 'react';

import { Button } from '../button';
import { useLocale, useMessages } from '../i18n';
import {
  ResultState,
  ResultStateActions,
  ResultStateContent,
  ResultStateDescription,
  ResultStateTitle,
} from '../result-state';
import {
  DataGridBody,
  DataGridEmpty,
  DataGridLoader,
  DataGridPinnedRows,
  DataGridSummary,
} from './data-grid-body';
import {
  createDataGridRowStore,
  DataGridInternalContext,
  DataGridRowStoreContext,
  type ColumnMenuAnchor,
  type DataGridInternal,
  type DataGridRowStore,
  type EditSession,
} from './data-grid-context';
import { useDataGridDefaults } from './data-grid-defaults';
import { useDataSource } from './use-data-source';
import { DataGridHead } from './data-grid-header';
import {
  DEFAULT_CHANGED_DURATION,
  DRAG_COLUMN,
  DRAG_WIDTH,
  EXPANDER_COLUMN,
  EXPANDER_WIDTH,
  EDITOR_FIELD,
  FOCUSABLE,
  insideWidget,
  SELECTION_COLUMN,
  SELECTION_WIDTH,
  SIMPLE_WIDGET,
} from './data-grid-constants';
import { defaultCellContent, defaultEditor } from './data-grid-editors';
import type {
  DataGridExportOptions,
  DataGridRowsReorderEvent,
  DataGridCellContext,
  DataGridEditorContext,
  DataGridExpandedGroups,
  DataGridHandle,
  DataGridLoading,
  DataGridProps,
  DataGridReason,
} from './data-grid.types';
import { useModel } from './use-model';

const DEFAULT_ROW_HEIGHT = 34;
const VIRTUALIZE_ROWS_FROM = 100;
const VIRTUALIZE_COLUMNS_FROM = 20;
/** The viewport assumed until the scroller is measured. */
const PROVISIONAL_VIEWPORT = 600;
const COLUMN_OVERSCAN_PX = 400;
/** The out-of-space set of a frame not measured yet, or of a grid that scrolls instead. */
const NONE_OUT: GridOutOfSpace = { popin: [], hidden: [] };
/** Where a secondary press is the field's own: the browser's menu cuts, copies and pastes. */
const EDITABLE = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';
/**
 * The window after a keyboard opening of a column menu in which a
 * `contextmenu` is the one Windows fires for the key, not a second press:
 * `context-menu`'s technique.
 */
const KEYBOARD_ECHO = 300;
/** Milliseconds after a touch activation in which the `dblclick` the browser adds is ignored. */
const TOUCH_ECHO = 500;

/** A rectangle with no size at the point the reader pressed. */
/** The latest function behind one that stays the same while a function is given. */
function useLatestOptional<Args extends unknown[], Result>(
  given: ((...args: Args) => Result) | undefined,
): ((...args: Args) => Result) | undefined {
  const latest = useRef(given);
  latest.current = given;
  const present = given !== undefined;
  return useMemo(
    () => (present ? (...args: Args) => latest.current!(...args) : undefined),
    [present],
  );
}

function pointAnchor(x: number, y: number): PositionerAnchor {
  const rect = new DOMRect(x, y, 0, 0);
  return { getBoundingClientRect: () => rect };
}

function sameQuery(a: GridQuery, b: GridQuery) {
  return JSON.stringify(a) === JSON.stringify(b);
}
function sameState(a: GridColumnState, b: GridColumnState) {
  return JSON.stringify(a) === JSON.stringify(b);
}
function sameKeys(a: readonly string[] | 'all', b: readonly string[] | 'all') {
  if (a === 'all' || b === 'all') return a === b;
  return a.length === b.length && a.every((key, index) => key === b[index]);
}
function sameRange(a: GridRange | null, b: GridRange | null) {
  if (!a || !b) return a === b;
  return sameCell(a.anchor, b.anchor) && sameCell(a.focus, b.focus);
}
function sameSelection(a: string | readonly string[] | null, b: string | readonly string[] | null) {
  if (Array.isArray(a) && Array.isArray(b)) return sameKeys(a, b);
  return a === b;
}

/**
 * A grid of data: the composite widget `table` declined to be. It owns the
 * rows, applies the query, walks the cells with one cursor, edits in place,
 * and lets the reader arrange the columns.
 */
type RowNodeOf<Row> = Extract<GridNode<Row>, { kind: 'row' }>;
const EMPTY_ROWS: readonly never[] = [];

/** The room a cell's content asks for: the value's laid-out width, the boxes beside it, the gaps, the padding and the border. */
function contentWidth(cell: HTMLElement): number {
  const style = getComputedStyle(cell);
  const frame =
    cell.offsetWidth -
    cell.clientWidth +
    parseFloat(style.paddingInlineStart) +
    parseFloat(style.paddingInlineEnd);
  const gap = parseFloat(style.columnGap) || 0;
  let width = 0;
  let count = 0;
  for (const child of cell.children) {
    if (!(child instanceof HTMLElement) || getComputedStyle(child).display === 'none') continue;
    /* The description is read, not drawn: it asks for no room. */
    if (child.dataset['part'] === 'column-description') continue;
    count += 1;
    if (count === 1 && child.dataset['ui'] === undefined) {
      const range = cell.ownerDocument.createRange();
      range.selectNodeContents(child);
      width += range.getBoundingClientRect().width;
    } else {
      width += child.getBoundingClientRect().width;
    }
  }
  return width + Math.max(0, count - 1) * gap + frame;
}

export function DataGrid<Row>({
  activatable,
  cellRenderers: givenCellRenderers,
  columnGroups,
  columnOverflow,
  dataSource,
  columnState: columnStateProp,
  columns,
  current: currentProp,
  density,
  defaultColumnState,
  defaultCurrent,
  defaultExpanded,
  defaultExpandedGroups,
  defaultQuery,
  defaultRange,
  defaultValue,
  disabledKeys,
  editMode,
  editorRenderers: givenEditorRenderers,
  error: givenError,
  expandable,
  expanded: expandedProp,
  expandedGroups: expandedGroupsProp,
  filterDebounce,
  filterRow,
  footer,
  handle,
  hasMore: givenHasMore,
  height,
  highlightChanges,
  labelledBy,
  loadMoreThreshold,
  loadMoreTrigger,
  loadMoreFailed,
  loading: givenLoading,
  locale,
  messages,
  mode,
  onActivate,
  onColumnStateChange,
  onCurrentChange,
  onEditCancel,
  onEditCommit,
  onEditStart,
  onExpandedChange,
  onExpandedGroupsChange,
  onLoadChildren,
  onRowsReorder,
  onKeyDown,
  onLoadMore,
  onManageColumns,
  onOutOfSpaceChange,
  onQueryChange,
  onRangeChange,
  onRetry: givenOnRetry,
  onValueChange,
  overscan,
  pinnedRows,
  pageSizes,
  query: queryProp,
  range: rangeProp,
  ref,
  renderCell: givenRenderCell,
  renderDetail: givenRenderDetail,
  renderEditor: givenRenderEditor,
  renderEmpty,
  renderFilterOperand,
  renderGroup: givenRenderGroup,
  renderHeader: givenRenderHeader,
  rowHeight,
  rowKey,
  rowsReorderable,
  rows: givenRows,
  selectionMode,
  showRange,
  skeletonRows,
  stickyHeader,
  stickyTo,
  striped,
  style,
  timeZone,
  totalCount: givenTotalCount,
  tree: givenTree,
  value: valueProp,
  variant,
  virtualize,
  ...nativeProps
}: DataGridProps<Row>) {
  const defaults = useDataGridDefaults();
  const id = useId();
  /* `pageSizes` is a default the page-size control a consumer places in the
     footer reads through `useDataGridDefaults`; the grid itself pages by the
     query's own size. */
  void pageSizes;
  const root = useRef<HTMLDivElement | null>(null);
  const scroll = useRef<HTMLDivElement | null>(null);

  /* ── Renderers ──────────────────────────────────────────────────────── */
  /* A renderer, and the tree's callbacks, are read when a row renders, through
     the latest props: written inline they were new functions on every render
     of the parent, and each one re-rendered every mounted row. A row answers
     to whether each is given, and to the cell renderers' column ids. */
  const givenLatest = useRef({
    cellRenderers: givenCellRenderers,
    editorRenderers: givenEditorRenderers,
    tree: givenTree,
  });
  givenLatest.current = {
    cellRenderers: givenCellRenderers,
    editorRenderers: givenEditorRenderers,
    tree: givenTree,
  };
  const renderCell = useLatestOptional(givenRenderCell);
  const renderDetail = useLatestOptional(givenRenderDetail);
  const renderEditor = useLatestOptional(givenRenderEditor);
  const renderGroup = useLatestOptional(givenRenderGroup);
  const renderHeader = useLatestOptional(givenRenderHeader);
  const cellRendererIds = givenCellRenderers ? Object.keys(givenCellRenderers).join() : null;
  const editorRendererIds = givenEditorRenderers ? Object.keys(givenEditorRenderers).join() : null;
  const givenTreeColumn = givenTree?.column;
  const treeHasChildren = givenTree?.hasChildren !== undefined;
  const tree = useMemo(
    (): GridTree<Row> | undefined =>
      givenTree === undefined
        ? undefined
        : {
            column: givenTreeColumn,
            parentKey: (row) => givenLatest.current.tree!.parentKey(row),
            hasChildren: treeHasChildren
              ? (row) => givenLatest.current.tree!.hasChildren?.(row) === true
              : undefined,
          },
    /* The given tree is read through `givenLatest`; these say what shape it has. */
    [givenTree === undefined, givenTreeColumn, treeHasChildren],
  );

  /* ── Resolution ─────────────────────────────────────────────────────── */
  const t = useMessages(dataGridMessages, messages);
  const dragT = useMessages(dragMessages);
  const providedLocale = useLocale();
  const resolvedVariant = variant ?? defaults.variant ?? 'ruled';
  const resolvedStriped = striped ?? defaults.striped ?? false;
  const resolvedSticky = stickyHeader ?? defaults.stickyHeader ?? true;
  const resolvedStickyTo = stickyTo ?? defaults.stickyTo ?? 'scroll';
  const resolvedSelection = selectionMode ?? defaults.selectionMode ?? 'none';
  const resolvedEditMode = editMode ?? defaults.editMode ?? 'cell';
  const resolvedFilterRow = filterRow ?? defaults.filterRow ?? false;
  const resolvedVirtualize = virtualize ?? defaults.virtualize ?? 'auto';
  const resolvedRowHeight = rowHeight ?? defaults.rowHeight;
  const resolvedColumnOverflow = columnOverflow ?? defaults.columnOverflow ?? 'auto';
  const resolvedOverscan = overscan ?? defaults.overscan ?? 6;
  const resolvedDebounce = filterDebounce ?? defaults.filterDebounce ?? 300;
  const resolvedThreshold = loadMoreThreshold ?? defaults.loadMoreThreshold ?? 20;
  const resolvedLoadMore = loadMoreTrigger ?? defaults.loadMoreTrigger ?? 'scroll';
  const resolvedSkeleton = skeletonRows ?? defaults.skeletonRows ?? 8;
  const resolvedLocale = locale ?? providedLocale;
  const resolvedActivatable = activatable ?? false;

  const rowKeyOf = useCallback(
    (row: Row) =>
      typeof rowKey === 'function'
        ? rowKey(row)
        : String((row as Record<keyof Row, unknown>)[rowKey]),
    [rowKey],
  );
  /* Strings, not the translator, are the dependencies: an inline `messages`
     object makes a new translator on every render. */
  const booleanYes = t('filterYes');
  const booleanNo = t('filterNo');
  const formatOptions = useMemo(
    () => ({
      locale: resolvedLocale,
      timeZone,
      booleans: { true: booleanYes, false: booleanNo },
    }),
    [resolvedLocale, timeZone, booleanYes, booleanNo],
  );
  const textOf = useCallback(
    (column: GridColumn<Row>, row: Row) => cellText(column, row, formatOptions),
    [formatOptions],
  );
  const disabledSet = useMemo(() => new Set(disabledKeys ?? []), [disabledKeys]);
  const isDisabled = useCallback((key: string) => disabledSet.has(key), [disabledSet]);
  const isEditable = useCallback(
    (column: GridColumn<Row>, row: Row) => {
      if (disabledSet.has(rowKeyOf(row))) return false;
      const editable = column.editable;
      return typeof editable === 'function' ? editable(row) : editable === true;
    },
    [disabledSet, rowKeyOf],
  );
  const anyEditable = useMemo(() => columns.some((column) => column.editable), [columns]);
  const isExpandable = useCallback(
    (row: Row) => {
      if (!renderDetail) return false;
      if (expandable === undefined) return true;
      return typeof expandable === 'function' ? expandable(row) : expandable;
    },
    [expandable, renderDetail],
  );

  /* ── Models ─────────────────────────────────────────────────────────── */
  const [query, requestQuery] = useModel<GridQuery, { change: string }>(
    queryProp,
    defaultQuery ?? emptyQuery(),
    onQueryChange as never,
    sameQuery,
  );

  /* ── The data source ───────────────────────────────────────────────── */
  /* With a source the grid asks for its rows itself; what the consumer gave
     for rows, total, loading and error is what the source answered. */
  const sourced = useDataSource(dataSource, query);
  const rows = dataSource ? sourced.rows : (givenRows ?? EMPTY_ROWS);
  const totalCount = dataSource ? sourced.total : givenTotalCount;
  const hasMore = dataSource ? sourced.hasMore : givenHasMore;
  const loadingGiven: DataGridLoading | undefined = dataSource ? sourced.loading : givenLoading;
  const loading = loadingGiven === undefined ? false : loadingGiven !== false;
  const error = dataSource ? sourced.error : givenError;
  const onRetry = dataSource ? sourced.retry : givenOnRetry;
  const resolvedMode =
    mode ?? (dataSource || totalCount !== undefined || hasMore !== undefined ? 'server' : 'client');
  const normalizedState = useMemo(
    () => normalizeColumnState(columnStateProp ?? defaultColumnState, columns),
    [columnStateProp, columns],
  );
  const [columnState, requestColumnState] = useModel<GridColumnState, { change: string }>(
    columnStateProp === undefined ? undefined : normalizedState,
    normalizedState,
    onColumnStateChange as never,
    sameState,
  );
  const effectiveState = useMemo(
    () => normalizeColumnState(columnState, columns),
    [columnState, columns],
  );
  const [value, requestValue] = useModel<string | readonly string[] | null>(
    valueProp,
    defaultValue ?? (resolvedSelection === 'multiple' ? [] : null),
    onValueChange,
    sameSelection,
  );
  const [range, requestRange] = useModel<GridRange | null>(
    rangeProp,
    defaultRange ?? null,
    onRangeChange,
    sameRange,
  );
  const [current, requestCurrent] = useModel<GridCell | null>(
    currentProp,
    defaultCurrent ?? null,
    onCurrentChange,
    sameCell,
  );
  const [expanded, requestExpanded] = useModel<readonly string[]>(
    expandedProp,
    defaultExpanded ?? [],
    onExpandedChange,
    sameKeys,
  );
  const [expandedGroups, requestExpandedGroups] = useModel<DataGridExpandedGroups>(
    expandedGroupsProp,
    defaultExpandedGroups ?? 'all',
    onExpandedGroupsChange,
    sameKeys,
  );

  /* ── Columns ────────────────────────────────────────────────────────── */
  const hasSelectionColumn = resolvedSelection === 'single' || resolvedSelection === 'multiple';
  const hasDragColumn = rowsReorderable === true;
  const hasExpanderColumn = renderDetail !== undefined;
  const gutters = useMemo(() => {
    const list: number[] = [];
    if (hasSelectionColumn) list.push(SELECTION_WIDTH);
    if (hasDragColumn) list.push(DRAG_WIDTH);
    if (hasExpanderColumn) list.push(EXPANDER_WIDTH);
    return list;
  }, [hasSelectionColumn, hasDragColumn, hasExpanderColumn]);
  const leading = gutters.reduce((sum, width) => sum + width, 0);
  /* Every column the reader has not hidden, before the frame's width is asked. */
  const layout = useMemo(
    () => resolveColumns(columns, effectiveState, { leading }),
    [columns, effectiveState, leading],
  );
  /* The scroller's inner width; 0 until it is measured, and nothing is taken out before. */
  const [frameWidth, setFrameWidth] = useState(0);
  /* Whether the main pointer is coarse — a finger — read again when it
     changes: a tablet docked to a mouse leaves the pop-in for the sideways
     scroll. A render without `matchMedia` reads a fine one. */
  const [coarsePointer, setCoarsePointer] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(pointer: coarse)');
    const read = () => setCoarsePointer(query.matches);
    read();
    query.addEventListener('change', read);
    return () => query.removeEventListener('change', read);
  }, []);
  /* The columns a frame too narrow for the template has taken out, by their
     `priority`: those drawn in each row's pop-in, and those that declined it
     with `popin: false`. Read from the frame's width, which neither set
     changes, so the measure never loops. Never in `columnState`. Empty while
     `columnOverflow` settles to `scroll`. The object is kept while its
     members are the same, so nothing downstream re-runs. */
  const outNow =
    frameWidth <= 0 ||
    resolveColumnOverflow(resolvedColumnOverflow, frameWidth, coarsePointer) === 'scroll'
      ? NONE_OUT
      : columnsOutOfSpace(layout, frameWidth, { leading });
  const outKey = `${outNow.popin.join('\u0000')}\u0001${outNow.hidden.join('\u0000')}`;
  const outOfSpace = useMemo<GridOutOfSpace>(() => outNow, [outKey]);
  const resolved = useMemo(
    () =>
      outOfSpace.popin.length === 0 && outOfSpace.hidden.length === 0
        ? layout
        : resolveColumns(
            columns,
            {
              ...effectiveState,
              hidden: [...effectiveState.hidden, ...outOfSpace.popin, ...outOfSpace.hidden],
            },
            { leading },
          ),
    [layout, outOfSpace, columns, effectiveState, leading],
  );
  /* The columns drawn in each row's pop-in, in the order of the resolved columns. */
  const popinColumns = useMemo(
    () =>
      outOfSpace.popin.length === 0
        ? []
        : layout.filter((column) => outOfSpace.popin.includes(column.id)),
    [layout, outOfSpace],
  );
  const hasPopin = popinColumns.length > 0;
  /* The sets a narrow frame took out, reported when either changes. */
  const reportedSpace = useRef<GridOutOfSpace>(NONE_OUT);
  useEffect(() => {
    const reported = reportedSpace.current;
    if (sameKeys(outOfSpace.popin, reported.popin) && sameKeys(outOfSpace.hidden, reported.hidden))
      return;
    reportedSpace.current = outOfSpace;
    onOutOfSpaceChange?.(outOfSpace);
  }, [outOfSpace, onOutOfSpaceChange]);
  const resolvedById = useMemo(
    () => new Map(resolved.map((column) => [column.id, column])),
    [resolved],
  );
  const columnIds = useMemo(
    () => [
      ...(hasSelectionColumn ? [SELECTION_COLUMN] : []),
      ...(hasDragColumn ? [DRAG_COLUMN] : []),
      ...(hasExpanderColumn ? [EXPANDER_COLUMN] : []),
      ...resolved.map((column) => column.id),
    ],
    [hasSelectionColumn, hasDragColumn, hasExpanderColumn, resolved],
  );
  /* The pop-in is one more column for a reader, after every visible one, with no track. */
  const ariaColCount = columnIds.length + (hasPopin ? 1 : 0);
  const popinIndex = columnIds.length + 1;
  /* The columns the cursor walks: the visible ones, then the pop-in's. */
  const cursorColumns = useMemo(
    () => (hasPopin ? [...columnIds, POPIN_COLUMN_ID] : columnIds),
    [hasPopin, columnIds],
  );
  const template = useMemo(() => columnTemplate(resolved, gutters), [resolved, gutters]);

  /* ── Pinned rows ────────────────────────────────────────────────────── */
  /* Held rows leave the query: what is sorted, filtered and paged is the
     rest. Each becomes a node of its own, outside the body's count. */
  const pinned = useMemo(() => {
    const top = pinnedRows?.top ?? [];
    const bottom = pinnedRows?.bottom ?? [];
    if (top.length === 0 && bottom.length === 0) {
      return {
        top: [] as RowNodeOf<Row>[],
        bottom: [] as RowNodeOf<Row>[],
        keys: null as ReadonlySet<string> | null,
      };
    }
    const byKey = new Map<string, Row>();
    for (const row of rows) byKey.set(rowKeyOf(row), row);
    const nodesOf = (keys: readonly string[]) =>
      keys.flatMap((key): RowNodeOf<Row>[] => {
        const row = byKey.get(key);
        return row === undefined
          ? []
          : [
              {
                kind: 'row',
                key,
                row,
                index: -1,
                groups: [],
                level: 1,
                parent: null,
                childCount: 0,
                open: false,
              },
            ];
      });
    return { top: nodesOf(top), bottom: nodesOf(bottom), keys: new Set([...top, ...bottom]) };
  }, [pinnedRows, rows, rowKeyOf]);
  const bodyRows = useMemo(
    () => (pinned.keys ? rows.filter((row) => !pinned.keys!.has(rowKeyOf(row))) : rows),
    [rows, pinned.keys, rowKeyOf],
  );

  /* ── The applied query ──────────────────────────────────────────────── */
  const result = useMemo(() => {
    const rows = bodyRows;
    if (resolvedMode === 'server') {
      /* Sorted, filtered and paged by the server; grouped here, in the order
         the rows came, so a page ordered by date shows its days. */
      const nodes = groupInOrder(rows, columns, query.group, {
        rowKey: rowKeyOf,
        expandedGroups,
        offset: query.page && 'index' in query.page ? query.page.index * query.page.size : 0,
        locale: resolvedLocale,
        timeZone,
        booleans: formatOptions.booleans,
      });
      return {
        nodes,
        rows,
        total: totalCount ?? null,
        hasMore: hasMore ?? false,
        aggregates: {} as Record<string, unknown>,
      };
    }
    const applied = applyQuery(rows, columns, query, {
      rowKey: rowKeyOf,
      expandedGroups,
      tree,
      expanded: tree ? expanded : undefined,
      locale: resolvedLocale,
      timeZone,
      booleans: formatOptions.booleans,
    });
    return { ...applied, total: applied.total };
  }, [
    resolvedMode,
    bodyRows,
    columns,
    query,
    rowKeyOf,
    expandedGroups,
    tree,
    expanded,
    resolvedLocale,
    timeZone,
    formatOptions.booleans,
    totalCount,
    hasMore,
  ]);
  const nodes = result.nodes;
  const total = result.total;
  /* The aggregating columns in the pop-in: the summary row draws their totals in its own. */
  const popinAggregated = useMemo(
    () => popinColumns.filter((column) => column.column.aggregate !== undefined),
    [popinColumns],
  );
  const hasSummary =
    (resolved.some((column) => column.column.aggregate !== undefined) ||
      popinAggregated.length > 0) &&
    resolvedMode === 'client';
  /* Whether a row draws a pop-in: a record's row, held or not, and the
     summary while a column in the pop-in has a total to show there. */
  const hasPopinCell = useCallback(
    (row: string) => {
      if (!hasPopin) return false;
      if (row === SUMMARY_ROW) return popinAggregated.length > 0;
      return isBodyRow(row);
    },
    [hasPopin, popinAggregated],
  );
  /* The pop-in's column on a row that draws none is that row's last visible column. */
  const landOn = useCallback(
    (cell: GridCell): GridCell => {
      if (cell.column !== POPIN_COLUMN_ID || hasPopinCell(cell.row)) return cell;
      return { row: cell.row, column: columnIds[columnIds.length - 1]! };
    },
    [hasPopinCell, columnIds],
  );
  const headerRowCount =
    1 + (columnGroups && columnGroups.length > 0 ? 1 : 0) + (resolvedFilterRow ? 1 : 0);

  /* ── Cursor axis ────────────────────────────────────────────────────── */
  const cursorRows = useMemo(() => {
    const list = [HEADER_ROW];
    if (resolvedFilterRow) list.push(FILTER_ROW);
    for (const node of pinned.top) list.push(node.key);
    for (const node of nodes)
      list.push(node.kind === 'group' ? `${GROUP_ROW_PREFIX}${node.key}` : node.key);
    for (const node of pinned.bottom) list.push(node.key);
    if (hasSummary) list.push(SUMMARY_ROW);
    return list;
  }, [nodes, pinned, resolvedFilterRow, hasSummary]);
  const bodyStart = 1 + (resolvedFilterRow ? 1 : 0);
  const bodyEnd = bodyStart + pinned.top.length + nodes.length + pinned.bottom.length;

  /* ── Virtual rows ───────────────────────────────────────────────────── */
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [measuredRow, setMeasuredRow] = useState<number | null>(null);
  const [rowSizes, setRowSizes] = useState<ReadonlyMap<number, number>>(new Map());
  /* A row with a pop-in is as tall as its fields, whatever the stated
     height: it is measured one by one, as an `auto` row is. */
  const autoRows = resolvedRowHeight === 'auto' || hasPopin;
  const rowSize =
    typeof resolvedRowHeight === 'number' ? resolvedRowHeight : (measuredRow ?? DEFAULT_ROW_HEIGHT);
  const windowsRows =
    resolvedVirtualize === true ||
    (resolvedVirtualize === 'auto' && nodes.length > VIRTUALIZE_ROWS_FROM);
  const metrics = useMemo(() => {
    if (!autoRows) return undefined;
    return createRowMetrics(nodes.map((_node, index) => rowSizes.get(index) ?? rowSize));
  }, [autoRows, nodes, rowSizes, rowSize]);
  const rowWindow = useMemo(() => {
    if (!windowsRows) {
      return { startIndex: 0, endIndex: nodes.length, startOffset: 0, totalSize: 0 };
    }
    /* Before the scroller is measured the window is provisional — a screen's
       worth of rows — rather than the whole set: a grid of ten thousand rows
       mounted every one of them once, on its first paint, and windowed only
       from the second. */
    const win = virtualWindow({
      itemCount: nodes.length,
      itemSize: rowSize,
      metrics,
      overscan: resolvedOverscan,
      scrollOffset: Math.max(0, scrollTop),
      viewportSize: viewport.height || PROVISIONAL_VIEWPORT,
    });
    return {
      startIndex: win.startIndex,
      endIndex: win.endIndex,
      startOffset: win.startOffset,
      totalSize: win.totalSize,
    };
  }, [windowsRows, viewport.height, nodes.length, rowSize, metrics, resolvedOverscan, scrollTop]);
  const mountedNodes = useMemo(
    () => (windowsRows ? nodes.slice(rowWindow.startIndex, rowWindow.endIndex) : nodes),
    [windowsRows, nodes, rowWindow.startIndex, rowWindow.endIndex],
  );
  /** Rows the cursor needs mounted whatever the window says. */
  const [heldRows, setHeldRows] = useState<readonly string[]>([]);

  /* ── Virtual columns ────────────────────────────────────────────────── */
  const middle = useMemo(() => resolved.filter((column) => column.pinned === null), [resolved]);
  const windowsColumns =
    resolvedVirtualize === true ||
    (resolvedVirtualize === 'auto' && middle.length > VIRTUALIZE_COLUMNS_FROM);
  const mountedColumns = useMemo(() => {
    if (!windowsColumns || viewport.width === 0) return resolved;
    const gutterWidth = gutters.reduce((sum, width) => sum + width, 0);
    const startZone = resolved
      .filter((column) => column.pinned === 'start')
      .reduce((sum, column) => sum + column.width, 0);
    const endZone = resolved
      .filter((column) => column.pinned === 'end')
      .reduce((sum, column) => sum + column.width, 0);
    const from = scrollLeft - COLUMN_OVERSCAN_PX;
    const to = scrollLeft + viewport.width - endZone + COLUMN_OVERSCAN_PX;
    let offset = gutterWidth + startZone;
    const kept = new Set<string>();
    for (const column of middle) {
      const end = offset + column.width;
      if (end >= from && offset <= to) kept.add(column.id);
      offset = end;
    }
    return resolved.filter(
      (column) =>
        column.pinned !== null ||
        kept.has(column.id) ||
        (current !== null && current.column === column.id),
    );
  }, [windowsColumns, viewport.width, resolved, gutters, scrollLeft, middle, current]);

  /* ── Selection ──────────────────────────────────────────────────────── */
  const selectableKeys = useMemo(() => {
    const source = resolvedMode === 'client' ? result.rows : bodyRows;
    return [
      ...pinned.top.map((node) => node.key),
      ...source.map(rowKeyOf),
      ...pinned.bottom.map((node) => node.key),
    ].filter((key) => !disabledSet.has(key));
  }, [resolvedMode, result.rows, bodyRows, pinned, rowKeyOf, disabledSet]);
  const selectedList = useMemo<readonly string[]>(
    () =>
      Array.isArray(value) ? value : value === null || value === undefined ? [] : [value as string],
    [value],
  );
  const selectedSet = useMemo(() => new Set(selectedList), [selectedList]);
  const anchor = useRef<string | undefined>(undefined);
  const isSelected = useCallback((key: string) => selectedSet.has(key), [selectedSet]);
  const selectableSet = useMemo(() => new Set(selectableKeys), [selectableKeys]);
  /* A set on both sides: `includes` over ten thousand keys for each of ten
     thousand chosen ones was a hundred million steps on select-all. */
  const selectedCount = useMemo(
    () => selectedList.filter((key) => selectableSet.has(key)).length,
    [selectedList, selectableSet],
  );
  const allState: 'none' | 'some' | 'all' =
    selectedCount === 0 ? 'none' : selectedCount >= selectableKeys.length ? 'all' : 'some';

  const commitSelection = useCallback(
    (selected: readonly string[], reason: DataGridReason, source: unknown) => {
      const next = resolvedSelection === 'multiple' ? selected : (selected[0] ?? null);
      requestValue(next, reason, source);
    },
    [resolvedSelection, requestValue],
  );
  const toggleSelected = useCallback(
    (key: string, options: { range?: boolean; source?: unknown; reason?: DataGridReason }) => {
      if (resolvedSelection === 'none' || resolvedSelection === 'range' || disabledSet.has(key))
        return;
      const outcome = nextSelection({
        action: options.range ? 'range' : 'toggle',
        mode: resolvedSelection,
        selected: selectedList,
        keys: selectableKeys,
        key,
        anchor: anchor.current,
        disabled: (candidate) => disabledSet.has(candidate),
      });
      if (!options.range) anchor.current = key;
      if (outcome.changed)
        commitSelection(outcome.selected, options.reason ?? 'pointer', options.source);
    },
    [resolvedSelection, disabledSet, selectedList, selectableKeys, commitSelection],
  );
  const toggleAll = useCallback(
    (source?: unknown) => {
      if (resolvedSelection !== 'multiple') return;
      const outcome = nextSelection({
        action: 'all',
        mode: 'multiple',
        selected: selectedList,
        keys: selectableKeys,
      });
      if (outcome.changed) commitSelection(outcome.selected, 'select', source);
    },
    [resolvedSelection, selectedList, selectableKeys, commitSelection],
  );

  /* ── Cursor grid and range ──────────────────────────────────────────── */
  const pageRows = Math.max(1, Math.floor((viewport.height || 400) / rowSize) - 1);
  const cursorGrid = useMemo<CursorGrid>(
    () => ({ rows: cursorRows, columns: cursorColumns, pageSize: pageRows, bodyStart, bodyEnd }),
    [cursorRows, cursorColumns, pageRows, bodyStart, bodyEnd],
  );
  const bounds = useMemo(
    () => (resolvedSelection === 'range' ? rangeBounds(cursorGrid, range) : null),
    [resolvedSelection, cursorGrid, range],
  );
  const rangeInfo = useCallback(
    (cell: GridCell) => rangeEdges(cursorGrid, bounds, cell),
    [cursorGrid, bounds],
  );
  const [rangeDragging, setRangeDragging] = useState(false);
  const rangeAnchor = useRef<GridCell | null>(null);

  const beginRange = useCallback(
    (cell: GridCell, extend: boolean, source: unknown) => {
      if (resolvedSelection !== 'range' || !isBodyRow(cell.row)) return;
      const from = extend && range ? range.anchor : cell;
      rangeAnchor.current = from;
      requestRange({ anchor: from, focus: cell }, 'pointer', source);
    },
    [resolvedSelection, range, requestRange],
  );
  const extendRange = useCallback(
    (cell: GridCell, source: unknown) => {
      if (resolvedSelection !== 'range' || !isBodyRow(cell.row)) return;
      const from = rangeAnchor.current ?? range?.anchor ?? cell;
      requestRange({ anchor: from, focus: cell }, 'pointer', source);
    },
    [resolvedSelection, range, requestRange],
  );

  /* ── Announcer ──────────────────────────────────────────────────────── */
  const announce = useCallback((message: string) => {
    getLiveAnnouncer(root.current?.ownerDocument).announce(message);
  }, []);

  /* ── Focus ──────────────────────────────────────────────────────────── */
  const [focused, setFocused] = useState(false);
  const pendingFocus = useRef<GridCell | null>(null);
  const focusCellNow = useCallback((cell: GridCell) => {
    const element = root.current?.querySelector<HTMLElement>(
      `[data-row="${CSS.escape(cell.row)}"] [data-column="${CSS.escape(cell.column)}"]`,
    );
    if (!element) return false;
    /* The pattern's first combination — one simple widget takes the focus in
       the cell's place — is a rule for the body. A header's menu trigger and
       a group row's toggle are secondary controls of a cell that is itself the
       target; Enter reaches them. */
    const structural =
      element.matches('[data-part="column-header"], [data-part="filter-cell"]') ||
      element.querySelector('[data-part="group-toggle"]') !== null;
    /* A cell in edit hands the focus to its editor's field — the input, the
       select's trigger, the picker's first segment — never to a stepper or a
       calendar button beside it, and never to the cell: read live, Enter on a
       numeric cell opened the editor and left the focus on the cell because
       the field and its two steppers were three widgets, not one. */
    const editor = element.querySelector<HTMLElement>('[data-part="editor"]');
    if (editor) {
      const field =
        editor.querySelector<HTMLElement>(EDITOR_FIELD) ??
        editor.querySelector<HTMLElement>(FOCUSABLE);
      (field ?? element).focus({ preventScroll: false });
      return true;
    }
    const widgets = structural ? [] : [...element.querySelectorAll<HTMLElement>(FOCUSABLE)];
    const single = widgets.length === 1 && widgets[0]!.matches(SIMPLE_WIDGET) ? widgets[0]! : null;
    (single ?? element).focus({ preventScroll: false });
    return true;
  }, []);

  const setCurrent = useCallback(
    (cell: GridCell, reason: DataGridReason, source?: unknown) => {
      if (!sameCell(cell, current)) requestCurrent(cell, reason, source);
      pendingFocus.current = cell;
      if (isBodyRow(cell.row) && !cursorRows.includes(cell.row)) return;
      /* Mount the row the cursor moves to when the window does not hold it. */
      const index = cursorRows.indexOf(cell.row) - bodyStart;
      if (
        windowsRows &&
        index >= 0 &&
        (index < rowWindow.startIndex || index >= rowWindow.endIndex)
      ) {
        setHeldRows([cell.row]);
        const offset = metrics ? metrics.offsetOf(index) : index * rowSize;
        scroll.current?.scrollTo({ top: offset - viewport.height / 2 + rowSize });
      }
    },
    [
      current,
      requestCurrent,
      cursorRows,
      bodyStart,
      windowsRows,
      rowWindow,
      metrics,
      rowSize,
      viewport.height,
    ],
  );

  useLayoutEffect(() => {
    const cell = pendingFocus.current;
    if (!cell) return;
    if (focusCellNow(cell)) pendingFocus.current = null;
  });

  /* The cursor survives its row leaving: same index, same column. A column
     that moved into the pop-in takes the cursor with it. */
  const lastRowIndex = useRef(0);
  useEffect(() => {
    if (current && cursorRows.includes(current.row)) {
      lastRowIndex.current = cursorRows.indexOf(current.row);
      if (cursorColumns.includes(current.column)) return;
    }
    if (!current) return;
    const popped =
      cursorRows.includes(current.row) &&
      outOfSpace.popin.includes(current.column) &&
      hasPopinCell(current.row);
    const settled = popped
      ? { row: current.row, column: POPIN_COLUMN_ID }
      : settleCursor(cursorGrid, current, lastRowIndex.current);
    if (settled && !sameCell(settled, current)) {
      requestCurrent(settled, 'programmatic');
      if (focused) pendingFocus.current = settled;
    } else if (!settled && focused) {
      root.current?.querySelector<HTMLElement>('[data-part="empty"] [tabindex]')?.focus();
    }
  }, [
    cursorGrid,
    cursorRows,
    cursorColumns,
    outOfSpace,
    hasPopinCell,
    current,
    requestCurrent,
    focused,
  ]);

  /* ── Sorting and filtering ──────────────────────────────────────────── */
  const sortOf = useCallback(
    (columnId: string) => {
      const index = query.sort.findIndex((key) => key.column === columnId);
      if (index === -1) return null;
      return { direction: query.sort[index]!.direction, index: index + 1 };
    },
    [query.sort],
  );
  const labelOf = useCallback(
    (columnId: string) => resolvedById.get(columnId)?.column.label ?? columnId,
    [resolvedById],
  );
  const announceSort = useCallback(
    (next: GridQuery) => {
      if (next.sort.length === 0) {
        announce(t('sortCleared'));
        return;
      }
      const order = next.sort
        .map((key) =>
          t(key.direction === 'ascending' ? 'sortAscending' : 'sortDescending', {
            column: labelOf(key.column),
          }),
        )
        .join(', ');
      announce(t('sortedBy', { order }));
    },
    [announce, t, labelOf],
  );
  const pressSort = useCallback(
    (columnId: string, append: boolean, source?: unknown, reason: DataGridReason = 'pointer') => {
      const column = resolvedById.get(columnId);
      if (!column || !column.sortable) return;
      const move = withSortPress(query, columnId, append);
      requestQuery(move.query, reason, source, { change: move.change });
      announceSort(move.query);
    },
    [resolvedById, query, requestQuery, announceSort],
  );
  const setSort = useCallback(
    (columnId: string, direction: SortDirection | null, source?: unknown) => {
      const move = withSort(query, columnId, direction);
      requestQuery(move.query, 'pointer', source, { change: move.change });
      announceSort(move.query);
    },
    [query, requestQuery, announceSort],
  );
  const filterOf = useCallback(
    (columnId: string) => ruleFor(query.filter, columnId) ?? null,
    [query.filter],
  );
  const setFilter = useCallback(
    (
      columnId: string,
      filter: FilterDescriptor | null,
      reason: DataGridReason,
      source?: unknown,
    ) => {
      const move = withColumnFilter(query, columnId, filter);
      requestQuery(move.query, reason, source, { change: move.change });
    },
    [query, requestQuery],
  );
  const [filterOpen, setFilterOpen] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  /* What a column menu opened by a context menu hangs from and returns focus
     to; `null` while it opens from its button. */
  const [menuAnchor, setMenuAnchor] = useState<ColumnMenuAnchor | null>(null);
  const keyboardMenuAt = useRef(Number.NEGATIVE_INFINITY);
  /* Opens a column's menu against an anchor other than its button: the point
     a context menu was opened at, or the header cell. Focus returns to the
     header cell, which is where the reader was. */
  const openColumnMenu = useCallback(
    (columnId: string, anchor: PositionerAnchor, header: HTMLElement) => {
      setMenuAnchor({ column: columnId, anchor, returnTo: header });
      setMenuOpen(columnId);
    },
    [],
  );
  /* The button and Ctrl+Enter open the menu where they always did: under the
     button, focus returning to it. */
  const anchorToButton = useCallback(() => setMenuAnchor(null), []);
  /* A secondary press on a data column's header opens its menu at the press.
     The browser keeps its own menu under Shift, and over a field, where cut,
     copy and paste are the reader's; a `contextmenu` just after Shift+F10 or
     the Menu key opened the menu from the keyboard is that key's echo. A
     press in a layer the header owns — React bubbles a portal's events
     through the tree — is not the header's. */
  const onHeaderContextMenu = useCallback(
    (event: MouseEvent<HTMLElement>, columnId: string) => {
      const target = event.target;
      if (!(target instanceof Element) || !event.currentTarget.contains(target)) return;
      if (event.shiftKey || target.closest(EDITABLE)) return;
      event.preventDefault();
      if (Date.now() - keyboardMenuAt.current < KEYBOARD_ECHO) return;
      openColumnMenu(columnId, pointAnchor(event.clientX, event.clientY), event.currentTarget);
    },
    [openColumnMenu],
  );
  const countsCache = useRef(new Map<string, ReadonlyMap<string, number>>());
  const countsFor = useCallback(
    (columnId: string) => {
      const key = `${columnId}|${JSON.stringify(query.filter)}|${query.search}|${rows.length}`;
      const cached = countsCache.current.get(key);
      if (cached) return cached;
      const column = columns.find((entry) => entry.id === columnId);
      const counts = new Map<string, number>();
      if (column) {
        const rest = withoutRuleFor(query.filter, columnId);
        const read = (row: Row, field: string) => {
          const target = columns.find((entry) => entry.id === field);
          return target ? cellValue(target, row) : undefined;
        };
        const match = createFilterGroupPredicate<Row>(rest.rules.length ? rest : null, read, {
          locale: resolvedLocale,
        });
        for (const row of rows) {
          if (!match(row)) continue;
          const raw = cellValue(column, row);
          for (const entry of Array.isArray(raw) ? raw : [raw]) {
            if (entry === null || entry === undefined || entry === '') continue;
            const text = String(entry);
            counts.set(text, (counts.get(text) ?? 0) + 1);
          }
        }
      }
      countsCache.current = new Map([[key, counts]]);
      return counts;
    },
    [columns, query.filter, query.search, rows, resolvedLocale],
  );

  /* ── Column moves ───────────────────────────────────────────────────── */
  const requestState = useCallback(
    (next: GridColumnState, change: string, reason: DataGridReason, source?: unknown) => {
      requestColumnState(next, reason, source, { change });
    },
    [requestColumnState],
  );
  const pin = useCallback(
    (columnId: string, zone: 'start' | 'end' | null, source?: unknown) => {
      requestState(withColumnPinned(effectiveState, columnId, zone), 'pinned', 'pointer', source);
    },
    [effectiveState, requestState],
  );
  /* Hides a column and announces it; the undo is the application's, from the request's `previous`. */
  const hide = useCallback(
    (columnId: string, source?: unknown, reason: DataGridReason = 'programmatic') => {
      const column = columns.find((entry) => entry.id === columnId);
      if (!column || effectiveState.hidden.includes(columnId)) return;
      requestState(withColumnHidden(effectiveState, columnId, true), 'hidden', reason, source);
      announce(t('columnHidden', { column: column.label }));
    },
    [columns, effectiveState, requestState, announce, t],
  );
  const resizeTo = useCallback(
    (columnId: string, width: number, reason: DataGridReason, source?: unknown) => {
      const column = columns.find((entry) => entry.id === columnId);
      if (!column) return;
      const next = withColumnWidth(effectiveState, column, width);
      requestState(next, 'width', reason, source);
      if (reason === 'keyboard') {
        announce(
          t('resized', {
            column: column.label,
            width: String(next.widths[columnId] ?? width),
          }),
        );
      }
    },
    [columns, effectiveState, requestState, announce, t],
  );
  const resizeBy = useCallback(
    (columnId: string, delta: number, source?: unknown) => {
      const column = resolvedById.get(columnId);
      if (!column || !column.resizable) return;
      resizeTo(columnId, column.width + delta, 'keyboard', source);
    },
    [resolvedById, resizeTo],
  );
  /* The widest content the column has on screen, plus the cell's own padding
     and border. The content is measured by a Range over the value, never by
     `scrollWidth`: a value that truncates lays its text out at full width
     under the clip, and one that does not fills its cell — `scrollWidth` gave
     the cell's box either way, so a column only ever grew. A header is its
     name plus what sits beside it (the sort mark, the actions slot) and the
     gaps between. `null` for a column with nothing mounted. */
  const measureFit = useCallback((columnId: string): number | null => {
    const element = root.current;
    if (!element) return null;
    let widest = 0;
    for (const cell of element.querySelectorAll<HTMLElement>(
      `[data-column="${CSS.escape(columnId)}"]`,
    )) {
      widest = Math.max(widest, contentWidth(cell));
    }
    return widest > 0 ? Math.ceil(widest) : null;
  }, []);
  const autofitColumn = useCallback(
    (columnId: string, reason: DataGridReason, source?: unknown) => {
      if (!resolvedById.has(columnId)) return;
      const width = measureFit(columnId);
      if (width !== null) resizeTo(columnId, width, reason, source);
    },
    [resolvedById, measureFit, resizeTo],
  );
  /* Every resizable column at once, as one request: measured first, then
     folded into one state. Read live, one request per column started from
     the same state and only the last column kept its width. */
  const autofitAll = useCallback(
    (reason: DataGridReason, source?: unknown) => {
      let next = effectiveState;
      for (const column of resolved) {
        if (!column.resizable) continue;
        const width = measureFit(column.id);
        if (width !== null) next = withColumnWidth(next, column.column, width);
      }
      if (next !== effectiveState) requestState(next, 'width', reason, source);
    },
    [effectiveState, resolved, measureFit, requestState],
  );
  /* The fit behind the resizer, the menu, the keyboard and the handle, each with its own reason. */
  const autofit = useCallback(
    (columnId: string | null, reason: DataGridReason, source?: unknown) =>
      columnId === null ? autofitAll(reason, source) : autofitColumn(columnId, reason, source),
    [autofitAll, autofitColumn],
  );
  const moveColumn = useCallback(
    (columnId: string, direction: -1 | 1, source?: unknown) => {
      const column = resolvedById.get(columnId);
      if (!column || !column.reorderable) return;
      const zone = zoneOf(resolved, columnId);
      const index = zone.indexOf(columnId);
      const target = index + direction;
      if (target < 0 || target >= zone.length) return;
      requestState(
        withColumnMoved(effectiveState, columnId, target, zone),
        'order',
        'keyboard',
        source,
      );
    },
    [resolvedById, resolved, effectiveState, requestState],
  );
  const [resizing, setResizing] = useState<string | null>(null);

  /* ── Reordering by drag ─────────────────────────────────────────────── */
  const [dragState, setDragState] = useState<{
    dragging: string | null;
    target: string | null;
    offset: number | null;
    /** Where the scroller stood at the last move: the line follows the viewport, not the content. */
    scrollTop: number;
  }>({
    dragging: null,
    target: null,
    offset: null,
    scrollTop: 0,
  });
  const drag = useRef<DragController | null>(null);
  const latest = useRef({ resolved, effectiveState, requestState, gutters, labelOf, t, dragT });
  latest.current = { resolved, effectiveState, requestState, gutters, labelOf, t, dragT };
  const draggables = useRef(new Map<string, () => void>());
  const swallowClick = useRef(false);

  const headerNodes = useRef(new Map<string, HTMLElement>());
  const attachNode = useCallback((node: HTMLElement | null, columnId: string) => {
    const controller = drag.current;
    const previous = draggables.current.get(columnId);
    if (previous) {
      previous();
      draggables.current.delete(columnId);
    }
    if (!node || !controller) return;
    const column = latest.current.resolved.find((entry) => entry.id === columnId);
    if (!column || !column.reorderable) return;
    const detach = controller.attachDraggable(node, {
      container: 'columns',
      key: columnId,
      handle: () => node,
      /* A press on the resize handle is a resize: the controller's own
         listener sits on the header and fires before the handle's, so
         the handle cannot stop it. */
      canDrag: (event) =>
        !(event.target instanceof Element && event.target.closest('[data-part="resizer"]')),
      distance: 6,
    });
    draggables.current.set(columnId, detach);
  }, []);
  const attachDraggable = useCallback(
    (node: HTMLElement | null, columnId: string) => {
      if (node) headerNodes.current.set(columnId, node);
      else headerNodes.current.delete(columnId);
      attachNode(node, columnId);
    },
    [attachNode],
  );
  /* A header that appears after the controller exists, or is re-created for
     a new layout, is attached then; the signature is the layout's, so a
     render that moved nothing re-attaches nothing. */
  const layoutSignature = resolved.map((column) => column.id).join('\u0000');
  useEffect(() => {
    for (const [columnId, node] of headerNodes.current) attachNode(node, columnId);
  }, [layoutSignature, attachNode]);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    /* One container for the whole header row: the three pin zones share the
       row's box, and three containers registered over the same element
       claimed the pointer in turn — the last one, an empty end zone, took
       every drop as its root. The zone is enforced at the drop instead: a
       column never leaves its zone, so a target past the zone's edge lands on
       the edge. */
    const controller = createDragController({
      document: element.ownerDocument,
      t: (key, slots) => latest.current.dragT(key, slots),
      preview: false,
      /* The scroller moves sideways when a header is dragged to its edge, so a
         column can reach a place past the viewport; never up or down — the
         pointer is at the scroller's top edge for the whole drag. */
      autoScroll: { axis: 'x' },
      onDrop: ({ items, target, reason, event }) => {
        if (target.kind !== 'between') return;
        const { resolved: list, effectiveState: state, requestState: request } = latest.current;
        const columnId = items[0]!;
        const zone = zoneOf(list, columnId);
        const to = zoneIndex(list, zone, columnId, target.index);
        if (to === null) return;
        request(
          withColumnMoved(state, columnId, to, zone),
          'order',
          reason === 'keyboard' ? 'keyboard' : 'pointer',
          event,
        );
      },
    });
    const allItems = () => latest.current.resolved.map((column) => column.id);
    const headerOf = (columnId: string) =>
      element.querySelector(`[data-part="column-header"][data-column="${CSS.escape(columnId)}"]`);
    controller.registerContainer({
      key: 'columns',
      items: allItems,
      orientation: 'horizontal',
      element: () =>
        element.querySelector('[data-part="head"] > [data-part="header-row"]:last-of-type'),
      itemElement: headerOf,
      label: () => latest.current.t('dragColumns'),
      itemLabel: (columnId) => latest.current.labelOf(columnId),
    });
    let wasDragging = false;
    const unsubscribe = controller.subscribe((state) => {
      if (state.status !== 'dragging') {
        /* The click the browser fires after a drop is the drag's, not a press
           on the header: read live, a reordered column came back sorted. */
        if (wasDragging) swallowClick.current = true;
        wasDragging = false;
        setDragState({ dragging: null, target: null, offset: null, scrollTop: 0 });
        return;
      }
      wasDragging = true;
      const dragging = state.items[0] ?? null;
      const target = state.target && state.target.kind === 'between' ? state.target : null;
      let offset: number | null = null;
      let scrollTop = 0;
      let over: string | null = null;
      if (target && dragging) {
        const list = latest.current.resolved;
        const zone = zoneOf(list, dragging);
        const first = list.find((column) => column.id === zone[0]);
        const last = list.find((column) => column.id === zone[zone.length - 1]);
        /* The indicator is drawn where the drop would land: inside the zone. */
        const boundary = Math.max(
          first ? first.index - 1 : 0,
          Math.min(last ? last.index : list.length, target.index),
        );
        const scroller = scroll.current;
        const ids = allItems();
        const atEnd = boundary >= ids.length;
        const anchor = ids[atEnd ? ids.length - 1 : boundary];
        const header = anchor ? headerOf(anchor) : null;
        if (header && scroller) {
          const box = header.getBoundingClientRect();
          const origin = scroller.getBoundingClientRect();
          const rtl = getComputedStyle(scroller).direction === 'rtl';
          const edge = atEnd !== rtl ? box.right : box.left;
          /* Content coordinates: the indicator is positioned in the
             scroller's box at scroll zero, so the scrolled distance is added
             back. `scrollLeft` is negative once an rtl scroller has moved. */
          offset = rtl
            ? origin.right - edge - scroller.scrollLeft
            : edge - origin.left + scroller.scrollLeft;
          scrollTop = scroller.scrollTop;
          over = ids[boundary] ?? null;
        }
      }
      setDragState({ dragging, target: over, offset, scrollTop });
    });
    drag.current = controller;
    /* The headers' ref callbacks ran in the commit before this effect, when
       there was no controller to attach to: every header that reported itself
       is attached now. Read live, no header could be dragged. */
    for (const [columnId, node] of headerNodes.current) attachNode(node, columnId);
    const attached = draggables.current;
    return () => {
      unsubscribe();
      for (const detach of attached.values()) detach();
      attached.clear();
      controller.destroy();
      drag.current = null;
    };
  }, []);

  const nodeByKey = useMemo(() => {
    const map = new Map<string, Extract<GridNode<Row>, { kind: 'row' }>>();
    for (const node of pinned.top) map.set(node.key, node);
    for (const node of nodes) if (node.kind === 'row') map.set(node.key, node);
    for (const node of pinned.bottom) map.set(node.key, node);
    return map;
  }, [nodes, pinned]);
  /* ── Reordering rows ────────────────────────────────────────────────── */
  /* Rows move only while the query is at rest and there is no tree: sorted,
     filtered, searched or grouped, the position on screen is not the
     position in `rows`. A page is fine — a node's index is its place in
     `rows` across pages. */
  const rowsReorderableNow =
    hasDragColumn &&
    !tree &&
    resolvedMode === 'client' &&
    query.sort.length === 0 &&
    query.filter === null &&
    query.search.trim() === '' &&
    query.group.length === 0;
  const [rowDragState, setRowDragState] = useState<{
    dragging: string | null;
    offset: number | null;
    scrollLeft: number;
  }>({ dragging: null, offset: null, scrollLeft: 0 });
  const rowDrag = useRef<DragController | null>(null);
  const rowNodes = useRef(new Map<string, HTMLElement>());
  const rowDraggables = useRef(new Map<string, () => void>());
  const rowLabelOf = useCallback(
    (key: string) => {
      const node = nodeByKey.get(key);
      const header = columns.find((column) => column.rowHeader);
      return node && header ? cellText(header, node.row, formatOptions) : key;
    },
    [nodeByKey, columns, formatOptions],
  );
  const latestRows = useRef({
    nodeByKey,
    mountedNodes,
    rowsReorderableNow,
    onRowsReorder,
    labelOf: rowLabelOf,
    t,
    dragT,
  });
  latestRows.current = {
    nodeByKey,
    mountedNodes,
    rowsReorderableNow,
    onRowsReorder,
    labelOf: rowLabelOf,
    t,
    dragT,
  };
  const attachRowNode = useCallback((node: HTMLElement | null, key: string) => {
    const controller = rowDrag.current;
    rowDraggables.current.get(key)?.();
    rowDraggables.current.delete(key);
    if (!node || !controller) return;
    const detach = controller.attachDraggable(node, {
      container: 'rows',
      key,
      handle: () => node.querySelector('[data-part="row-handle"]'),
      disabled: () => !latestRows.current.rowsReorderableNow,
      distance: 6,
    });
    rowDraggables.current.set(key, detach);
  }, []);
  const attachRowDraggable = useCallback(
    (node: HTMLElement | null, key: string) => {
      if (node) rowNodes.current.set(key, node);
      else rowNodes.current.delete(key);
      attachRowNode(node, key);
    },
    [attachRowNode],
  );
  /** Where a row lands in `rows` when dropped before the visible item at `index`. */
  const rowMove = useCallback((key: string, index: number): DataGridRowsReorderEvent | null => {
    const { nodeByKey: byKey, mountedNodes: mounted } = latestRows.current;
    const node = byKey.get(key);
    if (!node) return null;
    const items = mounted.filter((entry) => entry.kind === 'row');
    const last = items[items.length - 1];
    const before = items[index];
    const target =
      before && before.kind === 'row'
        ? before.index
        : last && last.kind === 'row'
          ? last.index + 1
          : 0;
    /* Removing the row first shifts everything after it up by one. */
    const to = node.index < target ? target - 1 : target;
    if (to === node.index) return null;
    return { key, from: node.index, to, reason: 'pointer' };
  }, []);
  useEffect(() => {
    const element = root.current;
    if (!element || !hasDragColumn) return;
    const controller = createDragController({
      document: element.ownerDocument,
      t: (key, slots) => latestRows.current.dragT(key, slots),
      preview: false,
      autoScroll: { axis: 'y' },
      onDrop: ({ items, target, reason, event }) => {
        if (target.kind !== 'between') return;
        const move = rowMove(items[0]!, target.index);
        if (move)
          latestRows.current.onRowsReorder?.({
            ...move,
            reason: reason === 'keyboard' ? 'keyboard' : 'pointer',
            event,
          });
      },
    });
    const mountedKeys = () =>
      latestRows.current.mountedNodes.flatMap((node) => (node.kind === 'row' ? [node.key] : []));
    const rowOf = (key: string) =>
      element.querySelector(
        `[data-part="body"] > [data-part="row"][data-row="${CSS.escape(key)}"]`,
      );
    controller.registerContainer({
      key: 'rows',
      items: mountedKeys,
      orientation: 'vertical',
      element: () => element.querySelector('[data-part="body"]'),
      itemElement: rowOf,
      label: () => latestRows.current.t('dragRows'),
      itemLabel: (key) => latestRows.current.labelOf(key),
    });
    const unsubscribe = controller.subscribe((state) => {
      if (state.status !== 'dragging') {
        setRowDragState({ dragging: null, offset: null, scrollLeft: 0 });
        return;
      }
      const dragging = state.items[0] ?? null;
      const target = state.target && state.target.kind === 'between' ? state.target : null;
      let offset: number | null = null;
      let scrollLeft = 0;
      const scroller = scroll.current;
      if (target && scroller) {
        const keys = mountedKeys();
        const atEnd = target.index >= keys.length;
        const anchor = keys[atEnd ? keys.length - 1 : target.index];
        const row = anchor ? rowOf(anchor) : null;
        if (row) {
          const box = row.getBoundingClientRect();
          const origin = scroller.getBoundingClientRect();
          offset = (atEnd ? box.bottom : box.top) - origin.top + scroller.scrollTop;
          scrollLeft = Math.abs(scroller.scrollLeft);
        }
      }
      setRowDragState({ dragging, offset, scrollLeft });
    });
    rowDrag.current = controller;
    for (const [key, node] of rowNodes.current) attachRowNode(node, key);
    const attached = rowDraggables.current;
    return () => {
      unsubscribe();
      for (const detach of attached.values()) detach();
      attached.clear();
      controller.destroy();
      rowDrag.current = null;
    };
  }, [hasDragColumn, attachRowNode, rowMove]);
  const moveRow = useCallback(
    (key: string, direction: -1 | 1, source?: unknown) => {
      if (!latestRows.current.rowsReorderableNow) return;
      const items = latestRows.current.mountedNodes.filter((node) => node.kind === 'row');
      const at = items.findIndex((node) => node.key === key);
      if (at < 0) return;
      const index = direction > 0 ? at + 2 : at - 1;
      if (index < 0) return;
      const move = rowMove(key, index);
      if (!move) return;
      onRowsReorder?.({ ...move, reason: 'keyboard', event: source as Event | undefined });
      announce(
        t('rowMoved', {
          row: latestRows.current.labelOf(key),
          position: move.to + 1,
        }),
      );
    },
    [rowMove, onRowsReorder, announce, t],
  );

  /* ── Changed cells ──────────────────────────────────────────────────── */
  const changedFor = highlightChanges === true ? DEFAULT_CHANGED_DURATION : highlightChanges || 0;
  /* One mark per changed cell, with the generation it was marked in: the
     generation's parity is the attribute's value, so a cell changed twice in
     a row restarts its paint. Read as a version, so a cell re-renders only
     when the set moves. */
  const changedCells = useRef(new Map<string, { until: number; generation: number }>());
  const changedGeneration = useRef(0);
  const [changedVersion, setChangedVersion] = useState(0);
  const changedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousRows = useRef<{ rows: readonly Row[]; byKey: Map<string, Row> } | null>(null);
  useEffect(() => {
    if (changedFor <= 0) {
      previousRows.current = null;
      return;
    }
    const previous = previousRows.current;
    const byKey = new Map<string, Row>();
    for (const row of rows) byKey.set(rowKeyOf(row), row);
    previousRows.current = { rows, byKey };
    if (!previous || previous.rows === rows) return;
    const now = Date.now();
    let marked = false;
    for (const node of [...pinned.top, ...mountedNodes, ...pinned.bottom]) {
      if (node.kind !== 'row') continue;
      const before = previous.byKey.get(node.key);
      if (before === undefined || before === node.row) continue;
      for (const column of resolved) {
        if (Object.is(cellValue(column.column, before), cellValue(column.column, node.row)))
          continue;
        changedCells.current.set(`${node.key}\u0000${column.id}`, {
          until: now + changedFor,
          generation: changedGeneration.current + 1,
        });
        marked = true;
      }
    }
    if (!marked) return;
    changedGeneration.current += 1;
    setChangedVersion((version) => version + 1);
    if (changedTimer.current === null) {
      const sweep = () => {
        changedTimer.current = null;
        const at = Date.now();
        let next = Number.POSITIVE_INFINITY;
        for (const [key, mark] of changedCells.current) {
          if (mark.until <= at) changedCells.current.delete(key);
          else next = Math.min(next, mark.until);
        }
        setChangedVersion((version) => version + 1);
        if (next !== Number.POSITIVE_INFINITY)
          changedTimer.current = setTimeout(sweep, Math.max(16, next - at));
      };
      changedTimer.current = setTimeout(sweep, changedFor);
    }
  }, [rows, rowKeyOf, mountedNodes, pinned, resolved, changedFor]);
  useEffect(
    () => () => {
      if (changedTimer.current !== null) clearTimeout(changedTimer.current);
    },
    [],
  );
  const changedOf = useCallback(
    (cell: GridCell): 'a' | 'b' | null => {
      const mark = changedCells.current.get(`${cell.row}\u0000${cell.column}`);
      return mark ? (mark.generation % 2 === 0 ? 'a' : 'b') : null;
    },
    [changedVersion],
  );

  /* ── Expansion ──────────────────────────────────────────────────────── */
  const expandedSet = useMemo(() => new Set(expanded), [expanded]);
  const isExpanded = useCallback((key: string) => expandedSet.has(key), [expandedSet]);
  const toggleExpanded = useCallback(
    (key: string, source?: unknown, reason: DataGridReason = 'pointer') => {
      const next = expandedSet.has(key)
        ? expanded.filter((entry) => entry !== key)
        : [...expanded, key];
      requestExpanded(next, reason, source);
    },
    [expandedSet, expanded, requestExpanded],
  );
  /* ── Tree ───────────────────────────────────────────────────────────── */
  const treeColumn = useMemo(() => {
    if (!tree) return null;
    if (tree.column && resolvedById.has(tree.column)) return tree.column;
    return resolved[0]?.id ?? null;
  }, [tree, resolvedById, resolved]);
  /* A row opened with children still to come: asked for once, marked until
     a child of hers is in `rows` or she is closed. */
  const [loadingChildren, setLoadingChildren] = useState<ReadonlySet<string>>(new Set());
  const isLoadingChildren = useCallback(
    (key: string) => loadingChildren.has(key),
    [loadingChildren],
  );
  const hasChildren = useCallback((row: Row) => tree?.hasChildren?.(row) === true, [tree]);
  useEffect(() => {
    if (loadingChildren.size === 0) return;
    const next = new Set(loadingChildren);
    for (const key of loadingChildren) {
      const node = nodeByKey.get(key);
      if (!node || !expandedSet.has(key) || node.childCount > 0) next.delete(key);
    }
    if (next.size !== loadingChildren.size) setLoadingChildren(next);
  }, [loadingChildren, nodeByKey, expandedSet]);
  const toggleBranch = useCallback(
    (key: string, source?: unknown, reason: DataGridReason = 'pointer') => {
      const node = nodeByKey.get(key);
      if (!node) return;
      const opening = !expandedSet.has(key);
      toggleExpanded(key, source, reason);
      if (opening && node.childCount === 0 && tree?.hasChildren?.(node.row) && onLoadChildren) {
        setLoadingChildren((current) => new Set(current).add(key));
        onLoadChildren({ key, row: node.row });
      }
    },
    [nodeByKey, expandedSet, toggleExpanded, tree, onLoadChildren],
  );
  const groupKeys = useMemo(
    () => nodes.filter((node) => node.kind === 'group').map((node) => node.key),
    [nodes],
  );
  const toggleGroup = useCallback(
    (key: string, source?: unknown, reason: DataGridReason = 'pointer') => {
      const open = expandedGroups === 'all' || expandedGroups.includes(key);
      let next: DataGridExpandedGroups;
      if (expandedGroups === 'all') {
        /* Closing one group under `all` names every other open group. Groups
           below the closed one are not listed, so they open again with it. */
        next = groupKeys.filter((entry) => entry !== key && !entry.startsWith(`${key}/`));
      } else {
        next = open ? expandedGroups.filter((entry) => entry !== key) : [...expandedGroups, key];
      }
      requestExpandedGroups(next, reason, source);
    },
    [expandedGroups, groupKeys, requestExpandedGroups],
  );

  /* ── Editing ────────────────────────────────────────────────────────── */
  const [edit, setEdit] = useState<EditSession | null>(null);
  const editRef = useRef(edit);
  editRef.current = edit;
  const rowOf = useCallback((key: string) => nodeByKey.get(key)?.row, [nodeByKey]);

  const startEdit = useCallback(
    (cell: GridCell, seed: string | null = null) => {
      const row = rowOf(cell.row);
      const column = columns.find((entry) => entry.id === cell.column);
      if (!row || !column || !isEditable(column, row)) return;
      const editing =
        resolvedEditMode === 'row'
          ? columns.filter((entry) => isEditable(entry, row)).map((entry) => entry.id)
          : [cell.column];
      const originals: Record<string, unknown> = {};
      for (const columnId of editing) {
        const target = columns.find((entry) => entry.id === columnId)!;
        originals[columnId] = cellValue(target, row);
      }
      const drafts = { ...originals };
      if (seed !== null) drafts[cell.column] = column.kind === 'number' ? Number(seed) : seed;
      setEdit({ cell, columns: editing, drafts, originals, status: 'editing', messages: {}, seed });
      onEditStart?.(cell);
      pendingFocus.current = cell;
    },
    [rowOf, columns, isEditable, resolvedEditMode, onEditStart],
  );
  const setDraft = useCallback((columnId: string, draft: unknown) => {
    const withDraft = (session: EditSession | null): EditSession | null =>
      session
        ? { ...session, drafts: { ...session.drafts, [columnId]: draft }, status: 'editing' }
        : session;
    // The ref too: an editor whose choice is the commit calls commit() before the next render.
    editRef.current = withDraft(editRef.current);
    setEdit(withDraft);
  }, []);
  const cancelEdit = useCallback(() => {
    const session = editRef.current;
    if (!session) return;
    setEdit(null);
    onEditCancel?.(session.cell);
    pendingFocus.current = session.cell;
  }, [onEditCancel]);

  const nextEditableCell = useCallback(
    (cell: GridCell, move: 'down' | 'next' | 'previous'): GridCell | null => {
      if (move === 'down') {
        const next = moveCursor(cursorGrid, cell, 'down');
        return sameCell(next, cell) || !isBodyRow(next.row) ? null : next;
      }
      const row = rowOf(cell.row);
      if (!row) return null;
      const editable = columnIds.filter((columnId) => {
        const column = columns.find((entry) => entry.id === columnId);
        return column !== undefined && isEditable(column, row);
      });
      const index = editable.indexOf(cell.column);
      const target = editable[index + (move === 'next' ? 1 : -1)];
      return target ? { row: cell.row, column: target } : null;
    },
    [cursorGrid, rowOf, columnIds, columns, isEditable],
  );

  const commitEdit = useCallback(
    (
      reason: 'keyboard' | 'pointer' | 'blur' | 'programmatic',
      options: { move?: 'down' | 'next' | 'previous' | 'stay' } = {},
    ) => {
      const session = editRef.current;
      if (!session || session.status === 'pending') return;
      const row = rowOf(session.cell.row);
      if (!row) {
        setEdit(null);
        return;
      }
      const changes: Record<string, unknown> = {};
      for (const columnId of session.columns) {
        if (!Object.is(session.drafts[columnId], session.originals[columnId]))
          changes[columnId] = session.drafts[columnId];
      }
      const after = () => {
        const move = options.move ?? 'stay';
        const target = move === 'stay' ? null : nextEditableCell(session.cell, move);
        setEdit(null);
        if (target) {
          setCurrent(target, 'keyboard');
          if (resolvedEditMode === 'cell' && move !== 'down') startEdit(target);
        } else pendingFocus.current = session.cell;
      };
      if (Object.keys(changes).length === 0) {
        after();
        return;
      }
      const validate = async () => {
        const messages: Record<string, string> = {};
        for (const columnId of Object.keys(changes)) {
          const column = columns.find((entry) => entry.id === columnId)!;
          const parsed = column.parse ? column.parse(changes[columnId], row) : changes[columnId];
          changes[columnId] = parsed;
          const message = column.validate ? await column.validate(parsed, row) : null;
          if (message) messages[columnId] = message;
        }
        return messages;
      };
      const run = async () => {
        setEdit((state) => (state ? { ...state, status: 'pending' } : state));
        const messages = await validate();
        if (Object.keys(messages).length > 0) {
          setEdit((state) => (state ? { ...state, status: 'invalid', messages } : state));
          pendingFocus.current = session.cell;
          return;
        }
        const primary =
          session.cell.column in changes ? session.cell.column : Object.keys(changes)[0]!;
        try {
          await onEditCommit?.({
            key: session.cell.row,
            column: primary,
            value: changes[primary],
            previous: session.originals[primary],
            row,
            reason,
            changes,
          });
          after();
        } catch (failure) {
          const message =
            failure instanceof Error && failure.message ? failure.message : t('editFailed');
          setEdit((state) =>
            state ? { ...state, status: 'invalid', messages: { [primary]: message } } : state,
          );
          pendingFocus.current = session.cell;
        }
      };
      void run();
    },
    [rowOf, nextEditableCell, setCurrent, resolvedEditMode, startEdit, columns, onEditCommit, t],
  );

  /* A row that changes under an open editor is a conflict, not a refresh. */
  const editConflict = t('editConflict');
  useEffect(() => {
    const session = editRef.current;
    if (!session || session.status === 'pending') return;
    const row = rowOf(session.cell.row);
    if (!row) return;
    const conflicts: Record<string, string> = {};
    for (const columnId of session.columns) {
      const column = columns.find((entry) => entry.id === columnId);
      if (column && !Object.is(cellValue(column, row), session.originals[columnId])) {
        conflicts[columnId] = editConflict;
      }
    }
    if (Object.keys(conflicts).length > 0) {
      setEdit({ ...session, status: 'invalid', messages: { ...session.messages, ...conflicts } });
    }
  }, [rows, rowOf, columns, editConflict]);

  const activate = useCallback(
    (key: string, reason: 'pointer' | 'keyboard', event: unknown) => {
      onActivate?.({ key, reason, event });
    },
    [onActivate],
  );

  /* ── Scrolling and measuring ────────────────────────────────────────── */
  useEffect(() => {
    const scroller = scroll.current;
    if (!scroller) return;
    let frame = 0;
    const read = () => {
      frame = 0;
      setScrollTop(scroller.scrollTop);
      setScrollLeft(Math.abs(scroller.scrollLeft));
    };
    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(read);
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });
    /* Guarded like `@slotted/core/overflow` guards it: a test document has
       no observer, and a grid that never learns its viewport windows nothing
       and stays correct. */
    /* The head's and the summary's heights, for the rows held under one and
       over the other: written on the scroller as the offsets the held rows
       stick at. Observed rather than computed — a filter row is a control's
       height, a group row a line's, and the sum is not the density's. */
    const edges = () => {
      const head = scroller.querySelector<HTMLElement>(':scope > [data-part="head"]');
      const summary = scroller.querySelector<HTMLElement>(':scope > [data-part="summary"]');
      scroller.style.setProperty(
        '--slotted-data-grid-pinned-top-offset',
        `${head?.offsetHeight ?? 0}px`,
      );
      scroller.style.setProperty(
        '--slotted-data-grid-pinned-bottom-offset',
        `${summary?.offsetHeight ?? 0}px`,
      );
    };
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            setViewport({ width: scroller.clientWidth, height: scroller.clientHeight });
            setFrameWidth(scroller.clientWidth);
            edges();
          });
    observer?.observe(scroller);
    for (const part of scroller.querySelectorAll(
      ':scope > [data-part="head"], :scope > [data-part="summary"]',
    ))
      observer?.observe(part);
    setViewport({ width: scroller.clientWidth, height: scroller.clientHeight });
    if (observer) setFrameWidth(scroller.clientWidth);
    edges();
    const affordance = createScrollAffordance(scroller, {
      orientation: () => 'horizontal',
      onChange: (state) => {
        scroller.toggleAttribute('data-overflowing', state.overflowing);
        scroller.toggleAttribute('data-at-start', state.overflowing && state.atStart);
        scroller.toggleAttribute('data-at-end', state.overflowing && state.atEnd);
      },
    });
    return () => {
      scroller.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
      observer?.disconnect();
      affordance.destroy();
    };
  }, []);

  /* The row height, read once from the first mounted row; every row when
     auto. A row with a pop-in changes height with the columns in it and with
     the frame's width, which reflows its fields: both are in the callback's
     identity, so every mounted row reports its height again when either
     moves. */
  const remeasure = hasPopin ? `${outKey}\u0002${frameWidth}` : outKey;
  const measureRow = useCallback(
    (index: number, node: HTMLElement | null) => {
      if (!node) return;
      /* A row is read only when its height is still unknown: the first row of
         a grid with no stated height, or every row of one that grows to its
         content. A read forces layout inside the commit, and a scroll step
         that read each row it mounted laid the page out once per row. */
      const needsFirst = typeof resolvedRowHeight !== 'number' && measuredRow === null;
      if (!needsFirst && !autoRows) return;
      const height = node.getBoundingClientRect().height;
      if (height === 0) return;
      if (needsFirst) setMeasuredRow(Math.round(height));
      if (autoRows) {
        setRowSizes((sizes) =>
          sizes.get(index) === height ? sizes : new Map(sizes).set(index, height),
        );
      }
    },
    [resolvedRowHeight, measuredRow, autoRows, remeasure],
  );

  /* Load more when the row `loadMoreThreshold` rows before the end comes into
     view, unless only the control asks, or the last page failed and a retry is
     the reader's to press. In view of the page, not of the grid's own box: a
     grid with no height grows to its rows and an ancestor scrolls, and its own
     scroller always reached the end, so every page was asked for at mount. An
     observer with no root counts the clip of every ancestor that scrolls. */
  const asksForMore =
    onLoadMore !== undefined &&
    hasMore === true &&
    !loading &&
    resolvedLoadMore !== 'button' &&
    loadMoreFailed !== true;
  const loadMoreIndex = Math.max(0, nodes.length - resolvedThreshold);
  const loadMoreTop = metrics ? metrics.offsetOf(loadMoreIndex) : loadMoreIndex * rowSize;
  const loadMoreMark = useRef<HTMLDivElement | null>(null);
  const latestLoadMore = useRef(onLoadMore);
  latestLoadMore.current = onLoadMore;
  useEffect(() => {
    const mark = loadMoreMark.current;
    /* Without the observer (a test document) nothing asks by itself; the footer still can. */
    if (!asksForMore || mark === null || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) latestLoadMore.current?.();
    });
    observer.observe(mark);
    return () => observer.disconnect();
  }, [asksForMore, nodes.length, loadMoreTop]);

  /* ── Keyboard ───────────────────────────────────────────────────────── */
  const rtl = () => (root.current ? getComputedStyle(root.current).direction === 'rtl' : false);

  const copyRange = useCallback(
    async (cell: GridCell) => {
      const cells = bounds ? rangeCells(cursorGrid, bounds) : [[cell]];
      const text = rangeToText(cells, (target) => {
        const row = rowOf(target.row);
        const column = columns.find((entry) => entry.id === target.column);
        return row && column ? textOf(column, row) : '';
      });
      const outcome = await writeToClipboard(text, root.current?.ownerDocument);
      if (outcome !== 'refused') {
        announce(t('copied', { count: cells.reduce((sum, line) => sum + line.length, 0) }));
      }
    },
    [bounds, cursorGrid, rowOf, columns, textOf, announce, t],
  );

  const onCellKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>, cell: GridCell) => {
      if (event.defaultPrevented) return;
      const session = editRef.current;
      const target = event.target as HTMLElement;
      const cellElement = event.currentTarget;
      const insideWidget = target !== cellElement;
      const key = event.key;
      const mirror = rtl();

      /* Inside an editor: the editor's own keys, then commit and cancel. */
      if (session && sameCell(session.cell, cell)) {
        if (key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          cancelEdit();
          return;
        }
        if (key === 'Enter') {
          event.preventDefault();
          commitEdit('keyboard', { move: resolvedEditMode === 'cell' ? 'down' : 'stay' });
          return;
        }
        if (key === 'Tab') {
          const next = nextEditableCell(cell, event.shiftKey ? 'previous' : 'next');
          if (next) {
            event.preventDefault();
            commitEdit('keyboard', { move: event.shiftKey ? 'previous' : 'next' });
          } else {
            commitEdit('keyboard', { move: 'stay' });
          }
          return;
        }
        if (key === 'F2') {
          event.preventDefault();
          commitEdit('keyboard', { move: 'stay' });
          return;
        }
        return;
      }
      if (session && session.columns.includes(cell.column) && session.cell.row === cell.row) {
        /* Another cell of a row in edit. */
        if (key === 'Escape') {
          event.preventDefault();
          cancelEdit();
          return;
        }
        if (key === 'Enter') {
          event.preventDefault();
          commitEdit('keyboard', { move: 'stay' });
          return;
        }
        if (key === 'Tab') return;
        return;
      }

      /* A widget of a header cell: Escape and F2 return to the cell, Tab
         cycles the cell's widgets without leaving it. */
      if (
        insideWidget &&
        cell.row === HEADER_ROW &&
        cellElement.contains(target) &&
        target.closest('[data-part="column-actions"]') !== null
      ) {
        if (key === 'Escape' || key === 'F2') {
          event.preventDefault();
          cellElement.focus();
          return;
        }
        if (key === 'Tab') {
          const widgets = [
            ...cellElement.querySelectorAll<HTMLElement>(
              '[data-part="column-actions"] button:not([disabled])',
            ),
          ];
          const index = widgets.indexOf(target);
          event.preventDefault();
          widgets[(index + (event.shiftKey ? -1 : 1) + widgets.length) % widgets.length]?.focus();
          return;
        }
      }
      /* Inside a widget the cursor entered: Escape returns to the cell, Tab cycles. */
      if (insideWidget && !target.matches(SIMPLE_WIDGET)) {
        if (key === 'Escape') {
          event.preventDefault();
          cellElement.focus();
        } else if (key === 'Tab') {
          const widgets = [...cellElement.querySelectorAll<HTMLElement>(FOCUSABLE)];
          if (widgets.length > 1) {
            const index = widgets.indexOf(target);
            const next =
              widgets[(index + (event.shiftKey ? -1 : 1) + widgets.length) % widgets.length];
            event.preventDefault();
            next?.focus();
          }
        }
        return;
      }

      const header = cell.row === HEADER_ROW;
      const column = resolvedById.get(cell.column);
      const row = isBodyRow(cell.row) ? rowOf(cell.row) : undefined;
      const intents: Record<string, CursorIntent> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: mirror ? 'end' : 'start',
        ArrowRight: mirror ? 'start' : 'end',
        Home: event.ctrlKey || event.metaKey ? 'first' : 'rowStart',
        End: event.ctrlKey || event.metaKey ? 'last' : 'rowEnd',
        PageUp: 'pageUp',
        PageDown: 'pageDown',
      };

      /* Column operations, on a header. */
      if (header && column) {
        /* Shift+F10 and the Menu key open the column menu on the header cell. */
        if (
          (key === 'ContextMenu' || (key === 'F10' && event.shiftKey)) &&
          !target.closest(EDITABLE)
        ) {
          event.preventDefault();
          keyboardMenuAt.current = Date.now();
          openColumnMenu(cell.column, cellElement, cellElement);
          return;
        }
        if (
          (event.ctrlKey || event.metaKey) &&
          event.shiftKey &&
          (key === 'ArrowLeft' || key === 'ArrowRight')
        ) {
          event.preventDefault();
          const grow = (key === 'ArrowRight') !== mirror;
          resizeBy(cell.column, grow ? RESIZE_STEP : -RESIZE_STEP, event);
          return;
        }
        if ((event.ctrlKey || event.metaKey) && event.shiftKey && key === 'Enter') {
          event.preventDefault();
          autofit(cell.column, 'keyboard', event);
          return;
        }
        /* F2 enters the header cell: its widgets are the column's help, its
           filter and its menu, and a reader reaches them without a pointer. */
        if (key === 'F2' && !insideWidget) {
          const first = cellElement.querySelector<HTMLElement>(
            '[data-part="column-actions"] button:not([disabled])',
          );
          if (first) {
            event.preventDefault();
            first.focus();
          }
          return;
        }
        if (event.altKey && (key === 'ArrowLeft' || key === 'ArrowRight')) {
          event.preventDefault();
          const forward = (key === 'ArrowRight') !== mirror;
          moveColumn(cell.column, forward ? 1 : -1, event);
          pendingFocus.current = cell;
          return;
        }
        if ((event.ctrlKey || event.metaKey) && key === 'Enter') {
          event.preventDefault();
          anchorToButton();
          setMenuOpen(cell.column);
          return;
        }
        if (key === 'Enter' || key === ' ') {
          if (insideWidget) return;
          event.preventDefault();
          pressSort(cell.column, event.shiftKey, event, 'keyboard');
          return;
        }
      }

      /* Group rows open and close with the horizontal arrows. */
      if (
        isGroupCursorRow(cell.row) &&
        (key === 'ArrowRight' || key === 'ArrowLeft') &&
        !event.shiftKey
      ) {
        const groupKey = cell.row.slice(GROUP_ROW_PREFIX.length);
        const open = expandedGroups === 'all' || expandedGroups.includes(groupKey);
        const opening = (key === 'ArrowRight') !== mirror;
        if (opening !== open) {
          event.preventDefault();
          toggleGroup(groupKey, event, 'keyboard');
          return;
        }
      }
      /* Alt with the vertical arrows moves the row, as Alt with the
         horizontal ones moves the column. */
      if (row && event.altKey && (key === 'ArrowUp' || key === 'ArrowDown')) {
        event.preventDefault();
        moveRow(cell.row, key === 'ArrowDown' ? 1 : -1, event);
        pendingFocus.current = cell;
        return;
      }

      /* In the tree column, the horizontal arrows open a closed branch,
         close an open one, and climb to the parent from a closed row or a
         leaf; elsewhere in the row they move the cursor as anywhere. */
      if (
        row &&
        treeColumn !== null &&
        cell.column === treeColumn &&
        (key === 'ArrowRight' || key === 'ArrowLeft') &&
        !event.shiftKey
      ) {
        const node = nodeByKey.get(cell.row);
        const branch =
          node !== undefined && (node.childCount > 0 || tree?.hasChildren?.(row) === true);
        const opening = (key === 'ArrowRight') !== mirror;
        if (node && branch && opening !== node.open) {
          event.preventDefault();
          toggleBranch(cell.row, event, 'keyboard');
          return;
        }
        if (node && !opening && node.parent !== null) {
          event.preventDefault();
          setCurrent({ row: node.parent, column: cell.column }, 'keyboard', event);
          return;
        }
      }
      if (
        row &&
        cell.column === EXPANDER_COLUMN &&
        (key === 'ArrowRight' || key === 'ArrowLeft') &&
        !event.shiftKey &&
        isExpandable(row)
      ) {
        const open = expandedSet.has(cell.row);
        const opening = (key === 'ArrowRight') !== mirror;
        if (opening !== open) {
          event.preventDefault();
          toggleExpanded(cell.row, event, 'keyboard');
          return;
        }
      }

      /* Selection keys. */
      if (key === ' ' && event.shiftKey && row) {
        event.preventDefault();
        if (resolvedSelection === 'range') {
          const line = rowRange(cursorGrid, cell.row);
          if (line) requestRange(line, 'keyboard', event);
        } else toggleSelected(cell.row, { range: false, source: event, reason: 'keyboard' });
        return;
      }
      if (
        key === ' ' &&
        (event.ctrlKey || event.metaKey) &&
        resolvedSelection === 'range' &&
        column
      ) {
        event.preventDefault();
        const line = columnRange(cursorGrid, cell.column);
        if (line) requestRange(line, 'keyboard', event);
        return;
      }
      if ((key === 'a' || key === 'A') && (event.ctrlKey || event.metaKey) && !insideWidget) {
        if (resolvedSelection === 'multiple') {
          event.preventDefault();
          const outcome = nextSelection({
            action: 'all',
            mode: 'multiple',
            selected: selectedList,
            keys: selectableKeys,
          });
          if (outcome.changed || selectedCount < selectableKeys.length)
            commitSelection(selectableKeys, 'select', event);
          return;
        }
        if (resolvedSelection === 'range') {
          event.preventDefault();
          const all = wholeRange(cursorGrid);
          if (all) requestRange(all, 'keyboard', event);
          return;
        }
      }
      if ((key === 'c' || key === 'C') && (event.ctrlKey || event.metaKey) && !insideWidget) {
        const selection = cellElement.ownerDocument.getSelection();
        if (selection && selection.toString().length > 0) return;
        event.preventDefault();
        void copyRange(cell);
        return;
      }
      if (key === 'Escape' && resolvedSelection === 'range' && range) {
        event.preventDefault();
        requestRange(null, 'clear', event);
        return;
      }

      /* Entering a cell: the editor, or the widgets inside. The pop-in is a
         cell of the row: it edits nothing, and Enter enters its widgets or
         activates the row as any other cell does. */
      if (row && (column || cell.column === POPIN_COLUMN_ID) && (key === 'Enter' || key === 'F2')) {
        const editable = column !== undefined && isEditable(column.column, row);
        if (editable && !insideWidget) {
          event.preventDefault();
          startEdit(cell);
          return;
        }
        const widgets = cellElement.querySelectorAll<HTMLElement>(FOCUSABLE);
        if (!insideWidget && widgets.length > 0) {
          event.preventDefault();
          widgets[0]!.focus();
          return;
        }
        if (key === 'Enter' && resolvedActivatable && !insideWidget) {
          event.preventDefault();
          activate(cell.row, 'keyboard', event);
          return;
        }
      }
      if (
        row &&
        column &&
        !insideWidget &&
        key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        (column.kind === 'text' || column.kind === 'number') &&
        isEditable(column.column, row)
      ) {
        if (column.kind === 'number' && !/[0-9.,-]/.test(key)) return;
        event.preventDefault();
        startEdit(cell, key);
        return;
      }

      const intent = intents[key];
      if (!intent) return;
      if (
        insideWidget &&
        (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'Home' || key === 'End') &&
        target.matches('input:not([type="checkbox"]):not([type="radio"]), textarea')
      ) {
        return;
      }
      event.preventDefault();
      const next = landOn(moveCursor(cursorGrid, cell, intent));
      if (event.shiftKey && key.startsWith('Arrow')) {
        if (resolvedSelection === 'range' && isBodyRow(next.row)) {
          const from = range?.anchor ?? cell;
          requestRange({ anchor: from, focus: next }, 'keyboard', event);
        } else if (
          resolvedSelection === 'multiple' &&
          (key === 'ArrowUp' || key === 'ArrowDown') &&
          isBodyRow(next.row)
        ) {
          toggleSelected(next.row, { range: true, source: event, reason: 'keyboard' });
        }
      }
      if (!sameCell(next, cell)) setCurrent(next, 'keyboard', event);
    },
    [
      cancelEdit,
      commitEdit,
      resolvedEditMode,
      nextEditableCell,
      resolvedById,
      rowOf,
      resizeBy,
      autofit,
      moveColumn,
      pressSort,
      expandedGroups,
      toggleGroup,
      isExpandable,
      expandedSet,
      toggleExpanded,
      treeColumn,
      nodeByKey,
      tree,
      toggleBranch,
      moveRow,
      resolvedSelection,
      cursorGrid,
      requestRange,
      toggleSelected,
      selectedList,
      selectableKeys,
      selectedCount,
      commitSelection,
      copyRange,
      range,
      isEditable,
      startEdit,
      resolvedActivatable,
      activate,
      setCurrent,
      openColumnMenu,
      anchorToButton,
      landOn,
    ],
  );

  /* ── Pointer ────────────────────────────────────────────────────────── */
  /* The pointer of the last press on a cell: `touch` and `pen` activate on one press. */
  const pressedWith = useRef('');
  const touchActivatedAt = useRef(Number.NEGATIVE_INFINITY);
  const onCellPointerDown = useCallback(
    (event: PointerEvent<HTMLElement>, cell: GridCell) => {
      pressedWith.current = event.pointerType ?? '';
      if (event.button !== 0) return;
      swallowClick.current = false;
      const session = editRef.current;
      if (
        session &&
        !sameCell(session.cell, cell) &&
        !(session.cell.row === cell.row && session.columns.includes(cell.column))
      ) {
        commitEdit('blur', { move: 'stay' });
      }
      if (!sameCell(cell, current)) requestCurrent(cell, 'pointer', event);
      if (resolvedSelection === 'range' && isBodyRow(cell.row)) {
        if (!insideWidget(event)) {
          beginRange(cell, event.shiftKey, event);
          setRangeDragging(true);
        }
      }
    },
    [commitEdit, current, requestCurrent, resolvedSelection, beginRange],
  );
  const onCellPointerEnter = useCallback(
    (event: PointerEvent<HTMLElement>, cell: GridCell) => {
      if (rangeDragging && event.buttons === 1) extendRange(cell, event);
    },
    [rangeDragging, extendRange],
  );
  useEffect(() => {
    if (!rangeDragging) return;
    const end = () => setRangeDragging(false);
    const doc = root.current?.ownerDocument ?? document;
    doc.addEventListener('pointerup', end);
    doc.addEventListener('pointercancel', end);
    return () => {
      doc.removeEventListener('pointerup', end);
      doc.removeEventListener('pointercancel', end);
    };
  }, [rangeDragging]);

  const onCellClick = useCallback(
    (event: MouseEvent<HTMLElement>, cell: GridCell) => {
      const pointer = pressedWith.current;
      pressedWith.current = '';
      if (swallowClick.current) {
        swallowClick.current = false;
        return;
      }
      if (insideWidget(event)) return;
      if (cell.row === HEADER_ROW && resolvedById.get(cell.column)?.sortable) {
        pressSort(cell.column, event.shiftKey, event, 'pointer');
        return;
      }
      if (isGroupCursorRow(cell.row)) {
        toggleGroup(cell.row.slice(GROUP_ROW_PREFIX.length), event);
        return;
      }
      if (!isBodyRow(cell.row)) return;
      if (resolvedSelection === 'single' && !disabledSet.has(cell.row)) {
        toggleSelected(cell.row, { range: false, source: event });
      }
      /* On a touch screen one press opens the record: a double tap is a zoom,
         not the gesture of opening. A cell in edit keeps the press for its
         editor. */
      const session = editRef.current;
      const editing =
        session !== null && session.cell.row === cell.row && session.columns.includes(cell.column);
      if (resolvedActivatable && (pointer === 'touch' || pointer === 'pen') && !editing) {
        touchActivatedAt.current = Date.now();
        activate(cell.row, 'pointer', event);
      }
    },
    [
      resolvedById,
      pressSort,
      toggleGroup,
      resolvedSelection,
      disabledSet,
      toggleSelected,
      resolvedActivatable,
      activate,
    ],
  );
  const onCellDoubleClick = useCallback(
    (event: MouseEvent<HTMLElement>, cell: GridCell) => {
      if (insideWidget(event)) return;
      /* The second tap of a touch that already activated the row. */
      if (Date.now() - touchActivatedAt.current < TOUCH_ECHO) return;
      const row = rowOf(cell.row);
      const column = columns.find((entry) => entry.id === cell.column);
      if (!row) return;
      if (column && isEditable(column, row) && !resolvedActivatable) {
        startEdit(cell);
        return;
      }
      if (resolvedActivatable) activate(cell.row, 'pointer', event);
      else if (column && isEditable(column, row)) startEdit(cell);
    },
    [rowOf, columns, isEditable, resolvedActivatable, startEdit, activate],
  );
  const onCellFocus = useCallback(
    (cell: GridCell) => {
      setFocused(true);
      if (!sameCell(cell, current)) requestCurrent(cell, 'programmatic');
    },
    [current, requestCurrent],
  );
  const onCellBlur = useCallback(() => {
    /* Blur inside the grid is followed by a focus inside it; the flag is
       cleared only when focus leaves the root, below. */
  }, []);
  const onRootBlur = useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      const next = event.relatedTarget as Node | null;
      if (!next || !event.currentTarget.contains(next)) {
        setFocused(false);
        const session = editRef.current;
        if (session && session.status === 'editing') {
          /* Focus leaving the grid commits the draft, as leaving a field does. */
          commitEdit('blur', { move: 'stay' });
        }
      }
    },
    [commitEdit],
  );

  /* ── Renderers ──────────────────────────────────────────────────────── */
  const renderCellContent = useCallback(
    (context: DataGridCellContext<Row>) => {
      const own = givenLatest.current.cellRenderers?.[context.column.id];
      if (own) return own(context);
      if (renderCell) return renderCell(context);
      return defaultCellContent(context);
    },
    /* The renderers are read through `givenLatest`; their column ids say which apply. */
    [cellRendererIds, renderCell],
  );
  const renderEditorContent = useCallback(
    (context: DataGridEditorContext<Row>): ReactNode => {
      const own = givenLatest.current.editorRenderers?.[context.column.id];
      if (own) return own(context);
      if (renderEditor) return renderEditor(context);
      return defaultEditor(context, t, resolvedLocale);
    },
    [editorRendererIds, renderEditor, t, resolvedLocale],
  );

  /* ── Handle ─────────────────────────────────────────────────────────── */
  const scrollToRowKey = useCallback(
    (key: string, align: 'start' | 'center' | 'end' | 'nearest' = 'nearest') => {
      const index = nodes.findIndex((node) => node.key === key);
      const scroller = scroll.current;
      if (index === -1 || !scroller) return;
      const offset = metrics ? metrics.offsetOf(index) : index * rowSize;
      const head = scroller.querySelector<HTMLElement>('[data-part="head"]')?.offsetHeight ?? 0;
      let top = offset;
      if (align === 'center') top = offset - viewport.height / 2 + rowSize;
      else if (align === 'end') top = offset - viewport.height + rowSize + head;
      else if (align === 'nearest') {
        const visibleTop = scroller.scrollTop;
        const visibleBottom = visibleTop + viewport.height - head;
        if (offset >= visibleTop && offset + rowSize <= visibleBottom) return;
        top = offset < visibleTop ? offset : offset - viewport.height + rowSize + head;
      }
      scroller.scrollTo({ top: Math.max(0, top) });
      if (windowsRows) setHeldRows([key]);
    },
    [nodes, metrics, rowSize, viewport.height, windowsRows],
  );
  const scrollToColumnId = useCallback(
    (columnId: string) => {
      const scroller = scroll.current;
      const column = resolvedById.get(columnId);
      if (!scroller || !column || column.pinned) return;
      let offset = gutters.reduce((sum, width) => sum + width, 0);
      for (const entry of resolved) {
        if (entry.id === columnId) break;
        if (entry.pinned === null || entry.pinned === 'start') offset += entry.width;
      }
      const startZone =
        resolved
          .filter((entry) => entry.pinned === 'start')
          .reduce((sum, entry) => sum + entry.width, 0) +
        gutters.reduce((sum, width) => sum + width, 0);
      const endZone = resolved
        .filter((entry) => entry.pinned === 'end')
        .reduce((sum, entry) => sum + entry.width, 0);
      const left = Math.abs(scroller.scrollLeft);
      if (offset < left + startZone) scroller.scrollTo({ left: offset - startZone });
      else if (offset + column.width > left + viewport.width - endZone)
        scroller.scrollTo({ left: offset + column.width - viewport.width + endZone });
    },
    [resolvedById, gutters, resolved, viewport.width],
  );
  /* The file's text, shared by the two handle methods. */
  const buildCsv = useCallback(
    (options: DataGridExportOptions = {}) => {
      const { filename: _filename, rows: which, columns: whichColumns, ...csv } = options;
      const visible = resolvedMode === 'client' ? result.rows : rows;
      const chosen =
        which === 'selected' ? visible.filter((row) => selectedSet.has(rowKeyOf(row))) : visible;
      const model = whichColumns === 'all' ? columns : resolved.map((column) => column.column);
      return toCsv(chosen, model, {
        locale: resolvedLocale,
        timeZone,
        ...csv,
        booleans: csv.booleans ?? formatOptions.booleans,
      });
    },
    [
      resolvedMode,
      result.rows,
      rows,
      selectedSet,
      rowKeyOf,
      columns,
      resolved,
      resolvedLocale,
      timeZone,
      formatOptions.booleans,
    ],
  );
  useImperativeHandle(
    handle,
    (): DataGridHandle => ({
      focusCell: (cell) => setCurrent(cell, 'programmatic'),
      scrollToRow: scrollToRowKey,
      scrollToColumn: scrollToColumnId,
      scrollToCell: (cell) => {
        scrollToRowKey(cell.row);
        scrollToColumnId(cell.column);
      },
      startEdit: (cell) => {
        setCurrent(cell, 'programmatic');
        startEdit(cell);
      },
      stopEdit: (options) =>
        options?.commit === false ? cancelEdit() : commitEdit('programmatic'),
      autofit: (columnId) => autofit(columnId ?? null, 'programmatic'),
      getOutOfSpace: () => outOfSpace,
      getVisibleRows: () => (resolvedMode === 'client' ? result.rows : rows),
      toCsv: buildCsv,
      /* A download by an anchor: the one way a browser saves a file without
         a permission prompt, and the URL is revoked as soon as the click has
         taken it. */
      reload: sourced.reload,
      exportCsv: (options = {}) => {
        const text = buildCsv(options);
        const doc = root.current?.ownerDocument ?? document;
        const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
        const link = doc.createElement('a');
        link.href = url;
        link.download = options.filename ?? 'export.csv';
        link.click();
        URL.revokeObjectURL(url);
      },
      selectAll: () => commitSelection(selectableKeys, 'programmatic', undefined),
      clearSelection: () => commitSelection([], 'programmatic', undefined),
      get element() {
        return root.current;
      },
    }),
    [
      setCurrent,
      scrollToRowKey,
      scrollToColumnId,
      startEdit,
      cancelEdit,
      commitEdit,
      autofit,
      outOfSpace,
      resolvedMode,
      result.rows,
      rows,
      buildCsv,
      sourced.reload,
      commitSelection,
      selectableKeys,
    ],
  );

  /* ── Root ───────────────────────────────────────────────────────────── */
  const attachRoot = useCallback(
    (node: HTMLDivElement | null) => {
      root.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  const rangeSummary = useMemo(() => {
    if (!bounds) return null;
    return `${bounds.rowEnd - bounds.rowStart + 1} × ${bounds.columnEnd - bounds.columnStart + 1}`;
  }, [bounds]);

  /* The last answer the grid drew. Zero rows is an answer, and a refetch of
     it keeps the empty state rather than drawing a skeleton over it (AF-02).
     Rows emptied by the consumer while a load starts are a new set, and wait
     in the skeleton. */
  const lastAnswer = useRef<'rows' | 'empty' | null>(null);
  const firstLoad =
    loadingGiven === 'initial' || (loadingGiven === true && lastAnswer.current !== 'empty');
  if (!loading && !error) lastAnswer.current = rows.length > 0 ? 'rows' : 'empty';

  const status: 'rows' | 'empty' | 'no-results' | 'error' | 'loading' = error
    ? 'error'
    : firstLoad && rows.length === 0
      ? 'loading'
      : nodes.length > 0
        ? 'rows'
        : query.filter || query.search.trim()
          ? 'no-results'
          : 'empty';

  /* A first load draws as many skeleton rows as the frame shows, capped at
     the page the query asks for: eight rows in a frame of twenty-five left
     the rest of the frame empty and the page that arrived was a different
     picture. An unmeasured frame draws the stated count. */
  const skeletonCount = useMemo(() => {
    const page = query.page?.size;
    if (viewport.height === 0) return resolvedSkeleton;
    return Math.max(1, Math.min(page ?? Infinity, Math.ceil(viewport.height / rowSize)));
  }, [query.page?.size, viewport.height, rowSize, resolvedSkeleton]);

  /* One tab stop always, as the pattern requires of a grid: the current cell
     while there is one, and the first cell of the header until the reader
     has been anywhere — without it a grid nobody had entered had no way in
     from the keyboard and no focusable content for its scroller. */
  const tabStop = useMemo<GridCell>(
    () => current ?? { row: HEADER_ROW, column: columnIds[0] ?? '' },
    [current, columnIds],
  );
  const internal = useMemo<DataGridInternal<Row>>(
    () => ({
      id,
      t,
      locale: resolvedLocale,
      booleans: formatOptions.booleans,
      timeZone,
      columns,
      resolved,
      resolvedById,
      columnIds,
      mountedColumns,
      columnsWindowed: windowsColumns,
      popinColumns,
      popinAggregated,
      popinIndex,
      hasPopinCell,
      query,
      nodes,
      total,
      selectionMode: resolvedSelection,
      editMode: resolvedEditMode,
      filterRow: resolvedFilterRow,
      activatable: resolvedActivatable,
      rowKeyOf,
      textOf,
      valueOf: cellValue,
      isEditable,
      anyEditable,
      isDisabled,
      isExpandable,
      current,
      tabStop,
      focused,
      setCurrent,
      isSelected,
      selectedCount,
      toggleSelected,
      toggleAll,
      allState,
      selectableCount: selectableKeys.length,
      rangeBounds: bounds,
      rangeInfo,
      changedOf,
      beginRange,
      extendRange,
      rangeDragging,
      isExpanded,
      toggleExpanded,
      toggleBranch,
      treeColumn,
      hasChildren,
      rowsReorderable: rowsReorderableNow,
      attachRowDraggable,
      rowLabelOf,
      isLoadingChildren,
      toggleGroup,
      sortOf,
      pressSort,
      setSort,
      filterOf,
      setFilter,
      filterOpen,
      setFilterOpen,
      menuOpen,
      setMenuOpen,
      menuAnchor,
      anchorToButton,
      onHeaderContextMenu,
      filterDebounce: resolvedDebounce,
      countsFor,
      pin,
      hide,
      resizeBy,
      resizeTo,
      autofit,
      moveColumn,
      resizing,
      setResizing,
      dragging: dragState.dragging,
      dropTarget: dragState.target,
      draggingRow: rowDragState.dragging,
      dropOffset: dragState.offset,
      attachDraggable,
      onManageColumns,
      edit,
      startEdit,
      setDraft,
      commitEdit,
      cancelEdit,
      activate,
      renderCellContent,
      renderEditorContent,
      renderHeaderContent: renderHeader,
      renderDetail,
      renderGroup,
      renderFilterOperand: renderFilterOperand as never,
      onCellPointerDown,
      onCellPointerEnter,
      onCellClick,
      onCellDoubleClick,
      onCellKeyDown,
      onCellFocus,
      onCellBlur,
      announce,
      detailId: (key: string) => `${id}detail-${key}`,
      rangeSummary,
    }),
    [
      id,
      t,
      resolvedLocale,
      formatOptions.booleans,
      timeZone,
      columns,
      resolved,
      resolvedById,
      columnIds,
      mountedColumns,
      windowsColumns,
      popinColumns,
      popinAggregated,
      popinIndex,
      hasPopinCell,
      query,
      nodes,
      total,
      resolvedSelection,
      resolvedEditMode,
      resolvedFilterRow,
      resolvedActivatable,
      rowKeyOf,
      textOf,
      isEditable,
      anyEditable,
      isDisabled,
      isExpandable,
      current,
      tabStop,
      focused,
      setCurrent,
      isSelected,
      selectedCount,
      toggleSelected,
      toggleAll,
      allState,
      selectableKeys.length,
      bounds,
      rangeInfo,
      changedOf,
      beginRange,
      extendRange,
      rangeDragging,
      isExpanded,
      toggleExpanded,
      toggleBranch,
      treeColumn,
      hasChildren,
      rowsReorderableNow,
      attachRowDraggable,
      rowLabelOf,
      isLoadingChildren,
      toggleGroup,
      sortOf,
      pressSort,
      setSort,
      filterOf,
      setFilter,
      filterOpen,
      menuOpen,
      menuAnchor,
      anchorToButton,
      onHeaderContextMenu,
      resolvedDebounce,
      countsFor,
      pin,
      hide,
      resizeBy,
      resizeTo,
      autofit,
      moveColumn,
      resizing,
      dragState,
      rowDragState.dragging,
      attachDraggable,
      onManageColumns,
      edit,
      startEdit,
      setDraft,
      commitEdit,
      cancelEdit,
      activate,
      renderCellContent,
      renderEditorContent,
      renderHeader,
      renderDetail,
      renderGroup,
      renderFilterOperand,
      onCellPointerDown,
      onCellPointerEnter,
      onCellClick,
      onCellDoubleClick,
      onCellKeyDown,
      onCellFocus,
      onCellBlur,
      announce,
      rangeSummary,
    ],
  );

  /* Body rows read the grid through this store rather than the context, so a
     selection click or a scroll step renders only the rows it changed. */
  const [rowStore] = useState(() => createDataGridRowStore(internal));
  rowStore.set(internal);
  useLayoutEffect(() => rowStore.publish(), [internal, rowStore]);

  const rootStyle = {
    ...style,
    '--slotted-data-grid-template': template,
    ...(height === undefined
      ? {}
      : { '--slotted-data-grid-block-size': typeof height === 'number' ? `${height}px` : height }),
    /* A stated row height is the drawn row as well as the windowed one: the
       window's offsets are computed from it, and a row drawn at the density's
       height under a taller estimate drifted away from its own place. */
    ...(typeof resolvedRowHeight === 'number'
      ? { '--slotted-data-grid-row-block-size': `${resolvedRowHeight}px` }
      : {}),
    ...(changedFor > 0 ? { '--slotted-data-grid-changed-duration': `${changedFor}ms` } : {}),
    /* Where a pop-in's fields start: after the gutters, with the first data column. */
    ...(hasPopin ? { '--slotted-data-grid-leading': `${leading}px` } : {}),
    /* The scroller's width, which holds a detail, a group row and the empty
       state to the frame without making the scroller a size container. */
    ...(viewport.width > 0 ? { '--slotted-data-grid-viewport': `${viewport.width}px` } : {}),
  } as CSSProperties;
  const bodyStyle = windowsRows
    ? ({
        '--slotted-data-grid-window-total': `${rowWindow.totalSize}px`,
        '--slotted-data-grid-window-start': `${rowWindow.startOffset}px`,
      } as CSSProperties)
    : undefined;

  const rangeText = (() => {
    if (showRange === false || !query.page || nodes.length === 0) return null;
    const start = ('index' in query.page ? query.page.index * query.page.size : 0) + 1;
    const shown =
      resolvedMode === 'client' ? nodes.filter((node) => node.kind === 'row').length : rows.length;
    const last = start + shown - 1;
    return total === null || total < 0
      ? t('rangeUnknown', { start, end: last })
      : t('range', { start, end: last, total });
  })();

  /**
   * What the footer offers for the next page. Under `scroll` the request is
   * automatic: a quiet status while the page loads, and a retry only once one
   * failed. A Load more control beside a list that loads itself read as a
   * control with no purpose.
   */
  const moreControl = (() => {
    if (!hasMore || !onLoadMore) return null;
    const offersControl = resolvedLoadMore !== 'scroll' || loadMoreFailed === true;
    if (!offersControl) {
      return loading ? (
        <span data-loading-more="" role="status">
          {t('loadingMore')}
        </span>
      ) : null;
    }
    return (
      <div>
        <Button
          disabled={loading}
          onClick={() => onLoadMore()}
          size="sm"
          tone="secondary"
          variant="outline"
        >
          {loadMoreFailed === true ? t('retry') : t('loadMore')}
        </Button>
      </div>
    );
  })();

  const emptyContent = (() => {
    if (status === 'rows' || status === 'loading') return null;
    const kind = status;
    if (renderEmpty) return renderEmpty(kind);
    const title =
      kind === 'error' ? t('error') : kind === 'no-results' ? t('noResults') : t('empty');
    return (
      <ResultState reach="section" status={kind} tabIndex={-1}>
        <ResultStateContent>
          <ResultStateTitle>{title}</ResultStateTitle>
          {kind === 'error' && error ? (
            <ResultStateDescription>{error}</ResultStateDescription>
          ) : null}
        </ResultStateContent>
        {kind === 'no-results' || (kind === 'error' && onRetry) ? (
          <ResultStateActions>
            {kind === 'no-results' ? (
              <Button
                onClick={(event) => {
                  const move = withoutFilters(query);
                  requestQuery(move.query, 'clear', event, { change: move.change });
                }}
                size="sm"
                tone="secondary"
                variant="outline"
              >
                {t('clearFilters')}
              </Button>
            ) : (
              <Button onClick={() => onRetry?.()} size="sm" tone="secondary" variant="outline">
                {t('retry')}
              </Button>
            )}
          </ResultStateActions>
        ) : null}
      </ResultState>
    );
  })();

  return (
    <DataGridInternalContext.Provider value={rowStore.grid as DataGridInternal<unknown>}>
      <DataGridRowStoreContext.Provider value={rowStore as DataGridRowStore<unknown>}>
        <div
          {...nativeProps}
          aria-busy={loading && status !== 'loading' ? true : undefined}
          aria-colcount={ariaColCount}
          aria-label={nativeProps['aria-label'] ?? (labelledBy ? undefined : t('grid'))}
          aria-labelledby={labelledBy}
          aria-multiselectable={
            resolvedSelection === 'multiple' || resolvedSelection === 'range' ? true : undefined
          }
          aria-rowcount={
            (total === null ? -1 : total) +
            pinned.top.length +
            pinned.bottom.length +
            headerRowCount +
            (hasSummary ? 1 : 0)
          }
          data-part="root"
          data-part-root=""
          data-popin={hasPopin ? outOfSpace.popin.length : undefined}
          data-narrow={viewport.width > 0 && viewport.width < COMPACT_BELOW ? '' : undefined}
          data-rows={autoRows ? 'auto' : 'fixed'}
          data-slotted-density={density ?? undefined}
          data-ui="data-grid"
          data-ui-data-grid=""
          data-variant={resolvedVariant}
          onBlur={onRootBlur}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (event.defaultPrevented) return;
            if (drag.current?.handleKeydown(event.nativeEvent)) return;
            rowDrag.current?.handleKeydown(event.nativeEvent);
          }}
          ref={attachRoot}
          role={tree ? 'treegrid' : 'grid'}
          style={rootStyle}
          {...(resolvedStriped ? { 'data-striped': '' } : {})}
          {...(resolvedSticky ? { 'data-sticky-header': '' } : {})}
          {...(resolvedFilterRow ? { 'data-filter-row': '' } : {})}
          {...(resolvedStickyTo === 'page' ? { 'data-sticky-to': 'page' } : {})}
          {...(resolvedSelection === 'none' ? {} : { 'data-selection': resolvedSelection })}
        >
          <div data-part="scroll" data-part-scroll="" ref={scroll}>
            <DataGridHead<Row> columnGroups={columnGroups} headerRowCount={headerRowCount} />
            {pinned.top.length > 0 ? (
              <DataGridPinnedRows<Row>
                edge="top"
                firstRowIndex={headerRowCount + 1}
                nodes={pinned.top}
              />
            ) : null}
            {status === 'loading' ? (
              <DataGridLoader<Row> rowSize={rowSize} rows={skeletonCount} />
            ) : (
              <DataGridBody<Row>
                bodyStyle={bodyStyle}
                firstIndex={windowsRows ? rowWindow.startIndex : 0}
                headerRowCount={headerRowCount + pinned.top.length}
                measureRow={autoRows || measuredRow === null ? measureRow : undefined}
                loadMore={asksForMore ? { top: loadMoreTop, ref: loadMoreMark } : undefined}
                nodes={mountedNodes}
                heldRows={heldRows}
                allNodes={nodes}
              />
            )}
            {emptyContent !== null && status !== 'loading' ? (
              <DataGridEmpty>{emptyContent}</DataGridEmpty>
            ) : null}
            {pinned.bottom.length > 0 ? (
              <DataGridPinnedRows<Row>
                edge="bottom"
                firstRowIndex={headerRowCount + pinned.top.length + (total ?? nodes.length) + 1}
                nodes={pinned.bottom}
              />
            ) : null}
            {hasSummary && status === 'rows' ? (
              <DataGridSummary<Row>
                aggregates={result.aggregates}
                rowIndex={
                  headerRowCount +
                  pinned.top.length +
                  (total ?? nodes.length) +
                  pinned.bottom.length +
                  1
                }
              />
            ) : null}
            {dragState.offset !== null ? (
              <div
                aria-hidden
                data-part="drop-indicator"
                data-part-drop-indicator=""
                style={
                  {
                    '--slotted-data-grid-drop-offset': `${dragState.offset}px`,
                    '--slotted-data-grid-drop-scroll': `${dragState.scrollTop}px`,
                  } as CSSProperties
                }
              />
            ) : null}
            {rowDragState.offset !== null ? (
              <div
                aria-hidden
                data-axis="row"
                data-part="drop-indicator"
                data-part-drop-indicator=""
                style={
                  {
                    '--slotted-data-grid-drop-offset': `${rowDragState.offset}px`,
                    '--slotted-data-grid-drop-scroll': `${rowDragState.scrollLeft}px`,
                  } as CSSProperties
                }
              />
            ) : null}
          </div>
          {footer !== undefined || rangeText !== null || moreControl !== null ? (
            <div data-part="footer" data-part-footer="">
              {rangeText !== null ? <span data-range="">{rangeText}</span> : null}
              {footer}
              {footer === undefined ? moreControl : null}
            </div>
          ) : null}
        </div>
      </DataGridRowStoreContext.Provider>
    </DataGridInternalContext.Provider>
  );
}

/**
 * Where a drop at a boundary of the whole row lands inside the source's zone:
 * the index among the zone's members, or `null` when the column would not
 * move. A boundary past the zone's edge lands on that edge.
 */
function zoneIndex<Row>(
  list: readonly ResolvedGridColumn<Row>[],
  zone: readonly string[],
  columnId: string,
  boundary: number,
): number | null {
  const first = list.findIndex((column) => column.id === zone[0]);
  const clamped = Math.max(first, Math.min(first + zone.length, boundary));
  const from = zone.indexOf(columnId);
  const to = clamped - first;
  const settled = to > from ? to - 1 : to;
  return settled === from ? null : settled;
}

function isBodyRow(row: string): boolean {
  return row !== HEADER_ROW && row !== FILTER_ROW && row !== SUMMARY_ROW && !isGroupCursorRow(row);
}

export { isBodyRow };
