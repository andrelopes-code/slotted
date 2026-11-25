import { clockColumns, clockMove, clockRows, clockStop } from '@slotted/core/date';
import type { ClockCell, ClockGroup, ClockStep } from '@slotted/core/date';

import type { ClockGridView, ClockUnitName } from './clock.types';

const STEPS: Partial<Record<string, ClockStep>> = {
  ArrowDown: 'down',
  ArrowUp: 'up',
  End: 'rowEnd',
  Home: 'rowStart',
  PageDown: 'lastRow',
  PageUp: 'firstRow',
};

/** The hours, or a stated list of whole times: a part of the day to a group. */
export function groupsGrid(
  unit: 'hour' | 'slot',
  name: string,
  groups: readonly ClockGroup[],
): ClockGridView {
  return {
    cells: groups.flatMap((group) => group.cells),
    columns: unit === 'hour' ? 6 : 3,
    groups,
    name,
    unit,
  };
}

/** The minutes of an hour or the seconds of a minute, under one name. */
export function unitsGrid(
  unit: 'minute' | 'second',
  name: string,
  cells: readonly ClockCell[],
): ClockGridView {
  return {
    cells,
    columns: clockColumns(cells.length),
    groups: [{ cells, label: name, name }],
    name,
    unit,
  };
}

/** Where a key lands in a grid, or nothing for a key that is not the grid's. */
export function keyTarget(grid: ClockGridView, stop: number, event: KeyboardEvent): number | null {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return null;

  const step = stepOf(event);
  if (step === undefined) return null;

  const counts = grid.groups.map((group) => group.cells.length);

  return clockMove(clockRows(counts, grid.columns), stop, step);
}

/** The one tab stop of a grid: the cell focus is on, or the one the grid opens at. */
export function stopOf(
  grid: ClockGridView,
  focused: { unit: ClockUnitName; index: number } | null,
): number {
  const held = focused?.unit === grid.unit ? focused.index : clockStop(grid.cells);

  return Math.min(held, Math.max(0, grid.cells.length - 1));
}

function stepOf(event: KeyboardEvent): ClockStep | undefined {
  const rtl = getComputedStyle(event.currentTarget as HTMLElement).direction === 'rtl';
  if (event.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) return 'next';
  if (event.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) return 'previous';

  return STEPS[event.key];
}
