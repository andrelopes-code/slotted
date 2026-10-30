/**
 * Where the cursor goes, over indices rather than DOM: the bindings turn a
 * key into an intent, this module turns the intent into the next cell, and
 * the binding mounts and focuses whatever that is. The grid the cursor walks
 * is a list of row keys — the header rows first, then the body's nodes, then
 * the summary — and a list of column ids in layout order.
 */

import type { GridCell, GridRange } from './types';

export type CursorIntent =
  | 'up'
  | 'down'
  | 'start'
  | 'end'
  | 'rowStart'
  | 'rowEnd'
  | 'pageUp'
  | 'pageDown'
  | 'first'
  | 'last';

export interface CursorGrid {
  /** Every row the cursor can stand on, in order: header rows, body nodes, summary. */
  readonly rows: readonly string[];
  /** Every column the cursor can stand on, in layout order. */
  readonly columns: readonly string[];
  /** Rows a page key jumps over. */
  readonly pageSize: number;
  /** The index of the first body row, where `first` and `last` are confined. */
  readonly bodyStart: number;
  /** One past the last body row. */
  readonly bodyEnd: number;
}

export function cellIndex(grid: CursorGrid, cell: GridCell): { row: number; column: number } {
  return { row: grid.rows.indexOf(cell.row), column: grid.columns.indexOf(cell.column) };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * The cell an intent lands on, or the same cell when the pattern says focus
 * does not move: an arrow at an edge, a page key on the first or last row.
 * `rtl` mirrors `start` and `end`, which are the arrow keys' visual
 * directions and not the logical ones.
 */
export function moveCursor(grid: CursorGrid, from: GridCell, intent: CursorIntent): GridCell {
  const { row, column } = cellIndex(grid, from);
  if (row === -1 || column === -1 || grid.rows.length === 0 || grid.columns.length === 0) {
    return from;
  }
  const lastRow = grid.rows.length - 1;
  const lastColumn = grid.columns.length - 1;
  let nextRow = row;
  let nextColumn = column;
  switch (intent) {
    case 'up':
      nextRow = row - 1;
      break;
    case 'down':
      nextRow = row + 1;
      break;
    case 'start':
      nextColumn = column - 1;
      break;
    case 'end':
      nextColumn = column + 1;
      break;
    case 'rowStart':
      nextColumn = 0;
      break;
    case 'rowEnd':
      nextColumn = lastColumn;
      break;
    case 'pageUp':
      nextRow = row === 0 ? 0 : Math.max(0, row - grid.pageSize);
      break;
    case 'pageDown':
      nextRow = row === lastRow ? lastRow : Math.min(lastRow, row + grid.pageSize);
      break;
    case 'first':
      nextRow = grid.bodyEnd > grid.bodyStart ? grid.bodyStart : row;
      nextColumn = 0;
      break;
    case 'last':
      nextRow = grid.bodyEnd > grid.bodyStart ? grid.bodyEnd - 1 : row;
      nextColumn = lastColumn;
      break;
  }
  nextRow = clamp(nextRow, 0, lastRow);
  nextColumn = clamp(nextColumn, 0, lastColumn);
  if (nextRow === row && nextColumn === column) return from;
  return { row: grid.rows[nextRow]!, column: grid.columns[nextColumn]! };
}

/**
 * Where the cursor lands when its row is gone: the same index, or the last
 * body row when the body shrank under it, in the same column — or the first
 * column when that one is gone too. `null` when nothing is left to stand on.
 */
export function settleCursor(
  grid: CursorGrid,
  previous: GridCell | null,
  previousRowIndex: number,
): GridCell | null {
  if (grid.rows.length === 0 || grid.columns.length === 0) return null;
  const column =
    previous && grid.columns.includes(previous.column) ? previous.column : grid.columns[0]!;
  if (previous && grid.rows.includes(previous.row)) return { row: previous.row, column };
  const bodyRows = grid.bodyEnd - grid.bodyStart;
  if (bodyRows <= 0) return { row: grid.rows[0]!, column };
  const index = clamp(previousRowIndex, grid.bodyStart, grid.bodyEnd - 1);
  return { row: grid.rows[index]!, column };
}

export function sameCell(a: GridCell | null | undefined, b: GridCell | null | undefined): boolean {
  if (!a || !b) return a === b;
  return a.row === b.row && a.column === b.column;
}

/* ── Ranges ──────────────────────────────────────────────────────────── */

export interface RangeBounds {
  readonly rowStart: number;
  readonly rowEnd: number;
  readonly columnStart: number;
  readonly columnEnd: number;
}

/** The rectangle a range covers, as inclusive indices, or `null` when a corner is off the grid. */
export function rangeBounds(
  grid: CursorGrid,
  range: GridRange | null | undefined,
): RangeBounds | null {
  if (!range) return null;
  const anchor = cellIndex(grid, range.anchor);
  const focus = cellIndex(grid, range.focus);
  if (anchor.row === -1 || anchor.column === -1 || focus.row === -1 || focus.column === -1)
    return null;
  return {
    rowStart: Math.min(anchor.row, focus.row),
    rowEnd: Math.max(anchor.row, focus.row),
    columnStart: Math.min(anchor.column, focus.column),
    columnEnd: Math.max(anchor.column, focus.column),
  };
}

export type RangeEdge = 'top' | 'bottom' | 'start' | 'end';

/** Whether a cell is inside the range, and which of the rectangle's edges it draws. */
export function rangeEdges(
  grid: CursorGrid,
  bounds: RangeBounds | null,
  cell: GridCell,
): { inside: boolean; edges: RangeEdge[] } {
  if (!bounds) return { inside: false, edges: [] };
  const { row, column } = cellIndex(grid, cell);
  const inside =
    row >= bounds.rowStart &&
    row <= bounds.rowEnd &&
    column >= bounds.columnStart &&
    column <= bounds.columnEnd;
  if (!inside) return { inside, edges: [] };
  const edges: RangeEdge[] = [];
  if (row === bounds.rowStart) edges.push('top');
  if (row === bounds.rowEnd) edges.push('bottom');
  if (column === bounds.columnStart) edges.push('start');
  if (column === bounds.columnEnd) edges.push('end');
  return { inside, edges };
}

/** The cells of a range, row by row. */
export function rangeCells(grid: CursorGrid, bounds: RangeBounds | null): GridCell[][] {
  if (!bounds) return [];
  const rows: GridCell[][] = [];
  for (let row = bounds.rowStart; row <= bounds.rowEnd; row += 1) {
    const cells: GridCell[] = [];
    for (let column = bounds.columnStart; column <= bounds.columnEnd; column += 1) {
      cells.push({ row: grid.rows[row]!, column: grid.columns[column]! });
    }
    rows.push(cells);
  }
  return rows;
}

/** A range over the whole of one column, or one row, or everything. */
export function columnRange(grid: CursorGrid, column: string): GridRange | null {
  if (grid.bodyEnd <= grid.bodyStart) return null;
  return {
    anchor: { row: grid.rows[grid.bodyStart]!, column },
    focus: { row: grid.rows[grid.bodyEnd - 1]!, column },
  };
}

export function rowRange(grid: CursorGrid, row: string): GridRange | null {
  if (grid.columns.length === 0) return null;
  return {
    anchor: { row, column: grid.columns[0]! },
    focus: { row, column: grid.columns[grid.columns.length - 1]! },
  };
}

export function wholeRange(grid: CursorGrid): GridRange | null {
  if (grid.bodyEnd <= grid.bodyStart || grid.columns.length === 0) return null;
  return {
    anchor: { row: grid.rows[grid.bodyStart]!, column: grid.columns[0]! },
    focus: { row: grid.rows[grid.bodyEnd - 1]!, column: grid.columns[grid.columns.length - 1]! },
  };
}

/**
 * The range as tab-separated text, one line per row, which is what a
 * spreadsheet pastes as a block. Values are the cell texts, in layout order.
 */
export function rangeToText(
  cells: readonly (readonly GridCell[])[],
  text: (cell: GridCell) => string,
): string {
  return cells
    .map((row) => row.map((cell) => text(cell).replace(/[\t\n]/g, ' ')).join('\t'))
    .join('\n');
}
