import { describe, expect, it } from 'vitest';

import { describeCompare, layoutCompare } from './compare';

const domain = { min: -1600, max: 800, step: 800 };

describe('layoutCompare', () => {
  it('draws two roots with one domain on one axis', () => {
    const first = layoutCompare([{ label: 'Subject', value: -1000 }], domain);
    const second = layoutCompare([{ label: 'Subject', value: 400 }], domain);

    expect(first.ticks).toEqual(second.ticks);
    expect(first.ticks.map((tick) => tick.value)).toEqual([-1600, -800, 0, 800]);
    expect(first.zero).toBeCloseTo(2 / 3);
  });

  it('hangs a negative bar left of the zero line and a positive one right of it', () => {
    const { bars, zero } = layoutCompare(
      [
        { label: 'Subject', value: -1000 },
        { label: 'Reference', value: 33, texture: true },
      ],
      domain,
    );

    expect(bars[0]!.to).toBeCloseTo(zero!);
    expect(bars[0]!.from).toBeLessThan(zero!);
    expect(bars[0]!.negative).toBe(true);
    expect(bars[1]!.from).toBeCloseTo(zero!);
  });
});

describe('describeCompare', () => {
  it('names every row with its value', () => {
    expect(
      describeCompare(
        [
          { label: 'Subject', value: -1000 },
          { label: 'Reference', value: 33 },
        ],
        String,
      ),
    ).toBe('Subject: -1000; Reference: 33');
  });
});
