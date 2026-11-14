import { describe, expect, it } from 'vitest';

import { createTranslator, sparklineMessages } from '../i18n';
import { describeStrip, layoutStrip } from './strip';

const t = createTranslator({ locale: 'en-US' }).family(sparklineMessages);
const format = (value: number) => String(value);
const values = [1000, -500, 2000, 0, 1500, 500, 2500, 1000];

describe('layoutStrip', () => {
  it('places each value as a share of the extent, with the zero tick inside it', () => {
    const layout = layoutStrip({ value: 800, values, reference: 1200 });

    expect(layout.low).toBe(-500);
    expect(layout.high).toBe(2500);
    expect(layout.value).toBeCloseTo(1300 / 3000);
    expect(layout.zero).toBeCloseTo(500 / 3000);
    expect(layout.band).toEqual({ from: 0, to: 1 });
    expect(layout.dots).toHaveLength(8);
    expect(layout.reference).toBeCloseTo(1700 / 3000);
  });

  it('draws no value dot while the value is pending, and widens to a stated extent', () => {
    const layout = layoutStrip({ value: null, values: [10, 20], min: 0, max: 40 });

    expect(layout.value).toBeNull();
    expect(layout.zero).toBeNull();
    expect(layout.band).toEqual({ from: 0.25, to: 0.5 });
  });
});

describe('describeStrip', () => {
  it('names the value, the span of the periods and the reference', () => {
    expect(
      describeStrip({ value: 800, values, reference: 1200 }, { t, format, label: 'Savings rate' }),
    ).toBe('Savings rate: 800, against a range of -500 to 2500, reference 1200');
  });

  it('says the value is pending when it is hidden', () => {
    expect(describeStrip({ value: null, values }, { t, format })).toBe(
      'value pending, against a range of -500 to 2500',
    );
  });
});
