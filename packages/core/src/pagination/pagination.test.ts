import { describe, expect, it } from 'vitest';

import { clampPage, itemRange, pageItems, totalPages } from './pagination';

const values = (input: Parameters<typeof pageItems>[0]) =>
  pageItems(input).map((item) => (item.type === 'page' ? item.value : `…${item.side}`));

describe('totalPages', () => {
  it('rounds a partial last page up', () => {
    expect(totalPages({ count: 482, pageSize: 20 })).toBe(25);
    expect(totalPages({ count: 480, pageSize: 20 })).toBe(24);
  });

  it('calls an empty collection one page rather than none', () => {
    expect(totalPages({ count: 0, pageSize: 20 })).toBe(1);
  });

  it('refuses a page size below one instead of dividing by nought', () => {
    expect(totalPages({ count: 10, pageSize: 0 })).toBe(10);
    expect(totalPages({ count: 10, pageSize: -5 })).toBe(10);
  });
});

describe('clampPage', () => {
  it('brings a page above the last one back to it', () => {
    expect(clampPage(40, 4)).toBe(4);
  });

  it('brings nought and a negative page to the first one', () => {
    expect(clampPage(0, 4)).toBe(1);
    expect(clampPage(-3, 4)).toBe(1);
  });

  it('leaves a page inside the range alone', () => {
    expect(clampPage(3, 4)).toBe(3);
  });
});

describe('itemRange', () => {
  it('covers the items the page actually holds', () => {
    expect(itemRange({ count: 482, pageSize: 20, page: 2 })).toEqual({ start: 21, end: 40 });
  });

  it('stops the last page at the last item', () => {
    expect(itemRange({ count: 482, pageSize: 20, page: 25 })).toEqual({ start: 481, end: 482 });
  });

  /** Nought to nought, so a caller can test either end for emptiness. */
  it('reports an empty collection as no range at all', () => {
    expect(itemRange({ count: 0, pageSize: 20, page: 1 })).toEqual({ start: 0, end: 0 });
  });

  it('clamps a page the collection no longer has', () => {
    expect(itemRange({ count: 12, pageSize: 20, page: 9 })).toEqual({ start: 1, end: 12 });
  });
});

describe('pageItems', () => {
  it('draws every page while the row is short enough to hold them', () => {
    expect(values({ count: 140, pageSize: 20, page: 1 })).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('opens a gap at the end once the row would overflow', () => {
    expect(values({ count: 400, pageSize: 20, page: 1 })).toEqual([1, 2, 3, 4, 5, '…end', 20]);
  });

  it('opens a gap at the start when the reader is near the last page', () => {
    expect(values({ count: 400, pageSize: 20, page: 20 })).toEqual([
      1,
      '…start',
      16,
      17,
      18,
      19,
      20,
    ]);
  });

  /**
   * The row never changes length, which is what stops the paginator changing
   * width as the reader walks through it. At the ends the pages the gap would
   * have hidden are spent on more neighbours instead of on empty space.
   */
  it('holds one length at every page', () => {
    for (let page = 1; page <= 20; page += 1) {
      expect(values({ count: 400, pageSize: 20, page })).toHaveLength(7);
    }
  });

  it('holds one length while a gap exists on both sides', () => {
    const middle = [7, 8, 9, 10, 11, 12, 13].map((page) =>
      values({ count: 400, pageSize: 20, page }),
    );

    for (const row of middle) expect(row).toHaveLength(7);
    expect(middle[0]).toEqual([1, '…start', 6, 7, 8, '…end', 20]);
    expect(middle.at(-1)).toEqual([1, '…start', 12, 13, 14, '…end', 20]);
  });

  /** Replacing one page with an ellipsis costs a target and saves nothing. */
  it('never draws an ellipsis in place of a single page', () => {
    expect(values({ count: 180, pageSize: 20, page: 5 })).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(values({ count: 200, pageSize: 20, page: 4 })).toEqual([1, 2, 3, 4, 5, '…end', 10]);
  });

  it('widens the row with the sibling count', () => {
    expect(values({ count: 400, pageSize: 20, page: 10, siblingCount: 2 })).toEqual([
      1,
      '…start',
      8,
      9,
      10,
      11,
      12,
      '…end',
      20,
    ]);
  });

  it('keeps more pages at each end with the boundary count', () => {
    expect(values({ count: 400, pageSize: 20, page: 10, boundaryCount: 2 })).toEqual([
      1,
      2,
      '…start',
      9,
      10,
      11,
      '…end',
      19,
      20,
    ]);
  });

  it('draws one page for an empty collection', () => {
    expect(values({ count: 0, pageSize: 20, page: 1 })).toEqual([1]);
  });

  it('clamps a page the collection no longer has before drawing the row', () => {
    expect(values({ count: 400, pageSize: 20, page: 99 })).toEqual([
      1,
      '…start',
      16,
      17,
      18,
      19,
      20,
    ]);
  });

  it('never repeats a page and never runs backwards', () => {
    for (let page = 1; page <= 20; page += 1) {
      const drawn = pageItems({ count: 400, pageSize: 20, page })
        .filter((item) => item.type === 'page')
        .map((item) => (item.type === 'page' ? item.value : 0));

      expect(new Set(drawn).size).toBe(drawn.length);
      expect([...drawn].sort((a, b) => a - b)).toEqual(drawn);
      expect(drawn).toContain(page);
    }
  });
});
