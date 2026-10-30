import { describe, expect, it } from 'vitest';

import {
  blockedAround,
  isDateRefusedInRun,
  orderedRun,
  rangeLength,
  rangeProblems,
} from './date-range';
import { plainDate } from './plain-date';

const d = (day: number) => plainDate(2026, 9, day);

describe('rangeLength', () => {
  it('counts days inclusively and nights as the difference', () => {
    expect(rangeLength(d(12), d(16), 'days')).toBe(5);
    expect(rangeLength(d(12), d(16), 'nights')).toBe(4);
  });

  it('gives the same day as one day and no nights', () => {
    expect(rangeLength(d(12), d(12), 'days')).toBe(1);
    expect(rangeLength(d(12), d(12), 'nights')).toBe(0);
  });

  it('counts a reversed pair the same way round', () => {
    expect(rangeLength(d(16), d(12), 'nights')).toBe(4);
  });
});

describe('orderedRun', () => {
  it('puts the earlier date first whichever was chosen first', () => {
    expect(orderedRun(d(16), d(12))).toEqual({ start: d(12), end: d(16) });
    expect(orderedRun(d(12), d(16))).toEqual({ start: d(12), end: d(16) });
  });
});

describe('blockedAround', () => {
  const unavailable = (date: { day: number }) => date.day === 3 || date.day === 15;

  it('finds the first unavailable day on either side of the start', () => {
    expect(blockedAround(d(7), unavailable, 366)).toEqual({ before: d(3), after: d(15) });
  });

  it('stops looking after the limit', () => {
    expect(blockedAround(d(7), unavailable, 4)).toEqual({ before: d(3), after: null });
  });

  it('finds nothing when nothing is unavailable', () => {
    expect(blockedAround(d(7), () => false, 366)).toEqual({ before: null, after: null });
  });
});

describe('isDateRefusedInRun', () => {
  const unavailable = (date: { day: number }) => date.day === 15;

  it('refuses the days beyond the first unavailable one while the run is contiguous', () => {
    const rules = { contiguous: true, count: 'nights' as const, unavailable };
    expect(isDateRefusedInRun(d(7), d(14), rules)).toBe(false);
    expect(isDateRefusedInRun(d(7), d(15), rules)).toBe(true);
    expect(isDateRefusedInRun(d(7), d(20), rules)).toBe(true);
  });

  it('lets the run jump over an unavailable day when it need not be contiguous', () => {
    const rules = { contiguous: false, count: 'nights' as const, unavailable };
    expect(isDateRefusedInRun(d(7), d(20), rules)).toBe(false);
    expect(isDateRefusedInRun(d(7), d(15), rules)).toBe(true);
  });

  it('refuses a day that would make the run shorter or longer than the limits', () => {
    const rules = { contiguous: true, count: 'nights' as const, minLength: 2, maxLength: 7 };
    expect(isDateRefusedInRun(d(7), d(8), rules)).toBe(true);
    expect(isDateRefusedInRun(d(7), d(9), rules)).toBe(false);
    expect(isDateRefusedInRun(d(7), d(14), rules)).toBe(false);
    expect(isDateRefusedInRun(d(7), d(15), rules)).toBe(true);
    /* Before the start too: the second press may come first. */
    expect(isDateRefusedInRun(d(7), d(5), rules)).toBe(false);
    expect(isDateRefusedInRun(d(7), d(6), rules)).toBe(true);
  });
});

describe('rangeProblems', () => {
  it('finds nothing wrong with a whole run inside every rule', () => {
    expect(
      rangeProblems(
        { start: d(7), end: d(11) },
        { count: 'nights', min: d(1), max: d(30), minLength: 2, maxLength: 7 },
      ),
    ).toEqual([]);
  });

  it('names an end before its start and does not swap them', () => {
    expect(rangeProblems({ start: d(11), end: d(7) }, { count: 'days' })).toEqual(['order']);
  });

  it('names a bound each end breaks', () => {
    expect(rangeProblems({ start: d(1), end: d(11) }, { count: 'days', min: d(3) })).toEqual([
      'min',
    ]);
    expect(rangeProblems({ start: d(7), end: null }, { count: 'days', max: d(3) })).toEqual([
      'max',
    ]);
  });

  it('runs the predicate over every day of the run, once', () => {
    const seen: number[] = [];
    const unavailable = (date: { day: number }) => {
      seen.push(date.day);
      return date.day === 9;
    };
    expect(rangeProblems({ start: d(7), end: d(11) }, { count: 'days', unavailable })).toEqual([
      'unavailable',
    ]);
    expect(seen).toEqual([7, 8, 9]);
  });

  it('checks only the two ends when the run need not be contiguous', () => {
    const unavailable = (date: { day: number }) => date.day === 9;
    expect(
      rangeProblems({ start: d(7), end: d(11) }, { contiguous: false, count: 'days', unavailable }),
    ).toEqual([]);
  });

  it('names a length outside the limits', () => {
    expect(rangeProblems({ start: d(7), end: d(8) }, { count: 'nights', minLength: 2 })).toEqual([
      'length',
    ]);
    expect(rangeProblems({ start: d(7), end: d(20) }, { count: 'nights', maxLength: 7 })).toEqual([
      'length',
    ]);
  });

  it('finds nothing wrong with an open end or an empty value', () => {
    expect(rangeProblems({ start: d(7), end: null }, { count: 'days' })).toEqual([]);
    expect(rangeProblems(null, { count: 'days', minLength: 2 })).toEqual([]);
  });
});
