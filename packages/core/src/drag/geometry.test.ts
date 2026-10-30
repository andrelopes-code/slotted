import { describe, expect, it } from 'vitest';

import { autoScrollDelta, resolvePoint } from './geometry';
import type { Rect } from './geometry';

const box = (left: number, top: number, width: number, height: number): Rect => ({
  left,
  top,
  right: left + width,
  bottom: top + height,
});

/** Three rows of 30 pixels, stacked from y = 100. */
const rows = [box(0, 100, 200, 30), box(0, 130, 200, 30), box(0, 160, 200, 30)];
const list = { key: 'list', rect: box(0, 100, 200, 90), items: ['a', 'b', 'c'], rects: rows };

describe('resolvePoint', () => {
  it('is null outside every container', () => {
    expect(
      resolvePoint({ x: 300, y: 110 }, [{ ...list, targets: ['between'] }], 'vertical'),
    ).toBeNull();
  });

  it('splits each row at its midpoint into the gap before and the gap after', () => {
    const containers = [{ ...list, targets: ['between'] as const }];
    expect(resolvePoint({ x: 10, y: 105 }, containers, 'vertical')).toEqual({
      kind: 'between',
      container: 'list',
      index: 0,
    });
    expect(resolvePoint({ x: 10, y: 125 }, containers, 'vertical')).toEqual({
      kind: 'between',
      container: 'list',
      index: 1,
    });
    expect(resolvePoint({ x: 10, y: 185 }, containers, 'vertical')).toEqual({
      kind: 'between',
      container: 'list',
      index: 3,
    });
  });

  /** A row's middle half is the row itself when the container takes drops on items. */
  it('lands on the item across its middle half, and in the gaps at its edges', () => {
    const containers = [{ ...list, targets: ['between', 'on'] as const }];
    expect(resolvePoint({ x: 10, y: 133 }, containers, 'vertical')).toEqual({
      kind: 'between',
      container: 'list',
      index: 1,
    });
    expect(resolvePoint({ x: 10, y: 145 }, containers, 'vertical')).toEqual({
      kind: 'on',
      container: 'list',
      key: 'b',
    });
    expect(resolvePoint({ x: 10, y: 157 }, containers, 'vertical')).toEqual({
      kind: 'between',
      container: 'list',
      index: 2,
    });
  });

  it('lands only on items when the container offers nothing between them', () => {
    const containers = [{ ...list, targets: ['on'] as const }];
    expect(resolvePoint({ x: 10, y: 133 }, containers, 'vertical')).toEqual({
      kind: 'on',
      container: 'list',
      key: 'b',
    });
  });

  it('is the root of an empty container', () => {
    const empty = {
      key: 'e',
      rect: box(0, 0, 100, 100),
      items: [],
      rects: [],
      targets: ['between'] as const,
    };
    expect(resolvePoint({ x: 5, y: 5 }, [empty], 'vertical')).toEqual({
      kind: 'root',
      container: 'e',
    });
  });

  it('prefers the smaller container when two hold the point, and the last registered on a tie', () => {
    const containers = [
      { ...list, key: 'under', targets: ['between'] as const },
      { ...list, key: 'over', targets: ['between'] as const },
    ];
    expect(resolvePoint({ x: 10, y: 105 }, containers, 'vertical')?.container).toBe('over');

    /* A lane inside a board: the board is registered last and is still not the answer. */
    const nested = [
      { ...list, key: 'lane', rect: box(0, 100, 100, 90), targets: ['between'] as const },
      { ...list, key: 'board', rect: box(0, 0, 400, 400), targets: ['between'] as const },
    ];
    expect(resolvePoint({ x: 10, y: 105 }, nested, 'vertical')?.container).toBe('lane');
    expect(resolvePoint({ x: 300, y: 300 }, nested, 'vertical')?.container).toBe('board');
  });

  it('skips an item whose box is unknown', () => {
    const containers = [
      { ...list, rects: [rows[0]!, null, rows[2]!], targets: ['between'] as const },
    ];
    /* Between a's midpoint and c's: b is not measured, so the gap before c is index 2. */
    expect(resolvePoint({ x: 10, y: 165 }, containers, 'vertical')).toEqual({
      kind: 'between',
      container: 'list',
      index: 2,
    });
  });

  it('reads the inline axis of a horizontal container', () => {
    const chips = [box(0, 0, 50, 20), box(50, 0, 50, 20)];
    const containers = [
      {
        key: 'row',
        rect: box(0, 0, 100, 20),
        items: ['a', 'b'],
        rects: chips,
        targets: ['between'] as const,
      },
    ];
    expect(resolvePoint({ x: 80, y: 10 }, containers, 'horizontal')).toEqual({
      kind: 'between',
      container: 'row',
      index: 2,
    });
    expect(resolvePoint({ x: 60, y: 10 }, containers, 'horizontal')).toEqual({
      kind: 'between',
      container: 'row',
      index: 1,
    });
  });

  it('reads a right-to-left row from its right', () => {
    /* `a` is the first item and sits on the right. */
    const chips = [box(50, 0, 50, 20), box(0, 0, 50, 20)];
    const containers = [
      {
        key: 'row',
        rect: box(0, 0, 100, 20),
        items: ['a', 'b'],
        rects: chips,
        targets: ['between'] as const,
        direction: 'rtl' as const,
      },
    ];
    expect(resolvePoint({ x: 20, y: 10 }, containers, 'horizontal')).toEqual({
      kind: 'between',
      container: 'row',
      index: 2,
    });
    expect(resolvePoint({ x: 40, y: 10 }, containers, 'horizontal')).toEqual({
      kind: 'between',
      container: 'row',
      index: 1,
    });
    expect(resolvePoint({ x: 90, y: 10 }, containers, 'horizontal')).toEqual({
      kind: 'between',
      container: 'row',
      index: 0,
    });
  });

  it('takes the nearest cell of a grid and decides on the inline axis', () => {
    const cells = [box(0, 0, 50, 50), box(50, 0, 50, 50), box(0, 50, 50, 50), box(50, 50, 50, 50)];
    const containers = [
      {
        key: 'g',
        rect: box(0, 0, 100, 100),
        items: ['a', 'b', 'c', 'd'],
        rects: cells,
        targets: ['between'] as const,
      },
    ];
    expect(resolvePoint({ x: 60, y: 70 }, containers, 'grid')).toEqual({
      kind: 'between',
      container: 'g',
      index: 3,
    });
    expect(resolvePoint({ x: 90, y: 70 }, containers, 'grid')).toEqual({
      kind: 'between',
      container: 'g',
      index: 4,
    });
  });
});

describe('autoScrollDelta', () => {
  const viewport = box(0, 0, 400, 300);

  it('is still away from every edge', () => {
    expect(autoScrollDelta({ x: 200, y: 150 }, viewport, 40, 12)).toEqual({ x: 0, y: 0 });
  });

  it('rises toward the edge and is fastest on it', () => {
    expect(autoScrollDelta({ x: 200, y: 300 }, viewport, 40, 12)).toEqual({ x: 0, y: 12 });
    expect(autoScrollDelta({ x: 200, y: 280 }, viewport, 40, 12)).toEqual({ x: 0, y: 6 });
    expect(autoScrollDelta({ x: 0, y: 150 }, viewport, 40, 12)).toEqual({ x: -12, y: 0 });
  });

  it('is still outside the box', () => {
    expect(autoScrollDelta({ x: 200, y: 340 }, viewport, 40, 12)).toEqual({ x: 0, y: 0 });
  });
});
