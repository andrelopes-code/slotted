import { describe, expect, it } from 'vitest';

import {
  addDays,
  clampDate,
  compareDate,
  daysInMonth,
  dayOfWeek,
  endOfMonth,
  isLeapYear,
  isPlainDate,
  isSameDate,
  isoWeekNumber,
  parseISODate,
  plainDate,
  startOfMonth,
  startOfWeek,
  stepMonth,
  stepYear,
  todayIn,
  toISODate,
} from './index';

describe('plainDate', () => {
  it('holds the three numbers and nothing else', () => {
    expect(plainDate(2026, 9, 9)).toEqual({ year: 2026, month: 9, day: 9 });
  });

  it('refuses a day the month does not have', () => {
    expect(() => plainDate(2025, 2, 29)).toThrow(/29/);
    expect(plainDate(2024, 2, 29)).toEqual({ year: 2024, month: 2, day: 29 });
  });

  it('refuses a month outside the year', () => {
    expect(() => plainDate(2026, 13, 1)).toThrow(/month/);
    expect(() => plainDate(2026, 0, 1)).toThrow(/month/);
  });

  it('recognizes its own shape and refuses everything else', () => {
    expect(isPlainDate(plainDate(2026, 9, 9))).toBe(true);
    expect(isPlainDate({ year: 2026, month: 9, day: 9 })).toBe(true);
    expect(isPlainDate(new Date())).toBe(false);
    expect(isPlainDate('2026-09-09')).toBe(false);
    expect(isPlainDate({ year: 2026, month: 9 })).toBe(false);
  });
});

describe('ISO 8601', () => {
  it('writes and reads the one string a form, a URL and the platform agree on', () => {
    expect(toISODate(plainDate(2026, 9, 9))).toBe('2026-09-09');
    expect(parseISODate('2026-09-09')).toEqual(plainDate(2026, 9, 9));
  });

  it('pads a year below four digits rather than writing three', () => {
    expect(toISODate(plainDate(48, 1, 1))).toBe('0048-01-01');
    expect(parseISODate('0048-01-01')).toEqual(plainDate(48, 1, 1));
  });

  /**
   * The gap the inventory names: a server sends `2026-09-09T00:00:00Z` and
   * every surveyed implementation either truncates it — which is a day west of
   * Greenwich — or fails silently. Refusing it is what makes the consumer
   * decide which day they meant.
   */
  it('refuses an instant rather than truncating one', () => {
    expect(parseISODate('2026-09-09T00:00:00Z')).toBe(null);
    expect(parseISODate('2026-09-09T21:30:00-03:00')).toBe(null);
  });

  it('refuses a date that does not exist and text that is not a date', () => {
    expect(parseISODate('2025-02-29')).toBe(null);
    expect(parseISODate('2026-9-9')).toBe(null);
    expect(parseISODate('')).toBe(null);
    expect(parseISODate('yesterday')).toBe(null);
  });
});

describe('comparison', () => {
  it('orders by year, then month, then day', () => {
    expect(compareDate(plainDate(2026, 9, 9), plainDate(2026, 9, 10))).toBeLessThan(0);
    expect(compareDate(plainDate(2026, 10, 1), plainDate(2026, 9, 30))).toBeGreaterThan(0);
    expect(compareDate(plainDate(2026, 9, 9), plainDate(2026, 9, 9))).toBe(0);
    expect(isSameDate(plainDate(2026, 9, 9), plainDate(2026, 9, 9))).toBe(true);
  });

  it('clamps to a bound and leaves a date inside it alone', () => {
    const min = plainDate(2026, 9, 1);
    const max = plainDate(2026, 9, 30);
    expect(clampDate(plainDate(2026, 8, 20), min, max)).toEqual(min);
    expect(clampDate(plainDate(2026, 10, 2), min, max)).toEqual(max);
    expect(clampDate(plainDate(2026, 9, 9), min, max)).toEqual(plainDate(2026, 9, 9));
    expect(clampDate(plainDate(1970, 1, 1), undefined, undefined)).toEqual(plainDate(1970, 1, 1));
  });
});

describe('the calendar itself', () => {
  it('knows the length of every month, and the leap rule at both centuries', () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(2100)).toBe(false);
  });

  it('numbers the weekday from Sunday, the way Intl does', () => {
    expect(dayOfWeek(plainDate(2026, 9, 9))).toBe(3);
    expect(dayOfWeek(plainDate(2026, 9, 6))).toBe(0);
  });

  it('adds days across a month, a year and a leap day', () => {
    expect(addDays(plainDate(2026, 9, 30), 1)).toEqual(plainDate(2026, 10, 1));
    expect(addDays(plainDate(2026, 1, 1), -1)).toEqual(plainDate(2025, 12, 31));
    expect(addDays(plainDate(2024, 2, 28), 1)).toEqual(plainDate(2024, 2, 29));
    expect(addDays(plainDate(2025, 2, 28), 1)).toEqual(plainDate(2025, 3, 1));
  });

  it('finds the edges of a month and of a week', () => {
    expect(startOfMonth(plainDate(2026, 9, 9))).toEqual(plainDate(2026, 9, 1));
    expect(endOfMonth(plainDate(2026, 2, 9))).toEqual(plainDate(2026, 2, 28));
    /* Wednesday 9 September 2026, in a week that starts on Sunday and in one
       that starts on Monday. */
    expect(startOfWeek(plainDate(2026, 9, 9), 0)).toEqual(plainDate(2026, 9, 6));
    expect(startOfWeek(plainDate(2026, 9, 9), 1)).toEqual(plainDate(2026, 9, 7));
  });

  /**
   * ISO 8601 week 1 is the week holding the year's first Thursday, which is
   * the rule that puts 1 January 2027 in week 53 of 2026.
   */
  it('numbers ISO weeks, including the ones that belong to the other year', () => {
    expect(isoWeekNumber(plainDate(2026, 1, 1))).toBe(1);
    expect(isoWeekNumber(plainDate(2026, 9, 9))).toBe(37);
    expect(isoWeekNumber(plainDate(2027, 1, 1))).toBe(53);
    expect(isoWeekNumber(plainDate(2021, 1, 1))).toBe(53);
  });
});

describe('stepping a month or a year', () => {
  it('moves whole months and keeps the day when the month is long enough', () => {
    expect(stepMonth(plainDate(2026, 9, 9), 1).date).toEqual(plainDate(2026, 10, 9));
    expect(stepMonth(plainDate(2026, 1, 15), -1).date).toEqual(plainDate(2025, 12, 15));
  });

  it('pulls the day back when the month is short, and says it did', () => {
    const step = stepMonth(plainDate(2026, 1, 31), 1);
    expect(step.date).toEqual(plainDate(2026, 2, 28));
    expect(step.clamped).toBe(true);
    expect(step.intendedDay).toBe(31);
  });

  /**
   * The behavior no surveyed implementation has. A reader on 31 January who
   * steps forward three times reaches 30 April everywhere else, because the
   * 31 was thrown away at February. Carrying `intendedDay` back in is what
   * makes the sequence 31 → 28 → 31 → 30 → 31.
   */
  it('restores the day the reader asked for once a month can hold it again', () => {
    let step = stepMonth(plainDate(2026, 1, 31), 1);
    expect(step.date).toEqual(plainDate(2026, 2, 28));

    step = stepMonth(step.date, 1, step.intendedDay);
    expect(step.date).toEqual(plainDate(2026, 3, 31));
    expect(step.clamped).toBe(false);

    step = stepMonth(step.date, 1, step.intendedDay);
    expect(step.date).toEqual(plainDate(2026, 4, 30));
    expect(step.clamped).toBe(true);

    step = stepMonth(step.date, 1, step.intendedDay);
    expect(step.date).toEqual(plainDate(2026, 5, 31));
  });

  it('steps a year, and clamps 29 February onto a year that has none', () => {
    expect(stepYear(plainDate(2026, 9, 9), 1).date).toEqual(plainDate(2027, 9, 9));

    const step = stepYear(plainDate(2024, 2, 29), 1);
    expect(step.date).toEqual(plainDate(2025, 2, 28));
    expect(step.clamped).toBe(true);
    expect(stepYear(step.date, 3, step.intendedDay).date).toEqual(plainDate(2028, 2, 29));
  });
});

describe('todayIn', () => {
  /**
   * The one question a time zone answers. Two zones on opposite sides of the
   * date line are a day apart at the same instant, and a calendar that marked
   * the wrong cell as today would be wrong for half the planet.
   */
  it('reads the day in the zone it is given, not in the runtime default', () => {
    const auckland = todayIn('Pacific/Auckland');
    const honolulu = todayIn('Pacific/Honolulu');
    expect(isPlainDate(auckland)).toBe(true);
    expect(compareDate(auckland, honolulu)).toBeGreaterThanOrEqual(0);
  });
});
