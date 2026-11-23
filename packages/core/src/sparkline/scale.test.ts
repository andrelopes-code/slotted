import { describe, expect, it } from 'vitest';

import { linearScale } from './scale';

describe('linearScale', () => {
  it('places zero inside a domain that crosses it', () => {
    const scale = linearScale({ values: [-1000, 400], includeZero: true });

    expect(scale.low).toBe(-1000);
    expect(scale.high).toBe(400);
    expect(scale.zero).toBeCloseTo(1000 / 1400);
    expect(scale.at(-1000)).toBe(0);
    expect(scale.at(400)).toBe(1);
  });

  it('has no zero when the domain does not cross it', () => {
    expect(linearScale({ values: [10, 20] }).zero).toBeNull();
    expect(linearScale({ values: [10, 20], includeZero: true }).zero).toBeNull();
  });

  it('draws one axis for every mark under a shared min, max and step', () => {
    const shared = { min: -1600, max: 800 };
    const first = linearScale({ ...shared, values: [-1000] });
    const second = linearScale({ ...shared, values: [400] });

    expect(first.ticks(800)).toEqual(second.ticks(800));
    expect(first.ticks(800).map((tick) => tick.value)).toEqual([-1600, -800, 0, 800]);
    expect(first.ticks(800).map((tick) => tick.at)).toEqual([0, 1 / 3, 2 / 3, 1]);
    expect(first.zero).toBeCloseTo(2 / 3);
  });

  it('widens the domain for a value past min or max, and never narrows it', () => {
    const scale = linearScale({ min: 0, max: 100, values: [50, 140] });

    expect([scale.low, scale.high]).toEqual([0, 140]);
  });

  it('counts each tick from the first, so a fractional step does not drift', () => {
    const values = linearScale({ min: 0, max: 1 })
      .ticks(0.1)
      .map((tick) => tick.value);

    expect(values).toHaveLength(11);
    expect(values.at(-1)).toBeCloseTo(1);
  });

  it('keeps a tick that stands on the low end, and writes zero without a sign', () => {
    expect(linearScale({ min: -0.3, max: 0.3 }).ticks(0.1)).toHaveLength(7);
    expect(linearScale({ min: -0.5, max: 2 }).ticks(1)[0]!.value).toBe(0);
  });

  it('draws no tick for a step of 0 or less, and centres a domain of one value', () => {
    const scale = linearScale({ values: [5] });

    expect(scale.ticks(0)).toEqual([]);
    expect(scale.ticks(-1)).toEqual([]);
    expect(scale.at(5)).toBe(0.5);
  });
});
