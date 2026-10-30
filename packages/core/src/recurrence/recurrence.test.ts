import { describe, expect, it } from 'vitest';

import { plainDate, toISODate } from '../date';
import type { PlainDate } from '../date';
import { formatRRule, MAX_PERIODS, occurrenceDates, parseRRule } from './index';
import type { RecurrenceRule } from './index';

const iso = (dates: readonly PlainDate[]) => dates.map(toISODate);
const d = (text: string) => {
  const [year, month, day] = text.split('-').map(Number) as [number, number, number];
  return plainDate(year, month, day);
};

describe('parseRRule', () => {
  it('reads the keys of the subset, with or without the RRULE: prefix', () => {
    expect(parseRRule('RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE;COUNT=10')).toEqual({
      frequency: 'weekly',
      interval: 2,
      byWeekday: [1, 3],
      count: 10,
    });
    expect(parseRRule('FREQ=MONTHLY;BYDAY=-1FR;UNTIL=20261231')).toEqual({
      frequency: 'monthly',
      byWeekday: [{ weekday: 5, nth: -1 }],
      until: plainDate(2026, 12, 31),
    });
    expect(parseRRule('FREQ=YEARLY;BYMONTH=11;BYDAY=4TH;WKST=SU')).toEqual({
      frequency: 'yearly',
      byMonth: [11],
      byWeekday: [{ weekday: 4, nth: 4 }],
      weekStart: 0,
    });
  });

  it('takes the date of an UNTIL written as a date-time', () => {
    expect(parseRRule('FREQ=DAILY;UNTIL=20260930T235959Z')?.until).toEqual(plainDate(2026, 9, 30));
  });

  /**
   * Total, as `parseFilter` is: a rule written by a newer system degrades to
   * a single occurrence rather than to an error on first paint.
   */
  it('gives null for anything outside the subset', () => {
    for (const text of [
      '',
      'FREQ=HOURLY',
      'FREQ=SECONDLY',
      'INTERVAL=2',
      'FREQ=DAILY;BYSETPOS=1',
      'FREQ=DAILY;BYYEARDAY=1',
      'FREQ=DAILY;INTERVAL=0',
      'FREQ=DAILY;COUNT=-1',
      'FREQ=DAILY;COUNT=2;UNTIL=20260101',
      'FREQ=DAILY;FREQ=WEEKLY',
      'FREQ=WEEKLY;BYDAY=XX',
      'FREQ=MONTHLY;BYMONTHDAY=32',
      'FREQ=YEARLY;BYMONTH=13',
      'FREQ=DAILY;UNTIL=2026-01-01',
      'FREQ=DAILY;garbage',
    ]) {
      expect(parseRRule(text), text).toBeNull();
    }
  });

  it('round-trips through formatRRule', () => {
    const rule: RecurrenceRule = {
      frequency: 'monthly',
      interval: 3,
      byWeekday: [{ weekday: 2, nth: 2 }, 4],
      until: plainDate(2027, 1, 5),
      weekStart: 0,
    };
    expect(formatRRule(rule)).toBe('FREQ=MONTHLY;INTERVAL=3;UNTIL=20270105;BYDAY=2TU,TH;WKST=SU');
    expect(parseRRule(formatRRule(rule))).toEqual(rule);
  });
});

describe('occurrenceDates', () => {
  it('repeats daily inside the window only', () => {
    const rule: RecurrenceRule = { frequency: 'daily', interval: 2 };
    expect(iso(occurrenceDates(rule, d('2026-09-01'), d('2026-09-04'), d('2026-09-10')))).toEqual([
      '2026-09-05',
      '2026-09-07',
      '2026-09-09',
    ]);
  });

  it('repeats weekly on the weekdays named, from the week of the start', () => {
    const rule: RecurrenceRule = { frequency: 'weekly', interval: 2, byWeekday: [1, 4] };
    /* 2026-09-01 is a Tuesday; its week (from Monday) holds Thursday 3. */
    expect(iso(occurrenceDates(rule, d('2026-09-01'), d('2026-09-01'), d('2026-09-30')))).toEqual([
      '2026-09-01',
      '2026-09-03',
      '2026-09-14',
      '2026-09-17',
      '2026-09-28',
    ]);
  });

  /** RFC 5545: DTSTART is always the first instance, and it counts. */
  it('counts the start as the first occurrence even when it does not match', () => {
    const rule: RecurrenceRule = { frequency: 'weekly', byWeekday: [5], count: 3 };
    expect(iso(occurrenceDates(rule, d('2026-09-01'), d('2026-01-01'), d('2026-12-31')))).toEqual([
      '2026-09-01',
      '2026-09-04',
      '2026-09-11',
    ]);
  });

  it('skips a monthly day the month does not have, as the standard does', () => {
    const rule: RecurrenceRule = { frequency: 'monthly', count: 4 };
    expect(iso(occurrenceDates(rule, d('2026-01-31'), d('2026-01-01'), d('2026-12-31')))).toEqual([
      '2026-01-31',
      '2026-03-31',
      '2026-05-31',
      '2026-07-31',
    ]);
  });

  it('reads an ordinal weekday from either end of the month', () => {
    const second: RecurrenceRule = { frequency: 'monthly', byWeekday: [{ weekday: 2, nth: 2 }] };
    expect(iso(occurrenceDates(second, d('2026-09-08'), d('2026-09-01'), d('2026-11-30')))).toEqual(
      ['2026-09-08', '2026-10-13', '2026-11-10'],
    );
    const last: RecurrenceRule = { frequency: 'monthly', byWeekday: [{ weekday: 5, nth: -1 }] };
    expect(iso(occurrenceDates(last, d('2026-09-25'), d('2026-09-01'), d('2026-11-30')))).toEqual([
      '2026-09-25',
      '2026-10-30',
      '2026-11-27',
    ]);
  });

  it('counts a negative month day from the end', () => {
    const rule: RecurrenceRule = { frequency: 'monthly', byMonthDay: [-1] };
    expect(iso(occurrenceDates(rule, d('2026-01-31'), d('2026-01-01'), d('2026-04-30')))).toEqual([
      '2026-01-31',
      '2026-02-28',
      '2026-03-31',
      '2026-04-30',
    ]);
  });

  it('repeats yearly on a leap day only in leap years', () => {
    const rule: RecurrenceRule = { frequency: 'yearly' };
    expect(iso(occurrenceDates(rule, d('2024-02-29'), d('2024-01-01'), d('2032-12-31')))).toEqual([
      '2024-02-29',
      '2028-02-29',
      '2032-02-29',
    ]);
  });

  it('repeats yearly on the fourth Thursday of November', () => {
    const rule: RecurrenceRule = {
      frequency: 'yearly',
      byMonth: [11],
      byWeekday: [{ weekday: 4, nth: 4 }],
    };
    expect(iso(occurrenceDates(rule, d('2026-11-26'), d('2026-01-01'), d('2028-12-31')))).toEqual([
      '2026-11-26',
      '2027-11-25',
      '2028-11-23',
    ]);
  });

  it('stops at until, inclusive', () => {
    const rule: RecurrenceRule = { frequency: 'daily', until: d('2026-09-03') };
    expect(iso(occurrenceDates(rule, d('2026-09-01'), d('2026-09-01'), d('2026-09-30')))).toEqual([
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
    ]);
  });

  /** RFC 5545: COUNT is reached before EXDATE removes anything. */
  it('removes exceptions after counting', () => {
    const rule: RecurrenceRule = { frequency: 'daily', count: 3 };
    expect(
      iso(
        occurrenceDates(rule, d('2026-09-01'), d('2026-09-01'), d('2026-09-30'), [d('2026-09-02')]),
      ),
    ).toEqual(['2026-09-01', '2026-09-03']);
  });

  it('reaches a window far from the start without walking every period', () => {
    const rule: RecurrenceRule = { frequency: 'daily' };
    expect(iso(occurrenceDates(rule, d('1970-01-01'), d('2026-09-01'), d('2026-09-02')))).toEqual([
      '2026-09-01',
      '2026-09-02',
    ]);
  });

  it('gives nothing before the start and stops at the period cap', () => {
    const rule: RecurrenceRule = { frequency: 'daily', byMonth: [2], byMonthDay: [30] };
    expect(occurrenceDates(rule, d('2026-01-01'), d('2026-01-02'), d('2400-01-01'))).toEqual([]);
    expect(MAX_PERIODS).toBe(50_000);
    expect(
      occurrenceDates({ frequency: 'daily' }, d('2026-09-10'), d('2026-09-01'), d('2026-09-09')),
    ).toEqual([]);
  });
});
