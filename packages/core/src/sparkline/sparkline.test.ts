import { describe, expect, it } from 'vitest';

import { createTranslator, sparklineMessages } from '../i18n';
import { PT_BR } from '../i18n/locales/pt-BR';

import {
  describeSparkline,
  layoutSparkline,
  observeSparklineBox,
  summarizeSparkline,
} from './sparkline';

const grid = { width: 100, height: 20 };

describe('summarizeSparkline', () => {
  it('reads the first and last real points and the extent between them', () => {
    expect(summarizeSparkline([3, 1, 4, 1, 5])).toEqual({
      count: 5,
      first: 3,
      last: 5,
      min: 1,
      max: 5,
      delta: 2,
      trend: 'up',
    });
  });

  it('treats null, NaN and infinities as gaps rather than values', () => {
    expect(summarizeSparkline([null, 2, Number.NaN, Number.POSITIVE_INFINITY, 1])).toMatchObject({
      count: 2,
      first: 2,
      last: 1,
      delta: -1,
      trend: 'down',
    });
  });

  it('has nothing to say about a series with no real point', () => {
    expect(summarizeSparkline([null, Number.NaN])).toEqual({
      count: 0,
      first: null,
      last: null,
      min: null,
      max: null,
      delta: null,
      trend: 'flat',
    });
  });

  it('calls a series that ends where it began flat', () => {
    expect(summarizeSparkline([2, 5, 2]).trend).toBe('flat');
  });
});

describe('layoutSparkline: line', () => {
  it('spreads the points across the width and maps the extent onto the height', () => {
    const layout = layoutSparkline({ data: [0, 10, 5], ...grid, inset: 0 });
    expect(layout.points).toEqual([
      { x: 0, y: 20, value: 0, index: 0 },
      { x: 50, y: 0, value: 10, index: 1 },
      { x: 100, y: 10, value: 5, index: 2 },
    ]);
    expect(layout.line).toBe('M0 20L50 0L100 10');
    expect(layout.marker).toEqual({ x: 100, y: 10, value: 5, index: 2 });
  });

  it('keeps the stroke and the marker inside the box by insetting the grid', () => {
    const layout = layoutSparkline({ data: [0, 10], ...grid, inset: 4 });
    expect(layout.points[0]).toEqual({ x: 4, y: 16, value: 0, index: 0 });
    expect(layout.points[1]).toEqual({ x: 96, y: 4, value: 10, index: 1 });
  });

  it('breaks the line at a gap instead of drawing across it', () => {
    const layout = layoutSparkline({ data: [0, null, 10, 5], ...grid, inset: 0 });
    expect(layout.line).toBe('M0 20M66.667 0L100 10');
    expect(layout.points).toHaveLength(3);
  });

  it('puts the marker on the last real point, not on the last slot', () => {
    const layout = layoutSparkline({ data: [1, 2, null], ...grid, inset: 0 });
    expect(layout.marker).toEqual({ x: 50, y: 0, value: 2, index: 1 });
  });

  it('draws a constant series through the middle of the height', () => {
    const layout = layoutSparkline({ data: [4, 4, 4], ...grid, inset: 0 });
    expect(layout.points.map((point) => point.y)).toEqual([10, 10, 10]);
  });

  it('closes the area from the line down to the bottom edge', () => {
    const layout = layoutSparkline({ data: [0, 10, 5], ...grid, inset: 0, area: true });
    expect(layout.area).toBe('M0 20L50 0L100 10L100 20L0 20Z');
  });

  it('closes one area per run when the line is broken', () => {
    const layout = layoutSparkline({ data: [0, 10, null, 5, 5], ...grid, inset: 0, area: true });
    expect(layout.area).toBe('M0 20L25 0L25 20L0 20ZM75 10L100 10L100 20L75 20Z');
  });

  it('smooths with a monotone curve that never overshoots a point', () => {
    const layout = layoutSparkline({
      data: [0, 10, 10, 0],
      ...grid,
      inset: 0,
      curve: 'monotone',
    });
    expect(layout.line.startsWith('M0 20C')).toBe(true);
    /* The two equal points in the middle stay a flat segment. */
    expect(layout.line).toContain('C44.444 0 55.556 0 66.667 0');
  });

  it('lets an explicit domain and a reference widen the extent', () => {
    const layout = layoutSparkline({ data: [2, 4], ...grid, inset: 0, min: 0, reference: 8 });
    expect(layout.points.map((point) => point.y)).toEqual([15, 10]);
    expect(layout.reference).toBe(0);
  });

  it('draws a single point as a marker with no line', () => {
    const layout = layoutSparkline({ data: [7], ...grid, inset: 0 });
    expect(layout.line).toBe('');
    expect(layout.marker).toEqual({ x: 50, y: 10, value: 7, index: 0 });
  });

  it('draws nothing for an empty series', () => {
    const layout = layoutSparkline({ data: [], ...grid, inset: 0 });
    expect(layout.line).toBe('');
    expect(layout.area).toBe('');
    expect(layout.marker).toBeNull();
    expect(layout.reference).toBeNull();
  });
});

describe('layoutSparkline: bar', () => {
  it('grows every bar from a zero baseline with a gap between neighbours', () => {
    const layout = layoutSparkline({ data: [10, 5], ...grid, inset: 0, type: 'bar', gap: 2 });
    expect(layout.baseline).toBe(20);
    expect(layout.bars.map((bar) => ({ ...bar, path: undefined }))).toMatchObject([
      { x: 0, y: 0, width: 49, height: 20, value: 10, index: 0 },
      { x: 51, y: 10, width: 49, height: 10, value: 5, index: 1 },
    ]);
  });

  it('rounds the data end of a bar and leaves the baseline end square', () => {
    const layout = layoutSparkline({ data: [10], ...grid, inset: 0, type: 'bar', radius: 2 });
    expect(layout.bars[0]!.path).toBe('M0 20v-18a2 2 0 0 1 2 -2h96a2 2 0 0 1 2 2v18Z');
  });

  it('hangs a negative bar from the baseline with its rounded end down', () => {
    const layout = layoutSparkline({
      data: [10, -10],
      ...grid,
      inset: 0,
      type: 'bar',
      gap: 0,
      radius: 2,
    });
    expect(layout.bars[1]!.path).toBe('M50 10h50v8a2 2 0 0 1 -2 2h-46a2 2 0 0 1 -2 -2Z');
  });

  it('caps the radius at half the width of a thin bar', () => {
    const layout = layoutSparkline({
      data: [10, 10],
      width: 6,
      height: 20,
      inset: 0,
      type: 'bar',
      gap: 2,
      radius: 4,
    });
    expect(layout.bars[0]!.path).toContain('a1 1 0 0 1 1 -1');
  });

  it('puts the baseline inside the box when the series crosses zero', () => {
    const layout = layoutSparkline({ data: [10, -10], ...grid, inset: 0, type: 'bar', gap: 0 });
    expect(layout.baseline).toBe(10);
    expect(layout.bars[0]).toMatchObject({ y: 0, height: 10 });
    expect(layout.bars[1]).toMatchObject({ y: 10, height: 10 });
  });

  it('skips a gap and keeps the slot for it', () => {
    const layout = layoutSparkline({ data: [1, null, 1], ...grid, inset: 0, type: 'bar', gap: 1 });
    expect(layout.bars.map((bar) => bar.index)).toEqual([0, 2]);
    expect(layout.bars[1]?.x).toBe(67.333);
  });

  it('gives a zero bar a hairline so the period is seen to exist', () => {
    const layout = layoutSparkline({ data: [0, 4], ...grid, inset: 0, type: 'bar', gap: 0 });
    expect(layout.bars[0]).toMatchObject({ height: 1, y: 19 });
  });

  it('drops the gap when there is no room for one and never draws under a pixel', () => {
    const layout = layoutSparkline({
      data: Array.from({ length: 100 }, (_, index) => index),
      width: 80,
      height: 20,
      inset: 0,
      type: 'bar',
      gap: 2,
    });
    expect(layout.bars.every((bar) => bar.width >= 1)).toBe(true);
    expect(layout.bars[1]!.x - layout.bars[0]!.x).toBeCloseTo(0.8, 5);
  });
});

describe('describeSparkline', () => {
  const t = createTranslator({ locale: 'en-US' }).family(sparklineMessages);
  const format = (value: number) => String(value);

  it('says the last value, the direction and the change since the first', () => {
    expect(describeSparkline([100, 120, 130], { t, format })).toBe('130, up 30 since 100');
  });

  it('names the series first when it has a name', () => {
    expect(describeSparkline([5, 3], { t, format, label: 'Errors' })).toBe(
      'Errors: 3, down 2 since 5',
    );
  });

  it('says a flat series is unchanged and names no change', () => {
    expect(describeSparkline([5, 9, 5], { t, format })).toBe('5, unchanged since 5');
  });

  it('says there is nothing when there is nothing', () => {
    expect(describeSparkline([null], { t, format, label: 'Errors' })).toBe('Errors: no data');
  });

  it('speaks the language of the translator it is given', () => {
    const pt = createTranslator({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } }).family(
      sparklineMessages,
    );
    expect(describeSparkline([100, 120, 130], { t: pt, format })).toBe('130, alta de 30 desde 100');
  });
});

describe('observeSparklineBox', () => {
  it('reports the box once, synchronously, where nothing can observe it', () => {
    const element = {
      getBoundingClientRect: () => ({ width: 120.004, height: 32 }),
    } as unknown as Element;
    const boxes: unknown[] = [];
    const handle = observeSparklineBox(element, (box) => boxes.push(box));
    expect(boxes).toEqual([{ width: 120, height: 32 }]);
    handle.destroy();
  });

  it('never reports nought, which is "not measured" rather than a box', () => {
    const boxes: unknown[] = [];
    observeSparklineBox({} as Element, (box) => boxes.push(box)).destroy();
    expect(boxes).toEqual([]);
  });
});
