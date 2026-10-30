import { describe, expect, it } from 'vitest';

import {
  formatRating,
  formatRatingValue,
  formatShare,
  normalizeRating,
  ratingAtPoint,
  ratingFills,
  ratingForKey,
  summarizeRatings,
} from './rating';

const whole = { max: 5, step: 1 } as const;
const half = { max: 5, step: 0.5 } as const;

describe('normalizeRating', () => {
  it('keeps an empty value empty', () => {
    expect(normalizeRating(null, whole)).toBeNull();
    expect(normalizeRating(undefined, whole)).toBeNull();
    expect(normalizeRating(Number.NaN, whole)).toBeNull();
  });

  it('puts a value on the grid, rounding up to the step', () => {
    expect(normalizeRating(3.2, whole)).toBe(4);
    expect(normalizeRating(3.2, half)).toBe(3.5);
    expect(normalizeRating(3.5, half)).toBe(3.5);
  });

  it('clamps to the scale and treats nought and below as empty', () => {
    expect(normalizeRating(9, whole)).toBe(5);
    expect(normalizeRating(0, whole)).toBeNull();
    expect(normalizeRating(-2, whole)).toBeNull();
  });
});

describe('ratingAtPoint', () => {
  const row = { x: 100, width: 120 };

  it('reads the symbol under the point, a symbol being a fifth of the row', () => {
    expect(ratingAtPoint({ x: 101 }, row, whole)).toBe(1);
    expect(ratingAtPoint({ x: 170 }, row, whole)).toBe(3);
    expect(ratingAtPoint({ x: 219 }, row, whole)).toBe(5);
  });

  it('reads the half under the point when the step is a half', () => {
    expect(ratingAtPoint({ x: 150 }, row, half)).toBe(2.5);
    expect(ratingAtPoint({ x: 162 }, row, half)).toBe(3);
  });

  it('never reads less than one step, and clamps past either end', () => {
    expect(ratingAtPoint({ x: 40 }, row, whole)).toBe(1);
    expect(ratingAtPoint({ x: 400 }, row, half)).toBe(5);
  });

  it('mirrors the row in a right-to-left document', () => {
    expect(ratingAtPoint({ x: 219 }, row, whole, true)).toBe(1);
    expect(ratingAtPoint({ x: 101 }, row, whole, true)).toBe(5);
  });
});

describe('ratingForKey', () => {
  const options = { rtl: false, clearable: true };

  it('raises and lowers by one step, and stops at both ends', () => {
    expect(ratingForKey('ArrowRight', 3, whole, options)).toBe(4);
    expect(ratingForKey('ArrowUp', 5, whole, options)).toBe(5);
    expect(ratingForKey('ArrowLeft', 3, half, options)).toBe(2.5);
    expect(ratingForKey('ArrowDown', 1, whole, options)).toBe(1);
  });

  it('starts an empty value at the first step', () => {
    expect(ratingForKey('ArrowRight', null, half, options)).toBe(0.5);
    expect(ratingForKey('ArrowLeft', null, whole, options)).toBe(1);
  });

  it('reads the inline arrows in the direction the document is written', () => {
    expect(ratingForKey('ArrowLeft', 3, whole, { ...options, rtl: true })).toBe(4);
    expect(ratingForKey('ArrowRight', 3, whole, { ...options, rtl: true })).toBe(2);
    expect(ratingForKey('ArrowUp', 3, whole, { ...options, rtl: true })).toBe(4);
  });

  it('reaches both ends in one key', () => {
    expect(ratingForKey('Home', 4, half, options)).toBe(0.5);
    expect(ratingForKey('End', 1, half, options)).toBe(5);
  });

  it('empties the value on Backspace and Delete only when clearable', () => {
    expect(ratingForKey('Backspace', 3, whole, options)).toBeNull();
    expect(ratingForKey('Delete', 3, whole, options)).toBeNull();
    expect(ratingForKey('Delete', 3, whole, { ...options, clearable: false })).toBeUndefined();
  });

  it('leaves every other key to the platform', () => {
    expect(ratingForKey('Tab', 3, whole, options)).toBeUndefined();
    expect(ratingForKey(' ', 3, whole, options)).toBeUndefined();
  });
});

describe('ratingFills', () => {
  it('lights every symbol up to the value and the last one by its share', () => {
    expect(ratingFills(3.6, 5)).toEqual([1, 1, 1, 0.6, 0]);
    expect(ratingFills(null, 3)).toEqual([0, 0, 0]);
    expect(ratingFills(9, 2)).toEqual([1, 1]);
  });
});

describe('summarizeRatings', () => {
  it('reads the total, the mean and each level’s share, highest level first', () => {
    const summary = summarizeRatings([5, 3, 0, 0, 2]);

    expect(summary.total).toBe(10);
    expect(summary.average).toBe(2.1);
    expect(summary.levels).toEqual([
      { level: 5, count: 2, share: 0.2 },
      { level: 4, count: 0, share: 0 },
      { level: 3, count: 0, share: 0 },
      { level: 2, count: 3, share: 0.3 },
      { level: 1, count: 5, share: 0.5 },
    ]);
  });

  it('reports an empty set as no mean rather than a mean of nought', () => {
    const summary = summarizeRatings([0, 0, 0, 0, 0]);

    expect(summary.total).toBe(0);
    expect(summary.average).toBeNull();
    expect(summary.levels.every((entry) => entry.share === 0)).toBe(true);
  });

  it('ignores a negative or fractional count', () => {
    expect(summarizeRatings([1.5, -3, 2]).total).toBe(3);
  });
});

describe('summarizeRatings: shape and confidence', () => {
  it('reads the spread, the margin of the mean and its interval inside the scale', () => {
    const summary = summarizeRatings([9, 18, 47, 158, 1052]);

    expect(summary.deviation).toBeCloseTo(0.661, 3);
    expect(summary.margin).toBeCloseTo(0.036, 3);
    expect(summary.interval?.[0]).toBeCloseTo(4.697, 3);
    expect(summary.interval?.[1]).toBeCloseTo(4.77, 3);
  });

  it('clamps a wide interval to the scale', () => {
    const summary = summarizeRatings([3, 0, 1, 0, 4]);

    expect(summary.interval?.[0]).toBeCloseTo(1.965, 3);
    expect(summary.interval?.[1]).toBeCloseTo(4.535, 3);
    expect(summarizeRatings([0, 0, 0, 0, 2]).interval).toEqual([5, 5]);
  });

  it('groups the levels into negative, neutral and positive', () => {
    expect(summarizeRatings([3, 0, 1, 0, 4]).buckets).toEqual({
      negative: 0.375,
      neutral: 0.125,
      positive: 0.5,
    });
  });

  it('draws one conclusion, the first rule that holds', () => {
    expect(summarizeRatings([3, 0, 1, 0, 4]).insight).toBe('divided');
    expect(summarizeRatings([0, 0, 1, 2, 4]).insight).toBe('few');
    expect(summarizeRatings([9, 18, 47, 158, 1052]).insight).toBe('consensus');
    expect(summarizeRatings([10, 20, 60, 50, 40]).insight).toBe('mixed');
  });

  it('draws no conclusion, no margin and no interval from nothing', () => {
    const summary = summarizeRatings([0, 0, 0, 0, 0]);

    expect(summary.insight).toBeNull();
    expect(summary.margin).toBeNull();
    expect(summary.interval).toBeNull();
    expect(summary.buckets).toEqual({ negative: 0, neutral: 0, positive: 0 });
  });

  it('lets the thresholds be moved', () => {
    expect(summarizeRatings([9, 18, 47, 158, 1052], { consensus: 0.99 }).insight).toBe('mixed');
    expect(summarizeRatings([0, 0, 1, 2, 40], { few: 50 }).insight).toBe('few');
  });
});

describe('formatRating, formatRatingValue and formatShare', () => {
  it('writes a value with the locale’s decimal separator and one place', () => {
    expect(formatRating(4.6, 'pt-BR')).toBe('4,6');
    expect(formatRating(4, 'en-US')).toBe('4.0');
  });

  it('writes a value for a label to one place at most, a whole one whole', () => {
    expect(formatRatingValue(3.5, 'pt-BR')).toBe('3,5');
    expect(formatRatingValue(3.75, 'en-US')).toBe('3.8');
    expect(formatRatingValue(3, 'pt-BR')).toBe('3');
  });

  it('writes a share as a whole percentage, a half rounded away from nought', () => {
    expect(formatShare(0.125, 'pt-BR')).toBe('13%');
    expect(formatShare(0.375, 'pt-BR')).toBe('38%');
    expect(formatShare(0.0035, 'pt-BR')).toBe('0%');
  });
});
