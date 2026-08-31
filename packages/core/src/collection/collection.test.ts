import { describe, expect, it } from 'vitest';

import { virtualWindow } from './index';

const list = {
  itemCount: 1000,
  itemSize: 40,
  overscan: 0,
  scrollOffset: 0,
  viewportSize: 400,
};

describe('virtualWindow', () => {
  it('renders the rows the viewport covers, and no more', () => {
    expect(virtualWindow(list)).toEqual({
      startIndex: 0,
      endIndex: 10,
      startOffset: 0,
      totalSize: 40000,
    });
  });

  it('turns a scroll offset into the index it exposes', () => {
    expect(virtualWindow({ ...list, scrollOffset: 400 })).toMatchObject({
      startIndex: 10,
      endIndex: 20,
      startOffset: 400,
    });
  });

  it('renders the row a misaligned offset only half exposes', () => {
    const { startIndex, endIndex } = virtualWindow({ ...list, scrollOffset: 20 });
    expect(startIndex).toBe(0);
    expect(endIndex).toBe(11);
  });

  it('buffers overscan rows on both sides of the viewport', () => {
    expect(virtualWindow({ ...list, overscan: 3, scrollOffset: 400 })).toMatchObject({
      startIndex: 7,
      endIndex: 23,
      startOffset: 280,
    });
  });

  it('does not buffer past either end of the list', () => {
    expect(virtualWindow({ ...list, overscan: 5 })).toMatchObject({ startIndex: 0, endIndex: 15 });
    expect(virtualWindow({ ...list, itemCount: 12, overscan: 5, scrollOffset: 80 })).toMatchObject({
      startIndex: 0,
      endIndex: 12,
    });
  });

  it('sizes the canvas to the whole list, not to the window', () => {
    expect(virtualWindow({ ...list, scrollOffset: 20000 }).totalSize).toBe(40000);
  });

  it('clamps an overscrolled offset into the list, as a rubber-band drag produces', () => {
    expect(virtualWindow({ ...list, scrollOffset: -120 })).toMatchObject({
      startIndex: 0,
      endIndex: 10,
    });
    expect(virtualWindow({ ...list, scrollOffset: 99999 })).toMatchObject({
      startIndex: 990,
      endIndex: 1000,
    });
  });

  it('treats a negative overscan as no overscan', () => {
    expect(virtualWindow({ ...list, overscan: -4, scrollOffset: 400 })).toMatchObject({
      startIndex: 10,
      endIndex: 20,
    });
  });

  it('answers an unmeasured viewport with the overscan buffer alone', () => {
    expect(virtualWindow({ ...list, overscan: 4, viewportSize: 0 })).toMatchObject({
      startIndex: 0,
      endIndex: 4,
      startOffset: 0,
    });
  });

  it('empties the window when there is nothing to show yet', () => {
    const empty = { startIndex: 0, endIndex: 0, startOffset: 0, totalSize: 0 };
    expect(virtualWindow({ ...list, itemCount: 0 })).toEqual(empty);
    expect(virtualWindow({ ...list, itemSize: 0 })).toEqual(empty);
    expect(virtualWindow({ ...list, itemCount: -3 })).toEqual(empty);
    expect(virtualWindow({ ...list, itemSize: -40 })).toEqual(empty);
  });

  it('never returns a slice that runs backwards', () => {
    for (const scrollOffset of [-500, 0, 37, 400, 39999, 80000]) {
      for (const viewportSize of [0, 1, 400, 90000]) {
        for (const overscan of [-2, 0, 4, 5000]) {
          const window = virtualWindow({ ...list, overscan, scrollOffset, viewportSize });
          expect(window.endIndex).toBeGreaterThanOrEqual(window.startIndex);
          expect(window.startIndex).toBeGreaterThanOrEqual(0);
          expect(window.endIndex).toBeLessThanOrEqual(list.itemCount);
        }
      }
    }
  });

  it('places every rendered row where the canvas expects it', () => {
    const window = virtualWindow({ ...list, overscan: 2, scrollOffset: 1234 });
    expect(window.startOffset).toBe(window.startIndex * list.itemSize);
    expect(window.endIndex * list.itemSize).toBeLessThanOrEqual(window.totalSize);
  });

  it('defaults overscan to nought, leaving the buffer to the caller', () => {
    expect(
      virtualWindow({ itemCount: 1000, itemSize: 40, scrollOffset: 0, viewportSize: 400 }),
    ).toEqual(virtualWindow(list));
  });

  it('accepts a fractional row size without drifting off the canvas', () => {
    const window = virtualWindow({ ...list, itemSize: 33.5, scrollOffset: 100 });
    expect(window.totalSize).toBe(33500);
    expect(window.startIndex).toBe(2);
    expect(window.startOffset).toBe(67);
  });
});
