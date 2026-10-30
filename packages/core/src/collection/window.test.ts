import { describe, expect, it } from 'vitest';

import { createRowMetrics, offsetForIndex, shouldLoadMore, virtualWindow } from './collection';

const list = {
  itemCount: 1000,
  itemSize: 40,
  overscan: 0,
  scrollOffset: 0,
  viewportSize: 400,
};

/**
 * A grouped list: a label of 24 pixels, then four options of 40, repeated. It
 * is the shape a single `itemSize` cannot describe, and the one a windowed
 * listbox with sections has.
 */
const grouped = createRowMetrics(
  Array.from({ length: 100 }, (_, index) => (index % 5 === 0 ? 24 : 40)),
);

describe('virtualWindow, pinned rows', () => {
  it('renders a row outside the viewport when it is pinned', () => {
    const window = virtualWindow({ ...list, scrollOffset: 4000, pinned: [3] });
    expect(window.startIndex).toBe(100);
    expect(window.pinnedBefore).toEqual([3]);
    expect(window.pinnedAfter).toEqual([]);
  });

  it('sorts pinned rows and puts each on the side it belongs to', () => {
    const window = virtualWindow({ ...list, scrollOffset: 4000, pinned: [900, 7, 3] });
    expect(window.pinnedBefore).toEqual([3, 7]);
    expect(window.pinnedAfter).toEqual([900]);
  });

  it('does not repeat a row the slice already renders', () => {
    const window = virtualWindow({ ...list, scrollOffset: 4000, pinned: [100, 105] });
    expect(window.pinnedBefore).toEqual([]);
    expect(window.pinnedAfter).toEqual([]);
  });

  it('drops a pinned index that is not a row, rather than rejecting it', () => {
    /* -1 is what the active index is for as long as nothing is active, and it
       reaches this on every render before the reader has touched the list. */
    const window = virtualWindow({ ...list, pinned: [-1, 1000, 4.5, Number.NaN] });
    expect(window.pinnedBefore).toEqual([]);
    expect(window.pinnedAfter).toEqual([]);
  });

  it('never repeats one pinned index twice', () => {
    const window = virtualWindow({ ...list, scrollOffset: 4000, pinned: [3, 3, 900, 900] });
    expect(window.pinnedBefore).toEqual([3]);
    expect(window.pinnedAfter).toEqual([900]);
  });
});

describe('createRowMetrics', () => {
  it('sums the rows into a canvas', () => {
    /* Twenty labels at 24 and eighty options at 40. */
    expect(grouped.totalSize).toBe(20 * 24 + 80 * 40);
    expect(grouped.count).toBe(100);
  });

  it('places each row after the ones before it', () => {
    expect(grouped.offsetOf(0)).toBe(0);
    expect(grouped.offsetOf(1)).toBe(24);
    expect(grouped.offsetOf(5)).toBe(24 + 4 * 40);
    expect(grouped.sizeOf(0)).toBe(24);
    expect(grouped.sizeOf(1)).toBe(40);
  });

  it('finds the row an offset falls inside', () => {
    expect(grouped.indexAt(0)).toBe(0);
    expect(grouped.indexAt(23)).toBe(0);
    expect(grouped.indexAt(24)).toBe(1);
    expect(grouped.indexAt(63)).toBe(1);
    expect(grouped.indexAt(64)).toBe(2);
  });

  it('clamps an offset outside the canvas rather than answering nothing', () => {
    expect(grouped.indexAt(-100)).toBe(0);
    expect(grouped.indexAt(1e9)).toBe(99);
    expect(grouped.offsetOf(-5)).toBe(0);
    expect(grouped.offsetOf(500)).toBe(grouped.totalSize);
    expect(grouped.sizeOf(-1)).toBe(0);
    expect(grouped.sizeOf(100)).toBe(0);
  });

  it('reads a negative or non-finite row as nought instead of poisoning the sum', () => {
    const metrics = createRowMetrics([10, -4, Number.NaN, 6]);
    expect(metrics.totalSize).toBe(16);
    expect(metrics.offsetOf(3)).toBe(10);
  });

  it('describes an empty list without dividing by anything', () => {
    const metrics = createRowMetrics([]);
    expect(metrics.count).toBe(0);
    expect(metrics.totalSize).toBe(0);
    expect(metrics.indexAt(40)).toBe(0);
  });
});

describe('virtualWindow, rows that differ in size', () => {
  it('windows a grouped list without drifting off its canvas', () => {
    const window = virtualWindow({
      itemCount: 100,
      metrics: grouped,
      scrollOffset: 0,
      viewportSize: 200,
    });
    expect(window.totalSize).toBe(grouped.totalSize);
    expect(window.startIndex).toBe(0);
    expect(window.startOffset).toBe(0);
    /* 24 + 40 + 40 + 40 + 40 = 184, then the next label crosses 200. */
    expect(window.endIndex).toBe(6);
  });

  it('starts the slice where the canvas says the row starts', () => {
    const window = virtualWindow({
      itemCount: 100,
      metrics: grouped,
      scrollOffset: 500,
      viewportSize: 200,
    });
    expect(window.startOffset).toBe(grouped.offsetOf(window.startIndex));
    expect(window.startOffset).toBeLessThanOrEqual(500);
  });

  it('prefers the metrics over an itemSize given beside them', () => {
    const window = virtualWindow({
      itemCount: 100,
      itemSize: 40,
      metrics: grouped,
      scrollOffset: 0,
      viewportSize: 200,
    });
    expect(window.totalSize).toBe(grouped.totalSize);
  });

  it('empties the window when the metrics describe nothing', () => {
    const window = virtualWindow({
      itemCount: 10,
      metrics: createRowMetrics([]),
      scrollOffset: 0,
      viewportSize: 200,
    });
    expect(window.endIndex).toBe(0);
    expect(window.totalSize).toBe(0);
  });

  it('never runs off the end of a grouped canvas', () => {
    for (const scrollOffset of [-40, 0, 199, 1000, 1e6]) {
      for (const overscan of [0, 3]) {
        const window = virtualWindow({
          itemCount: 100,
          metrics: grouped,
          overscan,
          scrollOffset,
          viewportSize: 200,
        });
        expect(window.startIndex).toBeGreaterThanOrEqual(0);
        expect(window.endIndex).toBeLessThanOrEqual(100);
        expect(window.endIndex).toBeGreaterThanOrEqual(window.startIndex);
      }
    }
  });
});

describe('offsetForIndex', () => {
  it('leaves the list alone when the row is already in view', () => {
    expect(offsetForIndex({ ...list, index: 5, align: 'nearest' })).toBe(0);
  });

  it('moves as little as possible to reveal a row below the fold', () => {
    /* Row 12 ends at 520; a 400-pixel viewport therefore starts at 120. */
    expect(offsetForIndex({ ...list, index: 12, align: 'nearest' })).toBe(120);
  });

  it('moves as little as possible to reveal a row above the fold', () => {
    expect(offsetForIndex({ ...list, index: 3, scrollOffset: 400 })).toBe(120);
  });

  it('puts a row at the start, the end, or the middle when asked', () => {
    expect(offsetForIndex({ ...list, index: 40, align: 'start' })).toBe(1600);
    expect(offsetForIndex({ ...list, index: 40, align: 'end' })).toBe(1240);
    expect(offsetForIndex({ ...list, index: 40, align: 'center' })).toBe(1420);
  });

  it('never scrolls past either end of the canvas', () => {
    expect(offsetForIndex({ ...list, index: 0, align: 'center' })).toBe(0);
    expect(offsetForIndex({ ...list, index: 999, align: 'start' })).toBe(40000 - 400);
  });

  it('clamps an index outside the list into it', () => {
    expect(offsetForIndex({ ...list, index: -5, align: 'start' })).toBe(0);
    expect(offsetForIndex({ ...list, index: 5000, align: 'start' })).toBe(39600);
  });

  it('answers a grouped list from its own canvas', () => {
    const offset = offsetForIndex({
      index: 6,
      itemCount: 100,
      metrics: grouped,
      scrollOffset: 0,
      viewportSize: 200,
      align: 'start',
    });
    expect(offset).toBe(grouped.offsetOf(6));
  });

  it('answers a list with nothing in it with nought', () => {
    expect(offsetForIndex({ ...list, itemCount: 0, index: 4 })).toBe(0);
  });
});

describe('shouldLoadMore', () => {
  const loaded = { loadedCount: 50, hasMore: true, loading: false };

  it('asks once the last loaded row is rendered', () => {
    expect(shouldLoadMore({ ...loaded, endIndex: 50 })).toBe(true);
    expect(shouldLoadMore({ ...loaded, endIndex: 49 })).toBe(false);
  });

  it('asks earlier when the caller states a threshold', () => {
    expect(shouldLoadMore({ ...loaded, endIndex: 45, threshold: 5 })).toBe(true);
    expect(shouldLoadMore({ ...loaded, endIndex: 44, threshold: 5 })).toBe(false);
  });

  it('does not ask while a request is already out', () => {
    expect(shouldLoadMore({ ...loaded, endIndex: 50, loading: true })).toBe(false);
  });

  it('does not ask when the consumer has said there is no more', () => {
    expect(shouldLoadMore({ ...loaded, endIndex: 50, hasMore: false })).toBe(false);
  });

  it('asks for the first page before anything has been loaded', () => {
    expect(shouldLoadMore({ endIndex: 0, loadedCount: 0, hasMore: true, loading: false })).toBe(
      true,
    );
  });

  it('reads a negative threshold as none', () => {
    expect(shouldLoadMore({ ...loaded, endIndex: 49, threshold: -10 })).toBe(false);
  });
});
