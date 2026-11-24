import { describe, expect, it } from 'vitest';

import { createRovingGrid } from './roving-grid';
import type { GridPosition, RovingGridKey, RovingGridOptions } from './roving-grid';

const at = (row: number, column: number): GridPosition => ({ row, column });
const grid = (options: Partial<RovingGridOptions> = {}) =>
  createRovingGrid({ rows: 4, columns: 5, ...options });
const ctrl = (key: string): RovingGridKey => ({ key, ctrlKey: true });

describe('createRovingGrid', () => {
  it.each([
    ['ArrowUp', at(0, 2)],
    ['ArrowDown', at(2, 2)],
    ['ArrowLeft', at(1, 1)],
    ['ArrowRight', at(1, 3)],
    ['Home', at(1, 0)],
    ['End', at(1, 4)],
  ])('moves by %s from the middle', (key, next) => {
    expect(grid().move({ key }, at(1, 2))).toEqual(next);
  });

  it('goes to the first and the last cell with Control and Home or End', () => {
    expect(grid().move(ctrl('Home'), at(1, 2))).toEqual(at(0, 0));
    expect(grid().move(ctrl('End'), at(1, 2))).toEqual(at(3, 4));
  });

  it.each([
    ['ArrowUp', at(0, 2)],
    ['ArrowDown', at(3, 2)],
    ['ArrowLeft', at(1, 0)],
    ['ArrowRight', at(1, 4)],
    ['Home', at(1, 0)],
    ['End', at(1, 4)],
  ])('stops at the edge by %s, the key being its own', (key, edge) => {
    expect(grid().move({ key }, edge)).toEqual(edge);
  });

  it('stays in the one cell of a 1 by 1 grid', () => {
    const one = grid({ rows: 1, columns: 1, page: 3 });

    for (const key of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'])
      expect(one.move({ key }, at(0, 0))).toEqual(at(0, 0));
    for (const key of ['PageUp', 'PageDown']) expect(one.move({ key }, at(0, 0))).toEqual(at(0, 0));
    expect(one.move(ctrl('End'), at(0, 0))).toEqual(at(0, 0));
  });

  it('crosses the rows of a page, and leaves the page keys alone without one', () => {
    expect(grid({ page: 2 }).move({ key: 'PageDown' }, at(0, 2))).toEqual(at(2, 2));
    expect(grid({ page: 9 }).move({ key: 'PageDown' }, at(1, 2))).toEqual(at(3, 2));
    expect(grid({ page: 2 }).move({ key: 'PageUp' }, at(3, 2))).toEqual(at(1, 2));
    expect(grid({ page: 9 }).move({ key: 'PageUp' }, at(1, 2))).toEqual(at(0, 2));
    expect(grid().move({ key: 'PageDown' }, at(0, 2))).toBeUndefined();
  });

  it('reads the columns in the reading direction', () => {
    const rtl = grid({ direction: 'rtl' });

    expect(rtl.move({ key: 'ArrowLeft' }, at(1, 2))).toEqual(at(1, 3));
    expect(rtl.move({ key: 'ArrowRight' }, at(1, 2))).toEqual(at(1, 1));
    expect(rtl.move({ key: 'ArrowDown' }, at(1, 2))).toEqual(at(2, 2));
    expect(rtl.move({ key: 'Home' }, at(1, 2))).toEqual(at(1, 0));
  });

  it('wraps on the axis of the arrow only when it is asked to', () => {
    const loop = grid({ loop: true });

    expect(loop.move({ key: 'ArrowRight' }, at(1, 4))).toEqual(at(1, 0));
    expect(loop.move({ key: 'ArrowLeft' }, at(1, 0))).toEqual(at(1, 4));
    expect(loop.move({ key: 'ArrowDown' }, at(3, 2))).toEqual(at(0, 2));
    expect(loop.move({ key: 'ArrowUp' }, at(0, 2))).toEqual(at(3, 2));
  });

  it.each<RovingGridKey>([
    { key: 'a' },
    { key: 'Tab' },
    { key: 'Enter' },
    { key: 'ArrowRight', altKey: true },
    { key: 'ArrowRight', ctrlKey: true },
    { key: 'ArrowRight', metaKey: true },
    { key: 'ArrowRight', shiftKey: true },
    { key: 'End', ctrlKey: true, shiftKey: true },
  ])('leaves a key that moves nothing: %j', (key) => {
    expect(grid().move(key, at(1, 2))).toBeUndefined();
  });

  it('passes the cells that take no focus', () => {
    const closed = new Set(['1:3', '1:0', '1:4', '0:0', '2:2']);
    const some = grid({ isDisabled: ({ row, column }) => closed.has(`${row}:${column}`), page: 1 });

    expect(some.move({ key: 'ArrowRight' }, at(1, 2))).toEqual(at(1, 2));
    expect(some.move({ key: 'ArrowDown' }, at(1, 2))).toEqual(at(3, 2));
    expect(some.move({ key: 'Home' }, at(1, 2))).toEqual(at(1, 1));
    expect(some.move(ctrl('Home'), at(1, 2))).toEqual(at(0, 1));
    expect(some.move({ key: 'PageDown' }, at(1, 2))).toEqual(at(1, 2));
  });

  describe('rest', () => {
    it('keeps a position the grid still holds', () => {
      expect(grid().rest(at(3, 4))).toEqual(at(3, 4));
    });

    it('takes the nearest cell that remains after a row or a column left', () => {
      expect(grid({ rows: 3 }).rest(at(3, 4))).toEqual(at(2, 4));
      expect(grid({ columns: 2 }).rest(at(3, 4))).toEqual(at(3, 1));
      expect(grid({ rows: 1, columns: 1 }).rest(at(3, 4))).toEqual(at(0, 0));
    });

    it('takes the nearest cell that takes focus', () => {
      const first = grid({ isDisabled: ({ row }) => row < 2 });

      expect(first.rest(at(0, 3))).toEqual(at(2, 3));
      expect(grid({ isDisabled: () => true }).rest(at(1, 2))).toBeUndefined();
    });

    it('is nowhere in a grid with no cell', () => {
      expect(grid({ rows: 0 }).rest(at(1, 2))).toBeUndefined();
      expect(grid({ columns: 0 }).rest(at(1, 2))).toBeUndefined();
    });
  });
});
