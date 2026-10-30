import { describe, expect, it } from 'vitest';

import {
  containerPositions,
  isIdentity,
  resultingPosition,
  sameTarget,
  stepWithin,
} from './positions';
import type { DropTarget } from './types';

const between = (container: string, index: number): DropTarget => ({
  kind: 'between',
  container,
  index,
});
const on = (container: string, key: string): DropTarget => ({ kind: 'on', container, key });

const moveB = { items: ['b'], source: { container: 'list', index: 1 }, operation: 'move' } as const;

describe('containerPositions', () => {
  it('offers a gap before every item and one after the last', () => {
    const positions = containerPositions(
      { key: 'other', items: ['x', 'y'], targets: ['between'] },
      moveB,
    );
    expect(positions).toEqual([between('other', 0), between('other', 1), between('other', 2)]);
  });

  /**
   * Under `move` from the same list the gap before the dragged item and the
   * gap after it are the same list once the item is gone. The gap before
   * stays as the identity position; the gap after is not offered, or the
   * first arrow press would announce a move that changed nothing.
   */
  it('collapses the two gaps around a moved item into the identity position', () => {
    const positions = containerPositions(
      { key: 'list', items: ['a', 'b', 'c'], targets: ['between'] },
      moveB,
    );
    expect(positions).toEqual([between('list', 0), between('list', 1), between('list', 3)]);
    expect(isIdentity(between('list', 1), moveB)).toBe(true);
    expect(isIdentity(between('list', 2), moveB)).toBe(true);
    expect(isIdentity(between('list', 3), moveB)).toBe(false);
  });

  it('keeps both gaps when the operation is a copy', () => {
    const copyB = { ...moveB, operation: 'copy' } as const;
    const positions = containerPositions(
      { key: 'list', items: ['a', 'b', 'c'], targets: ['between'] },
      copyB,
    );
    expect(positions).toHaveLength(4);
    expect(isIdentity(between('list', 1), copyB)).toBe(false);
  });

  it('interleaves on-item positions with the gaps, minus the dragged item itself', () => {
    const positions = containerPositions(
      { key: 'list', items: ['a', 'b', 'c'], targets: ['between', 'on'] },
      moveB,
    );
    expect(positions).toEqual([
      between('list', 0),
      on('list', 'a'),
      between('list', 1),
      on('list', 'c'),
      between('list', 3),
    ]);
  });

  it('offers only items when the container takes drops on them alone', () => {
    const positions = containerPositions(
      { key: 'bins', items: ['trash', 'archive'], targets: ['on'] },
      moveB,
    );
    expect(positions).toEqual([on('bins', 'trash'), on('bins', 'archive')]);
  });

  it('offers the root of an empty container, whatever it lists', () => {
    for (const targets of [['between'], ['on'], ['root']] as const) {
      expect(containerPositions({ key: 'empty', items: [], targets }, moveB)).toEqual([
        { kind: 'root', container: 'empty' },
      ]);
    }
  });

  /** The list the drag came from, emptied by the drag, is still a place to go back to. */
  it('offers the identity gap when every item of the source is being dragged', () => {
    const all = {
      items: ['a', 'b'],
      source: { container: 'list', index: 0 },
      operation: 'move',
    } as const;
    expect(
      containerPositions({ key: 'list', items: ['a', 'b'], targets: ['between'] }, all),
    ).toEqual([between('list', 0)]);
  });

  it('offers nothing from a disabled container', () => {
    expect(
      containerPositions(
        { key: 'list', items: ['a'], targets: ['between'], disabled: true },
        moveB,
      ),
    ).toEqual([]);
  });
});

describe('resultingPosition', () => {
  it('counts the position the reader will find the item at, one-based', () => {
    expect(resultingPosition(between('list', 0), ['a', 'b', 'c'], moveB)).toEqual({
      position: 1,
      total: 3,
    });
    /* Past `c`: the item leaves index 1, so the list is a, c, b. */
    expect(resultingPosition(between('list', 3), ['a', 'b', 'c'], moveB)).toEqual({
      position: 3,
      total: 3,
    });
  });

  it('grows the total by the dragged items in another container', () => {
    expect(resultingPosition(between('other', 2), ['x', 'y'], moveB)).toEqual({
      position: 3,
      total: 3,
    });
    const two = { ...moveB, items: ['b', 'c'] };
    expect(resultingPosition(between('other', 0), ['x'], two)).toEqual({ position: 1, total: 3 });
  });

  it('has no position for a drop on an item or a root', () => {
    expect(resultingPosition(on('list', 'a'), ['a'], moveB)).toBeNull();
    expect(resultingPosition({ kind: 'root', container: 'e' }, [], moveB)).toBeNull();
  });
});

describe('stepWithin', () => {
  const list = [between('l', 0), between('l', 1), between('l', 3), between('l', 4)];

  it('steps one position and stops at the ends', () => {
    expect(stepWithin(list, 1, 'next')).toBe(2);
    expect(stepWithin(list, 3, 'next')).toBe(3);
    expect(stepWithin(list, 0, 'previous')).toBe(0);
    expect(stepWithin(list, 0, 'first')).toBe(0);
    expect(stepWithin(list, 0, 'last')).toBe(3);
  });

  it('pages by ten and clamps', () => {
    expect(stepWithin(list, 0, 'pageNext')).toBe(3);
    expect(stepWithin(list, 3, 'pagePrevious')).toBe(0);
  });

  it('moves a row in a grid by its column count', () => {
    const grid = Array.from({ length: 9 }, (_, index) => between('g', index));
    expect(stepWithin(grid, 1, 'rowNext', 3)).toBe(4);
    expect(stepWithin(grid, 7, 'rowNext', 3)).toBe(7);
    expect(stepWithin(grid, 4, 'rowPrevious', 3)).toBe(1);
  });

  it('starts from the first position when nothing is current', () => {
    expect(stepWithin(list, -1, 'next')).toBe(0);
    expect(stepWithin(list, -1, 'last')).toBe(3);
  });
});

describe('sameTarget', () => {
  it('compares by kind and fields', () => {
    expect(sameTarget(between('l', 1), between('l', 1))).toBe(true);
    expect(sameTarget(between('l', 1), between('l', 2))).toBe(false);
    expect(sameTarget(on('l', 'a'), on('l', 'a'))).toBe(true);
    expect(sameTarget(on('l', 'a'), between('l', 0))).toBe(false);
    expect(sameTarget(null, null)).toBe(true);
    expect(sameTarget(null, between('l', 0))).toBe(false);
  });
});
