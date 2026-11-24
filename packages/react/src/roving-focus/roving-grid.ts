import { createRovingGrid, toolbarOwnedKeys } from '@slotted/core/focus';
import type { GridPosition, RovingGridOptions } from '@slotted/core/focus';
import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { FocusEvent, KeyboardEvent } from 'react';

export type UseRovingGridOptions = Omit<RovingGridOptions, 'direction'>;

/** What the element of one cell takes: the control itself, or what wraps it. */
export interface RovingGridCellProps {
  readonly 'data-roving-cell': string;
  readonly onFocus: (event: FocusEvent<HTMLElement>) => void;
  readonly onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  readonly tabIndex: 0 | -1;
}

export interface RovingGrid {
  /** Spread on the focusable element of the cell at `row` and `column`, counted from zero. */
  readonly cellProps: (row: number, column: number) => RovingGridCellProps;
}

const CELL = 'data-roving-cell';

/**
 * One tab stop over a grid of controls the application draws itself, a
 * `role="grid"` whose cells are the controls: a matrix of answers, a seat map,
 * a board. One cell has `tabIndex` 0, the arrows move the focus on two axes
 * (`createRovingGrid` in `@slotted/core/focus`), and the cell last focused
 * keeps the stop. The stop follows that cell's element while rows and columns
 * come and go, and rests on the nearest cell that remains when it leaves.
 *
 * A key is read on the cell alone, so a text field in a row head, or a control
 * inside a cell, keeps its own keys; a cell that is a text field keeps them too.
 */
export function useRovingGrid(options: UseRovingGridOptions): RovingGrid {
  const id = useId();
  const [held, setHeld] = useState<GridPosition>({ row: 0, column: 0 });
  const last = useRef<HTMLElement | null>(null);

  /* A row that comes or goes above the cell gives its element another place. */
  useLayoutEffect(() => {
    if (last.current?.isConnected !== true) return;

    const place = placeOf(last.current, id);
    if (place !== undefined) setHeld((previous) => (isSame(previous, place) ? previous : place));
  });

  const stop = createRovingGrid(options).rest(held);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>, from: GridPosition) {
    const cell = event.currentTarget;
    if (event.defaultPrevented || event.target !== cell) return;
    if (toolbarOwnedKeys(cell, 'horizontal').length > 0) return;

    const direction = getComputedStyle(cell).direction === 'rtl' ? 'rtl' : 'ltr';
    const next = createRovingGrid({ ...options, direction }).move(event, from);
    if (next === undefined) return;

    event.preventDefault();
    const root = cell.getRootNode() as ParentNode;
    root.querySelector<HTMLElement>(`[${CELL}=${JSON.stringify(nameOf(id, next))}]`)?.focus();
  }

  return {
    cellProps: (row, column) => ({
      [CELL]: nameOf(id, { row, column }),
      onFocus: (event) => {
        last.current = event.currentTarget;
        setHeld((previous) => (isSame(previous, { row, column }) ? previous : { row, column }));
      },
      onKeyDown: (event) => handleKeyDown(event, { row, column }),
      tabIndex: stop !== undefined && isSame(stop, { row, column }) ? 0 : -1,
    }),
  };
}

function nameOf(id: string, { column, row }: GridPosition) {
  return `${id} ${String(row)} ${String(column)}`;
}

/** The place a cell's element names, or `undefined` when it is a cell of this grid no more. */
function placeOf(cell: HTMLElement, id: string): GridPosition | undefined {
  const [grid, row, column] = (cell.getAttribute(CELL) ?? '').split(' ');

  return grid === id ? { row: Number(row), column: Number(column) } : undefined;
}

function isSame(a: GridPosition, b: GridPosition) {
  return a.row === b.row && a.column === b.column;
}
