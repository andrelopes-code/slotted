import { describe, expect, it } from 'vitest';

import { createDateFormat, yearMonthPattern } from './format';
import {
  compareYearMonth,
  firstDayOf,
  isPlainYearMonth,
  isYearMonthInRange,
  lastDayOf,
  parseISOYearMonth,
  plainYearMonth,
  toISOYearMonth,
  yearMonthOf,
} from './plain-year-month';

describe('PlainYearMonth', () => {
  it('builds a month and refuses one the calendar does not have', () => {
    expect(plainYearMonth(2026, 11)).toEqual({ year: 2026, month: 11 });
    expect(() => plainYearMonth(2026, 13)).toThrow(RangeError);
    expect(() => plainYearMonth(2026.5, 1)).toThrow(RangeError);
  });

  it('reads and writes the ISO 8601 year-month', () => {
    expect(parseISOYearMonth('2026-11')).toEqual({ year: 2026, month: 11 });
    expect(parseISOYearMonth(' 2026-01 ')).toEqual({ year: 2026, month: 1 });
    expect(parseISOYearMonth('2026-13')).toBeNull();
    expect(parseISOYearMonth('2026-11-01')).toBeNull();
    expect(toISOYearMonth({ year: 2026, month: 3 })).toBe('2026-03');
    expect(toISOYearMonth({ year: 987, month: 12 })).toBe('0987-12');
  });

  it('tells a month from a date', () => {
    expect(isPlainYearMonth({ year: 2026, month: 11 })).toBe(true);
    expect(isPlainYearMonth({ year: 2026, month: 11, day: 1 })).toBe(false);
    expect(isPlainYearMonth(null)).toBe(false);
  });

  it('orders months and bounds them', () => {
    const october = plainYearMonth(2026, 10);
    const november = plainYearMonth(2026, 11);
    expect(compareYearMonth(october, november)).toBeLessThan(0);
    expect(compareYearMonth(november, november)).toBe(0);
    expect(isYearMonthInRange(november, october, november)).toBe(true);
    expect(isYearMonthInRange(october, november, undefined)).toBe(false);
  });

  it('converts to and from the days a calendar holds', () => {
    expect(firstDayOf(plainYearMonth(2028, 2))).toEqual({ year: 2028, month: 2, day: 1 });
    expect(lastDayOf(plainYearMonth(2028, 2))).toEqual({ year: 2028, month: 2, day: 29 });
    expect(yearMonthOf({ year: 2026, month: 9, day: 30 })).toEqual({ year: 2026, month: 9 });
  });
});

describe('yearMonthPattern', () => {
  const shape = (locale: string) =>
    yearMonthPattern(createDateFormat({ locale }).pattern)
      .map((part) => (part.type === 'literal' ? part.value : part.type))
      .join('');

  it('drops the day and the separator that joined it', () => {
    expect(shape('en-US')).toBe('month/year');
    expect(shape('pt-BR')).toBe('month/year');
    expect(shape('de-DE')).toBe('month.year');
    expect(shape('ja-JP')).toBe('year/month');
  });
});
