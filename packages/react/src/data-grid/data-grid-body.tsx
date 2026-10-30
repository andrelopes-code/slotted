import { selectorKeyProps } from '@slotted/core/selector-key';
import {
  GROUP_ROW_PREFIX,
  POPIN_COLUMN_ID,
  SUMMARY_ROW,
  type GridNode,
  type ResolvedGridColumn,
} from '@slotted/core/grid';
import { memo, useCallback } from 'react';
import type { CSSProperties, ReactNode, Ref } from 'react';

import { Checkbox } from '../checkbox';
import { Glyph, Icon } from '../icon';
import { Skeleton } from '../skeleton';
import { VisuallyHidden } from '../visually-hidden';
import {
  cellStyle,
  columnAttributes,
  DRAG_COLUMN,
  EXPANDER_COLUMN,
  SELECTION_COLUMN,
} from './data-grid-constants';
import { useDataGridInternal, useDataGridRow } from './data-grid-context';
import { cellText } from '@slotted/core/grid';

interface BodyProps<Row> {
  nodes: readonly GridNode<Row>[];
  allNodes: readonly GridNode<Row>[];
  firstIndex: number;
  headerRowCount: number;
  bodyStyle: CSSProperties | undefined;
  measureRow: ((index: number, node: HTMLElement | null) => void) | undefined;
  heldRows: readonly string[];
  /** Where the rows that ask for the next page begin, and the mark observed over them to the end. */
  loadMore?: { top: number; ref: Ref<HTMLDivElement> } | undefined;
}

export function DataGridBody<Row>({
  allNodes,
  bodyStyle,
  firstIndex,
  headerRowCount,
  measureRow,
  nodes,
  heldRows,
  loadMore,
}: BodyProps<Row>) {
  /* A row the cursor stands on is mounted whatever the window says, at its
     own place: with the window's padding on the body it is drawn in flow
     after the windowed rows, and the cursor finds it by key. */
  const extra = heldRows
    .map((key) => allNodes.find((node) => node.key === key))
    .filter((node): node is GridNode<Row> => node !== undefined && !nodes.includes(node));

  return (
    <div data-part="body" data-part-body="" role="rowgroup" style={bodyStyle}>
      {[...nodes, ...extra].map((node, offset) => {
        const index = firstIndex + offset;
        const rowIndex = headerRowCount + 1 + (node.kind === 'row' ? node.index : index);
        return node.kind === 'group' ? (
          <GroupRow<Row> key={`group:${node.key}`} node={node} rowIndex={rowIndex} />
        ) : (
          <BodyRow<Row>
            index={index}
            key={node.key}
            measure={measureRow}
            node={node}
            rowIndex={rowIndex}
          />
        );
      })}
      {loadMore ? (
        <div
          aria-hidden="true"
          ref={loadMore.ref}
          style={{ bottom: 0, inlineSize: 1, position: 'absolute', top: loadMore.top }}
        />
      ) : null}
    </div>
  );
}

/**
 * Rows held at an edge of the body: a rowgroup of their own, sticky under
 * the head or over the summary, outside the window and the query. Each row
 * is the body's row, cursor and selection included.
 */
export function DataGridPinnedRows<Row>({
  edge,
  firstRowIndex,
  nodes,
}: {
  edge: 'top' | 'bottom';
  firstRowIndex: number;
  nodes: readonly Extract<GridNode<Row>, { kind: 'row' }>[];
}) {
  return (
    <div data-edge={edge} data-part="pinned-rows" data-part-pinned-rows="" role="rowgroup">
      {nodes.map((node, offset) => (
        <BodyRow<Row>
          index={-1}
          key={node.key}
          measure={undefined}
          node={node}
          rowIndex={firstRowIndex + offset}
        />
      ))}
    </div>
  );
}

/**
 * The result-state for no rows, no results or an error. A sibling of the
 * body rather than a child of it: a body with nothing in it is only as wide
 * as the message, and the message could not stay in view while the header's
 * columns scrolled sideways; against the scroller's own width it sticks to
 * the start and stands in the middle of what the reader sees.
 */
export function DataGridEmpty({ children }: { children: ReactNode }) {
  return (
    <div data-part="empty" data-part-empty="">
      {children}
    </div>
  );
}

interface RowProps<Row> {
  node: Extract<GridNode<Row>, { kind: 'row' }>;
  index: number;
  rowIndex: number;
  measure: ((index: number, node: HTMLElement | null) => void) | undefined;
}

function BodyRowInner<Row>({ index, measure, node, rowIndex }: RowProps<Row>) {
  const key = node.key;
  const store = useDataGridRow<Row>(key);
  const grid = store.latest();
  const selected = grid.isSelected(key);
  const disabled = grid.isDisabled(key);
  const current = grid.current !== null && grid.current.row === key;
  /* In a tree, `expanded` is the branch; the detail is a leaf's alone. */
  const expanded = grid.isExpanded(key) && (grid.treeColumn === null || node.childCount === 0);
  const loadingChildren = grid.isLoadingChildren(key);
  const editing = grid.edit !== null && grid.edit.cell.row === key;
  const attach = useCallback(
    (element: HTMLDivElement | null) => {
      measure?.(index, element);
      store.grid.attachRowDraggable(element, key);
    },
    [measure, index, store, key],
  );

  return (
    <>
      <div
        aria-rowindex={rowIndex}
        aria-selected={
          grid.selectionMode === 'single' || grid.selectionMode === 'multiple'
            ? selected
            : undefined
        }
        data-part="row"
        data-part-row=""
        data-row={key}
        ref={attach}
        role="row"
        {...(grid.treeColumn !== null ? { 'aria-level': node.level } : {})}
        {...(grid.treeColumn !== null && (node.childCount > 0 || node.open || loadingChildren)
          ? { 'aria-expanded': node.open }
          : {})}
        {...(loadingChildren ? { 'data-loading': '' } : {})}
        {...(grid.draggingRow === key ? { 'data-dragging': '' } : {})}
        {...(selected ? { 'data-selected': '' } : {})}
        {...(current ? { 'data-current': '' } : {})}
        {...(expanded ? { 'data-expanded': '' } : {})}
        {...(disabled ? { 'data-disabled': '' } : {})}
        {...(editing ? { 'data-editing': '' } : {})}
      >
        {grid.columnIds.includes(SELECTION_COLUMN) ? <SelectionCell<Row> rowKey={key} /> : null}
        {grid.columnIds.includes(DRAG_COLUMN) ? <DragHandleCell<Row> node={node} /> : null}
        {grid.columnIds.includes(EXPANDER_COLUMN) ? <ExpanderCell<Row> node={node} /> : null}
        {grid.mountedColumns.map((column) => (
          <BodyCell<Row> column={column} key={column.id} node={node} />
        ))}
        {grid.popinColumns.length > 0 ? <PopinCell<Row> node={node} /> : null}
      </div>
      {expanded && grid.renderDetail ? (
        <div
          aria-rowindex={rowIndex + 1}
          data-part="detail"
          data-part-detail=""
          data-row={`${key}:detail`}
          id={grid.detailId(key)}
          role="row"
        >
          <div
            aria-colindex={1}
            aria-colspan={grid.popinColumns.length > 0 ? grid.popinIndex : grid.columnIds.length}
            role="gridcell"
            style={{ '--slotted-data-grid-column': '1 / -1' } as CSSProperties}
            tabIndex={-1}
          >
            {grid.renderDetail(node.row, key)}
          </div>
        </div>
      ) : null}
    </>
  );
}

const BodyRow = memo(BodyRowInner) as typeof BodyRowInner;

function SelectionCell<Row>({ rowKey }: { rowKey: string }) {
  const grid = useDataGridInternal<Row>();
  const cell = { row: rowKey, column: SELECTION_COLUMN };
  const current =
    grid.current !== null &&
    grid.current.row === rowKey &&
    grid.current.column === SELECTION_COLUMN;
  const disabled = grid.isDisabled(rowKey);
  return (
    <div
      aria-colindex={1}
      data-column={SELECTION_COLUMN}
      data-part="selection"
      data-part-selection=""
      role="gridcell"
      style={{ '--slotted-data-grid-column': '1' } as CSSProperties}
      tabIndex={current ? 0 : -1}
      onFocus={(event) => {
        if (event.target === event.currentTarget) grid.onCellFocus(cell);
      }}
      onKeyDown={(event) => grid.onCellKeyDown(event, cell)}
      onPointerDown={(event) => grid.onCellPointerDown(event, cell)}
      {...(current ? { 'data-current': '' } : {})}
    >
      <Checkbox
        checked={grid.isSelected(rowKey)}
        disabled={disabled || undefined}
        onCheckedChange={(_checked, request) => {
          const source = request.source as { shiftKey?: boolean } | undefined;
          grid.toggleSelected(rowKey, { range: source?.shiftKey === true, source: request.source });
        }}
        tabIndex={current ? 0 : -1}
      >
        <VisuallyHidden>
          {grid.t('selectRow', { row: grid.rowLabelOf(rowKey), key: rowKey })}
        </VisuallyHidden>
      </Checkbox>
    </div>
  );
}

/**
 * The row's drag handle: a button the pointer drags from and the keyboard
 * moves with Alt and the arrows from any cell of the row. Disabled, not
 * gone, while the query is not at rest, so the column keeps its width and
 * the reader hears why nothing moves.
 */
function DragHandleCell<Row>({ node }: { node: Extract<GridNode<Row>, { kind: 'row' }> }) {
  const grid = useDataGridInternal<Row>();
  const cell = { row: node.key, column: DRAG_COLUMN };
  const index = grid.columnIds.indexOf(DRAG_COLUMN) + 1;
  const current =
    grid.current !== null && grid.current.row === node.key && grid.current.column === DRAG_COLUMN;
  return (
    <div
      aria-colindex={index}
      data-column={DRAG_COLUMN}
      data-kind="drag"
      data-part="cell"
      data-part-cell=""
      role="gridcell"
      style={{ '--slotted-data-grid-column': String(index) } as CSSProperties}
      tabIndex={current ? 0 : -1}
      onFocus={(event) => {
        if (event.target === event.currentTarget) grid.onCellFocus(cell);
      }}
      onKeyDown={(event) => grid.onCellKeyDown(event, cell)}
      onPointerDown={(event) => grid.onCellPointerDown(event, cell)}
      {...(current ? { 'data-current': '' } : {})}
    >
      <button
        aria-disabled={grid.rowsReorderable ? undefined : true}
        aria-label={grid.t('reorderRow', { row: grid.rowLabelOf(node.key) })}
        data-part="row-handle"
        data-part-row-handle=""
        {...(grid.rowsReorderable ? {} : { 'data-disabled': '' })}
        tabIndex={current ? 0 : -1}
        type="button"
      >
        <Icon>
          <Glyph name="grip-vertical" />
        </Icon>
      </button>
    </div>
  );
}

function ExpanderCell<Row>({ node }: { node: Extract<GridNode<Row>, { kind: 'row' }> }) {
  const grid = useDataGridInternal<Row>();
  const cell = { row: node.key, column: EXPANDER_COLUMN };
  const index = grid.columnIds.indexOf(EXPANDER_COLUMN) + 1;
  const current =
    grid.current !== null &&
    grid.current.row === node.key &&
    grid.current.column === EXPANDER_COLUMN;
  const expandable = grid.isExpandable(node.row);
  const open = grid.isExpanded(node.key);
  return (
    <div
      aria-colindex={index}
      data-column={EXPANDER_COLUMN}
      data-kind="expander"
      data-part="cell"
      data-part-cell=""
      role="gridcell"
      style={{ '--slotted-data-grid-column': String(index) } as CSSProperties}
      tabIndex={current ? 0 : -1}
      onFocus={(event) => {
        if (event.target === event.currentTarget) grid.onCellFocus(cell);
      }}
      onKeyDown={(event) => grid.onCellKeyDown(event, cell)}
      onPointerDown={(event) => grid.onCellPointerDown(event, cell)}
      {...(current ? { 'data-current': '' } : {})}
    >
      {expandable ? (
        <button
          aria-controls={open ? grid.detailId(node.key) : undefined}
          aria-expanded={open}
          aria-label={grid.t(open ? 'collapse' : 'expand')}
          data-part="expander"
          data-part-expander=""
          onClick={(event) => grid.toggleExpanded(node.key, event)}
          tabIndex={current ? 0 : -1}
          type="button"
        >
          <Icon>
            <Glyph name="chevron-right" />
          </Icon>
        </button>
      ) : null}
    </div>
  );
}

function BodyCell<Row>({
  column,
  node,
}: {
  column: ResolvedGridColumn<Row>;
  node: Extract<GridNode<Row>, { kind: 'row' }>;
}) {
  const grid = useDataGridInternal<Row>();
  const key = node.key;
  const cell = { row: key, column: column.id };
  const index = grid.columnIds.indexOf(column.id) + 1;
  const current =
    grid.current !== null && grid.current.row === key && grid.current.column === column.id;
  const selected = grid.isSelected(key);
  const session = grid.edit;
  const editing =
    session !== null && session.cell.row === key && session.columns.includes(column.id);
  const value = grid.valueOf(column.column, node.row);
  const text = grid.textOf(column.column, node.row);
  const editable = grid.isEditable(column.column, node.row);
  const range = grid.rangeInfo(cell);
  const message = editing ? (session.messages[column.id] ?? null) : null;
  const invalid = editing && session.status === 'invalid' && message !== null;
  const pending = editing && session.status === 'pending';
  const part = column.column.rowHeader ? 'row-header' : 'cell';
  const changed = grid.changedOf(cell);
  const treeCell = grid.treeColumn === column.id;
  const branch =
    treeCell &&
    (node.childCount > 0 || node.open || grid.isLoadingChildren(key) || grid.hasChildren(node.row));

  return (
    <div
      {...columnAttributes(column)}
      aria-colindex={index}
      aria-readonly={grid.anyEditable && !editable && column.kind !== 'actions' ? true : undefined}
      aria-selected={grid.selectionMode === 'range' && range.inside ? true : undefined}
      aria-invalid={invalid ? true : undefined}
      data-part={part}
      {...selectorKeyProps('part', part)}
      data-text={column.text}
      role={part === 'row-header' ? 'rowheader' : 'gridcell'}
      style={
        treeCell
          ? ({
              ...cellStyle(column, index),
              '--slotted-data-grid-level': String(node.level),
            } as CSSProperties)
          : cellStyle(column, index)
      }
      tabIndex={current ? 0 : -1}
      title={invalid && message ? message : undefined}
      onClick={(event) => grid.onCellClick(event, cell)}
      onDoubleClick={(event) => grid.onCellDoubleClick(event, cell)}
      onFocus={(event) => {
        if (event.target === event.currentTarget) grid.onCellFocus(cell);
      }}
      onKeyDown={(event) => grid.onCellKeyDown(event, cell)}
      onPointerDown={(event) => grid.onCellPointerDown(event, cell)}
      onPointerEnter={(event) => grid.onCellPointerEnter(event, cell)}
      {...(current ? { 'data-current': '' } : {})}
      {...(range.inside ? { 'data-in-range': '' } : {})}
      {...(range.edges.length > 0 ? { 'data-range-edge': range.edges.join(' ') } : {})}
      {...(editing ? { 'data-editing': '' } : {})}
      {...(invalid ? { 'data-invalid': '' } : {})}
      {...(pending ? { 'data-loading': '' } : {})}
      {...(changed ? { 'data-changed': changed } : {})}
      {...(grid.anyEditable && !editable && column.kind !== 'actions'
        ? { 'data-readonly': '' }
        : {})}
      {...(treeCell ? { 'data-tree': branch ? 'branch' : 'leaf' } : {})}
    >
      {treeCell ? (
        branch ? (
          <button
            aria-expanded={node.open}
            aria-label={grid.t(node.open ? 'collapse' : 'expand')}
            data-part="tree-toggle"
            data-part-tree-toggle=""
            onClick={(event) => {
              event.stopPropagation();
              grid.toggleBranch(key, event);
            }}
            onPointerDown={(event) => event.stopPropagation()}
            tabIndex={-1}
            type="button"
            {...(grid.isLoadingChildren(key) ? { 'data-loading': '' } : {})}
          >
            {/* A row waiting for its children turns the chevron into the
                loader's ring, which the stylesheet spins. */}
            <Icon>
              <Glyph name={grid.isLoadingChildren(key) ? 'loader-circle' : 'chevron-right'} />
            </Icon>
          </button>
        ) : (
          <span aria-hidden data-part="tree-toggle" data-part-tree-toggle="" data-empty="" />
        )
      ) : null}
      {editing ? (
        <div data-part="editor" data-part-editor="">
          {grid.renderEditorContent({
            row: node.row,
            rowKey: key,
            column: column.column,
            value,
            text,
            current,
            selected,
            draft: session.drafts[column.id],
            setDraft: (draft) => grid.setDraft(column.id, draft),
            commit: () => grid.commitEdit('programmatic'),
            cancel: () => grid.cancelEdit(),
            invalid,
            message,
          })}
        </div>
      ) : (
        grid.renderCellContent({
          row: node.row,
          rowKey: key,
          column: column.column,
          value,
          text,
          current,
          selected,
        })
      )}
    </div>
  );
}

/**
 * The columns a narrow frame moved out of the row, drawn under it as labelled
 * values: one cell spanning the row's second line, the last the cursor walks.
 */
function PopinCell<Row>({ node }: { node: Extract<GridNode<Row>, { kind: 'row' }> }) {
  const grid = useDataGridInternal<Row>();
  const key = node.key;
  const cell = { row: key, column: POPIN_COLUMN_ID };
  const current =
    grid.current !== null && grid.current.row === key && grid.current.column === POPIN_COLUMN_ID;
  const selected = grid.isSelected(key);
  return (
    <div
      aria-colindex={grid.popinIndex}
      data-column={POPIN_COLUMN_ID}
      data-part="popin"
      data-part-popin=""
      role="gridcell"
      style={{ '--slotted-data-grid-column': '1 / -1' } as CSSProperties}
      tabIndex={current ? 0 : -1}
      onClick={(event) => grid.onCellClick(event, cell)}
      onDoubleClick={(event) => grid.onCellDoubleClick(event, cell)}
      onFocus={(event) => {
        if (event.target === event.currentTarget) grid.onCellFocus(cell);
      }}
      onKeyDown={(event) => grid.onCellKeyDown(event, cell)}
      onPointerDown={(event) => grid.onCellPointerDown(event, cell)}
      {...(current ? { 'data-current': '' } : {})}
    >
      {grid.popinColumns.map((column) => (
        <div
          data-field={column.id}
          data-part="popin-field"
          data-part-popin-field=""
          key={column.id}
        >
          {column.column.label ? (
            <span data-part="popin-label" data-part-popin-label="">
              {column.column.label}
            </span>
          ) : null}
          {/* Read only: an edit happens in a visible cell, the detail or the record. */}
          <div data-part="popin-value" data-part-popin-value="" data-text={column.text}>
            {grid.renderCellContent({
              row: node.row,
              rowKey: key,
              column: column.column,
              value: grid.valueOf(column.column, node.row),
              text: grid.textOf(column.column, node.row),
              current: false,
              selected,
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function GroupRow<Row>({
  node,
  rowIndex,
}: {
  node: Extract<GridNode<Row>, { kind: 'group' }>;
  rowIndex: number;
}) {
  const grid = useDataGridInternal<Row>();
  const cursorRow = `${GROUP_ROW_PREFIX}${node.key}`;
  const column = grid.columns.find((entry) => entry.id === node.column);
  const aggregated = grid.resolved.filter((entry) => entry.column.aggregate !== undefined);
  const firstAggregate =
    aggregated.length > 0
      ? Math.min(...aggregated.map((entry) => grid.columnIds.indexOf(entry.id) + 1))
      : grid.columnIds.length + 1;
  const cellOf = (columnId: string) => ({ row: cursorRow, column: columnId });
  const firstColumn = grid.columnIds[0]!;
  const current = grid.current !== null && grid.current.row === cursorRow;
  const label = grid.t('groupCount', { count: node.count });

  return (
    <div
      aria-expanded={node.expanded}
      aria-level={node.level}
      aria-rowindex={rowIndex}
      data-part="group-row"
      data-part-group-row=""
      data-row={cursorRow}
      role="row"
      style={{ '--slotted-data-grid-level': String(node.level) } as CSSProperties}
      {...(current ? { 'data-current': '' } : {})}
    >
      <div
        aria-colindex={1}
        aria-colspan={firstAggregate - 1}
        data-column={firstColumn}
        role="gridcell"
        style={{ '--slotted-data-grid-column': `1 / ${firstAggregate}` } as CSSProperties}
        tabIndex={current && grid.current?.column === firstColumn ? 0 : -1}
        onClick={(event) => grid.onCellClick(event, cellOf(firstColumn))}
        onFocus={(event) => {
          if (event.target === event.currentTarget) grid.onCellFocus(cellOf(firstColumn));
        }}
        onKeyDown={(event) => grid.onCellKeyDown(event, cellOf(firstColumn))}
        onPointerDown={(event) => grid.onCellPointerDown(event, cellOf(firstColumn))}
        {...(current && grid.current?.column === firstColumn ? { 'data-current': '' } : {})}
      >
        <button
          aria-expanded={node.expanded}
          aria-label={grid.t(node.expanded ? 'collapseGroup' : 'expandGroup', { group: node.text })}
          data-part="group-toggle"
          data-part-group-toggle=""
          onClick={(event) => {
            event.stopPropagation();
            grid.toggleGroup(node.key, event);
          }}
          tabIndex={-1}
          type="button"
        >
          <Icon>
            <Glyph name="chevron-right" />
          </Icon>
        </button>
        {grid.renderGroup && column ? (
          grid.renderGroup({ node, column, toggle: () => grid.toggleGroup(node.key) })
        ) : (
          <>
            <span>{node.text}</span>
            <span data-count="">{label}</span>
          </>
        )}
      </div>
      {aggregated.map((entry) => {
        const index = grid.columnIds.indexOf(entry.id) + 1;
        const value = node.aggregates[entry.id];
        const text =
          value === null || value === undefined
            ? ''
            : cellText({ ...entry.column, accessor: () => value }, node.rows[0] as Row, {
                locale: grid.locale,
                booleans: grid.booleans,
              });
        const cell = cellOf(entry.id);
        const here = current && grid.current?.column === entry.id;
        return (
          <div
            {...columnAttributes(entry)}
            aria-colindex={index}
            key={entry.id}
            role="gridcell"
            style={cellStyle(entry, index)}
            tabIndex={here ? 0 : -1}
            onFocus={(event) => {
              if (event.target === event.currentTarget) grid.onCellFocus(cell);
            }}
            onKeyDown={(event) => grid.onCellKeyDown(event, cell)}
            onPointerDown={(event) => grid.onCellPointerDown(event, cell)}
            {...(here ? { 'data-current': '' } : {})}
          >
            <span data-aggregate="">{text}</span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * The skeleton rows of a first load: the grid's shape before its content, each
 * row as tall as the body rows it stands in for.
 */
export function DataGridLoader<Row>({ rows, rowSize }: { rows: number; rowSize: number }) {
  const grid = useDataGridInternal<Row>();
  const gutterCount = grid.columnIds.length - grid.resolved.length;
  return (
    <div
      aria-hidden
      data-part="loader"
      data-part-loader=""
      role="rowgroup"
      style={{ '--slotted-data-grid-loader-row-size': `${rowSize}px` } as CSSProperties}
    >
      {Array.from({ length: rows }, (_unused, row) => (
        <div data-part="row" data-part-row="" key={row} role="row">
          {grid.columnIds.map((columnId, index) => (
            <div
              key={columnId}
              role="gridcell"
              style={{ '--slotted-data-grid-column': String(index + 1) } as CSSProperties}
            >
              {/* The gutters reserve their width and draw nothing: what stands
                  in them is a chooser, a handle and a toggle, and an outline of
                  a control nobody can press yet is a control that lies. The
                  lengths follow the value columns, so a gutter does not shift
                  the sequence. */}
              {index >= gutterCount ? (
                <Skeleton
                  inlineSize={`${[70, 55, 80, 40, 60][(index - gutterCount) % 5]}%`}
                  loading
                />
              ) : null}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** The aggregates of the whole query, pinned to the end of the scroller. */
export function DataGridSummary<Row>({
  aggregates,
  rowIndex,
}: {
  aggregates: Readonly<Record<string, unknown>>;
  rowIndex: number;
}) {
  const grid = useDataGridInternal<Row>();
  const current = grid.current !== null && grid.current.row === SUMMARY_ROW;
  const gutterCount = grid.columnIds.length - grid.resolved.length;
  const textOf = (column: ResolvedGridColumn<Row>) => {
    const value = aggregates[column.id];
    return value === null || value === undefined
      ? ''
      : cellText({ ...column.column, accessor: () => value }, {} as Row, {
          locale: grid.locale,
          booleans: grid.booleans,
        });
  };
  const popinCell = { row: SUMMARY_ROW, column: POPIN_COLUMN_ID };
  const popinHere = current && grid.current?.column === POPIN_COLUMN_ID;
  return (
    <div data-part="summary" data-part-summary="" role="rowgroup">
      <div aria-rowindex={rowIndex} data-row={SUMMARY_ROW} role="row">
        {grid.columnIds.slice(0, gutterCount).map((columnId, index) => (
          <div
            aria-colindex={index + 1}
            data-column={columnId}
            data-part="summary-cell"
            data-part-summary-cell=""
            key={columnId}
            role="gridcell"
            style={{ '--slotted-data-grid-column': String(index + 1) } as CSSProperties}
            tabIndex={-1}
          />
        ))}
        {grid.mountedColumns.map((column) => {
          const index = grid.columnIds.indexOf(column.id) + 1;
          const cell = { row: SUMMARY_ROW, column: column.id };
          const here = current && grid.current?.column === column.id;
          const text = textOf(column);
          return (
            <div
              {...columnAttributes(column)}
              aria-colindex={index}
              data-part="summary-cell"
              data-part-summary-cell=""
              key={column.id}
              role="gridcell"
              style={cellStyle(column, index)}
              tabIndex={here ? 0 : -1}
              onFocus={(event) => {
                if (event.target === event.currentTarget) grid.onCellFocus(cell);
              }}
              onKeyDown={(event) => grid.onCellKeyDown(event, cell)}
              onPointerDown={(event) => grid.onCellPointerDown(event, cell)}
              {...(here ? { 'data-current': '' } : {})}
            >
              <span>{text}</span>
            </div>
          );
        })}
        {grid.hasPopinCell(SUMMARY_ROW) ? (
          <div
            aria-colindex={grid.popinIndex}
            data-column={POPIN_COLUMN_ID}
            data-part="popin"
            data-part-popin=""
            role="gridcell"
            style={{ '--slotted-data-grid-column': '1 / -1' } as CSSProperties}
            tabIndex={popinHere ? 0 : -1}
            onFocus={(event) => {
              if (event.target === event.currentTarget) grid.onCellFocus(popinCell);
            }}
            onKeyDown={(event) => grid.onCellKeyDown(event, popinCell)}
            onPointerDown={(event) => grid.onCellPointerDown(event, popinCell)}
            {...(popinHere ? { 'data-current': '' } : {})}
          >
            {grid.popinAggregated.map((column) => (
              <div
                data-field={column.id}
                data-part="popin-field"
                data-part-popin-field=""
                key={column.id}
              >
                {column.column.label ? (
                  <span data-part="popin-label" data-part-popin-label="">
                    {column.column.label}
                  </span>
                ) : null}
                <div data-part="popin-value" data-part-popin-value="">
                  <span>{textOf(column)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
