import type { Direction } from './arrow-navigation';

/** A cell of a grid, counted from zero in the reading order. */
export interface GridPosition {
  readonly row: number;
  readonly column: number;
}

/** What `move` reads of a key: a `KeyboardEvent` is one. */
export type RovingGridKey = Pick<KeyboardEvent, 'key'> &
  Partial<Pick<KeyboardEvent, 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey'>>;

export interface RovingGridOptions {
  readonly rows: number;
  readonly columns: number;
  /** Whether an arrow past the end of its axis continues at the other end. Off by default. */
  readonly loop?: boolean | undefined;
  /** Which way the columns are read. `ltr` by default. */
  readonly direction?: Direction | undefined;
  /** How many rows a page key crosses. Without it the page keys are left alone. */
  readonly page?: number | undefined;
  /** A cell that takes no focus, which every move passes. */
  readonly isDisabled?: ((position: GridPosition) => boolean) | undefined;
}

export interface RovingGridHandle {
  /**
   * Where a key moves to, or `undefined` for a key the grid leaves alone. A key
   * of the grid with nowhere to go, as an arrow at an edge, answers the same cell.
   */
  readonly move: (key: RovingGridKey, position: GridPosition) => GridPosition | undefined;
  /**
   * Where the one tab stop rests: the position, or the nearest cell the grid
   * still holds and that takes focus. `undefined` in a grid with no such cell.
   */
  readonly rest: (position: GridPosition) => GridPosition | undefined;
}

const ARROWS = {
  ltr: { ArrowLeft: -1, ArrowRight: 1 },
  rtl: { ArrowLeft: 1, ArrowRight: -1 },
} as const;

/**
 * The movement of one tab stop over a grid of controls an application draws
 * itself, on two axes: the arrows, Home and End along the row, Control with
 * Home or End to the ends of the grid, and the page keys by a step the caller
 * gives. It is the arithmetic alone and touches no document, so a framework's
 * state holds the position; `createRovingTabindex` is the one-axis ring that
 * writes the stop itself, and `@slotted/core/grid` moves the cursor of a
 * data-grid over its own rows and columns.
 */
export function createRovingGrid(options: RovingGridOptions): RovingGridHandle {
  const { columns, isDisabled = () => false, rows } = options;

  return {
    move: (key, position) => {
      const cells = candidates(options, key, position);

      return cells && (cells.find((cell) => !isDisabled(cell)) ?? position);
    },
    rest: (position) => {
      if (rows <= 0 || columns <= 0) return undefined;

      const row = clamp(position.row, rows);
      const column = clamp(position.column, columns);
      const distance = (cell: GridPosition) =>
        Math.abs(cell.row - row) + Math.abs(cell.column - column);
      if (!isDisabled({ row, column })) return { row, column };

      return everyCell(rows, columns)
        .filter((cell) => !isDisabled(cell))
        .sort((a, b) => distance(a) - distance(b))[0];
    },
  };
}

/** The cells a key moves to, the one it asks for first, or `undefined` for a key left alone. */
function candidates(
  { columns, direction = 'ltr', loop = false, page, rows }: RovingGridOptions,
  key: RovingGridKey,
  { column, row }: GridPosition,
): GridPosition[] | undefined {
  if (key.altKey === true || key.metaKey === true || key.shiftKey === true) return undefined;

  if (key.ctrlKey === true) {
    if (key.key === 'Home') return everyCell(rows, columns);
    if (key.key === 'End') return everyCell(rows, columns).reverse();

    return undefined;
  }

  const inRow = (indices: readonly number[]) => indices.map((index) => ({ row, column: index }));
  const inColumn = (indices: readonly number[]) => indices.map((index) => ({ row: index, column }));

  switch (key.key) {
    case 'ArrowLeft':
    case 'ArrowRight':
      return inRow(ahead(column, columns, ARROWS[direction][key.key], loop));
    case 'ArrowUp':
      return inColumn(ahead(row, rows, -1, loop));
    case 'ArrowDown':
      return inColumn(ahead(row, rows, 1, loop));
    case 'Home':
      return inRow(range(columns));
    case 'End':
      return inRow(range(columns).reverse());
    case 'PageUp':
      return page === undefined ? undefined : inColumn(paged(row, rows, -page));
    case 'PageDown':
      return page === undefined ? undefined : inColumn(paged(row, rows, page));
    default:
      return undefined;
  }
}

/** The places past `from` on one axis, nearest first, and around it when it loops. */
function ahead(from: number, count: number, step: 1 | -1, loop: boolean): number[] {
  return range(count)
    .map((taken) => from + step * (taken + 1))
    .filter((index) => loop || (index >= 0 && index < count))
    .map((index) => (index + count) % count);
}

/** The place a page away or at the edge, then the ones between it and `from`. */
function paged(from: number, count: number, step: number): number[] {
  const target = clamp(from + step, count);

  return range(Math.abs(target - from)).map((back) => target - Math.sign(step) * back);
}

function everyCell(rows: number, columns: number): GridPosition[] {
  return range(rows).flatMap((row) => range(columns).map((column) => ({ row, column })));
}

const range = (count: number) => Array.from({ length: count }, (_, index) => index);

const clamp = (index: number, count: number) => Math.min(Math.max(index, 0), count - 1);
